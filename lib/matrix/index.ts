export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
]

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export const mat4 = {

  identity: (): Mat4 => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ],

  translate: (matrix: Mat4, x: number, y: number, z: number): Mat4 => {
    matrix[12] += x;
    matrix[13] += y;
    matrix[14] += z;
    return matrix;
  },

  scale: (matrix: Mat4, x: number, y: number, z: number): Mat4 => {
    matrix[0] *= x;
    matrix[5] *= y;
    matrix[10] *= z;
    return matrix;
  },

  perspectiveProjection: (
    aspect: number, // canvas.width / canvas.height
    fov: number = Math.PI / 4,
    near: number = 0.1,
    far: number = 100.0,
  ): Mat4 => {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0,
    ];
  },

  orthographicProjection: (
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number = 0.1,
    far: number = 100.0,
  ): Mat4 => {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    return [
      -2 * lr, 0, 0, 0,
      0, -2 * bt, 0, 0,
      0, 0, 2 * nf, 0,

      (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
    ];
  },

  lookAt: (eye: Vec3, center: Vec3, up: Vec3): Mat4 => {
    const z = [eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]];

    const lengthZ = Math.sqrt(z[0] * z[0] + z[1] * z[1] + z[2] * z[2]);
    if (lengthZ !== 0) {
      z[0] /= lengthZ;
      z[1] /= lengthZ;
      z[2] /= lengthZ;
    }

    const x = [
      up[1] * z[2] - up[2] * z[1],
      up[2] * z[0] - up[0] * z[2],
      up[0] * z[1] - up[1] * z[0],
    ];
    const lengthX = Math.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2]);
    if (lengthX !== 0) {
      x[0] /= lengthX; x[1] /= lengthX; x[2] /= lengthX;
    }

    const y = [
      z[1] * x[2] - z[2] * x[1],
      z[2] * x[0] - z[0] * x[2],
      z[0] * x[1] - z[1] * x[0],
    ];

    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
      -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
      -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
      1,
    ];
  },

};
