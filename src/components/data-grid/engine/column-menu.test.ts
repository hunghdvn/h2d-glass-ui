import { describe, expect, it } from 'vitest';
import { columnMenuGroups, hasMenu } from './column-menu';
import type { ColumnMenuInput } from './column-menu';

const ALL: ColumnMenuInput = {
  allowSorting: true,
  allowPinning: true,
  allowReordering: true,
  allowResizing: true,
  allowHiding: true,
  allowGrouping: false,
  sorted: false,
  pinned: undefined,
  canMoveLeft: true,
  canMoveRight: true,
  canHide: true,
  grouped: false,
  canGroup: true,
};
const NONE: ColumnMenuInput = {
  ...ALL,
  allowSorting: false,
  allowPinning: false,
  allowReordering: false,
  allowResizing: false,
  allowHiding: false,
};
const actions = (input: ColumnMenuInput) =>
  columnMenuGroups(input).map((group) => group.map((entry) => entry.action));
const disabled = (input: ColumnMenuInput) =>
  columnMenuGroups(input)
    .flat()
    .filter((entry) => entry.disabled)
    .map((entry) => entry.action);

describe('columnMenuGroups', () => {
  it('lists the groups of crop d in order for a column that can do everything', () => {
    expect(actions(ALL)).toEqual([
      ['sortAscending', 'sortDescending', 'clearSorting'],
      ['pinLeft', 'pinRight'],
      ['moveLeft', 'moveRight', 'autoFit'],
      ['hide'],
    ]);
  });

  it('has no group, and so no separator, for what a column does not allow', () => {
    expect(actions({ ...ALL, allowSorting: false })).toEqual([
      ['pinLeft', 'pinRight'],
      ['moveLeft', 'moveRight', 'autoFit'],
      ['hide'],
    ]);
    expect(actions({ ...NONE, allowHiding: true })).toEqual([['hide']]);
    expect(actions({ ...NONE, allowSorting: true, allowHiding: true })).toEqual([
      ['sortAscending', 'sortDescending', 'clearSorting'],
      ['hide'],
    ]);
  });

  it('puts the moves and the fit in one group, each by its own allow', () => {
    expect(actions({ ...NONE, allowReordering: true })).toEqual([['moveLeft', 'moveRight']]);
    expect(actions({ ...NONE, allowResizing: true })).toEqual([['autoFit']]);
  });

  it('leaves Hide out when the column is the last one shown', () => {
    expect(actions({ ...ALL, canHide: false }).at(-1)).toEqual([
      'moveLeft',
      'moveRight',
      'autoFit',
    ]);
    expect(actions({ ...NONE, allowHiding: true, canHide: false })).toEqual([]);
  });

  it('turns Clear sorting off for a column that is not sorted', () => {
    expect(disabled(ALL)).toEqual(['clearSorting']);
    expect(disabled({ ...ALL, sorted: true })).toEqual([]);
  });

  it('offers Unpin to a pinned column and turns off the side it is pinned on', () => {
    expect(actions({ ...ALL, pinned: 'left' })[1]).toEqual(['pinLeft', 'pinRight', 'unpin']);
    expect(disabled({ ...ALL, sorted: true, pinned: 'left' })).toEqual(['pinLeft']);
    expect(disabled({ ...ALL, sorted: true, pinned: 'right' })).toEqual(['pinRight']);
  });

  it('turns a move off at the edge of the zone', () => {
    expect(disabled({ ...ALL, sorted: true, canMoveLeft: false })).toEqual(['moveLeft']);
    expect(disabled({ ...ALL, sorted: true, canMoveRight: false })).toEqual(['moveRight']);
  });
});

describe('hasMenu', () => {
  it('is true when any group has an item, and false when none has', () => {
    expect(hasMenu(ALL, true, false)).toBe(true);
    expect(hasMenu(NONE, true, false)).toBe(false);
    expect(hasMenu({ ...NONE, allowHiding: true }, true, false)).toBe(true);
    expect(hasMenu({ ...NONE, allowHiding: true }, false, false)).toBe(false);
    for (const key of [
      'allowSorting',
      'allowPinning',
      'allowReordering',
      'allowResizing',
    ] as const) {
      expect(hasMenu({ ...NONE, [key]: true }, false, false)).toBe(true);
    }
  });

  it('counts "Group by this column": a column that only groups has a menu in a grid that groups', () => {
    const only = { ...NONE, showWhenGrouped: false };
    expect(hasMenu({ ...only, allowGrouping: true }, true, true)).toBe(true);
    // The grid has no panel and no grouping, or the column does not allow it, or it is the last one.
    expect(hasMenu({ ...only, allowGrouping: true }, true, false)).toBe(false);
    expect(hasMenu({ ...only, allowGrouping: false }, true, true)).toBe(false);
    expect(hasMenu({ ...only, allowGrouping: true }, false, true)).toBe(false);
    // The last one that stays shown when grouped can be grouped.
    expect(hasMenu({ ...only, allowGrouping: true, showWhenGrouped: true }, false, true)).toBe(
      true,
    );
  });
});

describe('"Group by this column"', () => {
  const GROUPS = { ...ALL, allowGrouping: true };

  it('is the second group of the menu, after the sort', () => {
    expect(actions(GROUPS)).toEqual([
      ['sortAscending', 'sortDescending', 'clearSorting'],
      ['group'],
      ['pinLeft', 'pinRight'],
      ['moveLeft', 'moveRight', 'autoFit'],
      ['hide'],
    ]);
  });

  it('is the first group when the column does not sort', () => {
    expect(actions({ ...GROUPS, allowSorting: false })[0]).toEqual(['group']);
  });

  it('is absent when the grid does not offer it', () => {
    expect(actions({ ...ALL, allowGrouping: false }).flat()).not.toContain('group');
  });

  it('is absent for the last data column shown, as Hide is', () => {
    expect(actions({ ...GROUPS, canGroup: false, canHide: false }).flat()).not.toContain('group');
  });

  it('is there and turned off for a column that is grouped, even the last one shown', () => {
    expect(disabled({ ...GROUPS, sorted: true, grouped: true })).toEqual(['group']);
    expect(actions({ ...GROUPS, grouped: true, canGroup: false }).flat()).toContain('group');
  });

  it('is enabled for a column that is not grouped', () => {
    expect(disabled({ ...GROUPS, sorted: true })).toEqual([]);
  });
});
