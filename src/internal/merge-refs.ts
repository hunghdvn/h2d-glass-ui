import type { Ref, RefCallback } from 'react';
import { IS_REACT_19 } from './react-version';

/**
 * Combines several refs into one callback ref. On React 19 it returns a cleanup function, which also
 * runs any cleanup a callback ref returned. React 18 warns about a returned function, so there it
 * returns nothing and React calls it with `null` instead, which reaches every ref the same way.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (value: T | null) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(value);
        cleanups.push(typeof cleanup === 'function' ? cleanup : () => ref(null));
      } else if (ref) {
        ref.current = value;
        cleanups.push(() => {
          ref.current = null;
        });
      }
    }
    if (!IS_REACT_19) return undefined;
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}
