# ProUI User Documentation (Construct 3)

> This document is a Markdown rewrite of the existing ProUI user notes, enriched with details found in the codebase (`source/*/lang/en-US.json`, ACES metadata).

## 1) Getting started

### What you need
- Construct 3
- ProUI add-ons imported as `.c3addon`

### Required plugin
- **ProUI (`aekiro_proui`) must be added** to any project that uses ProUI behaviors.

### Typical setup flow
1. Import `aekiro_proui` and the behaviors/plugins you need.
2. Add **ProUI** plugin to the layout/project.
3. Add behavior(s) to your UI objects (Sprite / 9-patch / Tiled Background depending on behavior).
4. (Recommended) Call **ProUI → Initialise** at startup.

---

## 2) Global notes and shared syntax

### Frame/animation syntax
For properties like Normal/Hover/Clicked frames:
- `6` → frame 6 of current animation
- `animHover` → animation `animHover`
- `2/animHover` or `animHover/2` may appear in docs/examples across versions; keep a consistent style in your project

### Sound syntax
For properties such as Click/Hover/Open sound:
- `filename;volume`

### Color syntax
- `r,g,b` (example: `27,207,245`)

### Ignore Input (button-like behaviors)
Buttons/checkbox/radio can become non-clickable automatically when:
- object/layer invisible
- blocked by modal dialog

`Ignore Input` options:
- **No**: never ignore
- **Yes**: always ignore
- **Auto**: automatic behavior

---

## 3) Behaviors (end-user reference)

## Button
Applicable to: **Sprite, TiledBackground, 9-patch**

Main properties:
- `isEnabled`
- `Normal / Hover / Clicked / Disabled / Focus` frame
- `Normal / Hover / Clicked / Disabled / Focus` color
- `Click / Hover / Focus` sound
- `Click / Hover / Focus` animation + animation factor
- `Ignore Input`

Useful events/conditions:
- On Mouse Enter / Leave
- On Clicked
- On Focus / UnFocus
- Is Enabled, Is Focused, Is Clickable

Useful actions:
- Set enabled, simulate click
- Set focused
- Set sound volumes
- Runtime override for frames/colors/animations

---

## Checkbox
Applicable to: **Sprite**

Main properties:
- `isChecked`
- State frames for unchecked/checked pairs (`normal-frames`, `hover-frames`, etc.)
- Same interaction family as Button (sounds, animations, focus, ignore input)

Conditions:
- Is Checked, Is Clickable, On Clicked, focus/mouse events

Actions:
- Set enabled
- Set checked value
- Simulate click
- Set focused / ignore input

Expression:
- `value`

---

## Radio Button
Applicable to: **Sprite**

Main properties:
- `name` (radio option identifier)
- Other interaction properties are similar to Checkbox/Button

Actions:
- Set Name
- Set enabled / ignore input
- Simulate click

Expression:
- `name`

---

## Radio Group
Applicable to: **Sprite, TiledBackground, 9-patch**

Main properties:
- `value` (selected radio value)

Actions:
- Set value
- Set enabled

Expression:
- `value`

---

## Progress Bar
Behavior id: `aekiro_progress`  
Applicable to: **TiledBackground, 9-patch, Sprite**

Main properties:
- `Max Value`
- `Value`
- `Animation`
- `Type`

Actions:
- Set value
- Set max value

Expression:
- `value`

---

## Discrete Progress
Applicable to: **Sprite, TiledBackground, 9-patch**

Main properties:
- `value`

Actions:
- Set value

Expression:
- `value`

---

## Discrete Progress Part
Applicable to: **Sprite**

Main properties:
- `index`
- `0-frame`
- `0.5-frame` (optional)
- `1-frame`

Used as child items for discrete progress visuals.

---

## Slider Bar
Applicable to: **TiledBackground, 9-patch, Sprite**

Main properties:
- `Enabled`
- `Value`
- `Minimum`
- `Maximum`
- `Step`
- `Padding`
- `ValueChanged sound`
- `Type`

Conditions:
- Is Sliding
- On Changed

