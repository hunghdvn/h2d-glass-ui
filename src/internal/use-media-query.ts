import { useCallback, useMemo, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

/**
 * Whether the media query matches, kept up to date while the component is mounted. On the server and
 * during hydration it is `false`, so the markup the server sent is the narrow one and the first
 * client render agrees with it; a wide screen then gets one more render. Without `matchMedia`
 * (jsdom does not implement it) it is `false`.
 */
export function useMediaQuery(query: string): boolean {
  // One list per query, which both functions read: the snapshot is read on every render and again
  // after each commit, and a list made each time would be thrown away each time. There is no window
  // on the server, where only the server's snapshot is read.
  const list = useMemo(
    () =>
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(query)
        : null,
    [query],
  );
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!list) return () => {};
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [list],
  );
  const getSnapshot = useCallback(() => list?.matches ?? false, [list]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
