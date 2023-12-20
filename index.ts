import {
  style,
  getFirstElementByTagName,
  getElementById,
  addEventListener,
} from './lib/dom';
import { map } from './lib/fp/option';
import { cons, nil } from './lib/fp/list';
import { glsl, getWebGLContext, node, render } from './lib/webgl2';

function scaleCanvasResolution(
  canvas: HTMLCanvasElement,
  devicePixelRatio: number = window.devicePixelRatio,
) {
  const displayWidth = Math.floor(canvas.clientWidth * devicePixelRatio);
  const displayHeight = Math.floor(canvas.clientHeight * devicePixelRatio);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

const main = () => {
  const setFullHeight = style({
    margin: '0',
    width: '100%',
    height: '100%',
  });

  const canvas = getElementById<HTMLCanvasElement>('webglCanvas');
  const html = getFirstElementByTagName('html');
  const body = getFirstElementByTagName('body');
  addEventListener('resize', map(canvas, scaleCanvasResolution));
  setFullHeight(canvas);
  setFullHeight(html);
  setFullHeight(body);

  map(getWebGLContext(canvas), (gl) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const triangle = node({
      vertShader: glsl`
        in vec2 positions;
        void main() {
          gl_Position = vec4(positions, 0, 1);
        }
      `,
      fragShader: glsl`
        precision highp float;
        out vec4 fragColor;
        void main() {
          fragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `,
      attributes: {
        positions: [
          [0.0, 1.0],
          [-1.0, -1.0],
          [1.0, -1.0],
        ],
      },
      children: nil,
    });

    const camera = node({ children: cons(triangle, nil) });
    const scene = node({ children: cons(camera, nil) });

    render(gl)(scene);
  });
};

main();
