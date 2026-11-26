import { collator } from '../../../internal/intl';
import type { DataGridExpandedGroups, DataGridGroupItem } from '../types';
import { isDataColumn } from './columns';
import type { ResolvedColumn } from './columns';
import type { TextReader } from './filter';
import { compareListed, listedValue } from './listing';
import { sameKeySet } from './selection';
import { computeSummary } from './summary';
import type { ResolvedSummaryItem, SummaryValues } from './summary';
import type { Comparable } from './values';

/** One step down the tree: the column grouped by and the value of the group, as the filter holds it. */
export interface GroupStep {
  field: string;
  value: unknown;
}

/** A group of the tree: the rows that have one value of the level's column, and the groups inside it. */
export interface GroupNode<TRow> {
  /** What the state calls the group (`groupKey` of `path`). */
  key: string;
  /** The id of the column the level groups by. */
  field: string;
  /** From 1, the outermost level. */
  level: number;
  /** What the filter holds of the value: `null` for the blank group. */
  value: unknown;
  /** The text of the value, as the cells write it. */
  text: string;
  path: readonly GroupStep[];
  /** Every row inside the group, the groups of the levels below included, in the order they came. */
  rows: readonly TRow[];
  /** The groups of the next level; `null` at the last level, where `rows` are the leaves. */
  children: readonly GroupNode<TRow>[] | null;
  /** The totals of `rows`, when the grouping was given items to total. */
  totals: SummaryValues<TRow> | null;
}

/** Where a data row stands in the tree: what its ARIA says of it, and what a group's toggle needs. */
export interface RowPlace {
  /** From 1; the levels of the grouping plus 1. */
  level: number;
  /** The keys of the groups it is inside, the outermost first. */
  groups: readonly string[];
  /** The rows of its group, and its place among them from 1. */
  setsize: number;
  posinset: number;
}

// A value as text that tells it from another. A value JSON cannot write is written by `String`, so a
// key never throws.
export function written(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, part: unknown) =>
      typeof part === 'bigint' ? String(part) : part,
    );
  } catch {
    return String(value);
  }
}

/**
 * The items that group, in their order. An item whose field is not a column of the caller's (the
 * columns the grid adds for itself are not), whose column does not allow grouping, whose direction is
 * not `asc` or `desc`, or whose field came before, is dropped without a word, since a state may come
 * from the end user's storage (spec phase 6 section 5). The columns are every resolved one: a column
 * the layout hides groups all the same.
 */
export function effectiveGrouping<TRow>(
  items: readonly DataGridGroupItem[],
  columns: readonly ResolvedColumn<TRow>[],
): DataGridGroupItem[] {
  const kept: DataGridGroupItem[] = [];
  for (const item of items) {
    const column = columns.find((candidate) => candidate.id === item.field);
    if (!column || !isDataColumn(column) || !column.allowGrouping) continue;
    if (item.direction !== 'asc' && item.direction !== 'desc') continue;
    if (kept.some((other) => other.field === item.field)) continue;
    kept.push({ field: item.field, direction: item.direction });
  }
  return kept;
}

/**
 * Whether two groupings say the same: the same items in the same order, each by field and direction.
 * The grouping is an ordered list, so the order counts.
 */
export function sameGrouping(
  a: readonly DataGridGroupItem[],
  b: readonly DataGridGroupItem[],
): boolean {
  return (
    a === b ||
    (a.length === b.length &&
      a.every((item, at) => item.field === b[at]!.field && item.direction === b[at]!.direction))
  );
}

/**
 * Whether two sets of open groups say the same: the same `allExpanded`, and the same keys in `except`
 * compared as sets both ways, so a key written twice or in another order is no change.
 */
export function sameExpanded(a: DataGridExpandedGroups, b: DataGridExpandedGroups): boolean {
  if (a === b) return true;
  return a.allExpanded === b.allExpanded && sameKeySet(a.except, b.except);
}

/**
 * What the state calls a group: the JSON of its `[field, value]` steps from the outermost level, the
 * value being the one the filter holds (an ISO day for a date and a datetime, a lookup's raw value,
 * `null` for the blank). A key holds the levels above it, so the same value under two parents is two
 * groups, and a level that is added or moved makes keys that match none of the old ones.
 */
export function groupKey(path: readonly GroupStep[]): string {
  return written(path.map((step) => [step.field, step.value]));
}

interface Level<TRow> {
  item: DataGridGroupItem;
  column: ResolvedColumn<TRow>;
}

interface Pending<TRow> {
  value: unknown;
  text: string;
  sortKey: Comparable;
  rows: TRow[];
  /** The place of first appearance, which breaks a tie. */
  first: number;
}

