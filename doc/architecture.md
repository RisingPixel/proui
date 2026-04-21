# ProUI Runtime Architecture

## 1) System overview

ProUI is structured as a **single global plugin** (`aekiro_proui`) plus many **behavior add-ons** (button, dialog, scroll view, etc.). The plugin provides runtime-wide coordination, while behaviors attach to individual object instances and consume shared services.

- The repository describes this split explicitly: `aekiro_proui` is the required core plugin, and the rest are UI components/behaviors.
- On SDK v2, the ProUI plugin is declared via `SDK.IPluginBase` and marked `SetIsSingleGlobal(true)`, and its runtime instance is implemented by `C3.Plugins.aekiro_proui.Instance extends ISDKInstanceBase`.
- Behaviors use `ISDKBehaviorInstanceBase` and are expected to look up the single ProUI instance when they need global state.

In practice, this gives ProUI a hub-and-spoke model:

1. **Plugin instance** owns lifecycle hooks and high-level initialization (`Initialise`).
2. **Global registries/managers** live on `globalThis` and can be shared by all behaviors.
3. **Behavior instances** register themselves and read global managers for hierarchy, modal checks, scroll context, audio, and cloning support.

## 2) Runtime singleton and shared registries

Primary file: `source/aekiro_proui/c3runtime/instance.js`.

### Runtime singleton (`aekiro_proui`)

In the plugin runtime constructor:

- Ensures `globalThis.Aekiro` exists.
- Stores the singleton pointer at `globalThis.Aekiro.prouiSdkInstance`.
- Binds `this.goManager` to `globalThis.aekiro_goManager` and calls `goManager.init(runtime)`.

This is the anchor point that behaviors and utility methods use to access system-level services.

### `globalThis.Aekiro.*` registries and helpers

The same file defines a number of shared registries/caches:

- `instanceDataMap: WeakMap<instance, data>`: primary per-instance unsaved data store.
- `instanceDataByUid: Map<uid, data>`: UID-indexed fallback/lookup mirror.
- `behaviorInstances: Map<string, Set<instance>>`: reverse index by behavior key (e.g. `aekiro_gameobject`) used by scans like initialization and bulk operations.
- `protoPropertyNameCache`, `serializableBehaviorPropCache`: memoization caches for serialization/introspection.

And shared APIs:

- `registerBehaviorInstance`, `unregisterBehaviorInstance`, `getBehaviorInstances` for lifecycle-safe behavior indexing.
- `isInstanceOfPlugin` for resilient plugin-type checks across SDK/runtime representations.
- `getInstanceData` for lazily creating and retrieving per-instance data payloads.
- Compatibility shims (`compatRuntime`, `compatLayout`, `compatLayer`, `compatWorldInstance`, etc.) to present C2-style method names over C3 runtime objects where needed.

## 3) Lifecycle timeline

### Startup

1. Construct creates the single ProUI runtime instance.
2. Constructor sets singleton pointers and initializes `goManager`.
3. Constructor installs a `beforelayoutchange` listener used to clear pending initialization and stale manager state.

### `Initialise()`

`Initialise()` performs a **two-pass scene registration** pattern:

- Pass function:
  - reset `goManager.gos`
  - `registerGameObjects()`
  - `cleanSceneGraph()`
  - `createSceneGraph()`
- Runs once immediately with `goManager.isInit` false/true bracketing.
- Schedules a second `setTimeout(..., 0)` pass gated by an incrementing token (`_initialiseToken`) to avoid stale execution.

The action `Init` in `actions.js` simply forwards to this method.

### `beforelayoutchange`

Before layout transitions, ProUI:

- Cancels pending second-pass initialization timer.
- Increments initialization token so old callbacks become no-ops.
- Sets `goManager.isInit = false`.
- Clears scroll view registry (`aekiro_scrollViewManager.scrollViews`).
- Clears dialog stack (`aekiro_dialogManager.currentDialogs`).

### Behavior `_postCreate`, `_tick`, `_release`

Using button behavior as representative:

- `_postCreate`: runs post-property setup (`onPropsLoaded`) and schedules a view update tick (`updateViewTick`).
- `_tick`: executes deferred view update and per-frame tween progression; disables ticking when idle.
- `_release`: delegates to base release.

