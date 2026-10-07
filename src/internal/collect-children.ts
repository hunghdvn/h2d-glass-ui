import { Children, Fragment, isValidElement } from 'react';
import type { Key, ReactNode } from 'react';
import { resolveLazy } from './react-lazy';

const PART = Symbol.for('fl-glass-ui.part');

/**
 * Marks a component as a part that `collectChildren` recognises, for example `"select-item"`. A
 * marker rather than the component's identity, so a part still counts after React Server Components
 * hand it over as a lazy reference, as `markAsFieldControl` does.
 */
export function markPart<T extends object>(component: T, part: string): T {
  Object.defineProperty(component, PART, { value: part });
  return component;
}

/** The part a node is, or `undefined` for anything that is not a marked component's element. */
export function partOf(node: ReactNode): string | undefined {
  const element = resolveLazy(node);
  if (!isValidElement(element)) return undefined;
  const type = resolveLazy(element.type) as unknown;
  if ((typeof type !== 'function' && typeof type !== 'object') || type === null) return undefined;
  const part = (type as { [PART]?: unknown })[PART];
  return typeof part === 'string' ? part : undefined;
}

export interface CollectedPart {
  part: string;
  key: Key | null;
  props: Record<string, unknown> & { children?: ReactNode };
  /** The parts inside a group part. */
  parts?: CollectedPart[];
}

export interface CollectOptions {
  /** The parts to keep. */
  parts: readonly string[];
  /** Parts whose children are collected too, such as `"select-group"`. */
  groups?: readonly string[];
  /** Called for each child that is not one of `parts` (and not text that is only whitespace). */
  onUnknown?: (node: ReactNode) => void;
}

/**
 * Reads the parts out of `children` without rendering them: through Fragments, arrays and the group
 * parts, so the result is known on the server's first render. A component of the user's own that
 * wraps a part is not looked into; it goes to `onUnknown`.
 */
export function collectChildren(children: ReactNode, options: CollectOptions): CollectedPart[] {
  const { parts, groups = [], onUnknown } = options;
  const collected: CollectedPart[] = [];
  Children.forEach(children, (raw) => {
    const node = resolveLazy(raw);
    if (node === null || node === undefined || typeof node === 'boolean') return;
    if (typeof node === 'string' && node.trim() === '') return;
    if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
      collected.push(...collectChildren(node.props.children, options));
      return;
    }
    const part = partOf(node);
    if (part === undefined || !parts.includes(part) || !isValidElement(node)) {
      onUnknown?.(node);
      return;
    }
    const props = node.props as CollectedPart['props'];
    collected.push({
      part,
      key: node.key,
      props,
      ...(groups.includes(part) ? { parts: collectChildren(props.children, options) } : {}),
    });
  });
  return collected;
}
