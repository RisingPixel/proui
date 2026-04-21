"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_radiogroup.Instance = class aekiro_radiogroupInstance extends globalThis.ISDKBehaviorInstanceBase
	{
		constructor()
		{
			super();
			const properties = this._getInitProperties();
			
			//properties
			this.value  = properties[0];
			//**************************
			this.radioButtons = [];
			this.isEnabled = true;
			this.isInit = false;
			this._isCloneListenerAttached = false;
			this.goManager = globalThis.aekiro_goManager;
			
			this._childrenRegisteredListener = this.goManager.eventManager.on("childrenRegistred",() => this.init());
		}
		
		_postCreate(){
			globalThis.Aekiro.getInstanceData(this.instance).aekiro_radiogroup = this;
		}

		ensureGameObject(){
			let inst = this.inst;
			if(!inst){
				try{
					inst = this.instance;
				}catch(_err){
					return null;
				}
			}
			if(!inst){
				return null;
			}
			const currentGameObject = globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject;
			if(currentGameObject && currentGameObject !== this.aekiro_gameobject){
				this.aekiro_gameobject = currentGameObject;
				if(!this._isCloneListenerAttached && this.aekiro_gameobject && this.aekiro_gameobject.eventManager){
					this.aekiro_gameobject.eventManager.on("cloned",() => this.init(),{"once":true});
					this._isCloneListenerAttached = true;
				}
			}
			return this.aekiro_gameobject;
		}

		GetRadioButtons(){
			if(!this.ensureGameObject()){
				return [];
			}
			const currentGameObject = globalThis.Aekiro.getInstanceData(this.instance).aekiro_gameobject;
			return currentGameObject.children;
		}

		init(){
			if(!this.ensureGameObject()){
				this.isInit = false;
				return false;
			}
			
			this.radioButtons = this.GetRadioButtons();
			if(!this.radioButtons.length){
				this.isInit = false;
				return false;
			}
			
			var b;
			var l = this.radioButtons.length;
			for (var i = 0; i < l; i++) {
				b = globalThis.Aekiro.getInstanceData(this.radioButtons[i]).aekiro_radiobutton;
				if(b){
					b.init();
				}
			}
			
			this.updateView();
			this.isInit = true;
			
			//console.log(this.radioButtons);
			//console.log("init radiogroup" + this.instance.GetUID());
			return true;
		}
	
		
		isValueValid(value){
			var b;
			var radioButtons = this.GetRadioButtons();
			for (var i = 0; i < radioButtons.length; i++) {
				b = globalThis.Aekiro.getInstanceData(radioButtons[i]).aekiro_radiobutton;
				if(b.name == value){
					return true;
				}
			}
			return false;			
		}

		setValue(value){
			this.value = value; 
			var radioButtons = this.GetRadioButtons();
			if(!radioButtons.length){
				return false;
			}
			if(!this.isValueValid(value)){
				return false;
			}

			var b,l=radioButtons.length;
			for (var i = 0; i < l; i++) {
				b = globalThis.Aekiro.getInstanceData(radioButtons[i]).aekiro_radiobutton;
				if(b.name == value){
					b.setValue(1);
				}else{
					b.setValue(0);
				}
			}
		}
		
		updateView(){
			var areAllDisabled = true;
			var radioButtons = this.GetRadioButtons();
			for (var i = 0; i < radioButtons.length; i++) {
				var b = globalThis.Aekiro.getInstanceData(radioButtons[i]).aekiro_radiobutton;
				if(b.name == this.value){
					b.setValue(1);
				}else{
					b.setValue(0);
				}
				if(b.isEnabled){
					areAllDisabled = false;
				}
			}
			
			if(areAllDisabled){
				this.isEnabled = false;
			}	
		}
		
		_release(){
			if(this._childrenRegisteredListener){
				this.goManager.eventManager.removeListener(this._childrenRegisteredListener);
				this._childrenRegisteredListener = null;
			}
			super._release();
		}
	
		_saveToJson(){
			return {
				"value":this.value,
			};
		}
	
		_loadFromJson(o){
			this.value = o["value"];
		}
	};

}
