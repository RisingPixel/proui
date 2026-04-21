"use strict";

{
	const SDK = globalThis.SDK;
	
	const BEHAVIOR_CLASS = SDK.Behaviors.aekiro_dialog;

	BEHAVIOR_CLASS.Type = class aekiro_dialogType extends SDK.IBehaviorTypeBase
	{
		constructor()
		{
			super();
		}
	};
}
