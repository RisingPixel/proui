"use strict";


{
	const C3 = globalThis.C3;
	const PROUI_DOM_COMPONENT_ID = "aekiro_proui_dom";

	C3.Plugins.aekiro_proui.Instance = class aekiro_prouiSingleGlobalInstance extends globalThis.ISDKInstanceBase
	{
		constructor()
		{
			super({ domComponentId: PROUI_DOM_COMPONENT_ID });
			const properties = this._getInitProperties();
	
			this.ignoreInput = false;
			this.stopClickPropagation = properties[0];
			globalThis.Aekiro = globalThis.Aekiro || {};
			globalThis.Aekiro.prouiSdkInstance = this;

			this.goManager = globalThis.aekiro_goManager;
			
			this.goManager.init(this.runtime);
			this.lastLayout = null;
			this._initialiseToken = 0;
			this._initialiseTimer = null;
			if (this._addDOMMessageHandler) {
				this._addDOMMessageHandler("audio-error", data => {
					const message = data && data.message ? data.message : "Unknown audio error";
					console.error("ProUI: Failed to play audio. " + message);
				});
			}
			
			this.runtime.addEventListener("beforelayoutchange", () =>{
				//console.log("beforelayoutchange");
				// Cancel deferred initialise work from the previous layout so a stale pass
				// cannot rebuild the graph after managers were reset for the new layout.
				if (this._initialiseTimer !== null) {
					clearTimeout(this._initialiseTimer);
					this._initialiseTimer = null;
				}
				this._initialiseToken++;
				this.goManager.isInit = false;
				if(globalThis.aekiro_scrollViewManager){
					for (const key in globalThis.aekiro_scrollViewManager.scrollViews) {
						delete globalThis.aekiro_scrollViewManager.scrollViews[key];
					}
				}
				if(globalThis.aekiro_dialogManager){
					globalThis.aekiro_dialogManager.currentDialogs.length = 0;
				}
			});

			//console.log('%c%s','color: black; background: yellow','Change starting from this Version: Add the "initialise" action of ProUI plugin on "start of layout" of every layout using ProUI.');
		}
	
		Initialise()
		{
			/*if(this.lastLayout == this.runtime.GetMainRunningLayout().GetName())return;
			this.lastLayout = this.runtime.GetMainRunningLayout().GetName();*/
			//console.log("ProUI: Initialise");
			const token = ++this._initialiseToken;
			const runPass = () => {
				// Scene graph rebuilding is destructive; always rebuild from a clean
				// name registry so parent/child links match the current layout contents.
				this.goManager.gos = {};
				this.goManager.registerGameObjects();
				this.goManager.cleanSceneGraph();
				this.goManager.createSceneGraph();
			};

			this.goManager.isInit = false;
			runPass();
			this.goManager.isInit = true;

			if (this._initialiseTimer !== null) {
				clearTimeout(this._initialiseTimer);
			}
			this._initialiseTimer = setTimeout(() => {
				if (this._initialiseToken !== token) {
					return;
				}
				// A deferred second pass catches instances created slightly after layout
				// start (e.g. startup events spawning UI), keeping naming and hierarchy in sync.
				this.goManager.isInit = false;
				runPass();
				this.goManager.isInit = true;
				this._initialiseTimer = null;
			}, 0);
		}
	
		setUIAudioVolume(volume){
			var list = ["aekiro_gameobject"];
	
			var insts,audioSources;
			for (var i = 0, l = list.length; i < l; i++) {
				insts = globalThis.Aekiro.getBehaviorInstances(list[i]);
				for (var j = 0, m = insts.length; j < m; j++) {
					audioSources = globalThis.Aekiro.getInstanceData(insts[j]).audioSources;
					if(!audioSources)continue;
	
					for(var key in audioSources){
						audioSources[key].setVolume(volume);
					}
				}
			}
		}
	
		isTypeValid(inst,types){
			for (var i = 0, l= types.length; i < l; i++) {
				if(globalThis.Aekiro.isInstanceOfPlugin(inst, types[i])){
					return true;
				}
			}
			return false;
		}
	
		_release()
		{
			if (this._initialiseTimer !== null) {
				clearTimeout(this._initialiseTimer);
				this._initialiseTimer = null;
			}
			if (globalThis.Aekiro && globalThis.Aekiro.prouiSdkInstance === this) {
				globalThis.Aekiro.prouiSdkInstance = null;
			}
			super._release();
		}
	
		_saveToJson()
		{
			return {
				// data to be saved for savegames
			};
		}
	
		_loadFromJson(o)
		{
			// load state for savegames
		}
	};
	
}

