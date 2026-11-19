import { describe, expect, it, vi } from 'vitest';
import type { DataGridColumnLayout } from '../types';
import type { ResolvedColumn } from './columns';
import {
  MAX_FIT_WIDTH,
  applyLayout,
  autoFitWidth,
  clampWidth,
  fillerIndex,
  freezeWidths,
  moveColumn,
  pinColumn,
  pinOffsets,
  pinPlaces,
  resolveWidths,
  sameLayout,
  setHidden,
  startLayout,
} from './layout';

const flexible = (minWidth = 60) => ({ width: undefined, minWidth });
const fixed = (width: number, minWidth = 60) => ({ width, minWidth });
const sum = (widths: readonly number[]) => widths.reduce((total, width) => total + width, 0);

describe('resolveWidths', () => {
  it('gives a fixed width as it is', () => {
    expect(resolveWidths([fixed(100), fixed(250.5)], 1000)).toEqual([100, 250.5]);
  });

  it('keeps a fixed width that is under the minimum of its column', () => {
    expect(resolveWidths([fixed(40, 120)], 1000)).toEqual([40]);
  });

  it('shares what is left among the flexible columns equally', () => {
    expect(resolveWidths([flexible(), flexible()], 1000)).toEqual([500, 500]);
    expect(resolveWidths([fixed(100), flexible(), flexible()], 1000)).toEqual([100, 450, 450]);
  });

  it('gives whole pixels, the remainder going to the last flexible columns', () => {
    expect(resolveWidths([flexible(), flexible()], 1001)).toEqual([500, 501]);
    expect(resolveWidths([flexible(10), flexible(10), flexible(10)], 100)).toEqual([33, 33, 34]);
    expect(resolveWidths([flexible(10), flexible(10), flexible(10)], 101)).toEqual([33, 34, 34]);
    expect(resolveWidths([flexible(10), fixed(50), flexible(10), flexible(10)], 100)).toEqual([
      16, 50, 17, 17,
    ]);
  });

  it('holds a column at its minimum and leaves the rest to the others', () => {
    // An equal share of 300 is 150 each, which is under the 200 of the second.
    expect(resolveWidths([flexible(60), flexible(200)], 300)).toEqual([100, 200]);
    // Two columns held at 200 leave 100 for the first.
    expect(resolveWidths([flexible(60), flexible(200), flexible(200)], 500)).toEqual([
      100, 200, 200,
    ]);
  });

  it('is the sum of the minimums when nothing is left to share', () => {
    expect(resolveWidths([flexible(60), flexible(200)], 100)).toEqual([60, 200]);
    expect(resolveWidths([fixed(100), flexible(60), flexible(80)], 150)).toEqual([100, 60, 80]);
  });

  it('adds up to the available width, or to fixed plus minimums when that is more', () => {
    const minimums = [100, 60, 200, 75];
    const columns = [fixed(100), flexible(60), flexible(200), flexible(75)];
    for (const available of [0, 99, 100, 257, 640, 1280, 1919]) {
      const widths = resolveWidths(columns, available);
      expect(sum(widths)).toBe(Math.max(available, sum(minimums)));
      widths.forEach((width, index) => expect(width).toBeGreaterThanOrEqual(minimums[index]!));
    }
  });

  it('leaves the table narrower than the frame when no column is flexible', () => {
    expect(resolveWidths([fixed(100), fixed(200)], 1000)).toEqual([100, 200]);
  });

  it('reads a fractional minimum as the next whole pixel, so the sum stays whole', () => {
    expect(resolveWidths([flexible(60.2), flexible(60.2)], 100)).toEqual([61, 61]);
  });

  it('takes an available width that is not a number, or is negative, as 0', () => {
    expect(resolveWidths([flexible(60)], Number.NaN)).toEqual([60]);
    expect(resolveWidths([flexible(60)], -10)).toEqual([60]);
  });

  it('gives nothing for no columns', () => {
    expect(resolveWidths([], 500)).toEqual([]);
  });
});

// ---- the layout of the columns (phase 6 Plan C) ----

