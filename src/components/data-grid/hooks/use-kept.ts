import { useState } from 'react';

/**
 * The value of an earlier render for as long as `same` says the new one is the same: a value built
 * again in every render (an object written in the JSX, a list a function makes) keeps its identity
 * while it says the same, so what depends on its identity is not done again. The new value is kept
 * the first time it is not the same, in this render and not after it, as the grid keeps its labels.
 */
export function useKept<T>(value: T, same: (kept: T, next: T) => boolean): T {
  const [kept, keep] = useState(value);
  if (kept === value || same(kept, value)) return kept;
  keep(value);
  return value;
}

/** Whether two lists hold the same items in the same order. */
export function sameList<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
}

/** Whether two lists hold the same items, in any order. */
export function sameMembers<T>(a: readonly T[], b: readonly T[]): boolean {
  return (
    a.length === b.length &&
    a.every((item) => b.includes(item)) &&
    b.every((item) => a.includes(item))
  );
}
