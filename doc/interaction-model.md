# ProUI interaction model

This document summarizes how ProUI routes pointer input to button-like controls, with emphasis on the C3 runtime path implemented in `source/aekiro_button/c3runtime/behavior.js` and shared button logic in `source/aekiro_proui/c3runtime/instance.js`.

## 1) Event sources and listeners

### Runtime event source
- `aekiro_button` behavior registers global runtime listeners in its constructor:
  - `pointerdown`
  - `pointermove`
  - `pointerup`
  - `pointercancel`
- All of these are attached to `this.runtime` and removed in `_release()`.

### Pointer dispatch path
- `pointerdown` → `_OnPointerDown()` → `_OnInputDown(pointerId, clientX, clientY)`.
- `pointermove` → `_OnPointerMove()` → `_OnInputMove(pointerId, clientX, clientY)`.
- `pointerup` and `pointercancel` both funnel into `_OnInputUp(pointerId, clientX, clientY)`.
- For each candidate instance, coordinates are transformed with `layer.CanvasCssToLayer(clientX, clientY, zElevation)` before invoking per-button handlers.

## 2) Stop-click-propagation semantics (ProUI plugin property)

`ProUI` exposes `stopClickPropagation` (`yes`/`no`) as a plugin-level property (`aekiro_proui`).

### When `stopClickPropagation = no`
- `_OnInputDown` iterates all button instances.
- Each button is unfocused first (`beh.setFocused(false)`), then every candidate executes `OnAnyInputDown(...)`.
- Result: overlapping clickable controls can all process the same down event.

### When `stopClickPropagation = yes`
- `_OnInputDown` first collects only instances containing the pointer (`ContainsPoint`).
- It sorts matches by `GetTotalZElevation()` and keeps the highest Z as the top candidate.
- Visibility filter applies before top selection: only instances where both `inst.IsVisible()` and `inst.GetLayer().IsVisible()` are considered for the topmost target.
- Then an additional pass appends all hit instances whose **button ignore-input mode is `no`** (`ignoreInput == 0`), even if they are not the top visible one.
- `OnAnyInputDown(...)` is called for the resulting set.

Practical implication: with propagation-stop enabled, routing is mostly topmost-first, but controls set to `Ignore Input = no` are explicitly added back into dispatch.

## 3) Focus/unfocus lifecycle and trigger points

### Triggered conditions
`aekiro_button` behavior instance bridges shared button callbacks to C3 conditions:
- `OnFocusedC()` triggers `Cnds.OnFocused`.
- `OnUnFocusedC()` triggers `Cnds.OnUnFocused`.
- Click completion path (`OnAnyInputUpC`) triggers `Cnds.OnClicked` and ProUI `OnAnyButtonClicked`.

### Focus lifecycle
- On every pointer-down scan, each button is proactively unfocused (`setFocused(false)`) before target routing.
- In `setFocused(true)`:
  - focus visuals/audio are applied,
  - optional focus tween plays,
  - `OnFocusedC()` fires.
- In `setFocused(false)`:
  - visuals return to normal/current state,
  - focus tween is reversed if used,
  - `OnUnFocusedC()` fires.
- In `OnInputDown(...)`:
  - if not already focused, focus callback is fired (`OnFocusedC()`),
  - then `isFocused = true`, and click state is entered.

### Related mouse lifecycle
- `OnAnyInputMove` drives `OnMouseEnter`/`OnMouseLeave` transitions (desktop only).
- `OnMouseEnterC()` and `OnMouseLeaveC()` map to corresponding conditions.

## 4) How `ignoreInput` modes influence routing

Button property `ignore-input` values map to indices:
- `0 = no`
- `1 = yes`
- `2 = auto`

`isClickable(x, y)` enforces routing rules:
- Global kill switch: if ProUI `ignoreInput` is true, all buttons return non-clickable.
- Mode `yes` (`1`): always non-clickable.
- Mode `no` (`0`): clickable if enabled + instance/layer visible.
- Mode `auto` (`2`): clickable only if enabled + visible + inside scroll-view bounds, and not under an active modal dialog (when dialog manager exists).

Additionally, under stop-click-propagation mode, `ignoreInput == 0` instances are appended to dispatch candidates after topmost filtering.

## 5) Z-order and visibility filtering for topmost click targets

In stop-click-propagation mode:
1. Hit-test candidates (`ContainsPoint`) are gathered.
2. Candidates are sorted ascending by `GetTotalZElevation()`.
3. Top candidate is last element of the sorted list.
4. Before top extraction, visibility filter keeps only candidates with:
   - instance visible (`IsVisible()`), and
   - layer visible (`GetLayer().IsVisible()`).

Therefore, an invisible instance or one on a hidden layer cannot become the selected “topmost” receiver.

## 6) Edge cases

### Hidden layers vs hit collection
- Initial hit collection uses `ContainsPoint` before visibility filtering.
- Hidden-layer/hidden-instance controls are removed for topmost selection, but still present in raw hit list used by the second pass (`ignoreInput == 0` append).

### Overlapping controls
- With propagation-stop disabled: all overlapped controls that pass their own clickability checks can react.
- With propagation-stop enabled: primarily topmost visible target reacts, plus any overlapped controls forced in by `ignoreInput == 0` append behavior.

### Focus reset side effect
- Because each pointer-down loop calls `setFocused(false)` on all button instances first, focused state can churn rapidly in dense UI scenes.

### Async pointer handlers
- `_OnInputDown` and `_OnInputUp` are `async` and `await` each instance handler serially.
- If project code bound to callbacks performs asynchronous work, per-instance handling order is preserved but total pointer processing can be delayed.
- Re-entrant input arriving before awaits resolve may observe intermediate states (e.g., focus/click transitions already applied on earlier instances).

## 7) Troubleshooting quick table

| Symptom | Probable cause | File to inspect |
|---|---|---|
| Lower button never clicks when overlapping another | `Stop Click Propagation` enabled and lower button not re-added by `ignoreInput == 0` logic | `source/aekiro_button/c3runtime/behavior.js` |
| Button appears clickable but events never fire | `ignore-input` set to `yes` or ProUI global `ignoreInput` enabled | `source/aekiro_proui/c3runtime/instance.js`, `source/aekiro_proui/c3runtime/actions.js` |
| Clicks ignored inside scrolled UI region | `ignore-input = auto` and pointer outside containing scroll-view hit area | `source/aekiro_proui/c3runtime/instance.js` |
| Button under modal dialog does not respond | `ignore-input = auto` + dialog manager marks instance as under modal | `source/aekiro_proui/c3runtime/instance.js` |
| Focus/unfocus events firing unexpectedly on click | Global pointer-down pre-pass calls `setFocused(false)` across instances | `source/aekiro_button/c3runtime/behavior.js`, `source/aekiro_proui/c3runtime/instance.js` |
| Hidden-layer control still behaves oddly in overlap scenarios | Candidate collection and visibility filtering happen in separate phases | `source/aekiro_button/c3runtime/behavior.js` |
| Pointer interactions feel delayed in heavy callbacks | Serial `await` in `_OnInputDown`/`_OnInputUp` loops | `source/aekiro_button/c3runtime/behavior.js` |
