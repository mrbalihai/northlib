import { SideEffect } from '../fp';
import { List, forEach, arrayToList } from '../fp/list';
import { Option, none, some, flatMap, map } from '../fp/option';
import { Mat4, Vec2, Vec3, Vec4 } from '../matrix';

export const UNIFORM_TYPE = {
  Mat4: 'Mat4',
  Mat3: 'Mat3',
  Vec4: 'Vec4',
  Vec3: 'Vec3',
  Vec2: 'Vec2',
  Int: 'Int',
  Float: 'Float',
  Boolean: 'Boolean',
} as const;

export const BUFFER_TYPE = {
  Vec3: 'Vec3',
  Vec2: 'Vec2',
  Float: 'Float',
} as const;

export type BufferType = typeof BUFFER_TYPE[keyof typeof BUFFER_TYPE];
export type UniformType = typeof UNIFORM_TYPE[keyof typeof UNIFORM_TYPE];

type AttributeDefinition = [string, BufferType] | [string, BufferType][];

export const isInterleavedAttribute = (a: AttributeDefinition): a is [string, BufferType][] =>
  Array.isArray(a[0]);

export const isNonInterleavedAttribute = (a: AttributeDefinition): a is [string, BufferType] =>
  !Array.isArray(a[0]);

interface ShaderProgram {
  program: WebGLProgram,
  attributeLocations: Record<string, number>;
  uniformLocations: Record<string, number>;
  uniformTypes: Record<string, UniformType>;
  attributeTypes: Record<string, AttributeDefinition>;
}

export type GetWebGLContext = (
  canvas: Option<HTMLCanvasElement>,
) => Option<WebGL2RenderingContext>;

export type CreateProgram = (props: {
  vert: string,
  frag: string,
  uniforms: Record<string, UniformType>,
  attributes: Record<string, AttributeDefinition>,
}) => (gl: WebGL2RenderingContext) => Option<ShaderProgram>;

// To facilitate syntax highlighting
export const glsl = (shader: TemplateStringsArray) =>
  `#version 300 es\n${shader}`;

type UniformValue =
  | number
  | boolean
  | number[]
  | Mat4
  | Vec2
  | Vec3
  | Vec4
  | Float32Array;

type AttributeValue = number[];

interface NodeProps {
  shader: Option<ShaderProgram>;
  attributes?: { [key: string]: AttributeValue };
  uniforms?: { [key: string]: UniformValue };
  children: List<Node>;
  count?: number;
}

interface Node {
  props: NodeProps;
}

export const getWebGLContext: GetWebGLContext = (
  canvas: Option<HTMLCanvasElement>,
) =>
  flatMap(canvas, (el) => {
    const ctx = el.getContext('webgl2');
    return ctx
      ? some(ctx)
      : (console.error('unable to get webgl2 context'), none);
  });

export const scaleCanvas = (
  canvasOption: Option<HTMLCanvasElement>,
  devicePixelRatio: number = window.devicePixelRatio,
) =>
  map(canvasOption, (canvas) => {
    const displayWidth = Math.floor(canvas.clientWidth * devicePixelRatio);
    const displayHeight = Math.floor(canvas.clientHeight * devicePixelRatio);
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
    return canvas;
  });

export const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): Option<WebGLShader> => {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Invalid shader type:', type);
    return none;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      'Error compiling shader:',
      gl.getShaderInfoLog(shader),
      source,
    );
    gl.deleteShader(shader);
    return none;
  }

  return some(shader);
};

export const createProgram: CreateProgram =
  ({
    vert,
    frag,
    uniforms,
    attributes,
  }) => (gl) =>
    flatMap(
      compileShader(gl, gl.VERTEX_SHADER, vert),
      (vertexShader) =>
        flatMap(
          compileShader(gl, gl.FRAGMENT_SHADER, frag),
          (fragmentShader) => {
            const program = gl.createProgram();
            if (!program) return none;

            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
              console.error(
                'Error initializing shader program:',
                gl.getProgramInfoLog(program),
              );
              return none;
            }

            const attributeLocations = Object.keys(attributes)
              .reduce((a, b) => {
                const attr = attributes[b];
                if (isInterleavedAttribute(attr)) {
                  return {
                    ...a,
                    ...attr.reduce((c, d) => ({
                      ...c,
                      [d[0]]: gl.getAttribLocation(d[0], b),
                    }), {}),
                  };
                } else {
                  return {
                    ...a,
                    [b]: gl.getAttribLocation(program, attributes[b][0] as string),
                  };
                }
              }, {});

            const uniformLocations = Object.keys(uniforms)
              .reduce((a, b) => ({
                ...a,
                [b]: gl.getUniformLocation(program, b),
              }), {});

            return some({
              program,
              attributeLocations,
              uniformLocations,
              uniformTypes: uniforms,
              attributeTypes: attributes,
            });
          },
        ),
    );

