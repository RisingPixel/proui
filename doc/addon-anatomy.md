# Add-on anatomy (example: `aekiro_button`)

This page walks through one Construct 3 SDK v2 add-on end-to-end using `source/aekiro_button/` as a concrete example.

## 1) File roles in `source/aekiro_button/`

### `addon.json` (manifest + packaging)

`addon.json` is the entry-point metadata file for the add-on:

- Declares add-on identity (`"id": "aekiro_button"`, `"type": "behavior"`, version, author).
- Declares editor-time scripts via `editor-scripts` (`behavior.js`, `type.js`, `instance.js`).
- Declares `file-list`, i.e. every file to include in the `.c3addon` package.

For this add-on, the behavior is declared as SDK v2 and references the matching runtime and language files in `file-list`.

### `behavior.js` (editor-time behavior definition)

`behavior.js` defines the editor-side behavior class and property schema:

- Registers `SDK.Behaviors.aekiro_button` with Construct.
- Sets editor metadata (`name`, `description`, `help-url`, category, author).
- Declares editor properties in `SetProperties([...])` using `SDK.PluginProperty`.

Example properties include:

- `isenabled` (combo)
- `normal-frame`, `hover-frame`, `clicked-frame`, ... (text)
- `click-animation`, `hover-animation`, `focus-animation` (combo)
- animation factors (float)
- `ignore-input` (combo)

### `type.js` and `instance.js` (editor-time stubs)

These are editor-side class glue files:

- `type.js` defines `BEHAVIOR_CLASS.Type extends SDK.IBehaviorTypeBase`.
- `instance.js` defines `BEHAVIOR_CLASS.Instance extends SDK.IBehaviorInstanceBase`.

In `aekiro_button`, these files are intentionally lightweight; most behavior logic is in runtime (`c3runtime/`).

### `c3runtime/*.js` (runtime behavior implementation)

Runtime files actually execute in-game:

