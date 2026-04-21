# ProUI Developer Guide

This is the canonical technical onboarding document for runtime contributors.

## 1) Architecture overview

### Core plugin (`aekiro_proui`)

- The ProUI plugin is a **single global instance** that wires global runtime helpers into `globalThis.Aekiro`, initializes the game object graph, and exposes global controls (e.g. ignore input, audio volume).  
- Initialization is done via `Initialise()` (triggered by the ProUI action `Init`), which runs a two-pass registration/graph build and toggles `goManager.isInit` to protect state during rebuilding.  
- On `beforelayoutchange`, the plugin clears pending initialize timers and resets shared managers (`goManager`, scroll view manager cache, dialog manager active stack) to avoid stale cross-layout references.

Primary file: `source/aekiro_proui/c3runtime/instance.js`.

### Behaviors and plugin runtime split

Each add-on typically has:

- **Editor-time files** at `source/<addon>/*.js` + metadata files (`addon.json`, `aces.json`, `lang/*`).
- **Runtime files** under `source/<addon>/c3runtime/`:
  - `type.js`: object type/behavior type hooks.
  - `instance.js`: per-instance behavior/plugin logic and state.
  - `actions.js` / `conditions.js` / `expressions.js`: ACE API entry points.
  - `plugin.js` or `behavior.js`: runtime class registration and global event hooks (e.g. pointer listeners in button behavior).

### Global managers/registries

Runtime code relies on shared globals attached to `globalThis`:

- `globalThis.Aekiro`: compatibility methods, serialization utilities, and per-instance unsaved data registry (`getInstanceData`).
- `globalThis.aekiro_goManager`: game object naming, registration, scene graph rebuild, clone operations.
- `globalThis.aekiro_scrollViewManager`: scroll-view overlap tracking and registration.
- `globalThis.aekiro_dialogManager`: modal/dialog stack checks (input blocking under modals).

### Lifecycle at runtime

1. Construct loads runtime classes (`plugin.js`/`behavior.js`).
2. ProUI plugin singleton is created.
3. Behavior instances call `_postCreate`, register themselves in `Aekiro` instance data and managers.
4. Project calls ProUI `Init` action on layout start.
5. `goManager` rebuilds object registry and scene graph.
6. Input flows through behavior-level pointer handlers (`aekiro_button` behavior base), then to per-instance handlers.
7. Layout changes reset manager state; next layout must initialize again.

---

## 2) Add-on anatomy (`source/<addon>/`)

Use this checklist when reading or changing any add-on directory:

- `addon.json`  
  Add-on id, version, category, and metadata links used by packaging/import.
- `lang/en-US.json`  
  Display strings shown in Construct UI.
- `aces.json`  
  ACE declarations mirrored by runtime `actions/conditions/expressions` implementations.
- `plugin.js` / `behavior.js` (root)  
  Editor-side registration.
- `type.js`, `instance.js` (root)  
  Editor-side type/instance logic.
- `c3runtime/plugin.js` or `c3runtime/behavior.js`  
  Runtime class declaration; for some behaviors this is also where global event listeners are installed.
- `c3runtime/type.js`  
  Runtime type initialization.
- `c3runtime/instance.js`  
  Runtime instance state, graph links, update loops, and core logic.
- `c3runtime/actions.js` / `conditions.js` / `expressions.js`  
  Runtime ACE endpoints invoked by event sheets.

### How pieces connect

- Event sheet ACE calls land in runtime ACE files.
- ACE methods mutate behavior/plugin instance state in `c3runtime/instance.js`.
- Shared state is accessed through `globalThis.Aekiro.getInstanceData(inst)` and manager singletons.
- Complex behaviors (button, scroll view, dialog, etc.) often coordinate with `aekiro_gameobject` for transforms, parenting, and scene graph ordering.

---

## 3) Interaction model

### Pointer input routing

- `aekiro_button/c3runtime/behavior.js` attaches runtime-wide listeners for `pointerdown`, `pointermove`, `pointerup`, `pointercancel`.
- Pointer coordinates are converted from CSS space to each candidate instance’s layer coordinates via `CanvasCssToLayer(...)` before hit-testing.

### Focus/click propagation

When `proui.stopClickPropagation` is enabled:

1. Collect button instances under pointer.
2. Sort by total Z elevation.
3. Keep top visible target.
4. Also include `ignoreInput == 0` targets to allow designated pass-through participation.
5. Dispatch `OnAnyInputDown` only to this reduced set.

When disabled, all eligible instances receive `OnAnyInputDown` directly.

### Ignore-input behavior

- `proui.ignoreInput` is a global hard-stop checked by interactive behaviors (e.g. scroll view) to reject interactions.
- Per-button `ignoreInput` controls inclusion in propagation filtering even when click-stop mode is active.

### Z-order handling

