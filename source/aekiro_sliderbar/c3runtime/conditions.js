"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_sliderbar.Cnds = {
		IsSliding(){ return this.isSliding; },
		
		OnChanged(){ return true; }
	};
}
