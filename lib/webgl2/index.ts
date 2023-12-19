import { SideEffect } from "../fp";
import { List, forEach } from "../fp/list";
import { Option, none, some, chain, flatMap } from '../fp/option';

export type GetWebGLContext = (canvas: Option<HTMLCanvasElement>) => Option<WebGL2RenderingContext>;

// To facilitate syntax highlighting
export const glsl = String.raw;

export const getWebGLContext: GetWebGLContext = (canvas: Option<HTMLCanvasElement>) =>
  flatMap(canvas, el => {
    const ctx = el.getContext('webgl2');
    return ctx ? some(ctx) : none;
  });

type UniformValue = number | boolean | number[] | Float32Array;

interface NodeProps {
  fragShader?: string,
  vertShader?: string,
  attributes?: { [key: string]: number[] },
  uniforms?: { [key: string]: UniformValue },
  children: List<Node>;
}

interface Node {
  props: NodeProps
};

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string): Option<WebGLShader> => {
  const shader = gl.createShader(type);
  if (!shader) return none;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return none;
  }

  return some(shader);
};

const createShaderProgram = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): Option<WebGLProgram> => {
  return flatMap(compileShader(gl, gl.VERTEX_SHADER, vertexSource), vertexShader =>
    flatMap(compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource), fragmentShader => {
      const program = gl.createProgram();
      if (!program) return none;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error initializing shader program:', gl.getProgramInfoLog(program));
        return none;
      }

      return some(program);
    })
  );
};

const setupAttribute = (gl: WebGL2RenderingContext, shaderProgram: WebGLProgram, name: string, values: number[]): Option<WebGL2RenderingContext> => {
  const location = gl.getAttribLocation(shaderProgram, name);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
  gl.vertexAttribPointer(location, values.length, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(location);
  return some(gl);
};

const setupAttributes = (gl: WebGL2RenderingContext, shaderProgram: WebGLProgram, attributes: { [key: string]: number[] }): Option<WebGL2RenderingContext> => {
  let result = some(gl);
  for (const [name, value] of Object.entries(attributes)) {
    result = flatMap(result, gl => setupAttribute(gl, shaderProgram, name, value));
  }
  return result;
};

const setupUniform = (gl: WebGL2RenderingContext, shaderProgram: WebGLProgram, name: string, value: UniformValue): Option<WebGL2RenderingContext> => {
  const location = gl.getUniformLocation(shaderProgram, name);
  if (location === null) return none;
  if (typeof value === 'number') {
    gl.uniform1f(location, value); // Single float
  } else if (typeof value === 'number' && Number.isInteger(value)) {
    gl.uniform1i(location, value); // Single integer
  } else if (typeof value === 'boolean') {
    gl.uniform1i(location, value ? 1 : 0); // Boolean (booleans are treated as integers in GLSL)
  } else if (Array.isArray(value)) {
    switch (value.length) {
      case 2:
        gl.uniform2fv(location, value); // Vector of 2 floats
        break;
      case 3:
        gl.uniform3fv(location, value); // Vector of 3 floats
        break;
      case 4:
        gl.uniform4fv(location, value); // Vector of 4 floats
        break;
      case 9:
        gl.uniformMatrix3fv(location, false, value); // 3x3 matrix
        break;
      case 16:
        gl.uniformMatrix4fv(location, false, value); // 4x4 matrix
        break;
      default:
        console.warn(`Unhandled uniform array length: ${value.length}`);
        return none;
    }
  } else {
    console.warn(`Unhandled uniform type: ${typeof value}`);
    return none;
  }

  return some(gl);
};

const setupUniforms = (gl: WebGL2RenderingContext, shaderProgram: WebGLProgram, uniforms: { [key: string]: UniformValue }): Option<WebGL2RenderingContext> => {
  let result = some(gl);
  for (const [name, value] of Object.entries(uniforms)) {
    result = flatMap(result, gl => setupUniform(gl, shaderProgram, name, value));
  }
  return result;
};


export const node = (props: NodeProps): Node => ({ props });

const render = (gl: WebGL2RenderingContext, parentNode?: Node): SideEffect<Node> => {
  const { attributes: parentAttributes, uniforms: parentUniforms } = parentNode?.props ?? {};
  return (node: Node) => {
    const { fragShader, vertShader, attributes, uniforms, children } = node.props;
    const renderSequence = chain(
      () => vertShader && fragShader ? createShaderProgram(gl, vertShader, fragShader) : none,
      (shaderProgram) => {
        gl.useProgram(shaderProgram);
        return some(shaderProgram);
      },
      (shaderProgram) => setupAttributes(gl, shaderProgram, { ...parentAttributes, ...attributes }),
      (shaderProgram) => setupUniforms(gl, shaderProgram, { ...parentUniforms, ...uniforms }),
      (shaderProgram) => {
       //TODO: Simplified draw call, expand for other cases, count etc...
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.useProgram(null);
        return some(shaderProgram);
      }
    );
    chain(
      () => renderSequence(gl),
      () => (forEach(children, render(gl, node)), none),
    )(none);
  };
};