- Input winner selection is based on `GetTotalZElevation()` sorting.
- Hierarchy updates call `updateZindex` from game object behavior after clone/reparent operations.
- Scrollbars/sliders in scroll view are moved to top during initialization to preserve expected interaction ordering.

---

## 4) Runtime data flow

### Instance registration

- Behaviors store self references in unsaved instance data (`Aekiro.getInstanceData(inst).<behaviorKey> = this`).
- `aekiro_gameobject` additionally registers instances by behavior key (`registerBehaviorInstance`) for global scans (e.g. UI audio volume updates).

### `goManager` integration

- `aekiro_gameobject` instances call `goManager.addGO(inst)` in `_postCreate`.
- ProUI `Initialise()` calls:
  - `registerGameObjects()`
  - `cleanSceneGraph()`
  - `createSceneGraph()`

This is executed once immediately and once in a deferred pass (`setTimeout(..., 0)`) to pick up late-created instances from layout startup.

### Cross-behavior access patterns

Common pattern:

1. Retrieve target instance.
2. Read unsaved map entry from `Aekiro.getInstanceData(target)`.
3. Call behavior API from stored reference.

Examples:

- Scroll view patches content `SetHeight` / `SetWidth` and forwards size-change callbacks to its own instance methods.
- Button dispatch path gets per-instance button behavior through unsaved data and invokes `OnAnyInput*` methods.

---

## 5) Release process

### Versioning rules

- Keep add-on versions in `source/*/addon.json` aligned for the release scope.
- Use release archive naming: `ProUI_vX.XXX.zip`.
- Git tags/releases may use semantic labels (e.g. `v2.0.0`) while artifact keeps `X.XXX` style.

### Packaging steps

From repo root:

```bash
./tools/release.zsh <version>
```

Script behavior:

1. Deletes and recreates `build/`.
2. Zips each folder in `source/` as `build/<addon>.c3addon`.
3. Zips all generated add-ons into `build/ProUI_v<version>.zip`.
4. Moves final artifact to `dist-collection/ProUI_v<version>.zip`.

### Validation checklist

Before publishing:

- Confirm each intended add-on imports in Construct 3.
- Smoke-test key interactions: button click/focus, dialog modal blocking, scroll view swipe/wheel.
- Ensure `ProUI` plugin exists in demo project and `Init` is called on each layout using ProUI.
- Verify doc links and release notes reference correct version.

### Artifact naming

- Individual: `<addon>.c3addon`
- Bundle: `ProUI_vX.XXX.zip`
- Storage: `dist-collection/`

---

## 6) Troubleshooting appendix

| Symptom | Probable causes | Files to inspect first |
|---|---|---|
| Buttons do not click | ProUI `Init` not called on layout start; input globally ignored; z-order winner differs from expectation | `source/aekiro_proui/c3runtime/actions.js`, `source/aekiro_proui/c3runtime/instance.js`, `source/aekiro_button/c3runtime/behavior.js` |
| Scroll view does not move | Content/slider names invalid; content not larger than viewport; input blocked by modal/top scroll view | `source/aekiro_scrollView/c3runtime/instance.js` |
| Child objects jump after resize | Parent resize scaling propagation changed local transforms unexpectedly | `source/aekiro_gameObject/c3runtime/instance.js` |
| Clone appears but layering is wrong | Post-clone z-index refresh skipped or hierarchy not rebuilt yet | `source/aekiro_proui/c3runtime/actions.js`, `source/aekiro_gameObject/c3runtime/instance.js` |
| Input works in one layout only | Manager state reset on layout change but `Init` missing in next layout | `source/aekiro_proui/c3runtime/instance.js` |

---

## 7) Documentation maintenance checklist

Use this in every release PR:

- [ ] `README.md` points to the current canonical developer guide.
- [ ] Any runtime behavior flow change updates this document’s Architecture/Interaction/Data Flow sections.
- [ ] Troubleshooting table includes newly observed failure modes.
- [ ] Release process section matches current `tools/release.zsh` behavior.
- [ ] Placeholder metadata links status reviewed (see TODO tracker below).

### TODO tracker: metadata/help links requiring cleanup

The following add-on metadata still uses placeholder website/documentation URLs (for example `https://later.com` or generic Construct pages). Replace with stable project documentation/release URLs when decided:

- `source/aekiro_proui/addon.json`
- `source/aekiro_button/addon.json`
- `source/aekiro_checkbox/addon.json`
- `source/aekiro_dialog/addon.json`
- `source/aekiro_discreteProgress/addon.json`
- `source/aekiro_discreteProgressPart/addon.json`
- `source/aekiro_gridView/addon.json`
- `source/aekiro_gridViewBind/addon.json`
- `source/aekiro_progress/addon.json`
- `source/aekiro_radiobutton/addon.json`
- `source/aekiro_radiogroup/addon.json`
- `source/aekiro_remoteSprite/addon.json`
- `source/aekiro_sliderbar/addon.json`
- `source/aekiro_translation/addon.json`
- `source/aekiro_translationB/addon.json`

