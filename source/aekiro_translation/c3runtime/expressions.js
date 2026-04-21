"use strict";

{
	const C3 = globalThis.C3;
	C3.Plugins.aekiro_translation.Exps =
	{
		get(key,lang){
			var res  = globalThis["_"].get(this.data[lang],key);
			return res;
		}
	};
	
}
