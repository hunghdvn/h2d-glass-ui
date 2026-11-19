import { describe, expect, it } from 'vitest';
import { columnMenuGroups, hasMenu } from './column-menu';
import type { ColumnMenuInput } from './column-menu';

const ALL: ColumnMenuInput = {
  allowSorting: true,
  allowPinning: true,
  allowReordering: true,
  allowResizing: true,
  allowHiding: true,
  sorted: false,
  pinned: undefined,
  canMoveLeft: true,
  canMoveRight: true,
  canHide: true,
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
    expect(hasMenu(ALL, true)).toBe(true);
    expect(hasMenu(NONE, true)).toBe(false);
    expect(hasMenu({ ...NONE, allowHiding: true }, true)).toBe(true);
    expect(hasMenu({ ...NONE, allowHiding: true }, false)).toBe(false);
    for (const key of [
      'allowSorting',
      'allowPinning',
      'allowReordering',
      'allowResizing',
    ] as const) {
      expect(hasMenu({ ...NONE, [key]: true }, false)).toBe(true);
    }
  });
});
