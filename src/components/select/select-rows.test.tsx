import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { SelectGroup, SelectItem, SelectSeparator } from './Select';
import { readRows, textOf } from './select-rows';

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
        <SelectItem value="a">A</SelectItem>
        <SelectGroup label="More">
          <SelectItem value="b" disabled>
            B
          </SelectItem>
          <SelectSeparator />
          <SelectItem value="c" textValue="Sea">
            C
          </SelectItem>
        </SelectGroup>
      </>,
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
        <SelectItem value="">Empty</SelectItem>
        <span>Not a part</span>
        <SelectItem value="kept">Kept</SelectItem>
      </>,
    );
    expect(options.map((option) => option.value)).toEqual(['kept']);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