{
const Tween = globalThis["TWEEN"];
const C3 = globalThis.C3;

globalThis.Aekiro = globalThis.Aekiro || {};
globalThis.Aekiro.instanceDataMap = globalThis.Aekiro.instanceDataMap || new WeakMap();
globalThis.Aekiro.instanceDataByUid = globalThis.Aekiro.instanceDataByUid || new Map();
globalThis.Aekiro.behaviorInstances = globalThis.Aekiro.behaviorInstances || new Map();
globalThis.Aekiro.protoPropertyNameCache = globalThis.Aekiro.protoPropertyNameCache || new WeakMap();
globalThis.Aekiro.serializableBehaviorPropCache = globalThis.Aekiro.serializableBehaviorPropCache || new WeakMap();
globalThis.Aekiro.registerBehaviorInstance = globalThis.Aekiro.registerBehaviorInstance || function(key, inst) {
	if (!key || !inst) {
		return;
	}
	let set = globalThis.Aekiro.behaviorInstances.get(key);
	if (!set) {
		set = new Set();
		globalThis.Aekiro.behaviorInstances.set(key, set);
	}
	set.add(inst);
};
globalThis.Aekiro.unregisterBehaviorInstance = globalThis.Aekiro.unregisterBehaviorInstance || function(key, inst) {
	const set = globalThis.Aekiro.behaviorInstances.get(key);
	if (!set) {
		return;
	}
	set.delete(inst);
	if (!set.size) {
		globalThis.Aekiro.behaviorInstances.delete(key);
	}
};
globalThis.Aekiro.getBehaviorInstances = globalThis.Aekiro.getBehaviorInstances || function(key) {
	const set = globalThis.Aekiro.behaviorInstances.get(key);
	return set ? Array.from(set) : [];
};
globalThis.Aekiro.isInstanceOfPlugin = globalThis.Aekiro.isInstanceOfPlugin || function(inst, ctor) {
	if (!inst || !ctor) {
		return false;
	}

	const targetPlugin = globalThis.IPlugin && globalThis.IPlugin.getByConstructor
		? globalThis.IPlugin.getByConstructor(ctor)
		: null;
	const instPlugin = inst.plugin || (inst.objectType ? inst.objectType.plugin : null);

	if (instPlugin && targetPlugin) {
		if (instPlugin === targetPlugin) {
			return true;
		}
		if (instPlugin.id && targetPlugin.id && instPlugin.id === targetPlugin.id) {
			return true;
		}
	}

	if (inst.plugin && inst.plugin.constructor === ctor) {
		return true;
	}

	return false;
};
globalThis.Aekiro.compatRect = globalThis.Aekiro.compatRect || function(rect) {
	if (!rect || rect.__aekiroCompatRect) {
		return rect;
	}

	return {
		__aekiroCompatRect: true,
		left: rect.left,
		right: rect.right,
		top: rect.top,
		bottom: rect.bottom,
		width: rect.width,
		height: rect.height,
		getLeft() { return this.left; },
		getRight() { return this.right; },
		getTop() { return this.top; },
		getBottom() { return this.bottom; },
		getWidth() { return this.width; },
		getHeight() { return this.height; }
	};
};
globalThis.Aekiro.compatLayer = globalThis.Aekiro.compatLayer || function(layer) {
	if (!layer || layer.__aekiroCompatLayer) {
		return layer;
	}

	layer.__aekiroCompatLayer = true;
	layer.GetIndex = function() { return this.index; };
	layer.IsVisible = function() { return this.isVisible; };
	layer.SetVisible = function(v) { this.isVisible = v; };
	layer.GetOpacity = function() { return this.opacity; };
	layer.SetOpacity = function(v) { this.opacity = v; };
	layer.GetOwnScale = function() { return this.scale; };
	layer.SetOwnScale = function(v) { this.scale = v; };
	layer.GetViewport = function() { return globalThis.Aekiro.compatRect(this.getViewport()); };
	layer.CanvasCssToLayer = function(clientX, clientY, z) { return this.cssPxToLayer(clientX, clientY, z); };
	layer.GetLayout = function() { return this.layout; };
	layer.SetForceOwnTexture = function(v) { this.isForceOwnTexture = v; };
	layer.MoveInstanceAdjacent = function(inst, other, isAfter) {
		if (inst && typeof inst.moveAdjacentToInstance === "function") {
			return inst.moveAdjacentToInstance(other, isAfter);
		}
	};

	return layer;
};
globalThis.Aekiro.compatObjectClass = globalThis.Aekiro.compatObjectClass || function(objectClass) {
	if (!objectClass || objectClass.__aekiroCompatObjectClass) {
		return objectClass;
	}

	objectClass.__aekiroCompatObjectClass = true;
	objectClass.GetName = function() { return this.name; };

	return objectClass;
};
globalThis.Aekiro.compatLayout = globalThis.Aekiro.compatLayout || function(layout) {
	if (!layout || layout.__aekiroCompatLayout) {
		return layout;
	}

	layout.__aekiroCompatLayout = true;
	layout.GetName = function() { return this.name; };
	layout.GetLayerCount = function() {
		return Array.isArray(this.layers) ? this.layers.length : 0;
	};
	layout.GetLayerByIndex = function(index) {
		if (!Array.isArray(this.layers)) {
			return null;
		}
		return globalThis.Aekiro.compatLayer(this.layers[index] || null);
	};

	return layout;
};
globalThis.Aekiro.compatRuntime = globalThis.Aekiro.compatRuntime || function(runtime) {
	if (!runtime || runtime.__aekiroCompatRuntime) {
		return runtime;
	}

	runtime.__aekiroCompatRuntime = true;
	runtime.GetWallTime = function() {
		return this.wallTime ?? this.gameTime ?? (performance.now() / 1000);
	};
	runtime.GetTimeScale = function() {
		return this.timeScale ?? 1;
	};
	runtime.GetDt = function() {
		return this.dt ?? this.timeScaleDt ?? (1 / 60);
	};
	runtime.GetMainRunningLayout = function() {
		return globalThis.Aekiro.compatLayout(this.layout || this.mainRunningLayout || null);
	};
	runtime.DestroyInstance = function(inst) {
		if (!inst) {
			return;
		}
		if (typeof this.destroyInstance === "function") {
			return this.destroyInstance(inst);
		}
		if (typeof inst.destroy === "function") {
			return inst.destroy();
		}
	};
	runtime.UpdateRender = function() {};

	return runtime;
};
globalThis.Aekiro.compatBlendMode = globalThis.Aekiro.compatBlendMode || function(mode) {
	if (typeof mode === "string") {
		return mode;
	}

	const legacyBlendModes = [
		"normal",
		"additive",
		"xor",
		"copy",
		"destination-over",
		"source-in",
		"destination-in",
		"source-out",
		"destination-out",
		"source-atop",
		"destination-atop",
		"lighten",
		"darken",
		"multiply",
		"screen"
	];

	if (typeof mode === "number" && mode >= 0 && mode < legacyBlendModes.length) {
		return legacyBlendModes[mode];
	}

	return "normal";
};
globalThis.Aekiro.compatWorldInstance = globalThis.Aekiro.compatWorldInstance || function(inst) {
	if (!inst || inst.__aekiroCompatWorldInstance) {
		return inst;
	}

	inst.__aekiroCompatWorldInstance = true;
	inst.GetInstance = function() { return this; };
	inst.GetWorldInfo = function() { return this; };
	inst.GetUnsavedDataMap = function() { return globalThis.Aekiro.getInstanceData(this); };
	inst.GetUID = function() { return this.uid; };
	inst.GetObjectClass = function() { return globalThis.Aekiro.compatObjectClass(this.objectType); };
	inst.GetLayer = function() { return globalThis.Aekiro.compatLayer(this.layer); };
	inst.GetX = function() { return this.x; };
	inst.SetX = function(x) { this.x = x; };
	inst.GetY = function() { return this.y; };
	inst.SetY = function(y) { this.y = y; };
	inst.SetXY = function(x, y) {
		if (this.setPosition) {
			this.setPosition(x, y);
		} else {
			this.x = x;
			this.y = y;
		}
	};
	inst.OffsetX = function(dx) { this.SetX(this.GetX() + dx); };
	inst.OffsetY = function(dy) { this.SetY(this.GetY() + dy); };
	inst.OffsetXY = function(dx, dy) { this.SetXY(this.GetX() + dx, this.GetY() + dy); };
	inst.GetWidth = function() { return this.width; };
	inst.SetWidth = function(w) { this.width = w; };
	inst.GetHeight = function() { return this.height; };
	inst.SetHeight = function(h) { this.height = h; };
	inst.SetSize = function(w, h) {
		if (this.setSize) {
			this.setSize(w, h);
		} else {
			this.width = w;
			this.height = h;
		}
	};
	inst.GetAngle = function() { return this.angle; };
	inst.SetAngle = function(a) { this.angle = a; };
	inst.OffsetAngle = function(da) { this.SetAngle(this.GetAngle() + da); };
	inst.GetCosAngle = function() { return Math.cos(this.angle); };
	inst.GetSinAngle = function() { return Math.sin(this.angle); };
	inst.GetOpacity = function() { return this.opacity; };
	inst.SetOpacity = function(o) { this.opacity = o; };
	inst.GetBlendMode = function() {
		return this.blendMode;
	};
	inst.SetBlendMode = function(mode) {
		this.blendMode = globalThis.Aekiro.compatBlendMode(mode);
	};
	inst.GetBoundingBox = function() { return globalThis.Aekiro.compatRect(this.getBoundingBox()); };
	inst.GetBoundingQuad = function() { return this.getBoundingQuad(); };
	inst.GetQuad = function() { return this.getBoundingQuad(); };
	inst.ContainsPoint = function(x, y) { return this.containsPoint(x, y); };
	inst.IsVisible = function() { return this.isVisible; };
	inst.SetVisible = function(v) { this.isVisible = v; };
	inst.IsDestroyed = function() { return !!this.isDestroyed; };
	inst.MoveToTop = function() { return this.moveToTop(); };
	inst.MoveToBottom = function() { return this.moveToBottom(); };
	inst.MoveToLayer = function(layer) { return this.moveToLayer(layer); };
	inst.GetZIndex = function() { return this.zIndex; };
	inst.GetTotalZ = function() { return this.totalZ ?? this.totalZ ?? this.z ?? 0; };
	inst.GetTotalZElevation = function() { return this.totalZ ?? this.totalZ ?? this.z ?? 0; };
	inst.SetBboxChanged = function() {};

	globalThis.Aekiro.compatLayer(inst.layer);

	return inst;
};
globalThis.Aekiro.getInstanceData = globalThis.Aekiro.getInstanceData || function(inst) {
	globalThis.Aekiro.compatWorldInstance(inst);
	const uid = inst && (typeof inst.uid === "number" || typeof inst.uid === "string")
		? inst.uid
		: null;
	let data = uid !== null
		? globalThis.Aekiro.instanceDataByUid.get(uid)
		: globalThis.Aekiro.instanceDataMap.get(inst);
	if (!data) {
		data = {};
		if (uid !== null) {
			globalThis.Aekiro.instanceDataByUid.set(uid, data);
		} else {
			globalThis.Aekiro.instanceDataMap.set(inst, data);
		}
	}
	return data;
};
globalThis.Aekiro.cloneSerializableValue = globalThis.Aekiro.cloneSerializableValue || function(value) {
	if (value == null) {
		return value;
	}
	const type = typeof value;
	if (type === "string" || type === "number" || type === "boolean") {
		return value;
	}
	if (Array.isArray(value)) {
		return value
			.map(globalThis.Aekiro.cloneSerializableValue)
			.filter(v => v !== undefined);
	}
	if (type !== "object") {
		return undefined;
	}
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) {
		return undefined;
	}
	const out = {};
	for (const key of Object.keys(value)) {
		const cloned = globalThis.Aekiro.cloneSerializableValue(value[key]);
		if (cloned !== undefined) {
			out[key] = cloned;
		}
	}
	return out;
};
globalThis.Aekiro.serializeInstanceVars = globalThis.Aekiro.serializeInstanceVars || function(inst) {
	if (!inst || !inst.instVars) {
		return null;
	}
	const result = {};
	const names = Object.getOwnPropertyNames(inst.instVars);
	for (const name of names) {
		const cloned = globalThis.Aekiro.cloneSerializableValue(inst.instVars[name]);
		if (cloned !== undefined) {
			result[name] = cloned;
		}
	}
	return Object.keys(result).length ? result : null;
};
globalThis.Aekiro.applyInstanceVars = globalThis.Aekiro.applyInstanceVars || function(inst, state) {
	if (!inst || !inst.instVars || !state) {
		return;
	}
	for (const name of Object.keys(state)) {
		try {
			inst.instVars[name] = state[name];
		} catch (_err) {
		}
	}
};
globalThis.Aekiro.serializeWorldState = globalThis.Aekiro.serializeWorldState || function(inst) {
	const state = {
		width: inst.GetWidth(),
		height: inst.GetHeight(),
		angle: inst.GetAngle ? inst.GetAngle(true) : inst.GetAngle(),
		opacity: inst.GetOpacity ? inst.GetOpacity() : inst.opacity,
		visible: inst.IsVisible ? inst.IsVisible() : inst.isVisible
	};
	if ("originX" in inst && typeof inst.originX === "number") {
		state.originX = inst.originX;
	}
	if ("originY" in inst && typeof inst.originY === "number") {
		state.originY = inst.originY;
	}
	const animationName = typeof inst.animationName === "string"
		? inst.animationName
		: (inst.animation && typeof inst.animation.name === "string" ? inst.animation.name : null);
	if (animationName) {
		state.animationName = animationName;
	}
	if ("animationFrame" in inst && typeof inst.animationFrame === "number") {
		state.animationFrame = inst.animationFrame;
	}
	if ("colorRgb" in inst) {
		state.colorRgb = inst.colorRgb;
	}
	return state;
};
globalThis.Aekiro.applyWorldState = globalThis.Aekiro.applyWorldState || function(inst, state) {
	if (!state) {
		return;
	}
	if (typeof state.originX === "number" && typeof state.originY === "number" && typeof inst.setOrigin === "function") {
		inst.setOrigin(state.originX, state.originY);
	}
	if (typeof state.animationName === "string" && state.animationName.length && typeof inst.setAnimation === "function") {
		inst.setAnimation(state.animationName, "current-frame");
	}
	if (typeof state.animationFrame === "number" && "animationFrame" in inst) {
		inst.animationFrame = state.animationFrame;
	}
	if (typeof state.width === "number") {
		inst.SetWidth(state.width, true);
	}
	if (typeof state.height === "number") {
		inst.SetHeight(state.height, true);
	}
	if (typeof state.opacity === "number") {
		inst.SetOpacity(state.opacity);
	}
	if (typeof state.visible === "boolean") {
		inst.SetVisible(state.visible);
	}
	if ("colorRgb" in state && "colorRgb" in inst) {
		inst.colorRgb = state.colorRgb;
	}
	inst.SetBboxChanged();
};
globalThis.Aekiro.objectPropertySkipProps = globalThis.Aekiro.objectPropertySkipProps || new Set([
	"constructor",
	"uid",
	"iid",
	"runtime",
	"plugin",
	"objectType",
	"behaviors",
	"effects",
	"layer",
	"layout",
	"x",
	"y",
	"z",
	"zIndex",
	"zElevation",
	"totalZ",
	"totalZElevation",
	"width",
	"height",
	"angle",
	"angleDegrees",
	"opacity",
	"isVisible",
	"visible",
	"originX",
	"originY",
	"colorRgb",
	"animation",
	"animationName",
	"animationFrame",
	"timeScale",
	"dt",
	"activeSampling",
	"sampling",
	"blendMode",
	"worldInfo",
	"instance",
	"sdkInstance",
	"unsavedDataMap",
	"collisionCells",
	"renderCells",
	"boundingBox",
	"boundingQuad",
	"quad",
	"imageInfo",
	"imageAsset",
	"children",
	"parent"
]);
globalThis.Aekiro.serializeObjectProperties = globalThis.Aekiro.serializeObjectProperties || function(inst) {
	if (!inst) {
		return null;
	}

	const SKIP = globalThis.Aekiro.objectPropertySkipProps || new Set();
	const props = {};
	const seen = new Set();
	let proto = inst;

	while (proto && proto !== Object.prototype) {
		for (const name of Object.getOwnPropertyNames(proto)) {
			if (seen.has(name) || SKIP.has(name)) {
				continue;
			}
			seen.add(name);

			let value;
			try {
				value = inst[name];
			} catch (_err) {
				continue;
			}

			if (typeof value === "function") {
				continue;
			}

			const cloned = globalThis.Aekiro.cloneSerializableValue(value);
			if (cloned !== undefined) {
				props[name] = cloned;
			}
		}
		proto = Object.getPrototypeOf(proto);
	}

	return Object.keys(props).length ? props : null;
};
globalThis.Aekiro.applyObjectProperties = globalThis.Aekiro.applyObjectProperties || function(inst, state) {
	if (!inst || !state) {
		return;
	}

	const SKIP = globalThis.Aekiro.objectPropertySkipProps || new Set();
	for (const name of Object.keys(state)) {
		if (SKIP.has(name)) {
			continue;
		}
		try {
			inst[name] = state[name];
		} catch (_err) {
		}
	}
};
globalThis.Aekiro.scriptBehaviorSkipProps = globalThis.Aekiro.scriptBehaviorSkipProps || new Set([
	"constructor",
	"behavior",
	"instance",
	"runtime",
	"objectType",
	"plugin",
	"sdkInstance",
	"addon",
	"inst",
	"wi",
	"acts",
	"eventManager",
	"goManager",
	"children",
	"parent",
	"local",
	"prev",
	"userName",
	"areChildrenRegistred",
	"isWorldInfoOverrided",
	"proui",
	"aekiro_dialogManager",
	"scrollViews",
	"audioSources",
	"aekiro_gameobject"
]);
globalThis.Aekiro.serializeScriptBehaviorStates = globalThis.Aekiro.serializeScriptBehaviorStates || function(inst) {
	const getAllPropertyNames = value => {
		const names = new Set();
		let proto = value;
		while (proto && proto !== Object.prototype) {
			for (const name of Object.getOwnPropertyNames(proto)) {
				names.add(name);
			}
			proto = Object.getPrototypeOf(proto);
		}
		return names;
	};
	const SKIP_PROPS = globalThis.Aekiro.scriptBehaviorSkipProps;

	const result = {};
	const behaviors = inst && inst.behaviors ? inst.behaviors : null;
	if (!behaviors) {
		return result;
	}

	for (const key of getAllPropertyNames(behaviors)) {
		if (key === "aekiro_gameobject") {
			continue;
		}
		if (SKIP_PROPS.has(key)) {
			continue;
		}
		let behaviorInst;
		try {
			behaviorInst = behaviors[key];
		} catch (_err) {
			continue;
		}
		if (!behaviorInst) {
			continue;
		}
		const data = {};
		const seen = new Set();

		for (const prop of Object.keys(behaviorInst)) {
			seen.add(prop);
		}

		let proto = behaviorInst;
		while (proto && proto !== Object.prototype) {
			for (const prop of Object.getOwnPropertyNames(proto)) {
				if (!seen.has(prop)) {
					seen.add(prop);
				}
			}
			proto = Object.getPrototypeOf(proto);
		}

		for (const prop of seen) {
			if (SKIP_PROPS.has(prop)) {
				continue;
			}
			if (prop.endsWith("Manager")) {
				continue;
			}
			let value;
			try {
				value = behaviorInst[prop];
			} catch (_err) {
				continue;
			}
			if (typeof value === "function") {
				continue;
			}
			const cloned = globalThis.Aekiro.cloneSerializableValue(value);
			if (cloned !== undefined) {
				data[prop] = cloned;
			}
		}
		if (Object.keys(data).length) {
			result[key] = data;
		}
	}

	return result;
};
globalThis.Aekiro.applyScriptBehaviorStates = globalThis.Aekiro.applyScriptBehaviorStates || function(inst, states) {
	if (!states || !inst || !inst.behaviors) {
		return;
	}
	const SKIP_PROPS = globalThis.Aekiro.scriptBehaviorSkipProps || new Set();
	for (const key in states) {
		if (!Object.prototype.hasOwnProperty.call(states, key)) {
			continue;
		}
		if (key === "aekiro_gameobject") {
			continue;
		}
		let behaviorInst = null;
		try {
			behaviorInst = inst.behaviors[key];
		} catch (_err) {
		}
		const state = states[key];
		if (!behaviorInst || !state) {
			continue;
		}
		for (const prop of Object.keys(state)) {
			if (SKIP_PROPS.has(prop) || prop.endsWith("Manager")) {
				continue;
			}
			try {
				behaviorInst[prop] = state[prop];
			} catch (_err) {
			}
		}
		if (typeof behaviorInst.updateInitialState === "function") {
			behaviorInst.updateInitialState();
		}
	}
};
globalThis.Aekiro.serializeNodeState = globalThis.Aekiro.serializeNodeState || function(inst) {
	return {
		gameobject: globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject.SaveToJson(),
		instanceVars: globalThis.Aekiro.serializeInstanceVars(inst),
		objectProperties: globalThis.Aekiro.serializeObjectProperties(inst),
		world: globalThis.Aekiro.serializeWorldState(inst),
		scriptBehaviors: globalThis.Aekiro.serializeScriptBehaviorStates(inst)
	};
};
globalThis.Aekiro.applyNodeState = globalThis.Aekiro.applyNodeState || function(inst, state) {
	if (!state) {
		return;
	}
	var aekiro_gameobject = globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject;
	if (aekiro_gameobject && state.gameobject) {
		aekiro_gameobject.LoadFromJson(state.gameobject);
	}
	if (state.instanceVars) {
		globalThis.Aekiro.applyInstanceVars(inst, state.instanceVars);
	}
	if (state.objectProperties) {
		globalThis.Aekiro.applyObjectProperties(inst, state.objectProperties);
	}
	if (state.world) {
		globalThis.Aekiro.applyWorldState(inst, state.world);
	}
	if (state.scriptBehaviors) {
		globalThis.Aekiro.applyScriptBehaviorStates(inst, state.scriptBehaviors);
	}
};

