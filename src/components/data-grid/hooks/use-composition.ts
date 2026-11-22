import { useMemo, useRef } from 'react';
import type { CompositionEvent, MutableRefObject } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';

/** What `useComposition` gives an input: the handlers to spread on it, and whether a composition is on. */
export interface Composition {
  /** Whether an input method is composing in the input, from `compositionstart` to `compositionend`. */
  composing: MutableRefObject<boolean>;
  props: {
    onCompositionStart: () => void;
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
  };
}

/**
 * Tells an input that waits to send what is typed (the search field, the cells of the filter row) when an
 * input method is composing, so that it arms no timer for the candidates that come and go, and arms it
 * when the composition ends: `onEnd` is called then with the text of the input. The text is the method's
 * until it ends, and a half-composed word is no search.
 */
export function useComposition(onEnd: (text: string) => void): Composition {
  const composing = useRef(false);
  const latest = useRef(onEnd);
  useWriteOnCommit(() => {
    latest.current = onEnd;
  });
  const props = useMemo(
    () => ({
      onCompositionStart: () => {
        composing.current = true;
      },
      onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => {
        composing.current = false;
        latest.current(event.currentTarget.value);
      },
    }),
    [],
  );
  return { composing, props };
}
