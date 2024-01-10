import * as DGL from "devon-webgl"

export abstract class Canvas
{
	private static _canvases = new Map<string, Canvas>();
	private static _fullscreenCanvas: Canvas;
	private static _fullscreen: boolean;
	
	/**************************/
	/* CLASS OBJECT FUNCTIONS */
	/**************************/
	
	// Constructor
	constructor(public readonly id: string, size: DGL.Vector2<number>)
	{
		let element = document.getElementById(this.id) as HTMLDivElement;
		
		if (element != null) {
			Canvas._canvases.set(this.id, this);
			
			DGL.Context.create(this.id, element, size);
			DGL.Context.bind(this.id);
			
			let container = DGL.Context.getContainer(this.id);
			let button = document.createElement("button");
			let canvasID = this.id;
			button.className = "devon-webgl-canvas-container";
			button.innerText = "Fullscreen";
			button.onclick = function ()
			{
				DGL.Context.setFullscreen(canvasID);
			};
			container.after(button);
		}
	}
	
	// Update
	public update?(time: number, frame: number): void;
	
	/********************/
	/* STATIC FUNCTIONS */
	/********************/
	
	// Update all canvases
	public static update(time: number, frame: number)
	{
		this._canvases.forEach(function (canvas)
		{
			if (!Canvas._fullscreen || (Canvas._fullscreen && Canvas._fullscreenCanvas == canvas)) {
				DGL.Context.bind(canvas.id);
				canvas.update(time, frame);
				DGL.Context.draw();
			}
		});
	}
}