interface Row {
  id: string;
}
const column = (id: string, extra: Partial<ResolvedColumn<Row>> = {}): ResolvedColumn<Row> => ({
  id,
  caption: id,
  dataType: 'string',
  align: 'start',
  width: undefined,
  minWidth: 60,
  pinned: undefined,
  visible: true,
  rowHeader: false,
  allowSorting: true,
  allowResizing: true,
  value: () => undefined,
  text: () => '',
  ownText: false,
  sortKey: () => null,
  cell: undefined,
  info: { id, caption: id, dataType: 'string', align: 'start' },
  column: { id, value: () => undefined },
  ...extra,
});
const EMPTY: DataGridColumnLayout = { order: [], widths: {}, hidden: [], pinned: {} };
const layoutOf = (parts: Partial<DataGridColumnLayout>): DataGridColumnLayout => ({
  ...EMPTY,
  ...parts,
});
const ids = (applied: { columns: readonly { id: string }[] }) => applied.columns.map((c) => c.id);

describe('startLayout', () => {
  it('is the order of the array, with the own hidden, pinned and width of the columns', () => {
    const columns = [
      column('a', { width: 100 }),
      column('b', { visible: false }),
      column('c', { pinned: 'right', width: 80 }),
      column('d', { pinned: 'left' }),
    ];
    expect(startLayout(columns)).toEqual({
      order: ['a', 'b', 'c', 'd'],
      widths: { a: 100, c: 80 },
      hidden: ['b'],
      pinned: { c: 'right', d: 'left' },
    });
  });

  it('is empty for no column', () => {
    expect(startLayout([])).toEqual(EMPTY);
  });

  const own = { order: ['a', 'b'], widths: { a: 100 }, hidden: ['b'], pinned: { a: 'left' } };
  it.each([
    ['order', { order: ['b', 'a'] }],
    ['widths', { widths: { b: 70 } }],
    ['hidden', { hidden: [] }],
    ['pinned', { pinned: { b: 'right' } }],
  ] as const)('lets a given %s replace that part and no other', (name, given) => {
    const columns = [column('a', { width: 100, pinned: 'left' }), column('b', { visible: false })];
    expect(startLayout(columns, given)).toEqual({ ...own, ...given });
    expect(name in given).toBe(true);
  });

  it('takes a part that is undefined for no part', () => {
    const columns = [column('a', { width: 100 })];
    expect(startLayout(columns, { order: undefined, widths: undefined }).widths).toEqual({
      a: 100,
    });
  });
});

