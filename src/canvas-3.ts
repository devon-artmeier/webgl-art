import * as DGL from "devon-webgl"
import { Canvas } from "./core/canvas"
import { fragShaderLib } from "./core/fragment-shader-lib"

const vertexShader =
`#version 300 es

layout (location = 0) in vec2 vecFragCoord;
layout (location = 1) in vec2 vecTexCoord;

out vec2 fragCoord;
out vec2 texCoord;
out vec2 pixelCoord;

uniform vec2 resolution;
uniform mat4 projection;

void main(void)
{
	fragCoord = vecFragCoord;
	texCoord = vecTexCoord;
	pixelCoord = floor(vecTexCoord * resolution);
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

float getNeighbor(int x, int y, float xoff, float yoff, mat3 sobel)
{
	vec2 coord = vec2(pixelCoord.x + float(x) + xoff, pixelCoord.y + float(y) + yoff) / resolution;
	vec4 pixel = texture(tex, coord) * sobel[x + 1][y + 1];
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
	
	float c = clamp(sqrt((sx * sx) + (sy * sy)), 0.0, 1.0);
	if (c <= 32.0 / 255.0) c = 0.0;
	return c;
}

vec4 mixColor(vec4 c1, vec4 c2)
{
	vec4 c = vec4(c1.r + c2.r, c1.g - c2.r, c1.b - c2.r, 1);
	c = vec4(c.r - c2.g, c.g + c2.g, c.b - c2.g, 1);
	c = vec4(c.r - c2.b, c.g - c2.b, c.b + c2.b, 1);
	return clamp(c, 0.0, 1.0);
}

void main(void)
{
	float d = 4.0;

	float cr = sobel(-d, 0.0);
	float cg = sobel(0.0, 0.0);
	float cb = sobel(d, 0.0);
	
	vec4 baseColor = texture(tex, texCoord);
	vec4 color = vec4(cr, cg, cb, 1);
	
	vec4 hue = vec4(hsvToRGB(vec3(
		(time / 4.0) + (fragCoord.y / 512.0) + (noise(texCoord, randomSeed) / 2.0),
		2.0, 2.0
	)) * noise(texCoord, randomSeed), 1);
	
	fragColor = (baseColor * hue) + color;
}
`

const vertexShaderCube =
`#version 300 es

layout (location = 0) in vec3 vecFragCoord;
layout (location = 1) in vec2 vecTexCoord;

out vec2 texCoord;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

void main(void)
{
	texCoord = vecTexCoord;
	gl_Position = projection * view * model * vec4(vecFragCoord, 1);
}
`;

const fragmentShaderCube = 
`#version 300 es
precision highp float;

in vec2 texCoord;

out vec4 fragColor;

uniform sampler2D tex;

void main(void)
{
	fragColor = texture(tex, texCoord);
}
`

class Vertex2D extends DGL.Vertex
{
	constructor(public coord: DGL.Vector2<number>,
		public tex: DGL.Vector2<number>) { super(); }

	public getData(): readonly number[][]
	{
		return [this.coord, this.tex];
	}
}

class Vertex3D extends DGL.Vertex
{
	constructor(public coord: DGL.Vector3<number>,
		public tex: DGL.Vector2<number>) { super(); }

	public getData(): readonly number[][]
	{
		return [this.coord, this.tex];
	}
}

const imgVertices = [
	new Vertex2D([0, 0], [0, 0]),
	new Vertex2D([0, 0], [1, 1]),
	new Vertex2D([0, 0], [1, 0]),
	new Vertex2D([0, 0], [1, 1]),
	new Vertex2D([0, 0], [0, 0]),
	new Vertex2D([0, 0], [0, 1])
];