globalThis.AudioSource = class AudioSource {
	constructor(opts,runtime){
		this.runtime = runtime;
		this.parseConfig(opts);
		this.preload();
	}

	parseConfig(opts){
		opts = opts.split(";");
		this.fileName = opts[0];
		this.volume = parseInt(opts[1]);
		if(!this.volume)this.volume = 0;
	}

	getProuiSdkInstance(){
		return globalThis.Aekiro ? globalThis.Aekiro.prouiSdkInstance : null;
	}

	preload(){
		if(!this.fileName)return;
		var proui = this.getProuiSdkInstance();
		if(!proui || !proui._postToDOM)return;
		proui._postToDOM("audio-preload", {
			fileName: this.fileName
		});
	}

	setVolume(v){
		this.volume = v;
	}

	play(){
		//console.log(this.fileName,this.volume);
		if(!this.fileName)return;
		var proui = this.getProuiSdkInstance();
		if(!proui || !proui._postToDOM){
			console.error("ProUI: DOM-side audio bridge is unavailable.");
			return;
		}
		proui._postToDOM("audio-play", {
			fileName: this.fileName,
			volume: this.volume
		});
	}
};

globalThis.EventManager = class EventManager {
	constructor(inst){
		this.map = {};
		this.inst = inst;
	}
	on (eventName,callback,options) {
		if(!this.map[eventName]){
			this.map[eventName] = [];
		}
		
		var once = false;
		if(options){
			once = options["once"];
		}
		
		var listener = {"callback":callback,"once":once, "eventName": eventName};
		this.map[eventName].push(listener);
		
		return listener;
	}

	emit (eventName,options) {
		options = options || {};
		var listeners = this.map[eventName];
		var listener;
		//console.log(this.map);
		if(listeners){
			for (var i = 0, l=listeners.length; i < l; i++) {
				listener = listeners[i];
				listener["callback"](options["args"]);
				if(listener["once"]){
					this.removeListener(listener);
					
					l=listeners.length;
					if(l==0){
						break;
					}

					i--;
				}
			}
			
		}
		
		
		if(options["propagate"] == undefined) options["propagate"] = true;
		if(options["bubble"] == undefined) options["bubble"] = true;
		
		var options2 = Object.assign({}, options);
		options2["propagate"] = false;
		//bubble the event up the hierarchy
		if(options["bubble"] === true && this.inst){
			var go = globalThis.Aekiro.getInstanceData(this.inst).aekiro_gameobject;
			if(go.parent){
				globalThis.Aekiro.getInstanceData(go.parent).aekiro_gameobject.eventManager.emit(eventName,options2);
			}	
		}
		
		options2 = Object.assign({}, options);
		options2["bubble"] = false;
		//propagate the event down the hierarchy 
		
		if(options["propagate"] === true && this.inst){
			var go = globalThis.Aekiro.getInstanceData(this.inst).aekiro_gameobject;
			var children = go.children;
			for (var i = 0, l=children.length; i < l; i++) {
				globalThis.Aekiro.getInstanceData(children[i]).aekiro_gameobject.eventManager.emit(eventName,options);
			}
		}
	}

	removeListener(listener) {
		var listeners = this.map[listener["eventName"]];
		var index = listeners.indexOf(listener);
		listeners.splice(index, 1);
	}
};


