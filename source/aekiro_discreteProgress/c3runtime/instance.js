"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_discreteProgress.Instance = class aekiro_discreteProgressInstance extends globalThis.ISDKBehaviorInstanceBase {
		constructor()
		{
			super();
			const properties = this._getInitProperties();
			//properties
			this.value  = properties[0];
			
			//**************************
			this.parts = [];
			this.goManager = globalThis.aekiro_goManager;
			this.isInit = false;
			this._isCloneListenerAttached = false;
			
			this._childrenRegisteredListener = this.goManager.eventManager.on("childrenRegistred",() => this.init());
		}
	
	
		_postCreate(){
			globalThis.Aekiro.getInstanceData(this.instance).aekiro_discreteProgress = this;
		}

		ensureGameObject(){
			let inst = this.instance;
			try{
				inst = this.instance;
			}catch(_err){
				return null;
			}
			if(!inst){
				return null;
			}
			const currentGameObject = globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject;
			if(currentGameObject && currentGameObject !== this.aekiro_gameobject){
				this.aekiro_gameobject = currentGameObject;
				if(!this._isCloneListenerAttached && this.aekiro_gameobject.eventManager){
					this.aekiro_gameobject.eventManager.on("cloned",() => {
						this.isInit = false;
						this.init();
					},{"once":true});
					this._isCloneListenerAttached = true;
				}
			}
			return this.aekiro_gameobject;
		}
		
		init(){
			if(this.isInit){
				return true;
			}
			if(!this.ensureGameObject()){
				this.isInit = false;
				return false;	
			}
			var children = this.aekiro_gameobject.children;
			if(!children.length){
				this.isInit = false;
				return false;
			}
			this.max = children.length;
			var b;
			var l = this.max;
			for (var i = 0; i < l; i++) {
				b = globalThis.Aekiro.getInstanceData(children[i]).aekiro_discreteProgressPart;
				this.parts[b.index] = children[i];
				b._postCreate();
			}
			
			this.value = C3.clamp(this.value,0,this.max);
			this.updateView();
			this.isInit = true;
			//console.log(this.parts);
			return true;
		}

		isValueValid(value){
			if(value == null || isNaN(value) || value === ""){
				return false;
			}
			return true;			
		}
		
		setValue(value){
			if(!this.isValueValid(value)){
				return false;
			}
			value = C3.clamp(value,0,this.max);
			if(this.value!=value){
				this.value = value;	
				this.updateView();
			}
		}
		
		updateView(){
			var b;
			for (var i = 0; i < this.max; i++) {
				b = globalThis.Aekiro.getInstanceData(this.parts[i]).aekiro_discreteProgressPart;
				b.setFrameAnim(0);
			}
			
			var integer = Math.floor(this.value);
			var remainder = this.value % 1;
			
			for (var i = 0; i < integer; i++) {
				b = globalThis.Aekiro.getInstanceData(this.parts[i]).aekiro_discreteProgressPart;
				b.setFrameAnim(2);
			}
			
			if(i < this.max && remainder >= 0.5){
				b = globalThis.Aekiro.getInstanceData(this.parts[i]).aekiro_discreteProgressPart;
				b.setFrameAnim(1);
			}
		}
		
	
	
		
		
		_release()
		{
			if(this._childrenRegisteredListener){
				this.goManager.eventManager.removeListener(this._childrenRegisteredListener);
				this._childrenRegisteredListener = null;
			}
			super._release();
		}
	
		_saveToJson()
		{
			return {
				"value": this.value
			};
		}
	
		_loadFromJson(o)
		{
			this.value  = o["value"];
		}
	};
	
	
	
}
