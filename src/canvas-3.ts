import * as DGL from "devon-webgl"
import { Canvas } from "./core/canvas"
import { fragShaderLib } from "./core/fragment-shader-lib"

const vertexShader =
`#version 300 es

layout (location = 0) in vec2 vecFragCoord;
layout (location = 1) in vec2 vecTexCoord;

out vec2 texCoord;

uniform mat4 projection;

void main(void)
{
	texCoord = vecTexCoord;
	gl_Position = projection * vec4(vecFragCoord, 0, 1);
}
`;

const fragmentShader = 
`#version 300 es
precision highp float;

in vec2 fragCoord;
in vec2 texCoord;
in vec2 pixelCoord;

out vec4 fragColor;

uniform sampler2D tex;

${fragShaderLib}
	
void main(void)
{
	fragColor = texture(tex, texCoord);
}
`

class Vertex extends DGL.Vertex
{
	constructor(public coord: DGL.Vector2<number>,
		public tex: DGL.Vector2<number>) { super(); }

	public getData(): readonly number[][]
	{
		return [this.coord, this.tex];
	}
}

const imgVertices = [
	new Vertex([0, 0], [0, 0]),
	new Vertex([0, 0], [1, 1]),
	new Vertex([0, 0], [1, 0]),
	new Vertex([0, 0], [1, 1]),
	new Vertex([0, 0], [0, 0]),
	new Vertex([0, 0], [0, 1])
];

export class Canvas3 extends Canvas
{
	public video: HTMLVideoElement;
	private _videoPlaying: boolean = false;
	private _videoTimeUpdate: boolean = false;
	private _videoReady: boolean = false;
	
	constructor(id: string)
	{
		super(id, [480, 360]);
		
		DGL.Texture.create("texture");
		DGL.Shader.create("shader", vertexShader, fragmentShader);
		DGL.Mesh.createDynamic("mesh");
		
		this.video = document.createElement("video");
		this.video.playsInline = true;
		this.video.loop = true;
		this.video.width = 640;
		this.video.height = 480;
		
		this.video.addEventListener(
			"playing",
			() => {
				this._videoPlaying = true;
				this._videoReady = this._videoPlaying && this._videoTimeUpdate;
			},
			true,
		);
		
		this.video.addEventListener(
			"timeupdate",
			() => {
				this._videoTimeUpdate = true;
				this._videoReady = this._videoPlaying && this._videoTimeUpdate;
			},
			true,
		);
		
		this.video.src = "./img/badapple.mp4";
	}
	
	private updateMesh()
	{
		let width = this.video.videoWidth;
		let height = this.video.videoHeight;
		
		if (this._videoReady && width != 0 && height != 0) {
			let textureSize = DGL.Texture.getSize("texture");
			
			if (textureSize[0] != width || textureSize[1] != height) {
				imgVertices[0].coord[0] = -width / 2;
				imgVertices[0].coord[1] = -height / 2;
				
				imgVertices[1].coord[0] = width / 2;
				imgVertices[1].coord[1] = height / 2;
				
				imgVertices[2].coord[0] = width / 2;
				imgVertices[2].coord[1] = -height / 2;
				
				imgVertices[3].coord[0] = width / 2;
				imgVertices[3].coord[1] = height / 2;
				
				imgVertices[4].coord[0] = -width / 2;
				imgVertices[4].coord[1] = -height / 2;
				
				imgVertices[5].coord[0] = -width / 2;
				imgVertices[5].coord[1] = height / 2;
				
				DGL.Mesh.setVertexArray("mesh", imgVertices, 0);
				DGL.Mesh.flushVertices("mesh");
			}
			
			DGL.Texture.loadVideoFrame("texture", this.video);
			this._videoTimeUpdate = false;
		}
	}
	
	public update(time: number, frame: number)
	{
		let res = DGL.Context.getSize();
		let textureSize = DGL.Texture.getSize("texture");
		
		DGL.Viewport.set([0, 0], res);
		DGL.Context.clear([0, 0, 0, 1]);
		
		this.updateMesh();
			
		let aspect = [textureSize[1] * (res[0] / res[1]), textureSize[1]] as DGL.Vector2<number>;
		if (res[1] > res[0]) {
			aspect = [textureSize[0], textureSize[0] * (res[1] / res[0])];
		}
		
		let projection = DGL.Matrix.ortho([-aspect[0] / 2, -aspect[1] / 2], aspect, [0, 1]);
			
		DGL.Shader.bind("shader");
			
		DGL.Shader.setMatrix4("projection", projection);
		DGL.Shader.setTexture("tex", 0);
			
		DGL.Texture.setActive(0, "texture");
			
		DGL.Mesh.draw("mesh");
	}
}
