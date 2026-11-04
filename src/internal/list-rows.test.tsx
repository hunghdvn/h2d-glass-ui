import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { markPart } from './collect-children';
import { WARN_PREFIX, resetDevWarnings } from './warn';
import { readRows, textOf } from './list-rows';
import type { ListItemProps } from './list-rows';

const ThingItem = markPart(function ThingItem(props: ListItemProps): null {
  void props;
  return null;
}, 'thing-item');

const ThingGroup = markPart(function ThingGroup(props: {
  label: ReactNode;
  children?: ReactNode;
}): null {
  void props;
  return null;
}, 'thing-group');

const ThingSeparator = markPart(function ThingSeparator(): null {
  return null;
}, 'thing-separator');

const OtherItem = markPart(function OtherItem(props: ListItemProps): null {
  void props;
  return null;
}, 'select-item');

const THING_PARTS = {
  item: 'thing-item',
  group: 'thing-group',
  separator: 'thing-separator',
  owner: 'Thing',
} as const;

describe('textOf', () => {
  it('joins the text of nested elements and collapses whitespace', () => {
    expect(
      textOf(
        <>
          New <b>York</b>
          {'  '}
          {2026}
        </>,
      ),
    ).toBe('New York 2026');
  });
});

describe('readRows', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('numbers the options in list order through groups, and keys rows by position', () => {
    const { rows, options } = readRows(
      <>
        <ThingItem value="a">A</ThingItem>
        <ThingGroup label="More">
          <ThingItem value="b" disabled>
            B
          </ThingItem>
          <ThingSeparator />
          <ThingItem value="c" textValue="Sea">
            C
          </ThingItem>
        </ThingGroup>
      </>,
      THING_PARTS,
    );
    expect(
      options.map(({ index, value, disabled, text }) => [index, value, disabled, text]),
    ).toEqual([
      [0, 'a', false, 'A'],
      [1, 'b', true, 'B'],
      [2, 'c', false, 'Sea'],
    ]);
    expect(rows.map((row) => row.kind)).toEqual(['option', 'group']);
    const group = rows[1];
    expect(group?.kind === 'group' && group.key).toBe('1');
    expect(group?.kind === 'group' && group.rows.map((row) => row.kind)).toEqual([
      'option',
      'separator',
      'option',
    ]);
    expect(
      group?.kind === 'group' && group.rows[1]?.kind === 'separator' && group.rows[1].key,
    ).toBe('1.1');
  });

  it('skips an item with an empty value, and anything that is not a part, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { options } = readRows(
      <>
        <ThingItem value="">Empty</ThingItem>
        <span>Not a part</span>
        <ThingItem value="kept">Kept</ThingItem>
      </>,
      THING_PARTS,
    );
    expect(options.map((option) => option.value)).toEqual(['kept']);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]?.[0]).toBe(
      WARN_PREFIX +
        ' <Thing> reads only ThingItem, ThingGroup and ThingSeparator, directly or inside Fragments, arrays and ThingGroup. It skips anything else, including a component of your own that wraps a ThingItem.',
    );
    expect(warn.mock.calls[1]?.[0]).toBe(
      WARN_PREFIX +
        ' <ThingItem> needs a value that is not empty: the empty value is how the native select says nothing is chosen. The item is skipped.',
    );
  });

  it('skips an item whose value is not a string, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { options } = readRows(
      <>
        <ThingItem value={123 as unknown as string}>Bad</ThingItem>
        <ThingItem value="kept">Kept</ThingItem>
      </>,
      THING_PARTS,
    );
    expect(options.map((option) => option.value)).toEqual(['kept']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      WARN_PREFIX + ' <ThingItem> needs a value that is a string. The item is skipped.',
    );
  });

  it('keeps the Select warnings unchanged for owner "Select"', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readRows(
      <>
        <ThingItem value="">Empty</ThingItem>
        <ThingItem value={123 as unknown as string}>Bad</ThingItem>
        <span>Not a part</span>
      </>,
      { ...THING_PARTS, owner: 'Select' },
    );
    expect(warn.mock.calls.map((call) => call[0])).toEqual([
      WARN_PREFIX +
        ' <Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, arrays and SelectGroup. It skips anything else, including a component of your own that wraps a SelectItem.',
      WARN_PREFIX +
        ' <SelectItem> needs a value that is not empty: the empty value is how the native select says nothing is chosen. The item is skipped.',
      WARN_PREFIX + ' <SelectItem> needs a value that is a string. The item is skipped.',
    ]);
  });

  it('treats parts of another owner as unknown', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { options } = readRows(<OtherItem value="x">X</OtherItem>, THING_PARTS);
    expect(options).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      WARN_PREFIX +
        ' <Thing> reads only ThingItem, ThingGroup and ThingSeparator, directly or inside Fragments, arrays and ThingGroup. It skips anything else, including a component of your own that wraps a ThingItem.',
    );
  });
});
