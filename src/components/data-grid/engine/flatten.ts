import type { DataGridExpandedGroups, DataGridKey } from '../types';
import type { GroupNode, RowPlace } from './group';

/**
 * A data row of the list. `level` is 1 without grouping and the levels of the grouping plus 1 with it
 * (the `aria-level`); `groups` are the keys of the groups the row is inside, the outermost first;
 * `setsize` and `posinset` are the rows of its group and its place among them from 1, or 0 and 0
 * without grouping. Where a row stands in its group does not depend on which groups are open, so the
 * object of a row stays the same when a group is toggled.
 */
export interface FlatDataRow<TRow> {
  kind: 'data';
  key: DataGridKey;
  row: TRow;
  level: number;
  groups: readonly string[];
  setsize: number;
  posinset: number;
}

/**
 * The row of a group. `key` is the group's key, `level` its level from 1, `setsize` and `posinset` the
 * groups of its level inside its parent and its place among them. `continued` marks the repeat of a
 * group at the top of a page that starts inside it (`pageRows`); the list the grid flattens has none.
 */
export interface FlatGroupRow<TRow> {
  kind: 'group';
  key: string;
  node: GroupNode<TRow>;
  level: number;
  expanded: boolean;
  setsize: number;
  posinset: number;
  continued: boolean;
}

/** The detail row of a data row: its key is the key of that row, and its level the row's. */
export interface FlatDetailRow<TRow> {
  kind: 'detail';
  key: DataGridKey;
  row: TRow;
  level: number;
}

/** A row of the list the grid shows. */
export type FlatRow<TRow> = FlatDataRow<TRow> | FlatGroupRow<TRow> | FlatDetailRow<TRow>;

const NO_GROUPS: readonly string[] = [];
const UNGROUPED: RowPlace = { level: 1, groups: NO_GROUPS, setsize: 0, posinset: 0 };

function sameGroups(a: readonly string[], b: readonly string[]): boolean {
  return a === b || (a.length === b.length && a.every((key, index) => key === b[index]));
}

/**
 * One data row for each row, in order. `getKey` reads the key from the row and its index, once for
 * each row. `places` say where each row stands in its groups, by index (`rowPlaces`); without them the
 * rows are ungrouped. `previous` is the list made the last time: each of its rows whose row object,
 * key and place are the ones of now is given back as it was, found by its key and not by its index, so
 * a row that moved is the object it was. An immutable edit of one row (a new `data` array with one new
 * object) makes one new data row and draws one row again, and a key function that is new but says the
 * same (one written in the JSX) makes none. When every row is the one of before, in the same order,
 * the list itself is given back.
 */
export function flattenRows<TRow>(
  rows: readonly TRow[],
  getKey: (row: TRow, index: number) => DataGridKey,
  previous?: readonly FlatDataRow<TRow>[],
  places?: readonly RowPlace[],
): readonly FlatDataRow<TRow>[] {
  let same = previous?.length === rows.length;
  let byKey: Map<DataGridKey, FlatDataRow<TRow>> | undefined;
  const flat = rows.map((row, index): FlatDataRow<TRow> => {
    const key = getKey(row, index);
    const { level, groups, setsize, posinset } = places?.[index] ?? UNGROUPED;
    const fits = (before: FlatDataRow<TRow> | undefined): before is FlatDataRow<TRow> =>
      before !== undefined &&
      before.row === row &&
      before.key === key &&
      before.level === level &&
      before.setsize === setsize &&
      before.posinset === posinset &&
      sameGroups(before.groups, groups);
    const here = previous?.[index];
    if (fits(here)) return here;
    same = false;
    if (previous) {
      byKey ??= new Map(previous.map((before) => [before.key, before]));
      const found = byKey.get(key);
      if (fits(found)) return found;
    }
    return { kind: 'data', key, row, level, groups, setsize, posinset };
  });
  return same && previous ? previous : flat;
}

/**
 * Whether a group is open: every group is when `allExpanded`, but the ones in `except`, and none is
 * when not, but the ones in `except`. The one rule of the flattening and of a toggle.
 */
