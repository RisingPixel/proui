"use strict";

{
	const C3 = globalThis.C3;
	C3.Behaviors.aekiro_button = class aekiro_buttonBehavior extends globalThis.ISDKBehaviorBase
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
			super._release();
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
		_getProUI() {
			if(!this.proui){
				const objectClass = globalThis.IPlugin.getByConstructor(C3.Plugins.aekiro_proui);
				if(objectClass){
					this.proui = objectClass.getSingleGlobalInstance();
				}
			}
			return this.proui;
		}
		async _OnInputDown(source, b, c) {
			const proui = this._getProUI();
			const stopClickPropagation = proui.stopClickPropagation;
			const insts = this.getAllInstances();
			const targetInsts = [];
			for (const inst of insts) {
				const wi = inst;
				const beh = globalThis.Aekiro.getInstanceData(inst).aekiro_button;
				if(!beh) continue;
				const layer = wi.GetLayer();
				const [x,y] = layer.CanvasCssToLayer(b, c, wi.GetTotalZElevation());
				beh.setFocused(false);
				if(stopClickPropagation){
					if(wi.ContainsPoint(x, y)){
						targetInsts.push(inst);
					}					
				}else{
					if(beh.OnAnyInputDown){
						await beh.OnAnyInputDown(x,y,source);
					}					
				}

			}

			if(stopClickPropagation){
				// Route click to visual top-most target first to emulate UI hit-testing
				// when multiple interactive widgets overlap.
				targetInsts.sort(function(a, b) {
					return a.GetTotalZElevation() - b.GetTotalZElevation();
				});

				//stopin propagation only concrns visible instances
				const res = targetInsts.filter(s => s.IsVisible() &&  s.GetLayer().IsVisible());
				const topInstance = res[res.length-1];
				const targetInsts2 = [];
				if(topInstance){
					targetInsts2.push(topInstance);
				}
				
				//add instances with ignoreInput = no;
				// Legacy compatibility: explicit ignoreInput=0 instances still receive
				// events even when they are not the top-most overlap.
				for (const inst of targetInsts) {
					if(globalThis.Aekiro.getInstanceData(inst).aekiro_button.ignoreInput == 0){
						targetInsts2.push(inst);
					}
				}
				
				for (const inst of targetInsts2) {
					const wi = inst;
					const beh = globalThis.Aekiro.getInstanceData(inst).aekiro_button;
					if(!beh) continue;
					const layer = wi.GetLayer();
					const [x,y] = layer.CanvasCssToLayer(b, c, wi.GetTotalZElevation());
					if(beh.OnAnyInputDown){
						await beh.OnAnyInputDown(x,y,source);
					}
				}
			}
		}
		_OnInputMove(source, b, c) {
			const insts = this.getAllInstances();
			for (const inst of insts) {
				const beh = globalThis.Aekiro.getInstanceData(inst).aekiro_button;
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
				const beh = globalThis.Aekiro.getInstanceData(inst).aekiro_button;
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
