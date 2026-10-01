import { version } from 'react';

/**
 * React 19 or later. React 19 passes `ref` as a regular prop and lets a callback ref return a
 * cleanup function; React 18 keeps `ref` on the element and warns when a callback ref returns one.
 */
export const IS_REACT_19 = Number.parseInt(version, 10) >= 19;