globalThis.aekiro_goManager = {
	gos : {},
	haltNext:false,
	isRegistering:false,
	eventManager: new globalThis.EventManager(),
	lastLayout:0,
	
	init : function(runtime){
		if(this.runtime)return;
		
		this.runtime = globalThis.Aekiro.compatRuntime(runtime);		
		//this is used instead of _release(), because _release() comes after beforelayoutstart and clears everything that was setup.
		this.runtime.addEventListener("instancedestroy", function(e){
			const inst = e.instance;
			const data = globalThis.Aekiro.getInstanceData(inst);
			var go = data.aekiro_gameobject;
			if(go){
				go.Release2();	
			}
			if (inst) {
				globalThis.Aekiro.instanceDataMap.delete(inst);
				if (typeof inst.uid === "number" || typeof inst.uid === "string") {
					globalThis.Aekiro.instanceDataByUid.delete(inst.uid);
				}
			}
		});
		
	},

	clean : function(){
		var key;
		for(key in this.gos){
			if(this.gos[key].IsDestroyed()){
				this.removeGO(key);
			}
		}
	},
	
	addGO : function(inst){
		if(!inst)return;

		if(this.haltNext)return;
		
		var aekiro_gameobject = globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject;

		if(!aekiro_gameobject.name){
			aekiro_gameobject.name = "o"+inst.GetUID();
		}
		/*if(!name){
			console.error("Aekiro Hierarchy: object of uid=%s has no name !",inst.uid);
			return;
		}*/
		
		var name = aekiro_gameobject.name;
		if(this.gos.hasOwnProperty(name)){
			console.error("Aekiro Hierarchy: GameObject already exist with name: %s !",name);
			aekiro_gameobject.name = "o"+inst.GetUID();
			name = aekiro_gameobject.name;
			//return;
		}
		this.gos[name] = inst;
		
	},

	removeGO : function(name){
		delete this.gos[name];
	},

	setGoName : function(oldName,newName){
		if(!this.gos[oldName]){
			throw new Error("ProUI-goManager.setGoName() : game object to be renamed not found");
		}
		if(this.gos.hasOwnProperty(newName)){
			throw new Error("ProUI-goManager.setGoName() : game object already exist with name: "+newName);
		}

		this.gos[newName] = this.gos[oldName];

		this.removeGO(oldName);
	},

	getName : function(inst){
		var key;
		for(key in this.gos){
			if(this.gos[key] == inst){
				return key;
			}
		}
		return false;
	},
	
	removeGO2 : function(inst){
		var key;
		for(key in this.gos){
			if(this.gos[key] == inst){
				this.removeGO(key);
			}
		}
	},
	
	createInstance : function (objectClass,layer,x,y,templateName){
		this.objectTypeCache = this.objectTypeCache || new Map();
		const objectTypeKey = String(objectClass).toLowerCase();
		let objectType = this.objectTypeCache.get(objectTypeKey) || null;
		if(!objectType && this.runtime.objects){
			objectType = this.runtime.objects[objectClass] || null;
			if(!objectType){
				const objectNames = Object.keys(this.runtime.objects);
				const match = objectNames.find(name => name.toLowerCase() === objectTypeKey);
				if(match){
					objectType = this.runtime.objects[match];
				}
			}
			if(objectType){
				this.objectTypeCache.set(objectTypeKey, objectType);
			}
		}
		if(!objectType || typeof objectType.createInstance !== "function"){
			throw new Error("ProUI: Object type not found for clone: " + objectClass);
		}
		const layerRef = typeof layer === "string" || typeof layer === "number"
			? layer
			: (layer && typeof layer.index === "number" ? layer.index : 0);
		const px = typeof x === "number" ? x : 0;
		const py = typeof y === "number" ? y : 0;
		if(typeof templateName === "string" && templateName.length){
			return objectType.createInstance(layerRef, px, py, false, templateName);
		}
		return objectType.createInstance(layerRef, px, py, false);
	},
	
	clone : function (template,name,parent,layer, x, y,onNodeCreated){
		if(this.gos[name]){
			console.error("Aekiro GameObject: GameObject already exist with name: %s !",name);
			return;
		}
		
		if (typeof parent === 'string'){
			parent = this.gos[parent];	
		}
		
		//the x,y are global and _clone expect locals, so transform xy into locals in parent space
		if(parent){
			var wp = parent;
			var res = this.globalToLocal3(x,y,0,wp.GetX(),wp.GetY(),wp.GetAngle());
			x = res.x;
			y = res.y;
		}
		
		var inst = this._clone(template,name,parent,layer,x,y,onNodeCreated);
		
		globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject.children_update();
		globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject.updateZindex();
		
		var aekiro_gameobject = globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject;
		aekiro_gameobject.eventManager.emit("cloned",{"bubble":false,"propagate":false});
		
		return inst;
	},
	
	_clone : function (t_node,name,parent,layer, x, y, onNodeCreated){
		//haltNext is used to skip addGo() executed on the instance creation
		this.haltNext = true;
		var inst = this.createInstance(t_node.type, layer, 0, 0, t_node.templateName);
		this.haltNext = false;

		var aekiro_gameobject = globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject;
		var nodeState = t_node.json || null;
		if (!nodeState) {
			nodeState = {};
		} else if (typeof nodeState === "string") {
	        try {
	            nodeState = JSON.parse(nodeState);
	        } catch (a) {
	            return void console.error("Failed to load from JSON string: ", a);
	        }
		} else {
			nodeState = Object.assign({}, nodeState);
		}
		if (!nodeState.gameobject) {
			nodeState.gameobject = {};
		} else {
			nodeState.gameobject = Object.assign({}, nodeState.gameobject);
		}
		if (!nodeState.world && t_node.world) {
			nodeState.world = t_node.world;
		}
		if (!nodeState.instanceVars && t_node.instanceVars) {
			nodeState.instanceVars = t_node.instanceVars;
		}
		if (!nodeState.objectProperties && t_node.objectProperties) {
			nodeState.objectProperties = t_node.objectProperties;
		}
		if (!nodeState.scriptBehaviors && t_node.scriptBehaviors) {
			nodeState.scriptBehaviors = t_node.scriptBehaviors;
		}
		nodeState.gameobject.name = "";
		nodeState.gameobject.parentName = "";
		nodeState.gameobject.global_x = 0;
		nodeState.gameobject.global_y = 0;

		globalThis.Aekiro.applyNodeState(inst, nodeState);
		
		//aekiro_gameobject.eventManager.emit("cloned");
		
		globalThis.Aekiro.getInstanceData(inst).zindex = t_node.zindex;
		inst.moveToLayer(layer);

		aekiro_gameobject.name = "";
		aekiro_gameobject.parentName = "";
		if(name)aekiro_gameobject.name = name;
		this.addGO(inst);
		//aekiro_gameobject.onCreateInit();

		var wi = inst;
		var globalX = x;
		var globalY = y;
		var globalAngle = typeof t_node.angle === "number" ? t_node.angle : 0;
		if(parent){
			var wp = parent;
			globalX = wp.GetX() + x*Math.cos(wp.GetAngle()) - y*Math.sin(wp.GetAngle());
			globalY = wp.GetY() + x*Math.sin(wp.GetAngle()) + y*Math.cos(wp.GetAngle());
			globalAngle = wp.GetAngle() + globalAngle;
		}
		wi.SetX(globalX);
		wi.SetY(globalY);
		if(typeof t_node.angle === "number"){
			wi.SetAngle(globalAngle);
		}

		if(parent){
			globalThis.Aekiro.getInstanceData(parent).aekiro_gameobject.children_add(inst);
		}
		wi.SetBboxChanged();
		
		if(onNodeCreated)onNodeCreated(inst);
		
		//we put the trigger after the json state is applied, so that any modif happening in the eventsheet onCreated wont be overrided by the LoadFromJsonString
		//inst._postCreate();
		
		
		var child;
		for (var i = 0, l= t_node.children.length; i < l; i++) {
			child = t_node.children[i];
			this._clone(child,null,inst, layer, child.x, child.y,onNodeCreated);
		}

		return inst;
	},
	
	globalToLocal3: function(x,y,a,p_x,p_y,p_angle){
		var res = {};
		res.x = (x-p_x)*Math.cos(p_angle) + (y-p_y)*Math.sin(p_angle);
		res.y = -(x-p_x)*Math.sin(p_angle) + (y-p_y)*Math.cos(p_angle);
		res.angle = a - p_angle;
		return res;
	},
	
	registerGameObjects : function(){
		var insts = globalThis.Aekiro.getBehaviorInstances("aekiro_gameobject");
		var l = insts.length;
		for (var i = 0; i < l; i++){
			//we check for IsDestroyed: somehow when objects on a global layer get destroyed and recreated going from layer to another
			if(!insts[i].IsDestroyed()){
				this.addGO(insts[i]);	
			}
		}
	},

	createSceneGraph:function(){
		//console.log(this.gos);		
		var key, go, aekiro_gameobject;
		var parentSameLayer = {};
		for(key in this.gos){
			go = this.gos[key];
			aekiro_gameobject = globalThis.Aekiro.getInstanceData(go).aekiro_gameobject;
			if(aekiro_gameobject.parentName && this.gos[aekiro_gameobject.parentName]){
				globalThis.Aekiro.getInstanceData(this.gos[aekiro_gameobject.parentName]).aekiro_gameobject.children_add(go);
			}
			if(aekiro_gameobject.parentSameLayer){
				parentSameLayer[key] = go;
			}
		}
		
		for(key in parentSameLayer){
			go = parentSameLayer[key];
			aekiro_gameobject = globalThis.Aekiro.getInstanceData(go).aekiro_gameobject;
			aekiro_gameobject.children_addFromLayer(aekiro_gameobject.GetLayer());
		}
		
		//the onCreated trigger is executed before the children_register; so when a modif is applied to the parent on the trigger, the chidlren dont get updated
		for(key in this.gos){
			globalThis.Aekiro.getInstanceData(this.gos[key]).aekiro_gameobject.children_update();
		}
		
		//console.log("childrenRegistred");
		this.eventManager.emit("childrenRegistred");
	},
	
	cleanSceneGraph : function(){
		var key, inst;
		for(key in this.gos){
			inst = this.gos[key];
			var go = globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject;
			if(!go){
				continue;
			}
			go.removeFromParent();
			go.removeAllChildren();
			go.parent = null;
		}
	}

};



