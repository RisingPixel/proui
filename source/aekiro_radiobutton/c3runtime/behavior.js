"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_radiobutton = class aekiro_radiobuttonBehavior extends globalThis.ISDKBehaviorBase
	{
		constructor() {
			super();
			this._onPointerDownHandler = (a) => this._OnPointerDown(a);
			this._onPointerMoveHandler = (a) => this._OnPointerMove(a);
			this._onPointerUpHandler = (a) => this._OnPointerUp(a, !1);
			this._onPointerCancelHandler = (a) => this._OnPointerUp(a, !0);
			this.runtime.addEventListener("pointerdown", this._onPointerDownHandler);
			this.runtime.addEventListener("pointermove", this._onPointerMoveHandler);
			this.runtime.addEventListener("pointerup", this._onPointerUpHandler);
			this.runtime.addEventListener("pointercancel", this._onPointerCancelHandler);
		}
		_release() {
			this.runtime.removeEventListener("pointerdown", this._onPointerDownHandler);
			this.runtime.removeEventListener("pointermove", this._onPointerMoveHandler);
			this.runtime.removeEventListener("pointerup", this._onPointerUpHandler);
			this.runtime.removeEventListener("pointercancel", this._onPointerCancelHandler);
			this._onPointerDownHandler = null;
			this._onPointerMoveHandler = null;
			this._onPointerUpHandler = null;
			this._onPointerCancelHandler = null;
			super._release()
		}
		_OnPointerDown(a) {
			this._OnInputDown(a["pointerId"].toString(), a["clientX"], a["clientY"])
		}
		_OnPointerMove(a) {
			this._OnInputMove(a["pointerId"].toString(), a["clientX"], a["clientY"])
		}
		_OnPointerUp(a) {
			this._OnInputUp(a["pointerId"].toString(), a["clientX"], a["clientY"])
		}
		async _OnInputDown(source, b, c) {
			const insts = this.getAllInstances();
			for (const inst of insts) {
				const beh = globalThis.Aekiro.getInstanceData(inst).aekiro_radiobutton;
				if(!beh) continue;
				const wi = inst,
				layer = wi.GetLayer(),
				[x,y] = layer.CanvasCssToLayer(b, c, wi.GetTotalZElevation());
				if(beh.OnAnyInputDown)
					await beh.OnAnyInputDown(x,y,source);
			}
		}
		_OnInputMove(source, b, c) {
			const insts = this.getAllInstances();
			for (const inst of insts) {
				const beh = globalThis.Aekiro.getInstanceData(inst).aekiro_radiobutton;
				if(!beh) continue;
				/*if (!d.IsEnabled() || !d.IsDragging() || d.IsDragging() && d.GetDragSource() !== a)
					continue;*/
				const wi = inst 
				  , layer = wi.GetLayer()
				  , [x,y] = layer.CanvasCssToLayer(b, c, wi.GetTotalZElevation());
				if(beh.OnAnyInputMove)
					beh.OnAnyInputMove(x, y,source);
			}
		}
		async _OnInputUp(a,b,c) {
			const insts = this.getAllInstances();
			for (const inst of insts) {
				const beh = globalThis.Aekiro.getInstanceData(inst).aekiro_radiobutton;
				if(!beh) continue;
				const wi = inst,
				layer = wi.GetLayer(),
				[x,y] = layer.CanvasCssToLayer(b, c, wi.GetTotalZElevation());
				
				if(beh.OnAnyInputUp)
					await beh.OnAnyInputUp(x,y);
			}
		}
	};
}
