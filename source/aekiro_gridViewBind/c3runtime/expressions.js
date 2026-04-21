"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_gridviewbind.Exps ={
		index(){ return this.index; },
		key(){ return this.key; },
		get(key){
			if(!this.isObject(this.value)){
				return "";
			}

			var v = globalThis["_"]["get"](this.value,key);
			if(v == undefined){
				return  "";
			}else{
				return v;
			}
		}
	};
}


