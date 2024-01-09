import * as DGL from "devon-webgl"

const vertexShaderCode =
`#version 300 es

layout (location = 0) in vec2 vecFragCoord;
layout (location = 1) in vec2 vecTexCoord;

out vec2 texCoord;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

void main(void)
{
	texCoord = vecTexCoord;
	gl_Position = projection * view * model * vec4(vecFragCoord, 0, 1);
}
`;

const fragShaderCode = 
`#version 300 es
precision highp float;

in vec2 texCoord;
out vec4 fragColor;
uniform sampler2D render;

void main(void)
{
	fragColor = texture(render, texCoord);
}
`;

class RenderVertex extends DGL.Vertex
{
	// Constructor
	constructor(public coord: [number, number], public tex: [number, number])
		{ super(); }

	// Get data
	public getData(): readonly number[][]
	{
		return [this.coord, this.tex];
	}
}

const renderVertices = [
	new RenderVertex([0, 0], [0, 0]),
	new RenderVertex([1, 1], [1, 1]),
	new RenderVertex([1, 0], [1, 0]),
	new RenderVertex([0, 1], [0, 1])
];

const renderElements = [
	0,  1,  2,  1,  0,  3
];

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
			
			DGL.Texture.create("texture_render", DGL.Context.getSize());
			DGL.Shader.create("shader_render", vertexShaderCode, fragShaderCode);
			DGL.Mesh.createStatic("mesh_render", renderVertices, renderElements);
			
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