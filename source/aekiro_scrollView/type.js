"use strict";

{
	const SDK = globalThis.SDK;
	
	const BEHAVIOR_CLASS = SDK.Behaviors.aekiro_scrollView;

	BEHAVIOR_CLASS.Type = class aekiro_scrollViewType extends SDK.IBehaviorTypeBase
	{
		constructor()
		{
			super();
		}
	};
}
