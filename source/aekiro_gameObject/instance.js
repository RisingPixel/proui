"use strict";

{
	const SDK = globalThis.SDK;
	
	const BEHAVIOR_CLASS = SDK.Behaviors.aekiro_gameobject;

	BEHAVIOR_CLASS.Instance = class aekiro_gameobjectInstance extends SDK.IBehaviorInstanceBase
	{
		constructor()
		{
			super();
		}
	};
}
