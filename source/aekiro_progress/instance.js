"use strict";

{
	const SDK = globalThis.SDK;
	
	const BEHAVIOR_CLASS = SDK.Behaviors.aekiro_progress;

	BEHAVIOR_CLASS.Instance = class aekiro_progressInstance extends SDK.IBehaviorInstanceBase
	{
		constructor()
		{
			super();
		}
	};
}
