"use strict";

{
	const SDK = globalThis.SDK;
	
	const BEHAVIOR_CLASS = SDK.Behaviors.aekiro_checkbox;

	BEHAVIOR_CLASS.Type = class aekiro_checkboxType extends SDK.IBehaviorTypeBase
	{
		constructor()
		{
			super();
		}
	};
}
