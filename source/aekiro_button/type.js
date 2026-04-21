"use strict";

{
	const SDK = globalThis.SDK;
	
	const BEHAVIOR_CLASS = SDK.Behaviors.aekiro_button;

	BEHAVIOR_CLASS.Type = class aekiro_buttonType extends SDK.IBehaviorTypeBase
	{
		constructor()
		{
			super();
		}
	};
}
