import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server, where React 18 warns about layout
 * effects. Overlays need it to open, measure and move focus before the browser paints.
 */
export const useIsoLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
