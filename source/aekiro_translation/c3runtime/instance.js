"use strict";

{
	const C3 = globalThis.C3;
	C3.Plugins.aekiro_translation.Instance = class aekiro_translationSingleGlobalInstance extends globalThis.ISDKInstanceBase
	{
		constructor()
		{
			super();
			const properties = this._getInitProperties();
			
			this.data = {};
		}
		
		setData(data){
			if(typeof data === 'string'){
				try{
					this.data = JSON.parse(data);
				}catch(e){
					console.error("ProUI-Translation: Invalid JSON.");
				}
			}else{
				this.data = data;	
			}
		}
	
		translateAll (lang){
			if(!this.data[lang])return;

			var insts = globalThis.Aekiro.getBehaviorInstances("aekiro_translationB");

			var key,aekiro_translation,value;
			var l = insts.length; 
			for (var i = 0; i < l; i++){
				aekiro_translation = globalThis.Aekiro.getInstanceData(insts[i]).aekiro_translation;
				key = aekiro_translation.key;
				value = globalThis["_"].get(this.data[lang],key);
				if(value!=undefined){
					aekiro_translation.updateView(value);
				}
			}
		}
	
		_release()
		{
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
