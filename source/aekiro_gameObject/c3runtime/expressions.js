"use strict";

{
    const C3 = globalThis.C3;
    C3.Behaviors.aekiro_gameobject.Exps = {
        name(){ return this.name; },
        parent(){ return this.parentName; },
        asjson(){
            var t = this.getTemplate();  
            return  JSON.stringify(t);
        },
        globalX(){ return this.instance.GetX_old();},
        globalY(){ return this.instance.GetY_old();},
        globalAngle(){ return this.instance.GetAngle_old();},

        localX(){ return this.wi.GetX(true);},
        localY(){ return this.wi.GetY(true);},
        localAngle(){ return this.wi.GetAngle(true);}
    };
}
