import * as DGL from "devon-webgl"
import { Canvas } from "./core/canvas"
import { fragShaderLib } from "./core/fragment-shader-lib"

const vertexShader =
`#version 300 es

layout (location = 0) in vec2 vecFragCoord;
layout (location = 1) in vec2 vecTexCoord;

out vec2 texCoord;
out vec2 pixelCoord;

uniform vec2 resolution;
uniform mat4 projection;

void main(void)
{
	texCoord = vecTexCoord;
	pixelCoord = floor(vecTexCoord * resolution);
	gl_Position = projection * vec4(vecFragCoord, 0, 1);
}
`;

const fragmentShader = 
`#version 300 es
precision highp float;

in vec2 texCoord;
in vec2 pixelCoord;

out vec4 fragColor;

uniform sampler2D tex;
uniform vec2 resolution;
uniform float time;

float getNeighbor(int x, int y, float xoff, float yoff, mat3 sobel)
{
	vec4 pixel = texture(tex, vec2(pixelCoord.x + float(x) + xoff, pixelCoord.y + float(y) + yoff) / resolution) * sobel[x + 1][y + 1];
	return (pixel.r + pixel.g + pixel.b) / 3.0;
}

float sobel(float xoff, float yoff)
{
	mat3 sobelX;
	sobelX[0] = vec3(-1.0, 0.0, 1.0);
	sobelX[1] = vec3(-2.0, 0.0, 2.0);
	sobelX[2] = vec3(-1.0, 0.0, 1.0);
	
	mat3 sobelY;
	sobelY[0] = vec3( 1.0,  2.0,  1.0);
	sobelY[1] = vec3( 0.0,  0.0,  0.0);
	sobelY[2] = vec3(-1.0, -2.0, -1.0);
	
	float sx = getNeighbor(-1, -1, xoff, yoff, sobelX) +
		getNeighbor(0, -1, xoff, yoff, sobelX) +
		getNeighbor(1, -1, xoff, yoff, sobelX) +
		getNeighbor(-1, 0, xoff, yoff, sobelX) +
		getNeighbor(0, 0, xoff, yoff, sobelX) +
		getNeighbor(1, 0, xoff, yoff, sobelX) +
		getNeighbor(-1, 1, xoff, yoff, sobelX) +
		getNeighbor(0, 1, xoff, yoff, sobelX) +
		getNeighbor(1, 1, xoff, yoff, sobelX);
		
	float sy = getNeighbor(-1, -1, xoff, yoff, sobelY) +
		getNeighbor(0, -1, xoff, yoff, sobelY) +
		getNeighbor(1, -1, xoff, yoff, sobelY) +
		getNeighbor(-1, 0, xoff, yoff, sobelY) +
		getNeighbor(0, 0, xoff, yoff, sobelY) +
		getNeighbor(1, 0, xoff, yoff, sobelY) +
		getNeighbor(-1, 1, xoff, yoff, sobelY) +
		getNeighbor(0, 1, xoff, yoff, sobelY) +
		getNeighbor(1, 1, xoff, yoff, sobelY);
	
	float c = min(1.0, sqrt((sx * sx) + (sy * sy)));
	if (c <= 16.0 / 255.0) c = 0.0;
	return c;
}

void main(void)
{
	float a = time * 6.0;
	float d = 32.0;
	
	float cr1 = sobel(cos(a) * -d, sin(a) * -d);
	float cg1 = sobel(0.0, 0.0);
	float cb1 = sobel(cos(a) * d, sin(a) * d);
	
	float cr2 = sobel(-4.0, 0.0);
	float cg2 = sobel(0.0, 0.0);
	float cb2 = sobel(4.0, 0.0);
	
	fragColor = (texture(tex, texCoord) * vec4(cr1, cg1, cb1, 1)) + vec4(cr2, cg2, cb2, 1);
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
			
		DGL.Shader.setVec2("resolution", aspect);
		DGL.Shader.setFloat("time", time / 1000.0);
		DGL.Shader.setMatrix4("projection", projection);
		DGL.Shader.setTexture("tex", 0);
			
		DGL.Texture.setActive(0, "texture");
			
		DGL.Mesh.draw("mesh");
	}
}