globalThis.Aekiro.button = class aekiro_button extends globalThis.ISDKBehaviorInstanceBase
{
	constructor()
	{
		super();
	}

	button_constructor()
	{

		this.proui = globalThis.IPlugin.getByConstructor(C3.Plugins.aekiro_proui);
		if(this.proui){
			this.proui = this.proui.getSingleGlobalInstance();
		}
		this.proui.isTypeValid(this.instance,[C3.Plugins.Sprite,C3.Plugins.NinePatch,C3.Plugins.TiledBg],"Pro UI: Button behavior is only applicable to Sprite, 9-patch or tiled backgrounds objects.");
		
		this.inst = this.instance;
		this.wi = this.inst;
		this.goManager = globalThis.aekiro_goManager;
		this.scrollViews = globalThis.aekiro_scrollViewManager.scrollViews;
		this.aekiro_dialogManager = globalThis.aekiro_dialogManager;
		globalThis.Aekiro.getInstanceData(this.instance).aekiro_button = this;
		//*********************************
		this.isInstanceOfSprite = globalThis.Aekiro.isInstanceOfPlugin(this.instance, C3.Plugins.Sprite);
		this.STATES = {NORMAL:0, HOVER:1, CLICKED:2 , DISABLED:3, FOCUSED:4};
		this.isOnMobile = C3.Platform.IsMobile;
		this.isTouchStarted = false;
		this.isMouseEnter = false;
		this.isFocused = false;
		this.callbacks = [];
		this.frameAnim = [];
		this.initProps = {
			animationFrame : null,
			animationName : null,
			color: null
		};
		
		this.startClick = {x:0,y:0};
		
		//console.log("constructor aekiro_buttonB");
	}
	
	_postCreate(){
		/*if(this.goManager.haltNext)return;//this is mainly to avoid calling the following when cloning, because it's get called before LoadFromJson
		
		this.updateView();*/
		
		this.onPropsLoaded();
		this.updateViewTick();
		//console.log("PostCreate aekiro_buttonB ***");
	}
	
	//anything that's computed based on the instance props goes here
	onPropsLoaded(){
		this.useStates = true;
		if(!this.isInstanceOfSprite || 
		(this.frame_normal=="" && this.frame_hover=="" && this.frame_clicked=="" && this.frame_disabled=="")){
			this.useStates = false;
		}
		
		this.state = this.isEnabled? this.STATES.NORMAL:this.STATES.DISABLED; //this.state is computed here 
		this.setInitProps();
		this.initSounds();
		this.initFrameAnim();
		this.initAnimations();
		this.initColors();
	}
	
	//
	onInitPropsLoaded(){
		var t = this.initProps.color;
		this.initProps.color = t;
	}
	
	updateView(){
		this.setFrameAnim(this.state);
		this.setColor(this.state);
	}
	
	updateViewTick(){
		this.updateV = true;
		this._setTicking(true);
	}
	
	setEnabled(isEnabled){
		if(this.isEnabled == isEnabled)return;

		this.isEnabled = isEnabled;
		this.state = isEnabled? this.STATES.NORMAL:this.STATES.DISABLED;
		this.setFrameAnim(this.state);
		this.setColor(this.state);
	}
	
	parseFrameAnim(frameAnim,defaults){
		//return;
		if(frameAnim==undefined)frameAnim="";

		frameAnim = frameAnim.split('/');
		var frame,anim;
		if(isNaN(parseInt(frameAnim[0]))){
			anim = frameAnim[0];
			frame = parseInt(frameAnim[1])
		}else{
			anim = frameAnim[1];
			frame = parseInt(frameAnim[0]);
		}
		if(isNaN(frame)){
			frame = defaults?defaults["f"]:this.initProps.animationFrame;
		}
		if(!isNaN(anim) || !anim){
			anim = defaults?defaults["a"]:this.initProps.animationName;
		}
		if(anim != null){
			anim = String(anim);
			if(!anim.length){
				anim = null;
			}
		}
		var res =  {
			"f": frame,
			"a": anim
		};
		return res;

	}
	
	parseColor(color,defaultColor){
		if(color){
			color = color.split(",").map((value) => parseInt(value, 10));
		}else{
			if(defaultColor !== undefined){
				color = defaultColor;
			}else{
				color = this.initProps.color;
			}
		}
		return color;
	}
	
	initSounds(){
		var map = globalThis.Aekiro.getInstanceData(this.instance);
		if(!map.audioSources){
			map.audioSources = {};
		}
		var AudioSource = globalThis.AudioSource;

		this.audioSources = map.audioSources;
		this.audioSources.click = new AudioSource(this.clickSound,this.runtime);
		this.audioSources.hover = new AudioSource(this.hoverSound,this.runtime);
		this.audioSources.focus = new AudioSource(this.focusSound,this.runtime);	
	}
	
	initColors(){
		this.colors = [];
		
		this.colors[this.STATES.NORMAL] = this.parseColor(this.color_normal);
		this.colors[this.STATES.HOVER] = this.parseColor(this.color_hover, null);
		this.colors[this.STATES.CLICKED] = this.parseColor(this.color_clicked, null);
		this.colors[this.STATES.DISABLED] = this.parseColor(this.color_disabled);
		this.colors[this.STATES.FOCUSED] = this.parseColor(this.color_focus,null);
		//console.log(this.colors);
	}

	setColor(state){
		var color;
		if(this.isFocused){
			if(this.state == this.STATES.NORMAL){
				color = this.colors[this.STATES.FOCUSED] || this.colors[this.STATES.NORMAL];
			}else{
				color = this.colors[state] || this.colors[this.STATES.FOCUSED];

				if(!this.colors[state] && !this.colors[this.STATES.FOCUSED]){
					color = this.colors[this.STATES.NORMAL];
				}
			}
		}else{
			color = this.colors[state];
		}
		
		if(color){
			this.wi.colorRgb = color;
			this.wi.SetBboxChanged();
		}
	}
	
	setInitProps(){
		if(this.isInstanceOfSprite){
			this.initProps.animationFrame = this.initProps.animationFrame===null ? this.instance.animationFrame : this.initProps.animationFrame;
			this.initProps.animationName = this.initProps.animationName || this.instance.animationName;	
		}

		this.initProps.color = this.initProps.color || this.wi.colorRgb;
		//console.log(this.initProps);
	}
	

	initFrameAnim(){
		if(!this.useStates)return;
		//console.log(this.initProps.animationName);
		this.frameAnim[this.STATES.NORMAL] = this.parseFrameAnim(this.frame_normal);
		this.frameAnim[this.STATES.HOVER] = this.parseFrameAnim(this.frame_hover, {"f": null,"a": null});
		this.frameAnim[this.STATES.CLICKED] = this.parseFrameAnim(this.frame_clicked, {"f": null,"a": null});
		this.frameAnim[this.STATES.DISABLED] = this.parseFrameAnim(this.frame_disabled);
		this.frameAnim[this.STATES.FOCUSED] = this.parseFrameAnim(this.frame_focus,{"f": null,"a": null});

		//console.log("%o",this.frameAnim);
	}
	
	setFrameAnim(state){
		if(!this.useStates){
			return;
		}
		
		var frame, anim;
		if(this.isFocused){
			if(this.state == this.STATES.NORMAL){
				frame = (this.frameAnim[this.STATES.FOCUSED]["f"]===null)?this.frameAnim[this.STATES.NORMAL]["f"]:this.frameAnim[this.STATES.FOCUSED]["f"];
				anim = this.frameAnim[this.STATES.FOCUSED]["a"] || this.frameAnim[this.STATES.NORMAL]["a"] ;
			}else{
				if(this.frameAnim[state]["f"] == null && !this.frameAnim[state]["a"] ){
					frame = this.frameAnim[this.STATES.NORMAL]["f"];
					anim = this.frameAnim[this.STATES.NORMAL]["a"];
				}else{
					frame = (this.frameAnim[state]["f"]===null)?this.frameAnim[this.STATES.FOCUSED]["f"]:this.frameAnim[state]["f"];
					anim = this.frameAnim[state]["a"] || this.frameAnim[this.STATES.FOCUSED]["a"];				
				}

			}
		}else{
			frame = this.frameAnim[state]["f"];
			anim = this.frameAnim[state]["a"];
		}
		
		//console.log(frame,anim);
		
		if(typeof anim === "string" && anim.length){
			this.instance.setAnimation(anim, "beginning");
		}
		if(frame !== null){
			this.instance.animationFrame = frame;
		}
	}
	
	initAnimations(){
		this.currentDelta = {x:0, y:0, width:0, height:0};
		this.targetDelta = {x:0, y:0, width:0, height:0};
		
		this.tween = new Tween["Tween"](this.currentDelta);
	}

	setAnimations(type){
		//None|Scale Quadratic|Scale Elastic|Down|Up|Left|Right
		this.prev = {x : this.currentDelta.x, y : this.currentDelta.y ,width : this.currentDelta.width, height : this.currentDelta.height};

		if(type == 1){
			this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"])["to"](this.targetDelta, 200);
		}else if(type == 2){
			this.tween["easing"](Tween["Easing"]["Elastic"]["Out"])["to"](this.targetDelta, 500);
		}else if(type == 3){
			this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"])["to"](this.targetDelta, 100);
		}else if(type == 4){
			this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"])["to"](this.targetDelta, 100);
		}else if(type == 5){
			this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"])["to"](this.targetDelta, 100);
		}else if(type == 6){
			this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"])["to"](this.targetDelta, 100);
		}
	}
	
	getTargetDelta(type,state){
		//None|Scale Quadratic|Scale Elastic|Down|Up|Left|Right
		var wi = this.wi;
		var t  = {x:0, y:0, width:0, height:0};
		var f = 0.1;
		if(state == "click"){
			f = this.clickAnimationFactor;
		}else if(state == "hover"){
			f = this.hoverAnimationFactor;
		}else if(state == "focus"){
			f = this.focusAnimationFactor;
		}
		
		if(type == 1 || type == 2){
			t.width = wi.GetWidth()*f;
			t.height = wi.GetHeight()*f;
		}else if(type == 3){
			t.y = wi.GetHeight()*f;
		}else if(type == 4){
			t.y = -wi.GetHeight()*f;
		}else if(type == 5){
			t.x = -wi.GetWidth()*f;
		}else if(type == 6){
			t.x = wi.GetWidth()*f;
		}
		
		return t;
	}
		
	//**************************
	OnAnyInputDown(x, y) {
		if (this.wi.ContainsPoint(x, y)){
			this.OnInputDown(x,y);
		}
	}
	
	OnAnyInputMove(x, y) {
		if(this.isOnMobile)return;

		if (this.wi.ContainsPoint(x, y)){
			if(!this.isMouseEnter){
				this.OnMouseEnter(x, y);
			}
		}else{
			if(this.isMouseEnter){
				this.OnMouseLeave();
			}
		}
		//console.log("_OnMove"+x+"***"+y);
	}
	
	setFocused(isFocused){
		if(!this.isEnabled)return;
		
		if(isFocused == this.isFocused)return;
		
		this.isFocused = isFocused;

		/*var x = this.wi.GetBoundingBox().getLeft()+10;
		var y = this.wi.GetBoundingBox().getTop()+10;
		if(!this.isClickable(x,y))return;*/
		
		if(isFocused){	
			this.setFrameAnim(this.state);
			this.setColor(this.state);
			this.audioSources.focus.play();
			
			if(this.focusAnimation>0){
				this.tween["stop"]();
				this.targetDelta_focus = this.getTargetDelta(this.focusAnimation,"focus");
				this.targetDelta.width += this.targetDelta_focus.width;
				this.targetDelta.height += this.targetDelta_focus.height;
				this.targetDelta.x += this.targetDelta_focus.x;
				this.targetDelta.y += this.targetDelta_focus.y;

				this.setAnimations(this.focusAnimation);;
				this._setTicking(true);
				this.tween["start"](this.runtime.GetWallTime()*1000);
			}

			if(this.OnFocusedC)this.OnFocusedC();
		}else{
			//reset to normal
			this.setFrameAnim(this.STATES.NORMAL);
			this.setColor(this.STATES.NORMAL);
			//reapply the current state
			this.setFrameAnim(this.state);
			this.setColor(this.state);
			
			if(this.focusAnimation>0){
				this.tween["stop"]();
				this.targetDelta.width -= this.targetDelta_focus.width;
				this.targetDelta.height -= this.targetDelta_focus.height;
				this.targetDelta.x -= this.targetDelta_focus.x;
				this.targetDelta.y -= this.targetDelta_focus.y;

				this.setAnimations(this.focusAnimation);
				this._setTicking(true);
				this.tween["start"](this.runtime.GetWallTime()*1000);			
			}

			if(this.OnUnFocusedC)this.OnUnFocusedC();

		}
	}
	
	OnMouseEnter(x, y) {
		if(!this.isClickable(x,y))return;
		
		if(this.isTouchStarted)return;
		
		this.isMouseEnter = true;
		
		this.state = this.STATES.HOVER;
		this.setFrameAnim(this.state);
		this.setColor(this.state);	
		this.audioSources.hover.play();
		if(this.OnMouseEnterC)this.OnMouseEnterC();
		
		//Play the onhover Animation
		if(this.hoverAnimation>0){
			var wi = this.wi;
			this.tween["stop"]();
			//reset
			/*this.wi.SetSize(wi.GetWidth() - this.currentDelta.width, wi.GetHeight() - this.currentDelta.height);
			this.wi.OffsetXY(-this.currentDelta.x, -this.currentDelta.y);
			this.wi.SetBboxChanged();
			for(var i in this.currentDelta) this.currentDelta[i] = 0;*/
			
			this.targetDelta_hover = this.getTargetDelta(this.hoverAnimation,"hover");
			this.targetDelta.width += this.targetDelta_hover.width;
			this.targetDelta.height += this.targetDelta_hover.height;
			this.targetDelta.x += this.targetDelta_hover.x;
			this.targetDelta.y += this.targetDelta_hover.y;
			this.setAnimations(this.hoverAnimation);
			this._setTicking(true);
			this.tween["start"](this.runtime.GetWallTime()*1000);
		}

		//console.log("ProUI-Button uid=%s: On Mouse Enter",this.inst.uid);
	}
	
	async OnInputDown(x, y) {
		/*var res = await this.isOnMovingScrollView();
		if(res)return;*/
		
		//Ignore if the button is already being clicked, or not clickable
		if(!this.isClickable(x,y) || this.isTouchStarted)return;

		this.isTouchStarted = true;

		this.startClick.x = x;
		this.startClick.y = y;

		//Play the onclick Animation
		if(this.clickAnimation>0){
			this.tween["stop"]();
			
			this.targetDelta_click = this.getTargetDelta(this.clickAnimation,"click");
			this.targetDelta.width += this.targetDelta_click.width;
			this.targetDelta.height += this.targetDelta_click.height;
			this.targetDelta.x += this.targetDelta_click.x;
			this.targetDelta.y += this.targetDelta_click.y;
			
			this.setAnimations(this.clickAnimation);
			this._setTicking(true);
			this.tween["start"](this.runtime.GetWallTime()*1000);
		}
		
		//focus
		if(!this.isFocused && this.focusAnimation>0){ //play the focus anim one time
			this.tween["stop"]();
			this.targetDelta_focus = this.getTargetDelta(this.focusAnimation,"focus");
			this.targetDelta.width += this.targetDelta_focus.width;
			this.targetDelta.height += this.targetDelta_focus.height;
			this.targetDelta.x += this.targetDelta_focus.x;
			this.targetDelta.y += this.targetDelta_focus.y;

			this.setAnimations(this.focusAnimation);
			this._setTicking(true);
			this.tween["start"](this.runtime.GetWallTime()*1000);
		}

		if(!this.isFocused){ 
			if(this.OnFocusedC)this.OnFocusedC();
		}
		
		this.isFocused = true;
		this.state = this.STATES.CLICKED;
		this.setFrameAnim(this.state);
		this.setColor(this.state);
		this.audioSources.click.play();
			
	}
	
	async OnAnyInputUp(x, y) {
		//console.log("_OnInputUP"+x+"***"+y+"***"+source);
		if(!this.isTouchStarted)return;
		
		this.isTouchStarted = false;


		
		if(this.clickAnimation>0 && this.state!=this.STATES.NORMAL){			
			this.tween["stop"]();
			this.targetDelta.width -= this.targetDelta_click.width;
			this.targetDelta.height -= this.targetDelta_click.height;
			this.targetDelta.x -= this.targetDelta_click.x;
			this.targetDelta.y -= this.targetDelta_click.y;
			
			this.setAnimations(this.clickAnimation);
			this._setTicking(true);
			this.tween["start"](this.runtime.GetWallTime()*1000);
		}
		
		if(this.wi.ContainsPoint(x,y)){
			if(this.isOnMobile){ //on mobile
				this.state = this.STATES.NORMAL; //if isfocused
			}else{
				this.state = this.STATES.HOVER;
			}
			if(this.isOnScrollView() && (Math.abs(this.startClick.x-x)>10 || Math.abs(this.startClick.y-y)>10)){
				//console.log("scroll was moving");
				return;
			}else{
				this.Callbacks();
			}
			
		}else{
			this.state = this.STATES.NORMAL;//if isfocused
		}
		
		this.setFrameAnim(this.state);
		this.setColor(this.state);
	}
	
	Callbacks() {
		//execute programatic callbacks
		for (var i = 0, l= this.callbacks.length; i < l; i++) {
			this.callbacks[i]();
		}
		if(this.OnAnyInputUpC)this.OnAnyInputUpC();
	}

	OnMouseLeave() {
		//console.log("OnMouseLeave");
		this.isMouseEnter = false;
		
		//if the button was disabled on click
		if(this.state!=this.STATES.DISABLED){
			this.state = this.STATES.NORMAL;
		}
		
		this.setFrameAnim(this.state);
		this.setColor(this.state);
		
		if(this.hoverAnimation>0){
			this.targetDelta.width -= this.targetDelta_hover.width;
			this.targetDelta.height -= this.targetDelta_hover.height;
			this.targetDelta.x -= this.targetDelta_hover.x;
			this.targetDelta.y -= this.targetDelta_hover.y;
		}
		if(this.clickAnimation>0 && this.isTouchStarted){
			this.targetDelta.width -= this.targetDelta_click.width;
			this.targetDelta.height -= this.targetDelta_click.height;
			this.targetDelta.x -= this.targetDelta_click.x;
			this.targetDelta.y -= this.targetDelta_click.y;
		}
		if(this.hoverAnimation>0 || (this.clickAnimation>0 && this.isTouchStarted)){
			//for(var i in this.targetDelta) this.targetDelta[i] = 0;
			this.tween["stop"]();
			//this.setAnimations(this.hoverAnimation);
			//this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"])["to"]({ x: 0, y: 0,width: 0, height: 0}, 100);
			this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"])["to"](this.targetDelta, 100);
			this._setTicking(true);
			this.tween["start"](this.runtime.GetWallTime()*1000);
		}
			
		if(this.OnMouseLeaveC)this.OnMouseLeaveC();
	}

	
	//**************************
	setIgnoreInput(state){
		this.ignoreInput = state;
	}

	_tick(){
	
		if(this.updateV){
			this.updateView();
			this._setTicking(false);
			this.updateV = false;
			//console.log("updateV");
			return;
		}
		
		//console.log("tick button");
		if(this.isTweenPlaying){
			this.isTweenPlaying = false;
		}

		if(this.tween["isPlaying"]){
			this.tween["update"](this.runtime.GetWallTime()*1000);
			this.isTweenPlaying = true;
		}

		if(this.isTweenPlaying){
			var wi = this.wi;
			this.wi.OffsetXY(this.currentDelta.x-this.prev.x,this.currentDelta.y-this.prev.y);
			this.wi.SetSize(wi.GetWidth() + this.currentDelta.width-this.prev.width, wi.GetHeight() + this.currentDelta.height-this.prev.height);
			this.wi.SetBboxChanged();
			this.prev = {x : this.currentDelta.x, y : this.currentDelta.y, width : this.currentDelta.width, height : this.currentDelta.height};
		}else{
			this._setTicking(false);	
		}
	}
	
	//**************************
	isClickable(x,y){
		if( x === undefined || y === undefined){
			x = this.wi.GetBoundingBox().getLeft()+10;
			y = this.wi.GetBoundingBox().getTop()+10;
		}

		var isVisible = (this.wi.GetLayer().IsVisible() && this.wi.IsVisible());

		if(this.ignoreInput === 1 || this.proui.ignoreInput){
			return false;
		}

		if(this.ignoreInput == 0){
			return this.isEnabled && isVisible;
		}

		var isInsideScrollView = this.isInsideScrollView(x,y);
		var isUnder = false;
		if(this.ignoreInput === 2 && this.aekiro_dialogManager){
			isUnder = this.aekiro_dialogManager.isInstanceUnderModal(this.wi.GetLayer().GetIndex());
		}
		return this.isEnabled && isVisible && !isUnder && isInsideScrollView;
	}
	
	isInsideScrollView(x,y){ 
		//return true;
		var insideScrollView = true;
		var scrollViews = globalThis.aekiro_scrollViewManager ? globalThis.aekiro_scrollViewManager.scrollViews : this.scrollViews;
		var key = "l"+this.inst.GetLayer().GetIndex();
		var scrollView = scrollViews[key];
		if(globalThis.aekiro_scrollViewManager && globalThis.aekiro_scrollViewManager._isStale(scrollView)){
			delete scrollViews[key];
			scrollView = null;
		}
		if(scrollView){
			insideScrollView = scrollView.ContainsPoint(x, y);
		}
		return insideScrollView;
	}

	isOnScrollView(){ 
		var onScrollView = true;
		var scrollViews = globalThis.aekiro_scrollViewManager ? globalThis.aekiro_scrollViewManager.scrollViews : this.scrollViews;
		var key = "l"+this.inst.GetLayer().GetIndex();
		var scrollView = scrollViews[key];
		if(globalThis.aekiro_scrollViewManager && globalThis.aekiro_scrollViewManager._isStale(scrollView)){
			delete scrollViews[key];
			scrollView = null;
		}
		if(scrollView){
			return true;	
		}else{
			return false;
		}
		
	}

	isOnMovingScrollView(delay) {
		if(delay==undefined)delay = 20;
		var scrollViews = globalThis.aekiro_scrollViewManager ? globalThis.aekiro_scrollViewManager.scrollViews : this.scrollViews;
		var key = "l"+this.inst.GetLayer().GetIndex();
		var scrollView = scrollViews[key];
		if(globalThis.aekiro_scrollViewManager && globalThis.aekiro_scrollViewManager._isStale(scrollView)){
			delete scrollViews[key];
			scrollView = null;
		}
		if(scrollView){
			return new Promise(resolve => {	  	
			setTimeout(() => {
				if(globalThis.Aekiro.getInstanceData(scrollView).aekiro_scrollView.isMoving()){
					resolve(true);
				}else{
					resolve(false);
				}
			},delay);
			});
		}else{
		return false;
		}
	}



	_release(){
		super._release();
	}
	//**************************
	

};

