"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_radiogroup.Acts = {
		setValue(value){
			this.setValue(value);
		},
		setEnabled(isEnabled){
			this.isEnabled = isEnabled;
			for (var i = 0,l=this.radioButtons.length; i < l; i++) {
				globalThis.Aekiro.getInstanceData(this.radioButtons[i]).aekiro_radiobutton.setEnabled(isEnabled);
			}
		}
	};
}
