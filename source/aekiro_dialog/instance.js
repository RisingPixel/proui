"use strict";

{
	const SDK = globalThis.SDK;
	
	const BEHAVIOR_CLASS = SDK.Behaviors.aekiro_dialog;

	BEHAVIOR_CLASS.Instance = class aekiro_dialogInstance extends SDK.IBehaviorInstanceBase
	{
		constructor()
		{
			super();
		}
	};
}