- `c3runtime/behavior.js`
  - Registers global pointer listeners (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`).
  - Routes input to all behavior instances, with special handling for click propagation and z-order.
- `c3runtime/type.js`
  - Runtime type class (`ISDKBehaviorTypeBase`) lifecycle hooks.
- `c3runtime/instance.js`
  - Runtime instance class (`C3.Behaviors.aekiro_button.Instance`) that reads `_getInitProperties()`.
  - Maps startup properties to internal fields (`frame_*`, `sound`, `animation`, `ignoreInput`, etc.).
  - Triggers condition callbacks (for example, `OnClicked`).
  - Saves/loads behavior state via `_saveToJson()` and `_loadFromJson()`.
- `c3runtime/actions.js`
  - Creates `Acts` object and merges shared action handlers from `globalThis.Aekiro.button.Acts`.
- `c3runtime/conditions.js`
  - Creates `Cnds` object and merges shared condition handlers from `globalThis.Aekiro.button.Cnds`.
- `c3runtime/expressions.js`
  - Defines expression table (`Exps`). (Empty for this behavior currently.)

> Important architecture note: for `aekiro_button`, shared action/condition logic actually lives in `source/aekiro_proui/c3runtime/instance.js` under `globalThis.Aekiro.button.*`, then gets attached by `aekiro_button/c3runtime/actions.js` and `conditions.js`.

### `aces.json` (ACE schema: Conditions/Actions/Expressions)

`aces.json` is the declarative ACE definition used by Construct:

- `conditions`: each entry has an `id` and `scriptName` (e.g. `"onclicked3"` -> `"OnClicked"`).
- `actions`: similar mapping (e.g. `"setenabled0"` -> `"setEnabled"`) plus parameter definitions.
- `expressions`: empty in this add-on.

This file is the contract between editor event sheet UI and runtime handler names.

### `lang/en-US.json` (localization + display strings)

`lang/en-US.json` provides all editor-facing strings:

- Behavior name/description/help URL.
- Property labels, descriptions, combo item labels.
- Condition/action list names and display text templates.

Example: action id `setenabled0` is given list text like “Set Enabled” and display text template “Set {my} to [i]{0}[/i]”.

---

## 2) Property index mapping: `_getInitProperties()` -> editor declarations

Construct passes initial behavior properties as a positional array. Order is **exactly** the order declared in `behavior.js` `SetProperties([...])`.

In `aekiro_button/c3runtime/instance.js`, these are read by index:

| Index | Runtime field | Editor property id (`behavior.js`) |
|---:|---|---|
| 0 | `this.isEnabled` | `isenabled` |
| 1 | `this.frame_normal` | `normal-frame` |
| 2 | `this.frame_hover` | `hover-frame` |
| 3 | `this.frame_clicked` | `clicked-frame` |
| 4 | `this.frame_disabled` | `disabled-frame` |
| 5 | `this.frame_focus` | `focus-frame` |
| 6 | `this.clickSound` | `click-sound` |
| 7 | `this.hoverSound` | `hover-sound` |
| 8 | `this.focusSound` | `focus-sound` |
| 9 | `this.clickAnimation` | `click-animation` |
| 10 | `this.hoverAnimation` | `hover-animation` |
| 11 | `this.focusAnimation` | `focus-animation` |
| 12 | `this.color_normal` | `normal-color` |
| 13 | `this.color_hover` | `hover-color` |
| 14 | `this.color_clicked` | `clicked-color` |
| 15 | `this.color_disabled` | `disabled-color` |
| 16 | `this.color_focus` | `focus-color` |
| 17 | `this.clickAnimationFactor` | `click-animation-factor` |
| 18 | `this.hoverAnimationFactor` | `hover-animation-factor` |
| 19 | `this.focusAnimationFactor` | `focus-animation-factor` |
| 20 | `this.ignoreInput` | `ignore-input` |

If you insert/reorder properties in `behavior.js`, you must update this index mapping or existing projects can deserialize incorrectly.

---

## 3) ACE wiring flow: `aces.json` -> runtime handlers

For this add-on, wiring happens in three layers:

1. **Declare ACE surface in `aces.json`**
   - Example condition declaration: `scriptName: "OnClicked"`.
   - Example action declaration: `scriptName: "setEnabled"`.

2. **Expose runtime ACE tables in behavior runtime files**
   - `c3runtime/conditions.js` creates `C3.Behaviors.aekiro_button.Cnds` and merges `globalThis.Aekiro.button.Cnds`.
   - `c3runtime/actions.js` creates `...Acts` and merges `globalThis.Aekiro.button.Acts`.

3. **Implement actual handler functions in shared base logic**
   - In `source/aekiro_proui/c3runtime/instance.js`:
     - `globalThis.Aekiro.button.Cnds.OnClicked()` returns true.
     - `globalThis.Aekiro.button.Acts.setEnabled(isEnabled)` calls instance method `setEnabled`.
   - Trigger points in runtime instance call `_trigger(C3.Behaviors.aekiro_button.Cnds.OnClicked)` when click events occur.

So the event-sheet name from `aces.json` (`scriptName`) must match a key present on merged `Acts`/`Cnds` at runtime.

---

## 4) Checklist for creating a new add-on

Use this as a minimum-quality checklist.

### Required files

- [ ] `addon.json`
- [ ] `icon.svg`
- [ ] Editor scripts:
  - [ ] `behavior.js` **or** `plugin.js` (depending on add-on type)
  - [ ] `type.js`
  - [ ] `instance.js`
- [ ] Runtime scripts in `c3runtime/`:
  - [ ] `behavior.js` **or** `plugin.js`
  - [ ] `type.js`
  - [ ] `instance.js`
  - [ ] `actions.js`
  - [ ] `conditions.js`
  - [ ] `expressions.js`
- [ ] `aces.json`
- [ ] `lang/en-US.json`

### Naming and IDs

- [ ] `addon.json.id` is globally unique (e.g. `aekiro_myfeature`).
- [ ] Class registration names (`SDK.Behaviors.*`/`C3.Behaviors.*` or plugin equivalents) match the add-on id.
- [ ] `lang/en-US.json` keys align with ids in `behavior.js`/`plugin.js` and `aces.json`.
- [ ] `scriptName` entries in `aces.json` match actual runtime function names.

### Versioning and packaging

- [ ] Set `addon.json.version` for the release.
- [ ] Ensure `addon.json.file-list` includes every required shipped file.
- [ ] If changing property order, preserve compatibility or add migration strategy.
- [ ] Verify the add-on imports and ACEs appear correctly in Construct.

### Functional sanity checks

- [ ] Confirm triggers fire (`On...` conditions).
- [ ] Confirm actions mutate runtime state correctly.
- [ ] Confirm save/load (`_saveToJson`/`_loadFromJson`) restores behavior state.
- [ ] Confirm localized strings appear (not raw keys).

