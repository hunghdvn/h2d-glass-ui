import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';

export interface UseAnnounceResult {
  /**
   * Says `text` through the live region. The old text goes first and the new text is set a task
   * later, so the same sentence said twice is still read. With `delay`, calls made within that many
   * milliseconds of each other are joined and only the last is said. An empty text clears the
   * region and drops what is waiting.
   */
  announce: (text: string, options?: { delay?: number }) => void;
  /** The live region, for the component to render; it is there from the first render, empty. */
  region: ReactElement;
}

/**
 * One live region for one component. It sits in the component's own root and not in a shared place
 * outside it, because a modal Dialog makes everything outside itself inert and a region in the
 * inert part is not read. Screen readers only read changes in a region they already know, so the
 * region is rendered from the first render, empty.
 */
export function useAnnounce(): UseAnnounceResult {
  const [text, setText] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback((next: string, options?: { delay?: number }) => {
    clearTimeout(timer.current);
    setText('');
    if (next === '') return;
    timer.current = setTimeout(() => setText(next), options?.delay ?? 0);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const region = useMemo(
    () =>
      createElement(
        'div',
        { className: 'flg-visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true' },
        text,
      ),
    [text],
  );
  return { announce, region };
}
