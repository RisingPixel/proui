"use strict";

{
	const C3 = globalThis.C3;
	C3.Plugins.aekiro_proui.Acts = {
		SetInputIgnored(state){
			this.ignoreInput = state;
		},
		Clone(json,layer,x,y,name,parentName){
			json = JSON.parse(json);
			var inst = globalThis.aekiro_goManager.clone(json,name,parentName,layer,x,y);
			globalThis.Aekiro.getInstanceData(inst).aekiro_gameobject.updateZindex();
		},
		SetUIAudioVolume(v){
			this.setUIAudioVolume(v);
		},
		Init(){
			this.Initialise();
		}
	};
}