export function isGroupOpen(
  expanded: { allExpanded: boolean; except: readonly string[] | ReadonlySet<string> },
  key: string,
): boolean {
  const { except } = expanded;
  const listed = 'has' in except ? except.has(key) : except.includes(key);
  return expanded.allExpanded !== listed;
}

export interface FlattenInput<TRow> {
  /** The groups, or `null` when the rows are not grouped. */
  tree: readonly GroupNode<TRow>[] | null;
  /** The data rows in the order the tree shows them (`groupedRows`), each with its place. */
  keyed: readonly FlatDataRow<TRow>[];
  expanded: DataGridExpandedGroups;
  /** The keys of the rows whose detail is open. */
  expandedRows: ReadonlySet<DataGridKey>;
  /** Whether a row has a detail; without it no row does, whatever `expandedRows` holds. */
  hasDetail: ((row: TRow) => boolean) | undefined;
}

/**
 * The list the grid shows: a group row for each group, then its groups or its data rows when it is
 * open, and a detail row right after each data row whose key is in `expandedRows` and that has a detail.
 * Each data row is the keyed object itself. `previous` is the list made the last time: a group row whose
 * group, state and place are the same, and a detail row whose row and level are, are given back as they
 * were, so opening one group makes one new group row and draws it and the rows that come or go. With
 * nothing new the list itself is given back, and without a tree or a detail to add, the keyed rows.
 */
export function flattenTree<TRow>(
  { tree, keyed, expanded, expandedRows, hasDetail }: FlattenInput<TRow>,
  previous?: readonly FlatRow<TRow>[],
): readonly FlatRow<TRow>[] {
  const withDetails = hasDetail !== undefined && expandedRows.size > 0;
  if (!tree && !withDetails) return keyed;

  let before:
    | { groups: Map<string, FlatGroupRow<TRow>>; details: Map<DataGridKey, FlatDetailRow<TRow>> }
    | undefined;
  const earlier = () => {
    if (!before) {
      before = { groups: new Map(), details: new Map() };
      for (const row of previous ?? []) {
        if (row.kind === 'group') before.groups.set(row.key, row);
        else if (row.kind === 'detail') before.details.set(row.key, row);
      }
    }
    return before;
  };

  const list: FlatRow<TRow>[] = [];
  const pushData = (row: FlatDataRow<TRow>) => {
    list.push(row);
    if (!withDetails || !expandedRows.has(row.key) || !hasDetail(row.row)) return;
    const was = earlier().details.get(row.key);
    list.push(
      was && was.row === row.row && was.level === row.level
        ? was
        : { kind: 'detail', key: row.key, row: row.row, level: row.level },
    );
  };

  if (!tree) {
    for (const row of keyed) pushData(row);
    return list.length === keyed.length ? keyed : settle(list, previous);
  }

  const except = new Set(expanded.except);
  // The keyed rows are in the order of the tree, so a walk of it only needs to know how many rows a
  // group holds to step over the ones a closed group hides.
  let cursor = 0;
  const visit = (nodes: readonly GroupNode<TRow>[]) => {
    nodes.forEach((node, index) => {
      const open = isGroupOpen({ allExpanded: expanded.allExpanded, except }, node.key);
      const was = earlier().groups.get(node.key);
      const setsize = nodes.length;
      const posinset = index + 1;
      list.push(
        was &&
          was.node === node &&
          was.expanded === open &&
          was.setsize === setsize &&
          was.posinset === posinset
          ? was
          : {
              kind: 'group',
              key: node.key,
              node,
              level: node.level,
              expanded: open,
              setsize,
              posinset,
              continued: false,
            },
      );
      if (node.children) {
        if (open) visit(node.children);
        else cursor += node.rows.length;
        return;
      }
      if (open) for (let at = 0; at < node.rows.length; at++) pushData(keyed[cursor + at]!);
      cursor += node.rows.length;
    });
  };
  visit(tree);
  return settle(list, previous);
}

// The list just made, or the one before it when every row is the same object in the same order.
function settle<TRow>(
  list: FlatRow<TRow>[],
  previous: readonly FlatRow<TRow>[] | undefined,
): readonly FlatRow<TRow>[] {
  return previous && previous.length === list.length && list.every((row, i) => row === previous[i])
    ? previous
    : list;
}
