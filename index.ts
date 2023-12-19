import { style, getFirstElementByTagName, getElementById } from './lib/dom';
import { map, nil } from './lib/fp';
import { glsl, getWebGLContext, node, render } from './lib/webgl2';

const main = () => {
  const setFullHeight = style({ margin: '0', width: '100%',
    height: '100%',
  });

  const canvas = getElementById<HTMLCanvasElement>('webglCanvas');
  const html = getFirstElementByTagName('html');
  const body = getFirstElementByTagName('body');
  setFullHeight(canvas);
  setFullHeight(html);
  setFullHeight(body);

  map(getWebGLContext(canvas), (gl) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const camera = node({
      attributes: {
      },
    });

    const scene = node({
      vertShader: glsl`
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0, 1);
        }
      `,
      fragShader: glsl`
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `,
      attributes: {
        positions: [
          0.0,  1.0,
          -1.0, -1.0,
          1.0, -1.0,
        ],
      },
      children: nil,
    });

    render(gl, scene);
  });
}

main();
