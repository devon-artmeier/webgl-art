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
out vec2 imgTopLeft;
out vec2 imgBtmRight;

uniform vec2 resolution;
uniform mat4 projection;
uniform mat4 model;
uniform vec2 tex2Size;

void main(void)
{
	fragCoord = vecFragCoord;
	texCoord = vecTexCoord;
	pixelCoord = fragCoord * resolution / 2.0;
	
	mat4 matrix = projection * model;
	imgTopLeft = (matrix * vec4(-tex2Size.x / 2.0, tex2Size.x / 2.0, 0, 1)).xy;
	imgBtmRight = (matrix * vec4(tex2Size.y / 2.0, -tex2Size.y / 2.0, 0, 1)).xy;

	gl_Position = vec4(vecFragCoord, 0, 1);
}
`;

const fragmentShader = 
`#version 300 es
precision highp float;

in vec2 fragCoord;
in vec2 texCoord;
in vec2 pixelCoord;
in vec2 imgTopLeft;
in vec2 imgBtmRight;

out vec4 fragColor;

uniform sampler2D tex1;
uniform sampler2D tex2;
uniform vec2 tex1Size;

${fragShaderLib}
	
void main(void)
{
	vec4 img = vec4(1, 1, 1, 1);
	vec4 color = vec4(hsvToRGB(vec3(time / 2.0, 0.5, 1)), 1);
	
	if ((fragCoord.x >= imgTopLeft.x && fragCoord.x <= imgBtmRight.x) &&
		(fragCoord.y >= imgTopLeft.y && fragCoord.y <= imgBtmRight.y)) {
		img = texture(tex2, vec2(
			(fragCoord.x - imgTopLeft.x) / (imgBtmRight.x - imgTopLeft.x),
			-(fragCoord.y - imgTopLeft.y) / (imgBtmRight.y - imgTopLeft.y)
		));
	}
	
	vec2 correct = resolution / tex1Size;
	vec2 t = (-correct / 2.0) + (texCoord * correct) + 0.5;
	
	float sinx = sinRange(radians((time * 50.0) + (pixelCoord.y * 2.0)) / 1.25, 1.00, 1.15);
	float siny = sinRange(radians((-time * 50.0) + (pixelCoord.y * 2.0)) * 2.0, 0.85, 1.15);
	float sinx2 = sinRange(radians((time * 50.0) + (pixelCoord.y * 4.0)), -0.05, 0.05) * (mod(floor(pixelCoord.y), 2.0) - 0.5);
	
	t.x = ((t.x * sinx) - (sinx / 2.0) - 0.5) + sinx2;
	t.y = (t.y * siny) - (siny / 2.0) - 0.5;
	
	fragColor = (texture(tex1, t) * color) / img;
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
	new Vertex([-1, -1], [0, 0]),
	new Vertex([ 1,  1], [1, 1]),
	new Vertex([ 1, -1], [1, 0]),
	new Vertex([ 1,  1], [1, 1]),
	new Vertex([-1, -1], [0, 0]),
	new Vertex([-1,  1], [0, 1])
];

function radians(angle: number): number
{
	return angle * (Math.PI / 180);
}

export class Canvas1 extends Canvas
{
	constructor(id: string)
	{
		super(id, [480, 480]);
		let canvas = this._glCanvas;

		canvas.createTexture("texture_bg");
		canvas.loadTextureImageFile("texture_bg", "./img/test.png");
		canvas.setTextureWrapS("texture_bg", DGL.TextureWrap.Mirror);
		canvas.setTextureWrapT("texture_bg", DGL.TextureWrap.Mirror);
		canvas.genTextureMipmaps("texture_bg");

		canvas.createTexture("texture_img");
		canvas.loadTextureImageFile("texture_img", "./img/test2.png");
		canvas.setTextureWrapS("texture_img", DGL.TextureWrap.Repeat);
		canvas.setTextureWrapT("texture_img", DGL.TextureWrap.Repeat);
		canvas.genTextureMipmaps("texture_img");

		canvas.createShader("shader", vertexShader, fragmentShader);

		canvas.createStaticMesh("mesh", imgVertices);
	}
	
	public update(time: number)
	{
		let canvas = this._glCanvas;

		let res = canvas.size;
		let tex1Size = canvas.getTextureSize("texture_bg");
		let tex2Size = canvas.getTextureSize("texture_img");
		
		let scale = ((Math.sin(radians(time / 15.0)) + 1) * 2) + 0.5;
		
		canvas.setViewport([0, 0], res);
		canvas.clear([0, 0, 0, 1]);
		
		let projection = DGL.Matrix.ortho([-res[0] / 2 , -res[1] / 2], res, [0, 1]);
		let model = DGL.Matrix.transform2D([0, 0], 0, [scale, scale]);

		canvas.setShaderVec2("shader", "resolution", res);
		canvas.setShaderFloat("shader", "time", time / 1000.0);
		
		canvas.setShaderMatrix4("shader", "projection", projection);
		canvas.setShaderMatrix4("shader", "model", model);
		
		canvas.setShaderTexture("shader", "tex1", "texture_bg", 0);
		canvas.setShaderTexture("shader", "tex2", "texture_img", 1);
		canvas.setShaderVec2("shader", "tex1Size", tex1Size);
		canvas.setShaderVec2("shader", "tex2Size", tex2Size);
		
		canvas.drawMesh("mesh", "shader");

		//canvas.delete();
	}
}
