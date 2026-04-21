"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_gridView.Acts = {
		SetDataByJsonString(data,root){
			try {
				data = JSON.parse(data);
				//console.log(this.value);
			} catch(e) {
				console.error("ProUI-GRIDVIEW: json parse error !");
				return;
			}
			
			if(root){
				data = data[root];
			}
			this.value = data;
			this.build();
		},
		
		SetDataByJsonObject(jsonObject, root){
			var jsonInst = null;
			if(jsonObject){
				if(typeof jsonObject.getFirstPickedInstance === "function"){
					jsonInst = jsonObject.getFirstPickedInstance();
				}
				if(!jsonInst && typeof jsonObject.getFirstInstance === "function"){
					jsonInst = jsonObject.getFirstInstance();
				}
			}
			if(!jsonInst){
				return;
			}
			var data = jsonInst.getJsonDataCopy();
			if(root){
				data = data[root];
			}

			this.value = data;
			this.build();
		},
		Clear(){
			this.clear();
		}
	};
	
}