globalThis.Aekiro.button.Cnds = {
	OnMouseEnter(){ return true; },
	OnMouseLeave(){ return true; },
	IsEnabled(){ return this.isEnabled; },

	IsClickable(){ return this.isClickable(); },

	OnFocused(){ return true; },
	OnUnFocused(){ return true; },
	IsFocused(){ return this.isFocused; },

	OnClicked(){ return true; }
};


globalThis.Aekiro.button.Acts = {
	setEnabled(isEnabled){
		this.setEnabled(isEnabled);
	},
	SetFocused(v){
		this.setFocused(v);
	},
	SetIgnoreInput(s){
		this.setIgnoreInput(s);
	},
	SetClickSoundVolume(v){
		this.audioSources.click.setVolume(v);
	},
	SetHoverSoundVolume(v){
		this.audioSources.hover.setVolume(v);
	},
	SimulateClick(){
		if(this.isTouchStarted)return;
		
		var x = this.wi.GetBoundingBox().getLeft()+10;
		var y = this.wi.GetBoundingBox().getTop()+10;
		this.OnInputDown(x,y);
		setTimeout(() => {
			x = this.wi.GetBoundingBox().getLeft()-50;
			y = this.wi.GetBoundingBox().getTop()-50;
			this.OnAnyInputUp(x,y);
			this.Callbacks();
		},100);
	},


	setNormalFrame(v){
		this.frame_normal = v;
		this.initFrameAnim();
		this.setFrameAnim(this.state);
	},
	setHoverFrame(v){
		this.frame_hover = v;
		this.initFrameAnim();
	},
	setClickedFrame(v){
		this.frame_clicked = v;
		this.initFrameAnim();
	},
	setDisabledFrame(v){
		this.frame_disabled = v;
		this.initFrameAnim();
	},
	setFocusFrame(v){
		this.frame_focus = v;
		this.initFrameAnim();
	},

	setClickAnimation(v){
		this.clickAnimation = v;
		this.initAnimations();
	},
	setHoverAnimation(v){
		this.hoverAnimation = v;
		this.initAnimations();
	},
	setFocusAnimation(v){
		this.focusAnimation = v;
		this.initAnimations();
	},
	
	
	setNormalColor(v){
		this.color_normal = v;
		this.initColors();
	},
	setHoverColor(v){
		this.color_hover = v;
		this.initColors();
	},
	setClickedColor(v){
		this.color_clicked = v;
		this.initColors();
	},
	setFocusColor(v){
		this.color_focus = v;
		this.initColors();
	}
};


