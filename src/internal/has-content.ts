import { Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';

/**
 * Whether a node renders something. `0` and other numbers do; `null`, `undefined`, booleans and `''`
 * do not, and neither does an array or a `Fragment` that holds only those. A component that
 * returns `null` cannot be told from any other without rendering it, so it counts as content.
 */
export function hasContent(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasContent);
  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
    return hasContent(node.props.children);
  }
  return node !== undefined && node !== null && typeof node !== 'boolean' && node !== '';
}
