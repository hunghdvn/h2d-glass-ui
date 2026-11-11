import { Fragment, isValidElement } from 'react';
import type { Key, ReactNode } from 'react';
import { resolveLazy } from './react-lazy';

/**
 * One React key for each child of a list, from the keys the children came with (`null` for a child
 * with none). Own keys and index fallbacks live in different key spaces (`$` and `#`), and an own
 * key that repeats, such as one from another array, falls back to the index, so no two keys are
 * equal. A child keeps its own key when it has one, so that reordering keyed children preserves
 * each one's state and DOM node.
 */
export function childKeys(keys: readonly (Key | null)[]): string[] {
  const used = new Set<string>();
  return keys.map((own, index) => {
    const ownKey = own !== null ? '$' + own : null;
    const key = ownKey !== null && !used.has(ownKey) ? ownKey : '#' + index;
    used.add(key);
    return key;
  });
}

/** A child that `keyedChildren` found, with the key its place in the children as written gives it. */
export interface KeyedChild {
  key: string;
  node: ReactNode;
}

/** An array, or another iterable that React renders as a list (a Set, a generator). */
function asList(node: ReactNode): readonly ReactNode[] | null {
  if (Array.isArray(node)) return node as ReactNode[];
  if (typeof node !== 'object' || node === null || isValidElement(node)) return null;
  const iterator = (node as { [Symbol.iterator]?: unknown })[Symbol.iterator];
  return typeof iterator === 'function' ? Array.from(node as Iterable<ReactNode>) : null;
}

/** `:` separates the levels of a key, so an own key that holds one must not pass for two levels. */
const escapeKey = (key: Key) =>
  String(key).replace(/[=:]/g, (character) => (character === '=' ? '=0' : '=2'));

/**
 * The children as a flat list, through Fragments, arrays and other iterables, with the lazy
 * references of React Server Components resolved and without what renders nothing (`null`,
 * `undefined`, booleans, and text that is only whitespace).
 *
 * Each one has a key that is its path in the children as they are written, as `Children.toArray`
 * builds it: at each level its own key, or its slot, where a slot that renders nothing still
 * counts; an array or a Fragment prefixes the keys of its children with its own. So a child keeps
 * its key, and with it its state and its DOM node, when one before it comes or goes
 * (`{cond && <Item />}`), as it would in plain React. Own keys and slots live in different key
 * spaces (`$` and `#`), and within one list an own key that repeats falls back to the slot, as in
 * `childKeys`, so no two keys are equal.
 */
export function keyedChildren(children: ReactNode): KeyedChild[] {
  const flat: KeyedChild[] = [];
  const walk = (nodes: readonly ReactNode[], prefix: string) => {
    const used = new Set<string>();
    nodes.forEach((raw, slot) => {
      const node = resolveLazy(raw);
      const own = isValidElement(node) && node.key !== null ? '$' + escapeKey(node.key) : null;
      const name = own !== null && !used.has(own) ? own : '#' + slot;
      used.add(name);
      if (node === null || node === undefined || typeof node === 'boolean') return;
      if (typeof node === 'string' && node.trim() === '') return;
      const key = prefix + name;
      const inner =
        isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment
          ? (asList(node.props.children) ?? [node.props.children])
          : asList(node);
      if (inner) walk(inner, key + ':');
      else flat.push({ key, node });
    });
  };
  walk(asList(children) ?? [children], '');
  return flat;
}