const setupAttribute = (
  gl: WebGL2RenderingContext,
  shaderProgram: Option<ShaderProgram>,
  name: string,
  values: AttributeValue,
): Option<WebGLProgram> => {
  map(shaderProgram, (program) => {
    const location = program.attributeLocations[name];
    const definition = program.attributeTypes[name];

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);

    // TODO: enumerate interleaved attributes
    // TODO: get length from the attribute type

    const length = Array.isArray(values[0]) ? values[0].length : 1;
    gl.vertexAttribPointer(location, length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
  });
  return some(gl);
};

const setupAttributes = (
  gl: WebGL2RenderingContext,
  shaderProgram: Option<ShaderProgram>,
  attributes: { [key: string]: AttributeValue },
): Option<WebGLProgram> => {
  forEach<[string, AttributeValue]>(
    arrayToList(Object.entries(attributes)),
    ([name, values]) => setupAttribute(gl, shaderProgram, name, values),
  );
  return shaderProgram;
};

const setupUniform = (
  gl: WebGL2RenderingContext,
  shaderProgram: Option<ShaderProgram>,
  name: string,
  value: UniformValue,
): Option<WebGLProgram> => {
  map(shaderProgram, (shader) => {
    const location = shader.uniformLocations[name];
    const type = shader.uniformTypes[name];
    if (location === null || type === null) return none;
    switch (type) {
    case 'Int':
      gl.uniform1i(location, value as number);
      break;
    case 'Float':
      gl.uniform1f(location, value as number);
      break;
    case 'Boolean':
      gl.uniform1i(location, value ? 1 : 0);
      break;
    case 'Vec2':
      gl.uniform2fv(location, value as number[]);
      break;
    case 'Vec3':
      gl.uniform3fv(location, value as number[]);
      break;
    case 'Vec4':
      gl.uniform4fv(location, value as number[]);
      break;
    case 'Mat3':
      gl.uniformMatrix3fv(location, false, value as number[]);
      break;
    case 'Mat4':
      gl.uniformMatrix4fv(location, false, value as number[]);
      break;
    default:
      console.warn(`Unhandled uniform '${name}' of type '${type}' and value: '${value}'`);
      return none;
    }
  });
  return shaderProgram;
};

const setupUniforms = (
  gl: WebGL2RenderingContext,
  shaderProgram: Option<ShaderProgram>,
  uniforms: { [key: string]: UniformValue },
): Option<WebGLProgram> => {
  forEach<[string, UniformValue]>(
    arrayToList(Object.entries(uniforms)),
    ([name, value]) => setupUniform(gl, shaderProgram, name, value),
  );
  return some(shaderProgram);
};

export const node = (props: NodeProps): Node => ({ props });

export const createRenderer = (
  gl: WebGL2RenderingContext,
): SideEffect<Node> => {

  // Recursively render node and its children
  const render = (node: Node) => {
    const { shader, attributes, uniforms, children, count } = node.props;

    // TODO: apply cache from closure, don't switch shader if already switched
    // to it and don't bind data to unchanged attributes or uniforms.
    // This could be implemented by detecting changes in the state tree, i'd
    // need to create a way of mutating data within the state tree that manages
    // this
    map(shader, (a) => {
      gl.useProgram(a.program);
      if (attributes) setupAttributes(gl, shader, attributes);
      if (uniforms) setupUniforms(gl, shader, uniforms);
      gl.drawArrays(gl.TRIANGLES, 0, count || 0);
    });
    if (children) forEach(children, render);
  };
  return render;
};