describe('applyLayout', () => {
  const abc = [column('a'), column('b'), column('c')];

  it('shows the columns in the order of the layout, and reuses the column objects', () => {
    const applied = applyLayout(abc, layoutOf({ order: ['c', 'a', 'b'] }));
    expect(ids(applied)).toEqual(['c', 'a', 'b']);
    expect(applied.columns[0]).toBe(abc[2]);
    expect(applied.columns[1]).toBe(abc[0]);
  });

  it('keeps the zones in order: the left, the middle, then the right, each in `order`', () => {
    const applied = applyLayout(
      abc.concat(column('d'), column('e')),
      layoutOf({
        order: ['a', 'b', 'c', 'd', 'e'],
        pinned: { e: 'left', d: 'right', b: 'left', a: 'right' },
      }),
    );
    expect(ids(applied)).toEqual(['b', 'e', 'c', 'a', 'd']);
    expect(applied.pins).toEqual(['left', 'left', undefined, 'right', 'right']);
  });

  it('puts a new column, one that is not in `order`, at the end of its zone with its own values', () => {
    const columns = [
      column('a'),
      column('b'),
      column('x', { pinned: 'left', width: 90 }),
      column('y', { visible: false }),
      column('z'),
    ];
    const applied = applyLayout(columns, layoutOf({ order: ['b', 'a'], pinned: { a: 'left' } }));
    // a is pinned left and x joins it at its end; b and the new z are the middle; y is hidden.
    expect(ids(applied)).toEqual(['a', 'x', 'b', 'z']);
    expect(applied.layout).toEqual({
      order: ['b', 'a', 'x', 'y', 'z'],
      widths: { x: 90 },
      hidden: ['y'],
      pinned: { a: 'left', x: 'left' },
    });
  });

  it('lays a known column out by the layout alone: its own visible and pinned no longer count', () => {
    const columns = [column('a', { pinned: 'left', visible: false }), column('b')];
    const applied = applyLayout(columns, layoutOf({ order: ['a', 'b'] }));
    expect(ids(applied)).toEqual(['a', 'b']);
    expect(applied.pins).toEqual([undefined, undefined]);
    expect(applied.layout.hidden).toEqual([]);
    expect(applied.layout.pinned).toEqual({});
  });

  it('hides what `hidden` says, and keeps the hidden ids in the shown layout', () => {
    const applied = applyLayout(abc, layoutOf({ order: ['a', 'b', 'c'], hidden: ['b'] }));
    expect(ids(applied)).toEqual(['a', 'c']);
    expect(applied.layout.hidden).toEqual(['b']);
    expect(applied.layout.order).toEqual(['a', 'b', 'c']);
  });

  it('shows the first column in `order` when the layout hides every column, silently', () => {
    const applied = applyLayout(abc, layoutOf({ order: ['b', 'a', 'c'], hidden: ['a', 'b', 'c'] }));
    expect(ids(applied)).toEqual(['b']);
    expect(applied.layout.hidden).toEqual(['a', 'c']);
  });

  it('shows no column for no column', () => {
    const applied = applyLayout([], layoutOf({ order: ['a'], hidden: ['a'] }));
    expect(applied).toEqual({ columns: [], pins: [], widths: [], layout: EMPTY });
  });

  it('drops without a word the ids of no column, repeated ids, grid ids and pins that are no pin', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const applied = applyLayout(
        abc,
        layoutOf({
          order: ['b', 'gone', 'flg:select', 'b', 'a', 'c'],
          hidden: ['gone', 'c', 'c', 'flg:select'],
          widths: { gone: 100, 'flg:select': 100, a: 120 },
          pinned: { gone: 'left', a: 'top', b: 'right' } as never,
        }),
      );
      expect(ids(applied)).toEqual(['a', 'b']);
      expect(applied.layout).toEqual({
        order: ['b', 'a', 'c'],
        widths: { a: 120 },
        hidden: ['c'],
        pinned: { b: 'right' },
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('takes the width of a column from the layout, clamped to its minimum and to 2000', () => {
    const columns = [column('a', { minWidth: 100 }), column('b'), column('c')];
    const applied = applyLayout(
      columns,
      layoutOf({ order: ['a', 'b', 'c'], widths: { a: 40, b: 5000, c: 300 } }),
    );
    expect(applied.widths).toEqual([100, 2000, 300]);
    expect(applied.layout.widths).toEqual({ a: 100, b: 2000, c: 300 });
  });

  it('takes the own width of a column the layout has no width for, and none for a flexible one', () => {
    const columns = [column('a', { width: 150 }), column('b')];
    const applied = applyLayout(columns, layoutOf({ order: ['a', 'b'] }));
    expect(applied.widths).toEqual([150, undefined]);
    expect(applied.layout.widths).toEqual({ a: 150 });
  });

  it('leaves a width that is the own width of its column as it is, even under its minimum', () => {
    // The start layout copies the own width, and a fixed width under the minimum was always kept.
    const columns = [column('a', { width: 40, minWidth: 120 })];
    expect(applyLayout(columns, startLayout(columns)).widths).toEqual([40]);
  });

  it('takes a width that is not a positive number for none, silently', () => {
    const columns = [column('a', { width: 90 }), column('b')];
    const applied = applyLayout(
      columns,
      layoutOf({ order: ['a', 'b'], widths: { a: Number.NaN, b: -5 } }),
    );
    expect(applied.widths).toEqual([90, undefined]);
  });

  it('gives the same layout when it is applied again to its own shown layout', () => {
    const columns = [column('a', { width: 100 }), column('b', { visible: false }), column('c')];
    const once = applyLayout(columns, startLayout(columns));
    const twice = applyLayout(columns, once.layout);
    expect(twice.layout).toEqual(once.layout);
    expect(ids(twice)).toEqual(ids(once));
  });
});

describe('moveColumn', () => {
  const order = ['a', 'b', 'c', 'd'];

  it('puts a column just before or after another', () => {
    expect(moveColumn(order, 'a', 'c', 'before')).toEqual(['b', 'a', 'c', 'd']);
    expect(moveColumn(order, 'a', 'c', 'after')).toEqual(['b', 'c', 'a', 'd']);
    expect(moveColumn(order, 'd', 'a', 'before')).toEqual(['d', 'a', 'b', 'c']);
    expect(moveColumn(order, 'b', 'd', 'after')).toEqual(['a', 'c', 'd', 'b']);
  });

  it('leaves the other ids, the hidden ones too, in their places', () => {
    // Say b is hidden: it is still in the order, and it stays between a and c.
    expect(moveColumn(order, 'd', 'c', 'before')).toEqual(['a', 'b', 'd', 'c']);
    expect(moveColumn(order, 'a', 'c', 'after')).toEqual(['b', 'c', 'a', 'd']);
  });

  it('is a new array, the one given untouched, and the same order for a move that moves nothing', () => {
    const given = ['a', 'b', 'c'];
    const moved = moveColumn(given, 'a', 'c', 'after');
    expect(moved).not.toBe(given);
    expect(given).toEqual(['a', 'b', 'c']);
    expect(moveColumn(given, 'b', 'b', 'before')).toEqual(given);
    expect(moveColumn(given, 'a', 'b', 'before')).toEqual(given);
    expect(moveColumn(given, 'x', 'b', 'before')).toEqual(given);
    expect(moveColumn(given, 'a', 'x', 'after')).toEqual(given);
  });
});

describe('pinColumn', () => {
  const base = layoutOf({ order: ['a', 'b', 'c', 'd', 'e'] });

  it('pins to the end of the left zone', () => {
    const one = pinColumn(base, 'c', 'left');
    expect(one.order).toEqual(['c', 'a', 'b', 'd', 'e']);
    expect(one.pinned).toEqual({ c: 'left' });
    const two = pinColumn(one, 'e', 'left');
    expect(two.order).toEqual(['c', 'e', 'a', 'b', 'd']);
    expect(two.pinned).toEqual({ c: 'left', e: 'left' });
  });

  it('pins to the start of the right zone', () => {
    const one = pinColumn(base, 'b', 'right');
    expect(one.order).toEqual(['a', 'c', 'd', 'e', 'b']);
    const two = pinColumn(one, 'a', 'right');
    expect(two.order).toEqual(['c', 'd', 'e', 'a', 'b']);
    expect(two.pinned).toEqual({ a: 'right', b: 'right' });
  });

  it('unpins from the left to the start of the middle, and from the right to its end', () => {
    const both = pinColumn(pinColumn(pinColumn(base, 'a', 'left'), 'b', 'left'), 'e', 'right');
    expect(both.order).toEqual(['a', 'b', 'c', 'd', 'e']);
    const fromLeft = pinColumn(both, 'a', null);
    expect(fromLeft.order).toEqual(['b', 'a', 'c', 'd', 'e']);
    expect(fromLeft.pinned).toEqual({ b: 'left', e: 'right' });
    const fromRight = pinColumn(both, 'e', null);
    expect(fromRight.order).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(fromRight.pinned).toEqual({ a: 'left', b: 'left' });
  });

  it('puts a column unpinned from the right at the end of the middle', () => {
    // The last column pinned to the right is the first of the right zone.
    const right = pinColumn(pinColumn(base, 'd', 'right'), 'e', 'right');
    expect(right.order).toEqual(['a', 'b', 'c', 'e', 'd']);
    const back = pinColumn(right, 'd', null);
    expect(back.order).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(back.pinned).toEqual({ e: 'right' });
  });

  it('moves a column pinned to one side to the other', () => {
    const left = pinColumn(base, 'b', 'left');
    const right = pinColumn(left, 'b', 'right');
    expect(right.order).toEqual(['a', 'c', 'd', 'e', 'b']);
    expect(right.pinned).toEqual({ b: 'right' });
  });

  it('puts a column in its zone by the zone order, whatever order the layout was in', () => {
    // c is pinned left but listed last: the zone order is c, then the middle.
    const odd = layoutOf({ order: ['a', 'b', 'c'], pinned: { c: 'left' } });
    expect(pinColumn(odd, 'b', 'left').order).toEqual(['c', 'b', 'a']);
  });

  it('leaves the layout as it is for an unpin of a column that is not pinned, and for an unknown id', () => {
    expect(pinColumn(base, 'a', null)).toBe(base);
    expect(pinColumn(base, 'x', 'left')).toBe(base);
  });

  it('changes neither the layout it was given, nor the other parts', () => {
    const given = layoutOf({ order: ['a', 'b'], widths: { a: 100 }, hidden: ['b'] });
    const frozen = JSON.stringify(given);
    const pinned = pinColumn(given, 'b', 'left');
    expect(JSON.stringify(given)).toBe(frozen);
    expect(pinned.widths).toEqual({ a: 100 });
    expect(pinned.hidden).toEqual(['b']);
  });
});

describe('setHidden', () => {
  const base = layoutOf({ order: ['a', 'b', 'c'], hidden: ['c'] });

  it('adds an id to hidden, and takes it out', () => {
    expect(setHidden(base, 'a', true).hidden).toEqual(['c', 'a']);
    expect(setHidden(base, 'c', false).hidden).toEqual([]);
    expect(setHidden(base, 'a', true).order).toEqual(['a', 'b', 'c']);
  });

  it('leaves the layout as it is when nothing changes', () => {
    expect(setHidden(base, 'c', true)).toBe(base);
    expect(setHidden(base, 'a', false)).toBe(base);
  });
});

describe('sameLayout', () => {
  const one = layoutOf({
    order: ['a', 'b'],
    widths: { a: 100, b: 50 },
    hidden: ['b'],
    pinned: { a: 'left' },
  });
  const copy = (): DataGridColumnLayout => JSON.parse(JSON.stringify(one)) as DataGridColumnLayout;

  it('says that two layouts with the same parts are the same, by value', () => {
    expect(sameLayout(one, copy())).toBe(true);
    // The keys of an object have no order.
    expect(sameLayout(one, { ...copy(), widths: { b: 50, a: 100 } })).toBe(true);
  });

  it('says that two layouts that differ in any part are not', () => {
    expect(sameLayout(one, { ...one, order: ['b', 'a'] })).toBe(false);
    expect(sameLayout(one, { ...one, widths: { a: 101, b: 50 } })).toBe(false);
    expect(sameLayout(one, { ...one, widths: { a: 100 } })).toBe(false);
    expect(sameLayout(one, { ...one, hidden: [] })).toBe(false);
    expect(sameLayout(one, { ...one, pinned: { a: 'right' } })).toBe(false);
    expect(sameLayout(one, { ...one, pinned: {} })).toBe(false);
  });

  it('counts the hidden ids as a set: the order they are listed in says nothing', () => {
    const two = layoutOf({ order: ['a', 'b', 'c'], hidden: ['b', 'c'] });
    expect(sameLayout(two, { ...two, hidden: ['c', 'b'] })).toBe(true);
  });
});

describe('pinOffsets', () => {
  it('is the sum of the widths of the left zone before a left column', () => {
    expect(pinOffsets([100, 50, 70, 200], ['left', 'left', 'left', undefined])).toEqual([
      0,
      100,
      150,
      undefined,
    ]);
  });

  it('is the sum of the widths of the right zone after a right column', () => {
    expect(pinOffsets([200, 100, 50, 70], [undefined, 'right', 'right', 'right'])).toEqual([
      undefined,
      120,
      70,
      0,
    ]);
  });

  it('counts each zone by itself, and gives the columns in between none', () => {
    expect(
      pinOffsets([40, 100, 300, 250, 90], ['left', 'left', undefined, undefined, 'right']),
    ).toEqual([0, 40, undefined, undefined, 0]);
  });

  it('gives none to a grid with no pin', () => {
    expect(pinOffsets([10, 20], [undefined, undefined])).toEqual([undefined, undefined]);
    expect(pinOffsets([], [])).toEqual([]);
  });

  it('counts the column of boxes, which is the first of the left zone', () => {
    expect(pinOffsets([40, 104, 200], ['left', 'left', undefined])).toEqual([0, 40, undefined]);
  });
});

describe('fillerIndex', () => {
  it('is the end of the row when no column is pinned to the right', () => {
    expect(fillerIndex([undefined, undefined])).toBe(2);
    expect(fillerIndex(['left', undefined])).toBe(2);
    expect(fillerIndex([])).toBe(0);
  });

  it('is the place of the first column of the right zone', () => {
    expect(fillerIndex([undefined, 'right'])).toBe(1);
    expect(fillerIndex(['left', undefined, 'right', 'right'])).toBe(2);
    expect(fillerIndex(['right'])).toBe(0);
  });
});

describe('pinPlaces', () => {
  it('names the side, the edge and the offset property of each pinned column', () => {
    const places = pinPlaces(['left', 'left', undefined, 'right', 'right']);
    expect(places.map((place) => place && [place.side, place.edge])).toEqual([
      ['left', false],
      ['left', true],
      undefined,
      ['right', true],
      ['right', false],
    ]);
    expect(places[1]!.style).toEqual({ left: 'var(--flg-data-grid-pin-1)' });
    expect(places[3]!.style).toEqual({ right: 'var(--flg-data-grid-pin-3)' });
  });

  it('is all undefined for a grid with no pin', () => {
    expect(pinPlaces([undefined, undefined])).toEqual([undefined, undefined]);
  });
});

describe('clampWidth', () => {
  it('holds a width to the minimum of the column and to 2000', () => {
    expect(clampWidth(150, 60)).toBe(150);
    expect(clampWidth(20, 60)).toBe(60);
    expect(clampWidth(-300, 60)).toBe(60);
    expect(clampWidth(5000, 60)).toBe(2000);
  });

  it('gives whole pixels, and never a width under a minimum that has a fraction', () => {
    expect(clampWidth(150.4, 60)).toBe(150);
    expect(clampWidth(150.6, 60)).toBe(151);
    expect(clampWidth(10, 60.5)).toBe(61);
  });

  it('is the minimum for a width that is no number', () => {
    expect(clampWidth(Number.NaN, 60)).toBe(60);
  });
});

describe('autoFitWidth', () => {
  it('is the widest of the measures, rounded up', () => {
    expect(autoFitWidth([80, 143.2, 120], 60)).toBe(144);
  });

  it('is held to the minimum width of the column and to 600', () => {
    expect(MAX_FIT_WIDTH).toBe(600);
    expect(autoFitWidth([20, 30], 60)).toBe(60);
    expect(autoFitWidth([900], 60)).toBe(600);
  });

  it('is the minimum width when there is nothing to measure', () => {
    expect(autoFitWidth([], 75)).toBe(75);
  });

  it('keeps a minimum width that is over 600', () => {
    expect(autoFitWidth([700], 640)).toBe(640);
  });
});

describe('freezeWidths', () => {
  const shown = [
    { id: 'a', minWidth: 60, size: 100 },
    { id: 'b', minWidth: 60, size: 233 },
    { id: 'c', minWidth: 80, size: 311 },
  ];

  it('writes the measured width of every flexible column and the width of the one dragged', () => {
    expect(freezeWidths({ a: 100 }, shown, 'b', 250)).toEqual({ a: 100, b: 250, c: 311 });
  });

  it('keeps the width a layout has, whatever the column measures now', () => {
    expect(freezeWidths({ a: 90, b: 200, c: 300 }, shown, 'a', 120)).toEqual({
      a: 120,
      b: 200,
      c: 300,
    });
  });

  it('holds a flexible column that was not measured to its minimum width', () => {
    expect(
      freezeWidths({}, [{ id: 'a', minWidth: 60.5, size: undefined }, ...shown.slice(1)], 'b', 240),
    ).toEqual({ a: 61, b: 240, c: 311 });
  });

  it('is a new record, and keeps the widths of columns that are not shown', () => {
    const widths = { z: 50 };
    const frozen = freezeWidths(widths, shown, 'a', 110);
    expect(frozen).not.toBe(widths);
    expect(frozen.z).toBe(50);
    expect(widths).toEqual({ z: 50 });
  });
});
