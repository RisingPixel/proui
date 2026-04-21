"use strict";
{
    C3.Plugins.aekiro_remoteSprite.Type = class RemoteSpriteType extends globalThis.ISDKObjectTypeBase
    {
        constructor()
		{
			super();
        }

        _release()
        {
            super._release();
        }

        _onCreate()
        {
            this.GetImageInfo().LoadAsset(this.runtime);
        }

        _loadTextures(renderer)
        {
            return this.GetImageInfo().LoadStaticTexture(renderer,
            {
                linearSampling: this.runtime.IsLinearSampling()
            });
        }

        _releaseTextures()
        {
            this.GetImageInfo().ReleaseTexture();
        }
    };
}