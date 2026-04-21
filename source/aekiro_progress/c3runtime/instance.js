"use strict";

{
	const Tween = globalThis["TWEEN"];
	const C3 = globalThis.C3;

	C3.Behaviors.aekiro_progress.Instance = class aekiro_progressInstance extends globalThis.ISDKBehaviorInstanceBase
	{
		constructor()
		{
			super();
			const properties = this._getInitProperties();
			
			if (properties){
				this.maxValue = properties[0];
				this.value  = C3.clamp(properties[1],0,this.maxValue);
				this.animation = properties[2];
			}
	
			this.inst = null;
			this.wi = null;
			this.initWidth = null;
			this.goManager = globalThis.aekiro_goManager;
			
			this._childrenRegisteredListener = this.goManager.eventManager.on("childrenRegistred",() => this.init());			//******************************************
		}
	
		_postCreate(){
			this.inst = globalThis.Aekiro.compatWorldInstance(this.instance);
			this.wi = this.inst;
		}
	
		init(){
			var wi = this.wi;
			if(this.initWidth == null){
				this.initWidth = wi.GetWidth();
			}
			
			this.transf = {width:wi.GetWidth()};
			this.targetWidth = wi.GetWidth();
			this.tween = new Tween["Tween"](this.transf);
			if(this.animation == 1){
				this.tween["easing"](Tween["Easing"]["Linear"]["None"]);
			}else if(this.animation == 2){
				this.tween["easing"](Tween["Easing"]["Quadratic"]["Out"]);
			}
			this.updateView();
		}
		
		onInitPropsLoaded(){
			var wi = this.wi;
			wi.SetWidth(this.initWidth,true);		
		}

			
		isValueValid(value){
			if(value == null || isNaN(value) || value === ""){
				return false;
			}
			return true;			
		}

		setMaxValue(v){
			this.maxValue = v;
			this.value = C3.clamp(this.value,0,this.maxValue);
			this.updateView();
		}

		setValue(value){
			if(!this.isValueValid(value)){
				return false;
			}
			value = C3.clamp(value,0,this.maxValue);
			if(this.value!=value){
				this.value = value;
				this.updateView();
			}
		}
	
		updateView(){
			var targetProp = 0;
			
			var progress = this.value/this.maxValue;
			

			targetProp = progress*this.initWidth;
			this.targetWidth = targetProp;
	
			if(this.animation){
				var wi = this.wi;
				if(this.tween["isPlaying"]){
					this.tween["stop"]();
				}
				this.transf.width = wi.GetWidth();
				this.tween["to"]({ width:targetProp}, 500);
				
				this._setTicking(true);
				this.tween["start"](this.runtime.GetWallTime()*1000);
			}else{
				this.wi.SetWidth(targetProp,true);
				this.wi.SetBboxChanged();
				if(this.tween["isPlaying"]){
					this.tween["stop"]();
					this.isTweenPlaying = false;
				}
			}
		}
	
		_tick(){
			const wasPlaying = !!this.tween["isPlaying"];
			if(wasPlaying){
				this.tween["update"](this.runtime.GetWallTime()*1000);
				this.wi.SetWidth(this.transf.width,true);	
				this.wi.SetBboxChanged();
			}

			if(!this.tween["isPlaying"]){
				if(wasPlaying){
					this.transf.width = this.targetWidth;
					this.wi.SetWidth(this.targetWidth,true);
					this.wi.SetBboxChanged();
				}
				this._setTicking(false);	
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
	
		_saveToJson(){
			return {
				"maxValue":this.maxValue,
				"value":this.value,
				"animation":this.animation,
				"initWidth": this.initWidth
			}
		}
	
		_loadFromJson(o){
			this.maxValue = o["maxValue"];
			this.value = o["value"];
			this.animation = o["animation"];
			this.initWidth = o["initWidth"];
			
			this.onInitPropsLoaded();
		}
		
		
	};
}
