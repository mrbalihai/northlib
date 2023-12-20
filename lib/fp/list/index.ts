import { SideEffect } from "..";

export type List<A> = Nil | Cons<A>;

export interface Nil {
  readonly _tag: 'Nil';
}
export interface Cons<A> {
  readonly _tag: 'Cons';
  readonly head: A;
  readonly tail: List<A>;
}

export const nil: List<never> = {
  _tag: 'Nil',
}

export const cons = <A>(head: A, tail: List<A>): List<A> =>
  ({
    _tag: 'Cons',
    head,
    tail,
  });

export const reduce = <A, B>(list: List<A>, reducer: (acc: B, a: A) => B, initialValue: B): B => {
  if (list._tag === 'Nil') return initialValue;
  const newAcc = reducer(initialValue, list.head);
  return reduce(list.tail, reducer, newAcc);
}

export const forEach = <A>(list: List<A>, action: SideEffect<A>): void => {
  if (list._tag === 'Nil') return;
  action(list.head);
  forEach(list.tail, action);
}

export const arrayToList = <A>(arr: A[], index = 0): List<A> => {
  if (index >= arr.length) return nil;
  return cons(arr[index], arrayToList(arr, index + 1));
};