This pattern is typical for behaviors that need one-time initialization + optional per-frame work.

## 4) Manager relationships

### `goManager` (`globalThis.aekiro_goManager`)

Responsibilities:

- Owns named game-object registry `gos` and emits hierarchy events.
- Registers all `aekiro_gameobject` behavior instances via `Aekiro.getBehaviorInstances("aekiro_gameobject")`.
- Builds/cleans parent-child scene graph relations.
- Provides clone pipeline (`clone`/`_clone`) including node state application.
- Hooks runtime `instancedestroy` to release GO state and clean instance registries.

`goManager` is initialized by the ProUI singleton and is central to cross-behavior object discovery.

### ScrollView manager (`globalThis.aekiro_scrollViewManager`)

Responsibilities:

- Maintains `scrollViews` keyed by layer (`"l" + layerIndex`).
- Adds/removes entries as scroll views appear/disappear.
- Detects stale runtime instances (`_isStale`) and purges them defensively.
- Provides overlap queries used by interaction behaviors.

Button behavior reads this manager to decide if pointer coordinates are inside an active scroll context.

### Dialog manager (`globalThis.aekiro_dialogManager`)

Responsibilities:

- Maintains stack/list of opened dialogs (`currentDialogs`).
- Tracks modal presence.
- Computes whether another instance is under any modal dialog by layer order.

Button behavior uses `isInstanceUnderModal` when `ignoreInput === 2` to block interaction beneath modals.

## 5) Data flow: registration and consumption

### Text flow

1. Behavior instances call into shared utilities and/or register themselves into `Aekiro.behaviorInstances`.
2. ProUI `Initialise()` asks `goManager` to collect all `aekiro_gameobject` instances from that registry.
3. `goManager` builds named lookup (`gos`) and hierarchy links.
4. Other behaviors (button/dialog/scroll view/etc.) query:
   - `Aekiro.getInstanceData(instance)` for attached behavior state.
   - manager singletons (`goManager`, `scrollViewManager`, `dialogManager`) for global context.
5. On layout change or instance destroy, registries are cleaned/reset to prevent stale references.

### Mermaid

```mermaid
flowchart TD
  B[Behavior instance created] --> R[Aekiro.registerBehaviorInstance(key, inst)]
  R --> I[ProUI.Initialise()]
  I --> G1[goManager.registerGameObjects()]
  G1 --> G2[goManager.gos[name]=inst]
  G2 --> G3[goManager.createSceneGraph()]
  G3 --> C[Aekiro.getInstanceData(inst)]
  C --> U[Other behaviors consume state/managers]
  L[beforelayoutchange] --> X[clear scrollViews/currentDialogs + invalidate init token]
  D[instancedestroy] --> Y[release GO + delete instanceData maps]
```

## 6) Failure modes and invariants

### Invariants

- **ProUI plugin must exist** when behaviors depend on it. Button constructor looks up `C3.Plugins.aekiro_proui` single global instance and validates target object types.
- **Singleton assumption:** `globalThis.Aekiro.prouiSdkInstance` should point to one living runtime instance (or `null` after release).
- **Two-pass initialization is intentional:** first pass + deferred second pass ensures hierarchy stabilization after creation timing edge cases.
- **Layer-indexed managers:** scroll and dialog policies depend on valid layer ordering and visibility.

### Failure/edge modes

- Missing/invalid ProUI singleton can break behavior methods that dereference `this.proui`.
- Name collisions in `goManager.gos` trigger fallback renaming and log errors.
- Stale runtime instances in scroll registry are possible and explicitly guarded by `_isStale` checks.
- Outdated deferred init callback is prevented by `_initialiseToken` comparison.
- Destroyed instances are purged from both instance-data maps in the `instancedestroy` handler.

## 7) Pointers for developers

- Runtime core: `source/aekiro_proui/c3runtime/instance.js`
- Plugin metadata/editor config: `source/aekiro_proui/plugin.js`
- Public runtime actions: `source/aekiro_proui/c3runtime/actions.js`
