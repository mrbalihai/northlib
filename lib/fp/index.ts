export type Compose = <A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B,
) => (a: A) => C;
export type SideEffect<A = null> = (a: A) => void;

export const compose: Compose = (f, g) => a => f(g(a));
