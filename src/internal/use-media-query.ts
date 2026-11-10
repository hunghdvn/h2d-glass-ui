import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

/**
 * Whether the media query matches, kept up to date while the component is mounted. On the server and
 * during hydration it is `false`, so the markup the server sent is the narrow one and the first
 * client render agrees with it; a wide screen then gets one more render. Without `matchMedia`
 * (jsdom does not implement it) it is `false`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
    [query],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
