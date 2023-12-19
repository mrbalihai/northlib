export type Either<A, B> = Left<A> | Right<B>;

export interface Left<A> {
  readonly _tag: 'Left';
  readonly left: A
}
export interface Right<A> {
  readonly _tag: 'Right';
  readonly right: A
}

export const isLeft = <A, B>(a: Either<A, B>): a is Left<A> =>
  a._tag === 'Left';

export const left = <A, B = never>(a: A): Either<A, B> =>
  ({
    _tag: 'Left',
    left: a,
  });

export const right = <A, B = never>(a: A): Either<B, A> =>
  ({
    _tag: 'Right',
    right: a,
  });

