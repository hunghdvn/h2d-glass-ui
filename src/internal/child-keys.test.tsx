import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { childKeys, keyedChildren } from './child-keys';

describe('childKeys', () => {
  it('keeps an own key and falls back to the index for a child without one', () => {
    expect(childKeys(['a', null, 'c'])).toEqual(['$a', '#1', '$c']);
  });

  it('keeps own keys and index fallbacks apart, so a key that looks like an index does not collide', () => {
    expect(childKeys([null, '0', 0, null])).toEqual(['#0', '$0', '#2', '#3']);
  });

  it('falls back to the index for an own key that repeats', () => {
    expect(childKeys(['a', 'a', 'a'])).toEqual(['$a', '#1', '#2']);
  });

  it('is empty for no children', () => {
    expect(childKeys([])).toEqual([]);
  });
});

// The lists below are what JSX hands a component as `children`; they are never rendered as they are,
// so the elements in them need no key of their own.
describe('keyedChildren', () => {
  const keys = (children: ReactNode) => keyedChildren(children).map((child) => child.key);
  const types = (children: ReactNode) =>
    keyedChildren(children).map(({ node }) =>
      typeof node === 'object' && node !== null && 'type' in node ? node.type : node,
    );

  it('keys a child by its slot, counting the slots that render nothing, as React does', () => {
    const children = [<i />, null, <b />, false, 'text', '  ', 0, <u />];
    expect(keys(children)).toEqual(['#0', '#2', '#4', '#6', '#7']);
    expect(types(children)).toEqual(['i', 'b', 'text', 0, 'u']);
  });

  it('keeps an own key, apart from the keys of the slots', () => {
    expect(keys([<i key="a" />, <b />, <u key="1" />])).toEqual(['$a', '#1', '$1']);
  });

  it('prefixes the children of a nested array and of a Fragment by its own key or its slot', () => {
    const children = [
      <i />,
      [<b key="x" />, <u />],
      <Fragment key="f">
        <s />
      </Fragment>,
      <>
        <em />
        {null}
        <small />
      </>,
    ];
    expect(keys(children)).toEqual(['#0', '#1:$x', '#1:#1', '$f:#0', '#3:#0', '#3:#2']);
    expect(types(children)).toEqual(['i', 'b', 'u', 's', 'em', 'small']);
  });

  it('keys a single child as the first of a list, so that it keeps its key when siblings join it', () => {
    expect(keys(<i />)).toEqual(['#0']);
    expect(keys([<i />, <b />])[0]).toBe('#0');
  });

  // The navigation whose item shows only sometimes: what comes after it keeps its key, and so its
  // state and its DOM node.
  it('gives a child the same key whether a slot before it is filled or empty', () => {
    const list = (extra: boolean) => [
      <i />,
      extra ? <b /> : null,
      [extra && <s key="s" />, <u />],
      <em />,
    ];
    const keyOf = (extra: boolean, type: string) =>
      keyedChildren(list(extra)).find(({ node }) => (node as { type?: unknown }).type === type)
        ?.key;
    for (const type of ['i', 'u', 'em']) {
      expect(keyOf(true, type), type).toBe(keyOf(false, type));
    }
  });

  it('falls back to the slot for an own key that repeats in one list, and not across lists', () => {
    expect(keys([<i key="a" />, <b key="a" />, [<u key="a" />]])).toEqual(['$a', '#1', '#2:$a']);
  });

  it('escapes the separator in an own key, so that no two keys are equal', () => {
    const children = [
      <i key="x:$y" />,
      <Fragment key="x">
        <b key="y" />
      </Fragment>,
    ];
    expect(new Set(keys(children)).size).toBe(2);
  });

  it('walks an iterable as a list', () => {
    expect(keys(new Set([<i key="a" />, <b />]))).toEqual(['$a', '#1']);
  });

  it('resolves a lazy reference, and keys it by its slot', () => {
    // React Server Components hand a child over as a lazy reference.
    const lazy = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: <b>Bold</b>,
      _init: (x: unknown) => x,
    } as unknown as ReactNode;
    expect(keys([null, lazy])).toEqual(['#1']);
    expect(types([null, lazy])).toEqual(['b']);
  });

  it('is empty for no children', () => {
    expect(keyedChildren(null)).toEqual([]);
    expect(keyedChildren([])).toEqual([]);
  });
});
