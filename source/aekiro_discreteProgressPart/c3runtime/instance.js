"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_discreteProgressPart.Instance = class aekiro_discreteProgressPartInstance extends globalThis.ISDKBehaviorInstanceBase {
		constructor()
		{
			super();
			const properties = this._getInitProperties();
	
			//properties
			this.index  = properties[0];
			this.frameAnim_0  = properties[1];
			this.frameAnim_05  = properties[2];
			this.frameAnim_1  = properties[3];
			//**************************
			this.goManager = globalThis.aekiro_goManager;
			this.frameAnim = [];		
		}
	
		_postCreate(){
			globalThis.Aekiro.getInstanceData(this.instance).aekiro_discreteProgressPart = this;
			//**************************
			this.onPropsLoaded();
		}
		
		
		onPropsLoaded(){
			this.setInitProps();
			this.initFrameAnim();
		}
		
		setInitProps(){
			this.initProps = {
				animationFrame : null,
				animationName : null
			};
			
			this.initProps.animationFrame = this.initProps.animationFrame===null ? this.instance.animationFrame : this.initProps.animationFrame;
			this.initProps.animationName = this.initProps.animationName || this.instance.animationName;	
			
		}
		
		initFrameAnim(){
			this.frameAnim[0] = this.parseFrameAnim(this.frameAnim_0);
			this.frameAnim[1] = this.parseFrameAnim(this.frameAnim_05);
			this.frameAnim[2] = this.parseFrameAnim(this.frameAnim_1);
		}
		
		setFrameAnim(state){
			//console.log(this.frameAnim);
			var anim = this.frameAnim[state]["a"];
			var frame = this.frameAnim[state]["f"];
			if(typeof anim === "string" && anim.length){
				this.instance.setAnimation(anim, "beginning");
			}
			this.instance.animationFrame = frame;
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
			var res =  {
				"f": frame,
				"a": anim
			};
			return res;
		}
		
		_release()
		{
			super._release();
		}
	
		_saveToJson()
		{
			return {
				"index" : this.index,
				"frameAnim_0" :  this.frameAnim_0,
				"frameAnim_05" : this.frameAnim_05,
				"frameAnim_1": this.frameAnim_1
			};
		}
	
		_loadFromJson(o)
		{
			this.index  = o["index"];
			this.frameAnim_0  = o["frameAnim_0"];
			this.frameAnim_05  = o["frameAnim_05"];
			this.frameAnim_1  = o["frameAnim_1"];
			
			this.onPropsLoaded();
		}
	};
}
