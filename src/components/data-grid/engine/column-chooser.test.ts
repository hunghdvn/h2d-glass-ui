import { describe, expect, it } from 'vitest';
import type { DataGridColumnLayout } from '../types';
import { chooserItems } from './column-chooser';

const column = (id: string, allowHiding = true) => ({ id, caption: id.toUpperCase(), allowHiding });
const COLUMNS = [column('a', false), column('b'), column('c'), column('d')];
const layout = (part: Partial<DataGridColumnLayout> = {}): DataGridColumnLayout => ({
  order: ['a', 'b', 'c', 'd'],
  widths: {},
  hidden: [],
  pinned: {},
  ...part,
});
const ids = (items: ReturnType<typeof chooserItems>) => items.map((item) => item.id);

describe('chooserItems', () => {
  it('lists every column in the order of the layout, with its caption', () => {
    const items = chooserItems(COLUMNS, layout({ order: ['c', 'a', 'd', 'b'] }));
    expect(ids(items)).toEqual(['c', 'a', 'd', 'b']);
    expect(items.map((item) => item.caption)).toEqual(['C', 'A', 'D', 'B']);
  });

  it('lists them by zone, the left zone, the middle, then the right zone, as the grid shows them', () => {
    const items = chooserItems(
      COLUMNS,
      layout({ order: ['a', 'b', 'c', 'd'], pinned: { c: 'left', a: 'right' } }),
    );
    expect(ids(items)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('keeps a hidden column at its place, not shown', () => {
    const items = chooserItems(COLUMNS, layout({ hidden: ['b'] }));
    expect(ids(items)).toEqual(['a', 'b', 'c', 'd']);
    expect(items.map((item) => item.shown)).toEqual([true, false, true, true]);
  });

  it('locks the column that cannot be hidden, and disables its box while it is shown', () => {
    const items = chooserItems(COLUMNS, layout());
    expect(items.map((item) => item.locked)).toEqual([true, false, false, false]);
    expect(items.map((item) => item.disabled)).toEqual([true, false, false, false]);
  });

  it('lets a locked column that is hidden be shown again', () => {
    const [first] = chooserItems(COLUMNS, layout({ hidden: ['a'] }));
    expect(first).toMatchObject({ id: 'a', locked: true, shown: false, disabled: false });
  });

  it('disables the box of the last column shown, which is not locked', () => {
    const items = chooserItems(
      [column('a'), column('b'), column('c')],
      layout({ order: ['a', 'b', 'c'], hidden: ['a', 'c'] }),
    );
    expect(items.map((item) => [item.shown, item.disabled, item.locked])).toEqual([
      [false, false, false],
      [true, true, false],
      [false, false, false],
    ]);
  });

  it('marks the last column shown, and only while it is the only one and not locked', () => {
    const last = (hidden: string[]) =>
      chooserItems(COLUMNS, layout({ hidden }))
        .filter((item) => item.last)
        .map((item) => item.id);
    expect(last([])).toEqual([]);
    expect(last(['a', 'b', 'c'])).toEqual(['d']);
    expect(last(['b', 'c', 'd'])).toEqual([]);
  });

  it('disables nothing for a column that is not shown, whatever is left', () => {
    const items = chooserItems(
      [column('a'), column('b')],
      layout({ order: ['a', 'b'], hidden: ['b'] }),
    );
    expect(items.map((item) => item.disabled)).toEqual([true, false]);
  });

  it('is empty for no column', () => {
    expect(chooserItems([], layout({ order: [] }))).toEqual([]);
  });

  it('skips an id of the layout that is no column, and lists a column the layout does not know', () => {
    expect(ids(chooserItems(COLUMNS, layout({ order: ['x', 'b', 'a'] })))).toEqual([
      'b',
      'a',
      'c',
      'd',
    ]);
  });
});