const cubeVertices = [
	new Vertex3D([-1, -1, -1],  [0, 0]),
	new Vertex3D([ 1,  1, -1],  [1, 1]),
	new Vertex3D([ 1, -1, -1],  [1, 0]),
	new Vertex3D([-1,  1, -1],  [0, 1]),
	 
	new Vertex3D([-1, -1,  1],  [0, 0]),
	new Vertex3D([ 1, -1,  1],  [1, 0]),
	new Vertex3D([ 1,  1,  1],  [1, 1]),
	new Vertex3D([-1,  1,  1],  [0, 1]),
	
	new Vertex3D([-1,  1,  1],  [1, 0]),
	new Vertex3D([-1,  1, -1],  [1, 1]),
	new Vertex3D([-1, -1, -1],  [0, 1]),
	new Vertex3D([-1, -1,  1],  [0, 0]),
	
	new Vertex3D([ 1,  1,  1],  [1, 0]),
	new Vertex3D([ 1, -1, -1],  [0, 1]),
	new Vertex3D([ 1,  1, -1],  [1, 1]),
	new Vertex3D([ 1, -1,  1],  [0, 0]),
	 
	new Vertex3D([-1, -1, -1],  [0, 1]),
	new Vertex3D([ 1, -1, -1],  [1, 1]),
	new Vertex3D([ 1, -1,  1],  [1, 0]),
	new Vertex3D([-1, -1,  1],  [0, 0]),
	 
	new Vertex3D([-1,  1, -1],  [0, 1]),
	new Vertex3D([ 1,  1,  1],  [1, 0]),
	new Vertex3D([ 1,  1, -1],  [1, 1]),
	new Vertex3D([-1,  1,  1],  [0, 0])
];

const cubeElements = [
	0,  1,  2,  1,  0,  3,
	4,  5,  6,  6,  7,  4,
	8,  9,  10, 10, 11, 8,
	12, 13, 14, 13, 12, 15,
	16, 17, 18, 18, 19, 16,
	20, 21, 22, 21, 20, 23
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
		DGL.Shader.create("shader_cube", vertexShaderCube, fragmentShaderCube);
		DGL.Mesh.createDynamic("mesh");
		DGL.Mesh.createStatic("mesh_cube", cubeVertices, cubeElements);
		
		this.video = document.createElement("video");
		this.video.playsInline = true;
		this.video.loop = true;
		this.video.width = 10;
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

	private radians(angle: number): number
	{
		return angle * (Math.PI / 180);
	}
	
	public update(time: number, frame: number)
	{
		DGL.Depth.disable();

		let res = DGL.Context.getSize();
		let textureSize = DGL.Texture.getSize("texture");
		
		DGL.Viewport.set([0, 0], res);
		DGL.Context.clear([0, 0, 0, 1]);
		
		this.updateMesh();
			
		let aspect = [textureSize[1] * (res[0] / res[1]), textureSize[1]] as DGL.Vector2<number>;
		if (res[1] > res[0]) {
			aspect = [textureSize[0], textureSize[0] * (res[1] / res[0])];
		}
		
		let projection = DGL.Matrix.ortho([-aspect[0] / 2, -aspect[1] / 2], aspect, [0, 1000]);
			
		DGL.Shader.bind("shader");
			
		DGL.Shader.setVec2("resolution", aspect);
		DGL.Shader.setFloat("time", time / 1000.0);
		DGL.Shader.setFloat("randomSeed", Math.random())
		
		DGL.Shader.setMatrix4("projection", projection);
		
		DGL.Shader.setTexture("tex", 0);
		DGL.Texture.setActive(0, "texture");
			
		DGL.Mesh.draw("mesh");
		
		if (this._videoReady) {
			let angle = this.radians(time / 25);
			let sin = Math.sin(angle) * 12;
			let sin2 = Math.sin(angle * 2) * 12;
			let cos = Math.cos(angle) * 12;

			DGL.Depth.enable();
			DGL.Depth.setFunction(DGL.Depth.LessEqual);

			projection = DGL.Matrix.perspective(60, res, [0.1, 1000]);
			let view = DGL.Matrix.view3D([cos, sin2, sin], [0, 0, 0], [0, 1, 0]);
			
			DGL.Shader.bind("shader_cube");
			
			DGL.Shader.setMatrix4("projection", projection);
			DGL.Shader.setMatrix4("view", view);
			
			DGL.Shader.setTexture("tex", 0);
			DGL.Texture.setActive(0, "texture");

			let cubes = [
				[-6, -6, -6],
				[ 6, -6, -6],
				[-6, -6,  6],
				[ 6, -6,  6],
				[-6,  6, -6],
				[ 6,  6, -6],
				[-6,  6,  6],
				[ 6,  6,  6],
			] as DGL.Vector3<number>[];

			for (const cube of cubes) {
				let model = DGL.Matrix.transform3D(cube, [angle * 4, angle * 4, angle * 4], [1, 1, 1]);
				DGL.Shader.setMatrix4("model", model);
				DGL.Mesh.draw("mesh_cube");
			}
		}
	}
}
