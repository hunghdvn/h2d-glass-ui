import type { DataGridPin } from '../types';

export type ColumnMenuAction =
  | 'sortAscending'
  | 'sortDescending'
  | 'clearSorting'
  | 'pinLeft'
  | 'pinRight'
  | 'unpin'
  | 'moveLeft'
  | 'moveRight'
  | 'autoFit'
  | 'hide';

export interface ColumnMenuEntry {
  action: ColumnMenuAction;
  disabled: boolean;
}

/** What the items of one column's menu depend on. */
export interface ColumnMenuInput {
  allowSorting: boolean;
  allowPinning: boolean;
  allowReordering: boolean;
  allowResizing: boolean;
  allowHiding: boolean;
  /** Whether the column is one of the columns that are sorted. */
  sorted: boolean;
  pinned: DataGridPin | undefined;
  /** Whether a step to the left (right) stays inside the column's zone. */
  canMoveLeft: boolean;
  canMoveRight: boolean;
  /** Whether more than one data column is shown: the last one cannot be hidden. */
  canHide: boolean;
}

type Item = ColumnMenuEntry | false;

/**
 * The groups of a column's menu, in the order of C1 crop d, each as a list of the items it has: a
 * group with no item is left out, and the menu draws a separator between the groups that are left. The
 * groups are built from a list, so a later plan puts its own between two of them ("Group by this
 * column" is the second).
 */
export function columnMenuGroups(input: ColumnMenuInput): ColumnMenuEntry[][] {
  const { pinned } = input;
  const groups: Item[][] = [
    input.allowSorting && [
      { action: 'sortAscending', disabled: false },
      { action: 'sortDescending', disabled: false },
      { action: 'clearSorting', disabled: !input.sorted },
    ],
    input.allowPinning && [
      { action: 'pinLeft', disabled: pinned === 'left' },
      { action: 'pinRight', disabled: pinned === 'right' },
      pinned !== undefined && { action: 'unpin', disabled: false },
    ],
    [
      input.allowReordering && { action: 'moveLeft', disabled: !input.canMoveLeft },
      input.allowReordering && { action: 'moveRight', disabled: !input.canMoveRight },
      input.allowResizing && { action: 'autoFit', disabled: false },
    ],
    [input.allowHiding && input.canHide && { action: 'hide', disabled: false }],
  ].filter((group): group is Item[] => group !== false);
  return groups
    .map((group) => group.filter((item): item is ColumnMenuEntry => item !== false))
    .filter((group) => group.length > 0);
}

/**
 * Whether the menu of a column has an item: the button that opens it is drawn only then. Decided by
 * the same groups, so the button and the menu cannot disagree.
 */
export function hasMenu(
  column: Pick<
    ColumnMenuInput,
    'allowSorting' | 'allowPinning' | 'allowReordering' | 'allowResizing' | 'allowHiding'
  >,
  canHide: boolean,
): boolean {
  return (
    columnMenuGroups({
      ...column,
      sorted: false,
      pinned: undefined,
      canMoveLeft: true,
      canMoveRight: true,
      canHide,
    }).length > 0
  );
}
