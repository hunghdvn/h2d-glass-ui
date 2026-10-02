import type { ReactNode } from 'react';

/** Whether a node renders something. `0` and other numbers do; `null`, `undefined`, booleans and `''` do not. */
export function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && typeof node !== 'boolean' && node !== '';
}
