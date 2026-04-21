"use strict";
{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_gameobject.Instance = class MyBehaviorInstance extends globalThis.ISDKBehaviorInstanceBase {
		constructor()
		{
			super();
			const properties = this._getInitProperties();

			if (properties){
				this.name = properties[0];
				this.parentName = properties[1];
				this.parentSameLayer = properties[2];
			}

			this.inst = null;
			this.wi = null;
			this.acts = {};
			this.eventManager = null;
			this.goManager = globalThis.aekiro_goManager;

			this.userName = this.name ? this.name : null;
			this.areChildrenRegistred = false;
			this.children = [];
			this.parent = null;
			this.local = null;
			this.prev = null;
		}

		_postCreate(){
			this.inst = this.instance;
			this.wi = this.instance;
			globalThis.Aekiro.getInstanceData(this.instance).aekiro_gameobject = this;
			globalThis.Aekiro.registerBehaviorInstance("aekiro_gameobject", this.instance);
			this.acts = (this.instance && this.instance.plugin && this.instance.plugin.constructor && this.instance.plugin.constructor.Acts) || {};

			if(!this.acts.SetOpacity){
				this.acts.SetOpacity = function(inst, v){ inst.SetOpacity(v); };
			}
			if(!this.acts.SetVisible){
				this.acts.SetVisible = function(inst, v){ inst.SetVisible(v); };
			}
			if(!this.acts.MoveToLayer){
				this.acts.MoveToLayer = function(inst, v){ inst.MoveToLayer(v); };
			}
			if(!this.acts.SetZElevation){
				this.acts.SetZElevation = function(inst, v){
					if(typeof inst.SetZElevation === "function"){
						inst.SetZElevation(v);
					}else if("zElevation" in inst){
						inst.zElevation = v;
					}
				};
			}
			if(!this.acts.SetDefaultColor){
				this.acts.SetDefaultColor = function(inst, v){
					if("colorRgb" in inst){
						inst.colorRgb = v;
					}
				};
			}
			if(!this.acts.SetMirrored){
				this.acts.SetMirrored = function(inst, v){
					if("isMirrored" in inst){
						inst.isMirrored = !!v;
					}
				};
			}
			if(!this.acts.SetFlipped){
				this.acts.SetFlipped = function(inst, v){
					if("isFlipped" in inst){
						inst.isFlipped = !!v;
					}
				};
			}
			this.eventManager = new globalThis.EventManager(this.inst);

			this.local = {
				x : this.wi.GetX(),
				y : this.wi.GetY(),
				angle: this.wi.GetAngle(),
				_sinA: Math.sin(this.wi.GetAngle()),
				_cosA: Math.cos(this.wi.GetAngle())
			};

			this.overrideWorldInfo();
			this.prev = {
				x : this.wi.GetX(),
				y : this.wi.GetY(),
				angle : this.wi.GetAngle(),
				width: this.wi.GetWidth(),
				height: this.wi.GetHeight()
			};

			this.goManager.addGO(this.inst);
		}

		refreshExternalSyncTicking(){
			this._setTicking(false);
		}

		syncPrevState(){
			this.prev.x = this.wi.GetX();
			this.prev.y = this.wi.GetY();
			this.prev.angle = this.wi.GetAngle();
			this.prev.width = this.wi.GetWidth();
			this.prev.height = this.wi.GetHeight();
		}

		syncLocalFromWorld(){
			const angle = this.wi.GetAngle();
			this.local.x = this.wi.GetX();
			this.local.y = this.wi.GetY();
			this.local.angle = angle;
			this.local._sinA = Math.sin(angle);
			this.local._cosA = Math.cos(angle);
		}

		propagateSizeDelta(prevWidth, prevHeight, nextWidth, nextHeight){
			if(!this.children.length){
				return;
			}

			// Scale children proportionally when the parent is resized so authored
			// relative layout survives manual/editor/runtime size changes.
			const safePrevWidth = prevWidth === 0 ? 0.1 : prevWidth;
			const safePrevHeight = prevHeight === 0 ? 0.1 : prevHeight;
			const fw = nextWidth / safePrevWidth;
			const fh = nextHeight / safePrevHeight;

			for (var i = 0, l = this.children.length; i < l; i++) {
				var childWi = this.children[i].GetWorldInfo();
				childWi.SetX(childWi.GetX(true)*fw,true);
				childWi.SetY(childWi.GetY(true)*fh,true);
				childWi.SetSize(childWi.GetWidth()*fw,childWi.GetHeight()*fh);
				childWi.SetBboxChanged();
			}
		}

		_tick(){
			if(!this.wi || !this.local || !this.prev){
				return;
			}

			const x = this.wi.GetX();
			const y = this.wi.GetY();
			const angle = this.wi.GetAngle();
			const width = this.wi.GetWidth();
			const height = this.wi.GetHeight();

			const moved = x !== this.prev.x || y !== this.prev.y || angle !== this.prev.angle;
			const resized = width !== this.prev.width || height !== this.prev.height;

			if(!moved && !resized){
				return;
			}

			if(resized){
				this.propagateSizeDelta(this.prev.width, this.prev.height, width, height);
			}

			if(this.parent_get()){
				this.updateLocals();
			}else{
				this.syncLocalFromWorld();
			}

			this.children_update();
			this.syncPrevState();
		}

		overrideWorldInfo(){
			if(this.isWorldInfoOverrided)return;
			this.isWorldInfoOverrided = true;

			var inst = this.instance;
			var wi = inst.GetWorldInfo();

			if (!inst.GetUnsavedDataMap().aekiro_gameobject)return;

			// Intercept world-info mutators so hierarchy-relative ("local") edits and direct world edits resolve through a single sync path.
			wi.SetX_old = wi.SetX;
			wi.SetX = function (x,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal && aekiro_gameobject.parent){
					// Local-space edits should preserve hierarchy constraints by mutating
					// cached local transform and then recomputing globals.
					aekiro_gameobject.local.x = x;
					aekiro_gameobject.updateGlobals();
				}else{
					// Global edits (or root objects) write world transform first, then
					// recompute child-local values to keep both spaces consistent.
					this.SetX_old(x);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.SetY_old = wi.SetY;
			wi.SetY = function (y,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal && aekiro_gameobject.parent){
					aekiro_gameobject.local.y = y;
					aekiro_gameobject.updateGlobals();
				}else{
					this.SetY_old(y);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.SetXY_old = wi.SetXY;
			wi.SetXY = function (x,y,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal && aekiro_gameobject.parent){
					aekiro_gameobject.local.x = x;
					aekiro_gameobject.local.y = y;
					aekiro_gameobject.updateGlobals();
				}else{
					this.SetXY_old(x,y);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.OffsetX_old = wi.OffsetX;
			wi.OffsetX = function (x,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal && aekiro_gameobject.parent){
					aekiro_gameobject.local.x += x;
					aekiro_gameobject.updateGlobals();
				}else{
					this.OffsetX_old(x);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.OffsetY_old = wi.OffsetY;
			wi.OffsetY = function (y,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal && aekiro_gameobject.parent){
					aekiro_gameobject.local.y += y;
					aekiro_gameobject.updateGlobals();
				}else{
					this.OffsetY_old(y);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.OffsetXY_old = wi.OffsetXY;
			wi.OffsetXY = function (x,y,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal&& aekiro_gameobject.parent){
					aekiro_gameobject.local.x += x;
					aekiro_gameobject.local.y += y;
					aekiro_gameobject.updateGlobals();
				}else{
					this.OffsetXY_old(x,y);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.SetAngle_old = wi.SetAngle;
			wi.SetAngle = function (angle,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal&& aekiro_gameobject.parent){
					aekiro_gameobject.local.angle = angle;
					aekiro_gameobject.local._sinA = Math.sin(angle);
					aekiro_gameobject.local._cosA = Math.cos(angle);
					aekiro_gameobject.updateGlobals();
				}else{
					this.SetAngle_old(angle);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.OffsetAngle_old = wi.OffsetAngle;
			wi.OffsetAngle = function (angle,isLocal){
				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				if(isLocal&& aekiro_gameobject.parent){
					aekiro_gameobject.local.angle = C3.clampAngle(aekiro_gameobject.local.angle + angle);
					const _a = aekiro_gameobject.local.angle;
					aekiro_gameobject.local._sinA = Math.sin(_a);
					aekiro_gameobject.local._cosA = Math.cos(_a);
					aekiro_gameobject.updateGlobals();
				}else{
					this.OffsetAngle_old(angle);
					aekiro_gameobject.updateLocals();
				}
				aekiro_gameobject.children_update();
				aekiro_gameobject.syncPrevState();
			};

			wi.GetX_old = wi.GetX;
			// Preserve API shape by serving parent-space values only when callers explicitly request local coordinates.
			wi.GetX = function (isLocal){
				if(isLocal){
					var inst = this.GetInstance();
					var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
					if(aekiro_gameobject.parent){
						return aekiro_gameobject.local.x;
					}
				}
				return this.GetX_old();
			};

			wi.GetY_old = wi.GetY;
			wi.GetY = function (isLocal){
				if(isLocal){
					var inst = this.GetInstance();
					var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
					if(aekiro_gameobject.parent){
						return aekiro_gameobject.local.y;
					}
				}
				return this.GetY_old();
			};

			wi.GetAngle_old = wi.GetAngle;
			wi.GetAngle = function (isLocal){
				if(isLocal){
					var inst = this.GetInstance();
					var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
					if(aekiro_gameobject.parent){
						return aekiro_gameobject.local.angle;
					}
				}
				return this.GetAngle_old();
			};

			wi.GetCosAngle_old = wi.GetCosAngle;
			wi.GetCosAngle = function (isLocal){
				if(isLocal){
					var inst = this.GetInstance();
					var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
					if(aekiro_gameobject.parent){
						return aekiro_gameobject.local._cosA;
					}
				}
				return this.GetCosAngle_old();
			};

			wi.GetSinAngle_old = wi.GetSinAngle;
			wi.GetSinAngle = function (isLocal){
				if(isLocal){
					var inst = this.GetInstance();
					var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
					if(aekiro_gameobject.parent){
						return aekiro_gameobject.local._sinA;
					}
				}
				return this.GetSinAngle_old();
			};

			wi.SetWidth_old = wi.SetWidth;
			wi.SetWidth = function (w,onlyNode){
				if(onlyNode){
					this.SetWidth_old(w);
					return;
				}

				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				w = w===0 ? 0.1 : w;
				var f = w/this.GetWidth();

				this.SetWidth_old(w);
				var c = aekiro_gameobject.children;
				for (var i = 0, l = c.length; i < l; i++) {
					var childWi = c[i].GetWorldInfo();
					childWi.SetX(childWi.GetX(true)*f,true);
					childWi.SetWidth(childWi.GetWidth()*f);
					childWi.SetBboxChanged();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.SetHeight_old = wi.SetHeight;
			wi.SetHeight = function (h,onlyNode){
				if(onlyNode){
					this.SetHeight_old(h);
					return;
				}

				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;

				h = h===0 ? 0.1 : h;
				var f = h/this.GetHeight();

				this.SetHeight_old(h);
				var c = aekiro_gameobject.children;
				for (var i = 0, l = c.length; i < l; i++) {
					var childWi = c[i].GetWorldInfo();
					childWi.SetY(childWi.GetY(true)*f,true);
					childWi.SetHeight(childWi.GetHeight()*f);
					childWi.SetBboxChanged();
				}
				aekiro_gameobject.syncPrevState();
			};

			wi.SetSize_old = wi.SetSize;
			wi.SetSize = function (w,h,onlyNode){
				if(onlyNode){
					this.SetSize_old(w,h);
					return;
				}

				var inst = this.GetInstance();
				var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject)return;
				w = w===0 ? 0.1 : w;
				h = h===0 ? 0.1 : h;
				var fw = w/this.GetWidth();
				var fh = h/this.GetHeight();

				this.SetSize_old(w,h);
				var c = aekiro_gameobject.children;
				for (var i = 0, l = c.length; i < l; i++) {
					var childWi = c[i].GetWorldInfo();
					childWi.SetX(childWi.GetX(true)*fw,true);
					childWi.SetY(childWi.GetY(true)*fh,true);
					childWi.SetSize(childWi.GetWidth()*fw,childWi.GetHeight()*fh);
					childWi.SetBboxChanged();
				}
				aekiro_gameobject.syncPrevState();
			};
		}

		children_update(){
			return;
		}

		children_add(inst){
			var name, aekiro_gameobject, originalInst = inst;
			if (typeof inst === "string"){
				name = inst;
				inst = null;
			}else{
				aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(!aekiro_gameobject){
					console.error("Aekiro GameObject: You're adding a child (uid=%s) without a gameobject behavior on it.",inst.GetUID());
					return;
				}
				name = aekiro_gameobject.name;
			}

			inst = this.goManager.gos[name] || originalInst;

			if(inst === this.instance){
				return;
			}

			if(!inst){
				console.error("Aekiro GameObject: Object of name : %s not found !",name);
				return;
			}
			if(name === this.parentName){
				console.error("Aekiro GameObject: Cannot add %s as a child of %s, because %s is its parent !",name,this.name,name);
				return;
			}
			if(this.children.indexOf(inst) > -1){
				console.warn("Aekiro GameObject: Object %s already have a child named %s !",this.name,name);
				return;
			}

			aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
			aekiro_gameobject.removeFromParent();
			aekiro_gameobject.parentName = this.name;
			aekiro_gameobject.parent = this.instance;

			var res = this.globalToLocal(inst,this.instance);
			aekiro_gameobject.local.x = res.x;
			aekiro_gameobject.local.y = res.y;
			aekiro_gameobject.local.angle = res.angle;
			aekiro_gameobject.local._sinA = Math.sin(res.angle);
			aekiro_gameobject.local._cosA = Math.cos(res.angle);
			if(typeof this.instance.addChild === "function"){
				this.instance.addChild(inst,{
					transformX: true,
					transformY: true,
					transformAngle: true,
					transformOpacity: false,
					transformVisibility: false,
					destroyWithParent: true
				});
			}
			this.children.push(inst);

			this.eventManager.emit("childrenAdded",{"args":inst,"propagate":false});
		}

		setName(name){
			try{
				this.goManager.setGoName(this.name,name);
			}catch(e){
				console.error(e);
				return;
			}

			this.name = name;

			for (var i = 0, l = this.children.length; i < l; i++) {
				this.children[i].GetUnsavedDataMap().aekiro_gameobject.parentName = name;
			}
		}

		updateLocals(){
			var parent = this.parent_get();
			if(!parent || this.instance===null){
				return;
			}

			// Recompute locals from world state after external movements so child propagation stays stable.
			var res = this.globalToLocal(this.instance,parent);
			this.local.x = res.x;
			this.local.y = res.y;
			this.local.angle = res.angle;
			this.local._sinA = Math.sin(res.angle);
			this.local._cosA = Math.cos(res.angle);
		}

		updateGlobals(){
			var parent = this.parent_get();
			if(!parent)return;
			var res = this.localToGlobal(this.instance,parent);
			this.wi.SetXY_old(res.x,res.y);
			this.wi.SetAngle_old(res.angle);
		}

		_getTypeInstances(type){
			if(!type){
				return [];
			}
			var sol = null;
			if(typeof type.GetCurrentSol === "function"){
				sol = type.GetCurrentSol();
			}else if(typeof type.getCurrentSol === "function"){
				sol = type.getCurrentSol();
			}
			if(!sol){
				return [];
			}
			if(typeof sol.GetInstances === "function"){
				return sol.GetInstances();
			}
			if(typeof sol.getInstances === "function"){
				return sol.getInstances();
			}
			if(typeof sol.getAllInstances === "function"){
				return sol.getAllInstances();
			}
			return [];
		}

		children_addFromLayer (layer){
			var insts = globalThis.Aekiro.getBehaviorInstances("aekiro_gameobject");
			var myInst = this.instance;
			var inst,aekiro_gameobject;
			for (var i = 0, l = insts.length; i < l; i++) {
				inst = insts[i];
				aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
				if(inst !== myInst && inst.GetLayer() === layer && aekiro_gameobject && aekiro_gameobject.parentName === ""){
					this.children_add(inst);
				}
			}
		}

		children_addFromType (type){
			var insts = this._getTypeInstances(type);
			for (var i = 0, l = insts.length; i < l; i++) {
				this.children_add(insts[i]);
			}
		}

		children_remove(inst){
			var index = -1;
			if (typeof inst === "string"){
				for (var i = 0, l = this.children.length; i < l; i++) {
					if(this.children[i].GetUnsavedDataMap().aekiro_gameobject.name === inst){
						index = i;
						break;
					}
				}
			}else{
				index = this.children.indexOf(inst);
			}

			if(index !== -1){
				var child = this.children[index];
				var aekiro_gameobject = child.GetUnsavedDataMap().aekiro_gameobject;
				if(typeof child.removeFromParent === "function"){
					child.removeFromParent();
				}
				aekiro_gameobject.parent = null;
				this.children.splice(index, 1);
			}
		}

		children_removeFromType (type){
			var insts = this._getTypeInstances(type);
			for (var i = 0, l = insts.length; i < l; i++) {
				this.children_remove(insts[i]);
			}
		}

		removeAllChildren(){
			if(!this.children.length){
				return;
			}

			for (var i = 0, l = this.children.length; i < l; i++) {
				var child = this.children[i];
				var aekiro_gameobject = child.GetUnsavedDataMap().aekiro_gameobject;
				if(typeof child.removeFromParent === "function"){
					child.removeFromParent();
				}
				aekiro_gameobject.parent = null;
			}
			this.children.length = 0;
		}

		removeFromParent(){
			var parent = this.parent;
			var inst = this.instance;
			if(parent){
				if(typeof inst.removeFromParent === "function"){
					inst.removeFromParent();
				}
				var parentGo = parent.GetUnsavedDataMap().aekiro_gameobject;
				if(parentGo){
					var index = parentGo.children.indexOf(inst);
					if(index !== -1){
						parentGo.children.splice(index, 1);
					}
				}
				this.parent = null;
			}
		}

		destroyHierarchy(){
			var runtime = this.runtime;
			for (var i = this.children.length - 1; i >= 0; i--) {
				var child = this.children[i];
				if(!child){
					continue;
				}
				var childGo = child.GetUnsavedDataMap().aekiro_gameobject;
				if(childGo){
					childGo.destroyHierarchy();
				}
			}
			runtime.DestroyInstance(this.instance);
			this.children.length = 0;
		}

		parent_get(){
			if(!this.parent && this.parentName && this.name){
				this.parent = this.goManager.gos[this.parentName];
			}
			return this.parent;
		}

		getTemplate(node){
			if(!node){
				node = this.inst || this.instance;
			}

			var go = node.GetUnsavedDataMap().aekiro_gameobject;

			var template = {
				type: node.GetObjectClass().GetName(),
				templateName: typeof node.templateName === "string" ? node.templateName : "",
				x: node.GetWorldInfo().GetX(true),
				y: node.GetWorldInfo().GetY(true),
				angle: node.GetWorldInfo().GetAngle(true),
				zindex: node.GetWorldInfo().GetZIndex()+node.GetWorldInfo().GetLayer().GetIndex()*100,
				json: go.SaveToJson(),
				instanceVars: globalThis.Aekiro.serializeInstanceVars(node),
				objectProperties: globalThis.Aekiro.serializeObjectProperties(node),
				world: globalThis.Aekiro.serializeWorldState(node),
				scriptBehaviors: globalThis.Aekiro.serializeScriptBehaviorStates(node),
				children:[]
			};

			var children = go.children;
			for (var i = 0, l = children.length; i < l; i++) {
				template.children.push(this.getTemplate(children[i]));
			}

			return template;
		}

		hierarchyToArray(node,ar){
			if(!node){
				node = this.instance;
			}

			if(!ar){
				ar = [];
			}

			ar.push(node);

			var children = node.GetUnsavedDataMap().aekiro_gameobject.children;
			for (var i = 0, l = children.length; i < l; i++) {
				this.hierarchyToArray(children[i],ar);
			}

			return ar;
		}

		GetLayer(){
			return this.wi ? this.wi.GetLayer() : null;
		}

		updateZindex(){
			var children = this.hierarchyToArray();

			children.sort(function(a, b) {
				return a.GetUnsavedDataMap().zindex - b.GetUnsavedDataMap().zindex;
			});

			var layer = children[0].GetWorldInfo().GetLayer();
			for (var i = 1, l = children.length; i < l; i++) {
				layer.MoveInstanceAdjacent(children[i], children[i-1], true);
			}
			this.runtime.UpdateRender();
		}

		moveToTop(){
			var children = this.hierarchyToArray();
			children.sort(function(a, b) {
				return a.GetWorldInfo().GetZIndex() - b.GetWorldInfo().GetZIndex();
			});
			for (var i = 0, l = children.length; i < l; i++) {
				children[i].MoveToTop();
			}
			this.runtime.UpdateRender();
		}

		moveToBottom(){
			var children = this.hierarchyToArray();
			children.sort(function(a, b) {
				return b.GetWorldInfo().GetZIndex() - a.GetWorldInfo().GetZIndex();
			});
			for (var i = 0, l = children.length; i < l; i++) {
				children[i].MoveToBottom();
			}
			this.runtime.UpdateRender();
		}

		setTimeScale(s){
			var children = this.hierarchyToArray();
			for (var i = 1, l = children.length; i < l; i++) {
				if(typeof children[i].SetTimeScale === "function"){
					children[i].SetTimeScale(s);
				}
			}
		}

		_release(){
			const inst = this.inst || this.instance;
			if(inst){
				globalThis.Aekiro.unregisterBehaviorInstance("aekiro_gameobject", inst);
			}
		}

		Release2(){
			const inst = this.inst || this.instance;
			if(inst){
				globalThis.Aekiro.unregisterBehaviorInstance("aekiro_gameobject", inst);
			}
			this.goManager.removeGO(this.name);
			this.removeFromParent();

			for (var i = this.children.length - 1; i >= 0; i--) {
				this.children_remove(this.children[i]);
			}

			super._release();
		}

		SaveToJson(){
			return {
				"name" : this.name,
				"parentName" : this.parentName,
				"parentSameLayer" : this.parentSameLayer,
				"global_x": this.wi.GetX(),
				"global_y": this.wi.GetY()
			};
		}

		_saveToJson(){
			return this.SaveToJson();
		}

		LoadFromJson(o){
			o = o || {};
			this.name = o["name"];
			this.parentName = o["parentName"];
			this.parentSameLayer = o["parentSameLayer"];

			this.wi.SetXY(o["global_x"] || 0,o["global_y"] || 0);
			this.wi.SetBboxChanged();
		}

		_loadFromJson(o){
			this.LoadFromJson(o);
		}

		GetDebuggerProperties(){
			var children = [];
			for (var i = 0,l = this.children.length; i < l; i++) {
				children.push(this.children[i].GetUnsavedDataMap().aekiro_gameobject.name);
			}
			var children_str = JSON.stringify(children,null,"\t");

			return [{
				title: "aekiro_gameobject",
				properties: [
					{name: "name", value: this.name},
					{name: "parentName", value: this.parentName},
					{name: "children", value: children_str},
					{name: "local_x", value: this.local.x},
					{name: "local_y",value: this.local.y},
					{name: "local_angle",value: this.local.angle}
				]
			}];
		}

		_getDebuggerProperties(){
			return this.GetDebuggerProperties();
		}

		applyActionToHierarchy(action,v){
			if(!action) return;

			if(typeof action === "function"){
				action(this.instance, v);
			}else{
				this.instance.GetSdkInstance().CallAction(action,v);
			}
			var h = this.children;
			for (var i = 0, l = h.length; i < l; i++) {
				h[i].GetUnsavedDataMap().aekiro_gameobject.applyActionToHierarchy(action,v);
			}
		}

		SetBlendMode(bm){
			this.wi.SetBlendMode(bm);
			var h = this.children;
			for (var i = 0, l = h.length; i < l; i++) {
				h[i].GetWorldInfo().SetBlendMode(bm);
			}
		}

		globalToLocal(inst,parent_inst){
			if(!inst || !parent_inst)return;
			var wip = parent_inst.GetWorldInfo();
			return this.globalToLocal2(inst,wip.GetX(),wip.GetY(),wip.GetAngle());
		}

		globalToLocal2(inst,p_x,p_y,p_angle){
			if(!inst)return;

			var wi = inst.GetWorldInfo();
			return {
				x: (wi.GetX()-p_x)*Math.cos(p_angle) + (wi.GetY()-p_y)*Math.sin(p_angle),
				y: -(wi.GetX()-p_x)*Math.sin(p_angle) + (wi.GetY()-p_y)*Math.cos(p_angle),
				angle: wi.GetAngle() - p_angle
			};
		}

		localToGlobal(inst,parent_inst){
			if(!inst || !parent_inst)return;
			var wip = parent_inst.GetWorldInfo();
			return this.localToGlobal2(inst,wip.GetX(),wip.GetY(),wip.GetAngle());
		}

		localToGlobal2(inst,p_x,p_y,p_angle){
			if(!inst)return;

			var aekiro_gameobject = inst.GetUnsavedDataMap().aekiro_gameobject;
			return {
				x: p_x + aekiro_gameobject.local.x*Math.cos(p_angle) - aekiro_gameobject.local.y*Math.sin(p_angle),
				y: p_y + aekiro_gameobject.local.x*Math.sin(p_angle) + aekiro_gameobject.local.y*Math.cos(p_angle),
				angle: p_angle + aekiro_gameobject.local.angle
			};
		}

		localToGlobal_x(){
			var parent = this.parent_get();
			if(parent){
				var wp = parent.GetWorldInfo();
				return wp.GetX() + this.local.x*Math.cos(wp.GetAngle()) - this.local.y*Math.sin(wp.GetAngle());
			}
			return this.local.x;
		}

		localToGlobal_y(){
			var parent = this.parent_get();
			if(parent){
				var wp = parent.GetWorldInfo();
				return wp.GetY() + this.local.x*Math.sin(wp.GetAngle()) + this.local.y*Math.cos(wp.GetAngle());
			}
			return this.local.y;
		}

		localToGlobal_angle(){
			var parent = this.parent_get();
			if(parent){
				var wp = parent.GetWorldInfo();
				return wp.GetAngle() + this.local.angle;
			}
			return this.local.angle;
		}
	};
}
