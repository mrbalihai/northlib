import {
  style,
  getFirstElementByTagName,
  getElementById,
  addEventListener,
} from './lib/dom';
import { map, some } from './lib/fp/option';
import { cons, nil } from './lib/fp/list';
import { glsl, getWebGLContext, node, createRenderer, scaleCanvas, UNIFORM_TYPE, ATTRIBUTE_TYPE, createProgram } from './lib/webgl2';
import { Mat4, Vec3, Vec4, mat4 } from './lib/matrix';

interface CameraProps {
  near?: number,
  far?: number,
  aspect: number,
  fov?: number,
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
    const shader = createProgram({
      vert: glsl`
        in vec3 positions;
        in float faceIds;
        uniform mat4 projection;
        uniform mat4 transform;
        uniform mat4 view;
        out float vFaceId;
        void main() {
          gl_Position = projection * view * transform * vec4(positions, 1.0);
          vFaceId = faceIds;
        }
      `,
      frag: glsl`
        precision highp float;
        in float vFaceId;
        out vec4 fragColor;
        uniform vec4 color;
        void main() {
          if (vFaceId == 0.0) {
            fragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red
          } else if (vFaceId == 1.0) {
            fragColor = vec4(0.0, 1.0, 0.0, 1.0); // Green
          } else if (vFaceId == 2.0) {
            fragColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue
          } else if (vFaceId == 3.0) {
            fragColor = vec4(1.0, 1.0, 0.0, 1.0); // Yellow
          } else if (vFaceId == 4.0) {
            fragColor = vec4(0.0, 1.0, 1.0, 1.0); // Cyan
          } else if (vFaceId == 5.0) {
            fragColor = vec4(1.0, 0.0, 1.0, 1.0); // Magenta
          } else {
            fragColor = vec4(1.0, 1.0, 1.0, 1.0); // White for any other case
          }
        }
      `,
      uniforms: {
        projection: UNIFORM_TYPE.Mat4,
        transform: UNIFORM_TYPE.Mat4,
        view: UNIFORM_TYPE.Mat4,
        color: UNIFORM_TYPE.Vec4,
      },
      attributes: {
        positions: ATTRIBUTE_TYPE.Vec3,
        faceIds: ATTRIBUTE_TYPE.Float,
      },
    })(gl);

    const cube = node({
      shader,
      attributes: {
        positions: [
          [-1.0, -1.0, 1.0],
          [1.0, -1.0, 1.0],
          [1.0, 1.0, 1.0],
          [-1.0, 1.0, 1.0],

          [-1.0, -1.0, -1.0],
          [1.0, -1.0, -1.0],
          [1.0, 1.0, -1.0],
          [-1.0, 1.0, -1.0],

          [-1.0, 1.0, 1.0],
          [1.0, 1.0, 1.0],
          [1.0, 1.0, -1.0],
          [-1.0, 1.0, -1.0],

          [-1.0, -1.0, 1.0],
          [1.0, -1.0, 1.0],
          [1.0, -1.0, -1.0],
          [-1.0, -1.0, -1.0],

          [-1.0, -1.0, 1.0],
          [-1.0, 1.0, 1.0],
          [-1.0, 1.0, -1.0],
          [-1.0, -1.0, -1.0],

          [1.0, -1.0, 1.0],
          [1.0, 1.0, 1.0],
          [1.0, 1.0, -1.0],
          [1.0, -1.0, -1.0],
        ] as Vec3[],
        faceIds: [
          0, 0, 0, 0,
          1, 1, 1, 1,
          2, 2, 2, 2,
          3, 3, 3, 3,
          4, 4, 4, 4,
          5, 5, 5, 5,
        ],
      },
      uniforms: {
        color: [0.0, 1.0, 0.0, 1.0] as Vec4,
        transform: mat4.translate(mat4.scale(mat4.identity(), -0.5, -0.5, -0.5), -0.5, -0.5, -0.5),
      },
      count: 24,
      children: nil,
    });

    const pyramid = node({
      shader,
      attributes: {
        positions: [
          [-1, 0, -1],
          [1, 0, -1],
          [1, 0, 1],
          [-1, 0, 1],
          [0, 1, 0],
        ] as Vec3[],
      },
      uniforms: {
        color: [1.0, 0.0, 0.0, 1.0] as Vec4,
        transform: mat4.translate(mat4.scale(mat4.identity(), -0.5, -0.5, -0.5), 0.5, 0.5, 0.5),
      },
      count: 5,
      children: nil,
    });

    const createCamera = (props: CameraProps) => {
      const {
        near = 0.1,
        far = 10.0,
        aspect,
        fov =  45 * Math.PI / 180,
      } = props;
      const projection: Mat4 = mat4.perspectiveProjection(aspect, fov, near, far);
      const view: Mat4 = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0]);
      return node({
        shader,
        uniforms: {
          projection,
          view,
        },
        children: cons(cube, nil),
      });
    };

    const camera = createCamera({ aspect: gl.canvas.width / gl.canvas.height });
    const scene = node({
      shader,
      children: cons(camera, nil),
    });
    const render = createRenderer(gl);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    render(scene);

  });
};

main();
