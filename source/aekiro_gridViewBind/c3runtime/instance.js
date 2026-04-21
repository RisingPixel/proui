"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_gridviewbind.Instance = class aekiro_bindInstance extends globalThis.ISDKBehaviorInstanceBase
	{
		constructor()
		{
			super();
			const properties = this._getInitProperties();

			//*********************************
			this.index = -1 ;
			this.key = "" ;
			this.gridView = null;
			this.value = 0;
		}

		_postCreate()
		{
			globalThis.Aekiro.getInstanceData(this.instance).aekiro_gridviewbind = this;
		}
	
		setValue (value){
			//console.log("%cLABEL %d : Set value to %s","color:blue", this.inst.uid, value);		
			this.value = value;
			//this._trigger(C3.Behaviors.aekiro_gridviewbind.Cnds.OnChanged); //maybe later
		}
		
		triggerOnGridViewRender(){
			this._trigger(C3.Behaviors.aekiro_gridviewbind.Cnds.OnGridViewRender);
		}

		isObject (a) {
			return (!!a) && (a.constructor === Object);
		}
	
		_release()
		{
			super._release();
		}
	
		_saveToJson()
		{
			return {
			};
		}
	
		_loadFromJson(o)
		{
		}
	};
}