globalThis.Aekiro.checkbox = class aekiro_checkbox extends globalThis.Aekiro.button
{
	constructor()
	{
		super();
		const properties = this._getInitProperties();
	}
	
	checkbox_constructor(){
		this.button_constructor();
		globalThis.Aekiro.getInstanceData(this.instance).aekiro_checkbox = this;
		this.frameAnim = [[],[]];
	}

	hasCheckboxFrameSupport(){
		return !!this.instance && typeof this.instance.setAnimation === "function" && "animationFrame" in this.instance;
	}

	initFrameAnim(){
		this.useStates = true;

		if(!this.hasCheckboxFrameSupport() || (this.frame_normal=="" && this.frame_hover=="" && this.frame_disabled=="")){
			this.useStates = false;
			return;
		}
		
		this.cur_AnimationFrame = this.instance.animationFrame;
		this.cur_AnimationName = this.instance.animationName;
		
		var f = this.frame_normal.split(',');
		this.frameAnim[0][this.STATES.NORMAL] = this.parseFrameAnim(f[0]);
		this.frameAnim[1][this.STATES.NORMAL] = this.parseFrameAnim(f[1]);

		
		f = this.frame_hover.split(',');
		this.frameAnim[0][this.STATES.HOVER] = this.parseFrameAnim(f[0],{"f": null,"a": null});
		this.frameAnim[1][this.STATES.HOVER] = this.parseFrameAnim(f[1],{"f": null,"a": null});
		
		f = this.frame_disabled.split(',');
		this.frameAnim[0][this.STATES.DISABLED] = this.parseFrameAnim(f[0]);
		this.frameAnim[1][this.STATES.DISABLED] = this.parseFrameAnim(f[1]);
		
		f = this.frame_focus.split(',');
		this.frameAnim[0][this.STATES.FOCUSED] = this.parseFrameAnim(f[0],{"f": null,"a": null});
		this.frameAnim[1][this.STATES.FOCUSED] = this.parseFrameAnim(f[1],{"f": null,"a": null});
		
		//console.log("%o",this.frameAnim[state]);
	}
	
	setFrameAnim(state){
		if(!this.useStates){
			return;
		}
		if(state==this.STATES.CLICKED)state=this.STATES.NORMAL;
		var v = this.value?1:0;
		var frame, anim;
		
		if(this.isFocused){
			if(this.state == this.STATES.NORMAL){
				frame = (this.frameAnim[v][this.STATES.FOCUSED]["f"]===null)?this.frameAnim[v][this.STATES.NORMAL]["f"]:this.frameAnim[v][this.STATES.FOCUSED]["f"];
				anim = this.frameAnim[v][this.STATES.FOCUSED]["a"] || this.frameAnim[v][this.STATES.NORMAL]["a"] ;
			}else{
				if(this.frameAnim[v][state]["f"] == null && !this.frameAnim[v][state]["a"] ){
					frame = this.frameAnim[v][this.STATES.NORMAL]["f"];
					anim = this.frameAnim[v][this.STATES.NORMAL]["a"];
				}else{
					frame = (this.frameAnim[v][state]["f"]===null)?this.frameAnim[v][this.STATES.FOCUSED]["f"]:this.frameAnim[v][state]["f"];
					anim = this.frameAnim[v][state]["a"] || this.frameAnim[v][this.STATES.FOCUSED]["a"];				
				}
			}
		}else{
			frame = this.frameAnim[v][state]["f"];
			anim = this.frameAnim[v][state]["a"];
		}
		
		//console.log(frame,anim);
		
		if(typeof anim === "string" && anim.length && this.instance.setAnimation){
			this.instance.setAnimation(anim, "beginning");
		}
		if(frame !== null){
			this.instance.animationFrame = frame;
		}
	}
	
	initColors(){
		this.cur_color = this.wi.colorRgb;
		this.colors = [[],[]];
		
		var c;
		c = this.color_normal.split(';');
		this.colors[0][this.STATES.NORMAL] = this.parseColor(c[0]);
		this.colors[1][this.STATES.NORMAL] = this.parseColor(c[1],this.colors[0][this.STATES.NORMAL]);
		
		c = this.color_hover.split(';');
		this.colors[0][this.STATES.HOVER] = this.parseColor(c[0], null);
		this.colors[1][this.STATES.HOVER] = this.parseColor(c[1], this.colors[0][this.STATES.HOVER]);
		
		c = this.color_clicked.split(';');
		this.colors[0][this.STATES.CLICKED] = this.parseColor(c[0], null);
		this.colors[1][this.STATES.CLICKED] = this.parseColor(c[1], this.colors[0][this.STATES.CLICKED]);
		
		c = this.color_disabled.split(';');
		this.colors[0][this.STATES.DISABLED] = this.parseColor(c[0]);
		this.colors[1][this.STATES.DISABLED] = this.parseColor(c[1]),this.colors[0][this.STATES.DISABLED];
		
		c = this.color_focus.split(';');
		this.colors[0][this.STATES.FOCUSED] = this.parseColor(c[0], null);
		this.colors[1][this.STATES.FOCUSED] = this.parseColor(c[1], this.colors[0][this.STATES.FOCUSED]);
		
		//console.log(this.colors);
	}
		
	setColor(state){
		var v = this.value?1:0;
		var color;
		if(this.isFocused){
			if(this.state == this.STATES.NORMAL){
				color = this.colors[v][this.STATES.FOCUSED] || this.colors[v][this.STATES.NORMAL];
			}else{
				color = this.colors[v][state] || this.colors[v][this.STATES.FOCUSED];

				if(!this.colors[v][state] && !this.colors[v][this.STATES.FOCUSED]){
					//color = this.initProps.color;
					color = this.colors[v][this.STATES.NORMAL];
				}
			}
		}else{
			color = this.colors[v][state];
		}
		
		if(color){
			this.wi.colorRgb = color;
			this.wi.SetBboxChanged();
		}
	}
	
	isValueValid(value){
		if(value == null || value === ""){
			return false;
		}
		return true;			
	}

	setValue(value){
		value = !!value;
		value = value?1:0;
		
		if(this.value!=value){
			this.value = value;
			this.setFrameAnim(this.state);
			this.setColor(this.state);
		}
	}
};


