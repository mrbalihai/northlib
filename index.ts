import {
  style,
  getFirstElementByTagName,
  getElementById,
  addEventListener,
} from './lib/dom';
import { map, some } from './lib/fp/option';
import { cons, nil } from './lib/fp/list';
import { glsl, getWebGLContext, node, render, scaleCanvas } from './lib/webgl2';
import { Mat4, Vec3, Vec4 } from './lib/matrix';


interface CameraProps {
  isOrthographic?: boolean;
  width?: number;
  height?: number;
  depth?: number
  near?: number,
  far?: number,
  aspect?: number,
  fov?: number, //radians
}

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

    const cube = node({
      vertShader: glsl`
        in vec3 positions;
        uniform mat4 perspective;
        void main() {
          gl_Position = perspective * vec4(positions, 1.0);
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
          [-1.0, -1.0, 1.0],
          [1.0, -1.0, 1.0],
          [1.0, 1.0, 1.0],
          [-1.0, 1.0, 1.0],

          [-1.0, -1.0, -1.0],
          [-1.0, 1.0, -1.0],
          [1.0, 1.0, -1.0],
          [1.0, -1.0, -1.0],

          [-1.0, 1.0, -1.0],
          [-1.0, 1.0, 1.0],
          [1.0, 1.0, 1.0],
          [1.0, 1.0, -1.0],

          [-1.0, -1.0, -1.0],
          [1.0, -1.0, -1.0],
          [1.0, -1.0, 1.0],
          [-1.0, -1.0, 1.0],

          [1.0, -1.0, -1.0],
          [1.0, 1.0, -1.0],
          [1.0, 1.0, 1.0],
          [1.0, -1.0, 1.0],

          [-1.0, -1.0, -1.0],
          [-1.0, -1.0, 1.0],
          [-1.0, 1.0, 1.0],
          [-1.0, 1.0, -1.0],
        ] as Vec3[],
      },
      uniforms: {
        color: [0.0, 1.0, 0.0, 1.0] as Vec4,
      },
      count: 4 * 6,
      children: nil,
    });

    const createCamera = (props: CameraProps) => {
      const {
        isOrthographic = false,
        width: w = 0,
        height: h = 0,
        depth: d = 0,
        near: n = 10,
        far = 50,
        aspect: a = 0,
        fov = 50,
      } = props;
      const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
      const r = 1.0 / (n - far);
      const projection: Mat4 = isOrthographic
        ? [
           2/w, 0,   0,   0,
           0,  -2/h, 0,   0,
           0,   0,   2/d, 0,
          -1,   1,   0,   1,
        ]
        : [
          f/a, 0, 0,        0,
          0,   f, 0,        0,
          0,   0, (n+f)*r, -1,
          0,   0, n*f*r*2,  0
        ];

      return node({
        uniforms: {
          projection
        },
        children: cons(cube, nil),
      });
    }
    const scene = node({ children: cons(createCamera({ aspect: gl.canvas.width / gl.canvas.height }), nil) });

    render(gl)(scene);
  });
};

main();
