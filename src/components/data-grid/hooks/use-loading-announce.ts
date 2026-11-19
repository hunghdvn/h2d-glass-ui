import { useEffect, useRef } from 'react';
import type { UseAnnounceResult } from '../../../internal/use-announce';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';

/**
 * How long a load has to last before it is said, in milliseconds. `aria-busy` already says that the
 * table is loading; the sentence is for a load that goes on, and a shorter one is not worth it.
 */
export const LOADING_ANNOUNCE_DELAY = 1000;

/**
 * Says `text` once when `loading` has lasted `LOADING_ANNOUNCE_DELAY`. The wait is a timer of its own,
 * started when `loading` turns on and cleared when it turns off or the grid goes, so a load that
 * flips off and on says it once and a short one says nothing. Nothing is said to the region before
 * then, and nothing is cleared from it: a sentence that was said in the same press (a sort) is
 * heard, and not replaced. The words are read when they are said and are not a reason to say them
 * again.
 */
export function useLoadingAnnounce(
  loading: boolean,
  text: string,
  announce: UseAnnounceResult['announce'],
): void {
  const words = useRef(text);
  useWriteOnCommit(() => {
    words.current = text;
  });
  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => announce(words.current), LOADING_ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [loading, announce]);
}
