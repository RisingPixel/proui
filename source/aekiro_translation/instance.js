"use strict";

{
	const SDK = globalThis.SDK;
	
	const PLUGIN_CLASS = SDK.Plugins.aekiro_translation;

	PLUGIN_CLASS.Instance = class aekiro_translationInstance extends SDK.IInstanceBase
	{
		constructor()
		{
			super();
		}
	};
}
