"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_gameobject.Type = class MyBehaviorType extends globalThis.ISDKBehaviorTypeBase
	{
		constructor() {
            super();
        }
		
		_release()
		{
			super._release();
		}
		
		_onCreate()
		{	
		}
	};
}