globalThis.aekiro_scrollViewManager = { 
	scrollViews : {},

	_isStale : function(inst){
		if(!inst){
			return true;
		}
		try{
			if(inst.IsDestroyed && inst.IsDestroyed()){
				return true;
			}
		}catch(_err){
			return true;
		}
		try{
			if(inst._sdkInst && inst._sdkInst._wasReleased){
				return true;
			}
		}catch(_err){
		}
		return false;
	},


	add : function(inst){
		globalThis.Aekiro.compatWorldInstance(inst);
		this.scrollViews["l"+inst.GetLayer().GetIndex()] = inst;
	},
	
	remove : function(inst){
		for(var key in this.scrollViews){
			if(this.scrollViews[key] == inst || this._isStale(this.scrollViews[key])){
				delete this.scrollViews[key];
			}
		}
		//delete this.scrollViews["l"+inst.GetLayer().GetIndex()];
	},
	
	//test if inst (a scrollview) overlaps with a scroll on x,y
	isOverlaped : function(inst,x,y){
		globalThis.Aekiro.compatWorldInstance(inst);
		var n = inst.runtime.GetMainRunningLayout().GetLayerCount();
		var scrollView;
		var isOverlaped = false;
		for (var i = inst.GetLayer().GetIndex()+1,l = n; i < l; i++) {
			scrollView = this.scrollViews["l"+i];
			if(scrollView){
				if(!scrollView.GetLayer().IsVisible()){
					continue;
				}

				if(scrollView.ContainsPoint(x,y)){
					isOverlaped = true;
					break;
				}
			}

		}
		return isOverlaped;
	}
};


globalThis.aekiro_dialogManager = {
	currentDialogs : [],

	addDialog : function(inst){
		/*if(this.runtime.changelayout && this.currentDialogs_lastResetTick != this.runtime.tickcount){
			//console.log("*** Reseting currentDialogs***");
			this.currentDialogs.length = 0;
			this.currentDialogs_lastResetTick = this.runtime.tickcount;
		}*/
		this.currentDialogs.push(inst);
	},

	removeDialog : function(inst){
		var i = this.currentDialogs.indexOf(inst);
		if(i != -1){
			this.currentDialogs.splice(i, 1);
		}
	},

	isDialogOpened : function(){
		return this.currentDialogs.length;
	},
	isModalDialogOpened : function(){
		for (var i = 0; i < this.currentDialogs.length; i++) {
			if(globalThis.Aekiro.getInstanceData(this.currentDialogs[i]).aekiro_dialog.isModal){
				return true;
			}
		}
		return false;
	},
	isInstanceUnder : function(layerIndex){
		for (var i = 0,l=this.currentDialogs.length; i < l; i++) {
			if(layerIndex<this.currentDialogs[i].GetLayer().GetIndex()){
				return true;
			}
		}
		return false;
	},
	isInstanceUnderModal : function(layerIndex){
		var dialog;
		for (var i = 0,l=this.currentDialogs.length; i < l; i++) {
			dialog = this.currentDialogs[i];
			if(layerIndex<dialog.GetLayer().GetIndex() && globalThis.Aekiro.getInstanceData(dialog).aekiro_dialog.isModal){
				return true;
			}
		}
		return false;
	}
};

}
