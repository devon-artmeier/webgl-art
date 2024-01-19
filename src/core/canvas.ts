import * as DGL from "devon-webgl"

export abstract class Canvas
{
	private static _canvases = new Map<string, Canvas>();

	protected _glCanvas: DGL.Canvas;
	
	/**************************/
	/* CLASS OBJECT FUNCTIONS */
	/**************************/
	
	// Constructor
	constructor(public readonly id: string, size: DGL.Vector2<number>)
	{
		let element = document.getElementById(this.id) as HTMLDivElement;
		
		if (element != null) {
			Canvas._canvases.set(this.id, this);

			this._glCanvas = new DGL.Canvas(this.id, size);
			let container = this._glCanvas.container;
			element.appendChild(this._glCanvas.container);
			
			let button = document.createElement("button");
			let canvasID = this.id;
			button.className = "devon-webgl-canvas-container";
			button.innerText = "Fullscreen";
			button.onclick = function ()
			{
				Canvas._canvases.get(canvasID)._glCanvas.setFullscreen();
			};
			container.after(button);
		}
	}
	
	// Update
	public update?(time: number): void;
	
	/********************/
	/* STATIC FUNCTIONS */
	/********************/
	
	// Update all canvases
	public static update(time: number)
	{
		this._canvases.forEach(function (canvas)
		{
			canvas._glCanvas.startDraw();
			canvas.update(time);
			canvas._glCanvas.finishDraw();
		});
	}
}