"use strict";
{
   
    const DOM_COMPONENT_ID = "aekiro_remoteSprite_dom";

    C3.Plugins.aekiro_remoteSprite.Instance = class RemoteSpriteInstance extends globalThis.ISDKDOMInstanceBase
    {
        constructor()
		{
			super();
			const properties = this._getInitProperties();
        }

        _release()
        {
            super._release();
        }

        _draw(renderer)
        {

        }


        
        _saveToJson()
        {
            return {
                // data to be saved for savegames
            };
        }

        _loadFromJson(o)
        {
            // load state for savegames
        }

        _getDebuggerProperties()
        {
            return [
            {
            }];
        }
    };
}