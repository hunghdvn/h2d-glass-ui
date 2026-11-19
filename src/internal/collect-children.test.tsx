import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { collectChildren, flattenChildren, markPart, partOf } from './collect-children';
import { IS_REACT_19 } from './react-version';

const Item = markPart(
  (() => null) as (props: { value: string; children?: ReactNode }) => null,
  'item',
);
const Group = markPart(
  (() => null) as (props: { label: string; children?: ReactNode }) => null,
  'group',
);
const Separator = markPart(() => null, 'separator');
const Other = markPart(() => null, 'other');
function Wrapper({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

const options = { parts: ['item', 'group', 'separator'], groups: ['group'] };

describe('collectChildren', () => {
  it('reads parts through Fragments, arrays and group parts, in order', () => {
    const result = collectChildren(
      <>
        <Item value="a">A</Item>
        {[<Item key="b" value="b" />, <Separator key="s" />]}
        <Group label="More">
          <>
            <Item value="c" />
          </>
        </Group>
      </>,
      options,
    );
    expect(result.map((part) => part.part)).toEqual(['item', 'item', 'separator', 'group']);
    expect(result[0]?.props.value).toBe('a');
    expect(result[0]?.props.children).toBe('A');
    expect(result[1]?.key).toBe('b');
    expect(result[3]?.parts?.map((part) => part.props.value)).toEqual(['c']);
  });

  it('reports anything else, and skips it', () => {
    const onUnknown = vi.fn();
    const result = collectChildren(
      <>
        <Item value="a" />
        <Wrapper>
          <Item value="hidden" />
        </Wrapper>
        <Other />
        text
        {'   '}
        {null}
        {false}
      </>,
      { ...options, onUnknown },
    );
    expect(result.map((part) => part.props.value)).toEqual(['a']);
    // The wrapper (a component of the user's own), the part not asked for, and the text.
    expect(onUnknown).toHaveBeenCalledTimes(3);
  });

  it('recognises a part handed over as a lazy reference', () => {
    // React Server Components pass client components to the client as lazy references.
    const resolved = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: Item,
      _init: (x: unknown) => x,
    };
    expect(partOf(<Item value="a" />)).toBe('item');
    expect(partOf(<Other />)).toBe('other');
    expect(partOf('text')).toBeUndefined();
    // The element's type is a lazy reference that resolves to the marked component.
    const element = { ...(<Item value="a" />), type: resolved } as unknown as ReactNode;
    expect(partOf(element)).toBe('item');
  });
});

describe('flattenChildren', () => {
  it('flattens Fragments and arrays, and drops what renders nothing', () => {
    const nodes = flattenChildren(
      <>
        <a href="/">Home</a>
        {[<span key="x">X</span>, null, false]}
        <>
          text
          {'   '}
          {undefined}
          {0}
        </>
      </>,
    );
    expect(
      nodes.map((node) => (typeof node === 'object' && node && 'type' in node ? node.type : node)),
    ).toEqual(['a', 'span', 'text', 0]);
  });

  // Only Server Components hand a child over as a lazy reference, and they need React 19.
  it.runIf(IS_REACT_19)('resolves a child handed over as a lazy reference', () => {
    const lazy = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: <b>Bold</b>,
      _init: (x: unknown) => x,
    } as unknown as ReactNode;
    const [node] = flattenChildren(<>{lazy}</>);
    expect(node && typeof node === 'object' && 'type' in node && node.type).toBe('b');
  });
});