Actions:
- Set enabled/value/min/max/step

Expression:
- `value`

---

## Dialog
Applicable to: **TiledBackground, 9-patch, Sprite**

Main properties:
- Open animation (+ tweening + duration)
- Close animation (+ tweening + duration)
- Open/Close sound
- Close button name
- `isModal`

Conditions:
- On Dialog Opened
- On Dialog Closed
- Is Opened

Actions:
- Open `(x,y,center?)`
- Close
- Set open/close sound volume

---

## Scroll View
Applicable to: **TiledBackground, 9-patch, Sprite**

Main properties:
- Is Enabled
- Direction (Vertical / Horizontal / Both)
- Swipe Scroll
- MouseWheel Scroll
- Inertia
- Movement type (Clamped / Elastic)
- Content name
- Vertical/Horizontal slider & scrollbar names
- Mouse wheel scroll speed

Actions:
- Scroll to `(x,y)` with absolute/percentage mode and smooth factor
- Scroll by `(x,y)` with absolute/percentage mode and smooth factor
- Set enabled

---

## Grid View
Applicable to: **TiledBackground, 9-patch, Sprite**

Main properties:
- Item Name
- Max Columns / Max Rows (`-1` = dynamic/unlimited)
- Vertical/Horizontal spacing
- Vertical/Horizontal padding

Condition:
- On Render

Actions:
- Set data from JSON string (optional root key)
- Set data from JSON object (optional root key)
- Clear

Expressions:
- `at(path)`
- `count`

---

## GridView Data Bind
Applicable to: UI elements inside Grid View item templates

Main properties:
- `Binding Key` (data key to map)

Conditions:
- Compare Index
- Compare Value
- On Changed
- On Grid View Render

Expressions:
- `index`
- `key`
- `get(key)`

---

## Translation (behavior)
Behavior id: `aekiro_translationB`  
Applicable to: **Text, SpriteFont**

Main property:
- `key` (translation key; nested paths allowed by your translation data structure)

Use this on text objects you want auto-translated.

---

## Game Object
Applicable to: **any world object**

Main properties:
- `Name`
- `Parent name`
- `Parent layer`

Capabilities:
- Local transform controls: local X/Y/Angle
- Parent/child hierarchy manipulation
- Clone/destroy hierarchy
- Common appearance ops (size, scale, visibility, opacity, blend mode, mirror/flip, z-elevation, layer order)

Useful expressions:
- `name`, `parent`, `asjson`
- `globalX/globalY/globalAngle`
- `localX/localY/localAngle`

---

## 4) Plugins (end-user reference)

## ProUI plugin
Plugin id: `aekiro_proui`

Property:
- `Stop Click Propagation` (only top-most button receives click)

Conditions:
- Is Any Dialog Opened
- On Any Button Clicked

Actions:
- Initialise
- Ignore All Input (global UI input gate)
- Clone Game Object from JSON
- Set UI Volume

---

## Translation plugin
Plugin id: `aekiro_translation`

Actions:
- Translate all to language
- Set translation data from JSON string

Expression:
- `get(key, language)`

---

## Remote Sprite plugin
Plugin id: `aekiro_remoteSprite`

Actions:
- Load From URL (with sizing mode in C3 runtime variant)
- Set blend mode (runtime variant)

Use this for dynamically loading external images into sprite-like UI assets.

---

## 5) Practical usage tips

- Add **ProUI plugin first**, then attach behaviors.
- For modal flows, use **Dialog isModal** and check **ProUI Is Any Dialog Opened**.
- Keep consistent naming conventions for `Name`, `Parent Name`, `Item Name`, and binding keys.
- For GridView/Translation, validate JSON structure and root keys early.
- If interactions seem blocked, verify `Ignore Input`, visibility, and dialog layering.

---

## 6) Source mapping

This markdown was derived from:
- `doc/ProUI Doc.pdf` (provided transcript)
- behavior/plugin metadata under `source/*/lang/en-US.json`
- addon definitions under `source/*/addon.json`
