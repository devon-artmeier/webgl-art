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
	pixelCoord = fragCoord * resolution / 2.0;
	
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
	float segHeight = (30.0 / 256.0) * ((random() + 0.5) / 2.0);
	float segIntensity = sinRange(radians((time * 50.0) * 4.00), 0.0, 0.05);
	float fuzz = (random(pixelCoord.y + randomSeed) - 0.5) / 48.0;
	float xoff = ((step(mod(fragCoord.y + 1.0, segHeight * 2.0), segHeight) - 0.5) * segIntensity) + fuzz;
	
	vec4 color = vec4(hsvToRGB(vec3(
		(time / 4.0) + (fragCoord.y / 8.0) + (noise(texCoord, randomSeed) / 3.0),
		0.75,
		sin((fragCoord.y * 2.0) + time) + 2.0
	)), 1);
	
	fragColor = texture(tex, vec2(texCoord.x + xoff, texCoord.y)) / color;
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
	new Vertex([-0.5, -0.5], [0, 0]),
	new Vertex([ 0.5,  0.5], [1, 1]),
	new Vertex([ 0.5, -0.5], [1, 0]),
	new Vertex([ 0.5,  0.5], [1, 1]),
	new Vertex([-0.5, -0.5], [0, 0]),
	new Vertex([-0.5,  0.5], [0, 1])
];

export class Canvas2 extends Canvas
{
	constructor(id: string)
	{
		super(id, [480, 480]);
		
		DGL.Texture.create("texture");
		DGL.Texture.loadImageFile("texture", "./img/test.png");
		DGL.Texture.createMipmap("texture");
	
		DGL.Shader.create("shader", vertexShader, fragmentShader);

		DGL.Mesh.createStatic("mesh", imgVertices);
	}
	
	public update(time: number, frame: number)
	{
		let res = DGL.Context.getSize();
		
		DGL.Viewport.set([0, 0], res);
		DGL.Context.clear([0, 0, 0, 1]);
		
		let aspect = [res[0] / res[1], 1] as DGL.Vector2<number>;
		if (res[1] > res[0]) {
			aspect = [1, res[1] / res[0]];
		}
		
		let projection = DGL.Matrix.ortho([-aspect[0] / 2, -aspect[1] / 2], aspect, [0, 1]);
		
		DGL.Shader.bind("shader");
		
		DGL.Shader.setVec2("resolution", res);
		DGL.Shader.setFloat("time", time / 1000.0);
		DGL.Shader.setFloat("randomSeed", Math.random());
		
		DGL.Shader.setMatrix4("projection", projection);
		
		DGL.Shader.setTexture("tex", 0);
		DGL.Texture.setActive(0, "texture");
		
		DGL.Mesh.draw("mesh");
	}
}
