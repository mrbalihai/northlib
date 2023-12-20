export type Option<A> = Some<A> | None;
export type Map = <A, B>(option: Option<A>, f: (a: A) => B) => Option<B>;
export type FlatMap = <A, B>(
  option: Option<A>,
  f: (a: A) => Option<B>,
) => Option<B>;

export interface Some<A> {
  readonly _tag: 'Some';
  readonly value: A;
}
export interface None {
  readonly _tag: 'None';
}

export const none: Option<never> = {
  _tag: 'None',
};

export const isNone = <A>(a: Option<A>): a is None => a._tag === 'None';

export const some = <A>(a: A): Option<A> => ({
  _tag: 'Some',
  value: a,
});

export const map: Map = (a, f) => (isNone(a) ? none : some(f(a.value)));

export const flatMap: FlatMap = (a, f) => (isNone(a) ? none : f(a.value));

export const chain =
  <A>(...operations: ((input: A) => Option<A>)[]): ((input: A) => Option<A>) =>
  (input: A) =>
    operations.reduce(
      (acc: Option<A>, operation: (input: A) => Option<A>) =>
        flatMap(acc, operation),
      some(input),
    );
