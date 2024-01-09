export const fragShaderLib = 
`uniform vec2 resolution;
uniform float time;
uniform float frame;
uniform float randomSeed;

// Pi
#define PI 3.1415926535897932384626433832795

// RGB color to HSV color
vec3 rgbToHSV(vec3 c)
{
	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV color to RGB color
vec3 hsvToRGB(vec3 c)
{
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Get sine of angle shifted into range
float sinRange(float a, float min, float max)
{
	float mult = abs(max - min) / 2.0;
	return (sin(a) * mult) + abs(max - mult);	
}

// Get cosine of angle shifted into range
float cosRange(float a, float min, float max)
{
	float mult = abs(max - min) / 2.0;
	return (cos(a) * mult) + abs(max - mult);	
}

// Get noise value (randomized)
float noise(vec2 coord, float seed)
{
	return fract(sin(dot(coord + seed, vec2(12.9898, 78.233))) * 43758.5453) * (1.0 / 0.9999);
}

// Get noise value
float noise(vec2 coord)
{
	return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453) * (1.0 / 0.9999);
}

// Get random value
float random()
{
	return noise(vec2(randomSeed));
}

// Get random value
float random(float seed)
{
	return noise(vec2(seed));
}
`;