function groupLevel<TRow>(
  rows: readonly TRow[],
  levels: readonly Level<TRow>[],
  depth: number,
  parent: readonly GroupStep[],
  read: TextReader<TRow>,
  compareText: (a: string, b: string) => number,
  items: readonly ResolvedSummaryItem<TRow>[] | undefined,
  view: ((row: TRow) => TRow | null) | undefined,
): GroupNode<TRow>[] {
  const { item, column } = levels[depth]!;
  const found = new Map<unknown, Pending<TRow>>();
  for (const row of rows) {
    const key = read.key(row, column);
    let pending = found.get(key);
    if (!pending) {
      const { text, sortKey } = listedValue(row, column, read);
      pending = { value: key, text, sortKey, rows: [], first: found.size };
      found.set(key, pending);
    }
    pending.rows.push(row);
  }
  const sign = item.direction === 'asc' ? 1 : -1;
  const ordered = [...found.values()].sort((a, b) => {
    // The blank group, and a value with nothing to order it by, come last whichever way the level
    // goes: a direction turns the values, not where "none" stands.
    if (a.value === null || b.value === null)
      return a.value === b.value ? 0 : a.value === null ? 1 : -1;
    if (a.sortKey === null || b.sortKey === null) {
      return a.sortKey === b.sortKey ? a.first - b.first : a.sortKey === null ? 1 : -1;
    }
    return compareListed(a.sortKey, b.sortKey, compareText) * sign || a.first - b.first;
  });
  return ordered.map((pending) => {
    const path = [...parent, { field: item.field, value: pending.value }];
    return {
      key: groupKey(path),
      field: item.field,
      level: depth + 1,
      value: pending.value,
      text: pending.text,
      path,
      rows: pending.rows,
      children:
        depth + 1 < levels.length
          ? groupLevel(pending.rows, levels, depth + 1, path, read, compareText, items, view)
          : null,
      totals: items ? computeSummary(pending.rows, items, view) : null,
    };
  });
}

/**
 * The rows as a tree of groups, one level for each item that groups (`effectiveGrouping`: the rest is
 * ignored). One pass over the rows for each level, with a `Map` by value, so the cost is the rows
 * times the levels. The groups of a level come in the item's direction, the values ordered as the
 * header filter's list orders them (`listedValue`); the blank group is last, and values ordered the
 * same keep the order they first appear in. The rows of a group keep their order, which is the sort's.
 * With `items` each group carries the totals of its rows, read through `view` when it is given: the groups are
 * made from the rows as they are (the saved values), the totals from what `view` shows of them (spec 3.5 step 6).
 * No level that groups: no tree.
 */
export function groupRows<TRow>(
  rows: readonly TRow[],
  grouping: readonly DataGridGroupItem[],
  columns: readonly ResolvedColumn<TRow>[],
  read: TextReader<TRow>,
  locale: string,
  items?: readonly ResolvedSummaryItem<TRow>[],
  view?: (row: TRow) => TRow | null,
): readonly GroupNode<TRow>[] {
  const levels: Level<TRow>[] = effectiveGrouping(grouping, columns).map((item) => ({
    item,
    column: columns.find((candidate) => candidate.id === item.field)!,
  }));
  if (levels.length === 0) return [];
  const compareText = collator(locale, { numeric: true }).compare;
  return groupLevel(rows, levels, 0, [], read, compareText, items, view);
}

/** The data rows in the order the tree shows them: the leaves, in group order. */
export function groupedRows<TRow>(tree: readonly GroupNode<TRow>[]): TRow[] {
  const rows: TRow[] = [];
  const visit = (nodes: readonly GroupNode<TRow>[]) => {
    for (const node of nodes) {
      if (node.children) visit(node.children);
      else for (const row of node.rows) rows.push(row);
    }
  };
  visit(tree);
  return rows;
}

/** The place of each row of `groupedRows(tree)`, in the same order. */
export function rowPlaces<TRow>(tree: readonly GroupNode<TRow>[]): RowPlace[] {
  const places: RowPlace[] = [];
  const visit = (nodes: readonly GroupNode<TRow>[], groups: readonly string[]) => {
    for (const node of nodes) {
      const inside = [...groups, node.key];
      if (node.children) {
        visit(node.children, inside);
        continue;
      }
      node.rows.forEach((_row, index) => {
        places.push({
          level: node.level + 1,
          groups: inside,
          setsize: node.rows.length,
          posinset: index + 1,
        });
      });
    }
  };
  visit(tree, []);
  return places;
}
