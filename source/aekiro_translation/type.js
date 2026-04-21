"use strict";

{
	const SDK = globalThis.SDK;
	

	const PLUGIN_CLASS = SDK.Plugins.aekiro_translation;

	PLUGIN_CLASS.Type = class aekiro_translationType extends SDK.ITypeBase
	{
		constructor()
		{
			super();
		}
	};
}
