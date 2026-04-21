"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_translationB.Instance = class aekiro_translationBInstance extends globalThis.ISDKBehaviorInstanceBase
	{
		constructor()
		{
			super();
			const properties = this._getInitProperties();
			this.key = properties[0];

			this.isInstanceOfSprite = false;
		}

		_postCreate(){
			this.inst = this.instance;
			globalThis.Aekiro.getInstanceData(this.instance).aekiro_translation = this;
			globalThis.Aekiro.registerBehaviorInstance("aekiro_translationB", this.instance);
			this.isInstanceOfSprite = this.instance.plugin.constructor == C3.Plugins.Sprite;
		}
	
		updateView(v){
			if(this.isInstanceOfSprite){
				this.setFrameAnim(v);
			}else{
				this.instance.text = v;
			}
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
				frame = defaults?defaults["f"]:undefined;
			}
			if(!isNaN(anim) || !anim){
				anim = defaults?defaults["a"]:undefined;
			}
			var res =  {
				"f": frame,
				"a": anim
			};
			return res;

		}
		
		setFrameAnim(v){
			this.frameAnim = this.parseFrameAnim(v);
			var anim = this.frameAnim["a"];
			var frame = this.frameAnim["f"];
			//console.log(anim+"**"+frame);
			if(typeof anim === "string" && anim.length){
				this.instance.setAnimation(anim, "beginning");
			}
			if(frame!=undefined){
				this.instance.animationFrame = frame;
			}
		}
	
		_release()
		{
			const inst = this.inst || this.instance;
			if(inst){
				globalThis.Aekiro.unregisterBehaviorInstance("aekiro_translationB", inst);
			}
			super._release();
		}
		
		_saveToJson()
		{
			return {
				"key" : this.key
			};
		}

		_loadFromJson(o)
		{
			this.key = o["key"];
		}
	};
}
