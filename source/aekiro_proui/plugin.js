//Converted with C2C3AddonConverter v1.0.1.1
"use strict";

{
	const SDK = globalThis.SDK;
	const C3 = globalThis.C3;
	const lang = globalThis.lang;
	const PLUGIN_ID = "aekiro_proui";
	const PLUGIN_CATEGORY = "other";

	let app = null;

	const PLUGIN_CLASS = SDK.Plugins.aekiro_proui = class aekiro_proui extends SDK.IPluginBase
	{
		constructor()
		{
			super(PLUGIN_ID);
			SDK.Lang.PushContext("plugins." + PLUGIN_ID.toLowerCase());
			this._info.SetName(lang(".name"));
			this._info.SetDescription(lang(".description"));
			this._info.SetCategory(PLUGIN_CATEGORY);
			this._info.SetAuthor("Aekiro");
			this._info.SetHelpUrl(lang(".help-url"));
			this._info.SetIsSingleGlobal(true);
			this._info.SetIsDeprecated(false);
			this._info.SetSupportsEffects(false);
			this._info.SetMustPreDraw(false);
			this._info.SetCanBeBundled(true);
			this._info.SetDOMSideScripts(["c3runtime/domSide.js"]);

			SDK.Lang.PushContext(".properties");
			this._info.SetProperties([
				new SDK.PluginProperty("combo", "stopClickPropagation", {initialValue:"yes", items:["no","yes"]}),
			]);
			this._info.AddFileDependency({
				filename: "lodash.custom.min.js",
				type: "external-runtime-script"
				});
			this._info.AddFileDependency({
				filename: "Tween.js",
				type: "external-runtime-script"
				});
			SDK.Lang.PopContext();		// .properties
			SDK.Lang.PopContext();
		}
	};
	PLUGIN_CLASS.Register(PLUGIN_ID, PLUGIN_CLASS);
}
