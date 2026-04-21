"use strict";
{
    const C3 = globalThis.C3;
    C3.Plugins.aekiro_remoteSprite.Acts = {
        async LoadFromURL(url,keepCurrentSize) {
            url = await this.runtime.GetAssetManager().GetProjectFileUrl(url);
            this.image.src = url;

            this.image.onload = () =>{
                if(!keepCurrentSize){
                    const wi = this.instance;
                    wi.SetWidth(this.image.width,true);
                    wi.SetHeight(this.image.height,true);
                    wi.SetBboxChanged();
                }
                this.isImageLoaded = true;
                this.newImageLoaded = true;
                this.runtime.UpdateRender();
            };
        },

        SetEffect(a){
            this.instance.SetBlendMode(a);
            this.runtime.UpdateRender();
        }
    };
}