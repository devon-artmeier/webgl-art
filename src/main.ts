import * as DGL from "devon-webgl"
import { Canvas } from "./core/canvas"
import { Canvas1 } from "./canvas-1"
import { Canvas2 } from "./canvas-2"
import { Canvas3 } from "./canvas-3"

let frame = 0;
let canvas1 = new Canvas1("test-canvas");
let canvas2 = new Canvas2("test-canvas-2");
let canvas3 = new Canvas3("test-canvas-3");

document.getElementById("bad-apple").onclick = function ()
{
	canvas3.video.play();
}

function render(time: number)
{
	Canvas.update(time, frame++);
	requestAnimationFrame(render);
}
requestAnimationFrame(render);