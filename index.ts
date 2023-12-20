import {
  style,
  getFirstElementByTagName,
  getElementById,
  addEventListener,
} from './lib/dom';
import { map, some } from './lib/fp/option';
import { cons, nil } from './lib/fp/list';
import { glsl, getWebGLContext, node, render, scaleCanvas } from './lib/webgl2';

const main = () => {
  const setFullHeight = style({
    margin: '0',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  });

  const canvas = getElementById<HTMLCanvasElement>('webglCanvas');
  const html = getFirstElementByTagName('html');
  const body = getFirstElementByTagName('body');
  setFullHeight(canvas);
  setFullHeight(html);
  setFullHeight(body);

  scaleCanvas(canvas, window.devicePixelRatio);
  const scaleCanvasListener = addEventListener('resize', () =>
    scaleCanvas(canvas, window.devicePixelRatio),
  );
  scaleCanvasListener(some(window));

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
        uniform vec4 color;
        void main() {
          fragColor = color;
        }
      `,
      attributes: {
        positions: [
          [0.0, 1.0, 0],
          [-1.0, -1.0, 0],
          [1.0, -1.0, 0],
        ],
      },
      uniforms: {
        color: [0.0, 1.0, 0.0, 1.0],
      },
      children: nil,
    });

    const camera = node({
      children: cons(triangle, nil),
    });
    const scene = node({ children: cons(camera, nil) });

    render(gl)(scene);
  });
};

main();
