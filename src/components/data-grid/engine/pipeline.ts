import type {
  DataGridExpandedGroups,
  DataGridFilter,
  DataGridGroupItem,
  DataGridKey,
  DataGridPage,
  DataGridSortItem,
} from '../types';
import { isDataColumn } from './columns';
import type { ResolvedColumn } from './columns';
import { freshRow, overlayRows, withPinned } from './edit';
import type { ShownRows } from './edit';
import {
  conditionOf,
  filterRows,
  foldedSearch,
  headerConditionFilters,
  rowConditionFilters,
  searchRows,
} from './filter';
import type { TextReader } from './filter';
import { flattenRows, flattenTree } from './flatten';
import type { FlatDataRow, FlatRow } from './flatten';
import { effectiveGrouping, groupRows, groupedRows, rowPlaces, written } from './group';
import type { GroupNode, RowPlace } from './group';
import { clampPageIndex, countRows, pageCount, pageRows } from './page';
import { sortRows } from './sort';
import { computeSummary } from './summary';
import type { ResolvedSummaryItem, SummaryValues } from './summary';

export interface PipelineInput<TRow> {
  data: readonly TRow[];
  /** The columns that are shown: the sort reads the ones its items name, the search the ones it reads. */
  columns: readonly ResolvedColumn<TRow>[];
  /** The filter: the search, and the conditions of the columns. */
  filter: DataGridFilter;
  /** Every resolved column, the hidden ones too: a condition of a hidden column still filters. */
  filterColumns: readonly ResolvedColumn<TRow>[];
  /** The texts of the cells, written and folded once for the search and the filter. */
  read: TextReader<TRow>;
  /** The key of a row, from the row and its index in the sorted list. */
  getKey: (row: TRow, index: number) => DataGridKey;
  sort: readonly DataGridSortItem[];
  /** The grouping as the grid holds it: `effectiveGrouping` decides which items group. */
  grouping: readonly DataGridGroupItem[];
  /** Every resolved column, the hidden ones too: a column the layout hides still groups. */
  groupColumns: readonly ResolvedColumn<TRow>[];
  /**
   * The totals, resolved: those of the footer (`total`, over every row after the filter) and those of
   * the group rows (`group`); `null` has none.
   */
  summary: {
    total: readonly ResolvedSummaryItem<TRow>[];
    group: readonly ResolvedSummaryItem<TRow>[];
  } | null;
  /** Which groups are open. */
  expanded: DataGridExpandedGroups;
  /** The keys of the rows whose detail is open. */
  expandedRows: readonly DataGridKey[];
  /** Whether a row has a detail; `undefined` when the grid has none. */
  hasDetail: ((row: TRow) => boolean) | undefined;
  /** `null` is not paged: every row is one page. */
  page: DataGridPage | null;
  /**
   * Server mode: `data` is already searched, filtered and sorted and is the page; only the count is
   * the grid's to work out.
   */
  remote: boolean;
  totalCount: number | undefined;
  locale: string;
  /**
   * The unsaved changes over the rows (step 2 of spec 3.5: `applyChanges`, which the caller keeps by `data` and
   * the changes), or `null` for none. The rows it pins are kept by the search and the filter and are not
   * moved by the sort and the groups, which read the saved values; the rows are shown with the changes over
   * them, the totals read the shown values, and its new rows are put outside the groups. A value typed in an
   * editor is no input: the caller passes the same object until a change is committed.
   */
  changes: ShownRows<TRow> | null;
  /** Where the new rows stand: before the list (and at the top of every page) or after it. */
  newRowPosition: 'first' | 'last';
  /** The row whose form is open, which is a form row in the place of its row (or of its new row). */
  form: { key: DataGridKey; added: boolean } | null;
}

export interface PipelineResult<TRow> {
  /** The rows the search keeps, before the conditions of the columns: the header filter's list narrows from them. */
  searched: readonly TRow[];
  /** All the rows after searching, filtering and sorting, before grouping and paging. */
  rows: readonly TRow[];
  /** The groups; `null` when no item of the grouping groups, and in server mode. */
  tree: readonly GroupNode<TRow>[] | null;
  /**
   * Every data row after the filter, in the order shown (the groups' order when grouped), each with its
   * key and its place in its groups; the rows a closed group hides are in it.
   */
  keyed: readonly FlatDataRow<TRow>[];
  /**
   * `keyed` as it was before the unsaved changes went over it: the saved rows themselves, in the order shown,
   * a closed group's and every page's included, and no new row. The same array while the rows and their order
   * are the same, whatever the changes do. In server mode it is the page. The CSV export writes these.
   */
  savedRows: readonly FlatDataRow<TRow>[];
  /** The totals of every row after the search and the filter; `null` without items, and in server mode. */
  totals: SummaryValues<TRow> | null;
  /** The list the grid draws from: data, group and detail rows; the whole list, not a page. */
  flat: readonly FlatRow<TRow>[];
  /**
   * The count of rows the pager counts: the data and group rows of `flat` (`countRows`), or
   * `totalCount` in server mode.
   */
  total: number;
  pageCount: number;
  /** The index of the page shown, which may differ from the one asked for. */
  pageIndex: number;
  /** The page: the flat rows to draw. */
  visible: readonly FlatRow<TRow>[];
}

// The conditions of the filter that filter, written as one text, and the columns they name. A
// condition that filters nothing, of a column the grid does not have, or put aside by `enabled:
// false` is not in it, so a change to one of those runs no step again.
function filterSignature<TRow>(
  filter: DataGridFilter,
  columns: readonly ResolvedColumn<TRow>[],
): { signature: string; named: ResolvedColumn<TRow>[] } {
  const named: ResolvedColumn<TRow>[] = [];
  const parts: string[] = [];
  if (filter.enabled === false) return { signature: '', named };
  for (const column of columns) {
    if (!isDataColumn(column)) continue;
    const condition = conditionOf(filter, column.id);
    if (!condition) continue;
    const onRow = rowConditionFilters(column, condition);
    const onHeader = headerConditionFilters(condition);
    if (!onRow && !onHeader) continue;
    named.push(column);
    parts.push(
      written([
        column.id,
        onRow ? [condition.operator ?? column.operators[0], condition.value] : null,
        onHeader ? [condition.values, condition.exclude === true] : null,
      ]),
    );
  }
  return { signature: parts.join('\u0002'), named };
}

// Remembers the last result of one step by the identity of what it was computed from. The step is
// given its last result, for the ones that keep the parts that did not change.
function memo<T>() {
  let last: { deps: readonly unknown[]; value: T } | undefined;
  return (deps: readonly unknown[], compute: (previous: T | undefined) => T): T => {
    if (
      last &&
      last.deps.length === deps.length &&
      deps.every((d, i) => Object.is(d, last!.deps[i]))
    ) {
      return last.value;
    }
    const value = compute(last?.value);
    last = { deps, value };
    return value;
  };
}

// A list of values as a set that is the one given last time when it has the same members, so that
// a step remembered by the set does not run again for an array written anew on every render.
function stableSet<T>() {
  let held: ReadonlySet<T> = new Set();
  return (values: readonly T[]): ReadonlySet<T> => {
    const next = new Set(values);
    if (next.size !== held.size || values.some((value) => !held.has(value))) held = next;
    return held;
  };
}

/**
 * The steps of spec 3.5 that Plans B, D and E have: search, filter, sort, group, total, flatten, page.
 * Each step remembers its result by the identity of its inputs, so a new page runs only the page step
 * and the same inputs give back the same objects. The sort is compared by value (`field` and
 * `direction` of each item), since an app writes it as a new array on every render, and of the
 * columns only those its items name count, so a column hidden or shown sorts again only when the sort
 * is by it. The grouping is compared the same way, by the items that group and the columns they name.
 *
 * The search keeps the rows with the query in a shown column that allows searching; it is remembered
 * by the folded query and by those columns taken as a set, so a reorder, a width, or the hide of a
 * column the search does not read runs it no more. The filter keeps the rows that pass every condition
 * that filters, of every resolved column, the hidden ones too; it is remembered by the rows the search
 * kept and by a signature of those conditions, so a condition that filters nothing, a new object with
 * the same conditions, and any hide or reorder run it no more. A step that leaves every row gives back
 * its input, so the steps after it see the same array. The sort works on the filtered rows.
 *
 * The group step builds the tree from the sorted rows (a sort runs it, a hide does not), and the
 * totals of the footer are computed from the filtered rows, so the order does not matter to them. The
 * flatten step is two: the data rows in the order shown, which are kept by key, and the list with the
 * group rows and the detail rows, which a toggle of a group or a detail runs alone. The exceptions
 * of `expanded` and `expandedRows` are compared as sets.
 *
 * New rows or a new `getKey` read the keys again, and keep each data row that is the same as before,
 * and the flat list when they all are (`flattenRows`): an app writes a `rowKey` function as a new one
 * on every render, and edits one row by making a new `data` array. In server mode the search, the
 * filter, the sort, the group and the total steps are skipped and the data is the page (the details
 * of the open rows are still put in). The virtual window is not a step: only the scroll knows it, and
 * it reads `flat`.
 *
 * The unsaved changes (`changes`, step 2) are over the saved rows: the search and the filter keep the rows
 * they pin whatever they read, the sort and the groups read the saved values, so a row with a change never
 * leaves and never moves; the shown rows, the new rows and the form row come at the flattening, and the
 * totals read the shown values. A committed change is a new `changes` object: it runs the overlay, the
 * footer's totals, the flattening and the page, and the search and the filter only when the set of pinned
 * rows is another; the same object runs nothing.
 */
export function createPipeline<TRow>() {
  const searched = memo<readonly TRow[]>();
  const filtered = memo<readonly TRow[]>();
  const sorted = memo<readonly TRow[]>();
  const grouped = memo<readonly GroupNode<TRow>[]>();
  const shownOrder = memo<{ rows: TRow[]; places: RowPlace[] }>();
  const totaled = memo<SummaryValues<TRow>>();
  const flatList = memo<readonly FlatRow<TRow>[]>();
  const counted = memo<number>();
  const paged = memo<readonly FlatRow<TRow>[]>();
  const whole = memo<PipelineResult<TRow>>();
  const exceptions = stableSet<string>();
  const openRows = stableSet<DataGridKey>();
  // The rows that must not leave the search or the filter, as a set: a committed change that pins the
  // same rows runs neither step.
  const pinnedRows = stableSet<TRow>();
  const overlaid = memo<readonly FlatDataRow<TRow>[]>();
  const addedList = memo<readonly FlatDataRow<TRow>[]>();
  let keyedState:
    | {
        rows: readonly TRow[];
        getKey: PipelineInput<TRow>['getKey'];
        places: readonly RowPlace[] | undefined;
        value: readonly FlatDataRow<TRow>[];
      }
    | undefined;

  return {
    run({
      data,
      columns,
      filter,
      filterColumns,
      read,
      getKey,
      sort,
      grouping,
      groupColumns,
      summary,
      expanded,
      expandedRows,
      hasDetail,
      page,
      remote,
      totalCount,
      locale,
      changes,
      newRowPosition,
      form,
    }: PipelineInput<TRow>): PipelineResult<TRow> {
      // Step 2, the rows over the saved ones: `changes` is what `applyChanges` made of the data and the
      // changes. With none the steps below see the data as it is.
      const active = changes !== null && changes.pinned.size > 0 ? changes : null;
      const pinned = pinnedRows(active ? [...active.pinnedRows] : []);

      // Step 3, the search. The columns it reads are the shown ones that allow it, in the order of
      // their ids so that a reorder is the same set.
      const query = remote ? '' : foldedSearch(filter.search);
      let afterSearch = data;
      if (query !== '') {
        const searchable = columns
          .filter((column) => isDataColumn(column) && column.allowSearch)
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        afterSearch = searched([data, read, query, pinned, ...searchable], () =>
          withPinned(data, searchRows(data, searchable, query, read), pinned),
        );
      }

      // Step 4, the conditions of the columns.
      let afterFilter = afterSearch;
      if (!remote) {
        const { signature, named } = filterSignature(filter, filterColumns);
        if (signature !== '') {
          afterFilter = filtered([afterSearch, read, signature, pinned, ...named], () =>
            withPinned(afterSearch, filterRows(afterSearch, filterColumns, filter, read), pinned),
          );
        }
      }

      // Step 5, the sort.
      const sortSignature = sort
        .map((item) => `${item.field}\u0001${item.direction}`)
        .join('\u0002');
      // The sort reads only the columns its items name, among the shown ones: hiding or showing
      // another column gives another `columns` and sorts nothing again.
      const sortNamed = sort.flatMap((item) => {
        const column = columns.find((candidate) => candidate.id === item.field);
        return column ? [column] : [];
      });
      const rows = sorted([remote, afterFilter, locale, sortSignature, ...sortNamed], () =>
        remote ? data : sortRows(afterFilter, sort, columns, locale),
      );

      // Step 6, the groups. Only the items that group count, and of the columns only the ones they
      // name: a hide, a width or a reorder runs nothing here. The group totals are part of the step.
      const levels = remote ? [] : effectiveGrouping(grouping, groupColumns);
      const groupItems = summary && summary.group.length > 0 ? summary.group : undefined;
      let tree: readonly GroupNode<TRow>[] | null = null;
      if (levels.length > 0) {
        const groupSignature = levels
          .map((item) => `${item.field}\u0001${item.direction}`)
          .join('\u0002');
        const groupNamed = levels.map((item) =>
          groupColumns.find((candidate) => candidate.id === item.field)!,
        );
        // The totals of a group read the shown values, so a committed change computes them again; without
        // totals the groups read none and a change runs nothing here.
        const groupView = groupItems && active ? active.view : undefined;
        tree = grouped(
          [rows, read, locale, groupSignature, groupItems, groupView, ...groupNamed],
          () => groupRows(rows, levels, groupColumns, read, locale, groupItems, groupView),
        );
      }

      // Step 7, the totals of the footer: every row after the filter, so a sort runs no total.
      const totalItems = !remote && summary && summary.total.length > 0 ? summary.total : null;
      // They read the shown values, over the new rows too, and no row marked for deletion.
      const totals = totalItems
        ? totaled([afterFilter, read, totalItems, active], () =>
            active
              ? computeSummary(
                  active.added.length > 0
                    ? [...afterFilter, ...active.added.map((one) => one.row)]
                    : afterFilter,
                  totalItems,
                  active.view,
                )
              : computeSummary(afterFilter, totalItems),
          )
        : null;

      // Step 8, the flattening. First the data rows in the order shown, with their keys and places:
      // the list made last is offered back, so each row that is the same is kept.
      const order = tree
        ? shownOrder([tree], () => ({ rows: groupedRows(tree), places: rowPlaces(tree) }))
        : undefined;
      const shown = order ? order.rows : rows;
      const places = order?.places;
      if (
        keyedState?.rows !== shown ||
        keyedState.getKey !== getKey ||
        keyedState.places !== places
      ) {
        keyedState = {
          rows: shown,
          getKey,
          places,
          value: flattenRows(shown, getKey, keyedState?.value, places),
        };
      }
      // The rows of a change are shown with it over them; every other row is the object it was.
      const keyedSaved = keyedState.value;
      const keyed = overlaid([keyedSaved, active], (previous) =>
        overlayRows(keyedSaved, active, previous),
      );
      // The new rows, outside the groups, which flatten with the form that is open.
      const fresh = active ? active.added.map(freshRow) : [];
      const added = addedList(fresh, () => fresh);
      // Then the list: the groups that are open and the details of the rows that are. A toggle runs
      // this alone.
      const exceptSet = exceptions(expanded.except);
      const detailSet = openRows(expandedRows);
      const flat = flatList(
        [
          tree,
          keyed,
          expanded.allExpanded,
          exceptSet,
          detailSet,
          hasDetail,
          added,
          newRowPosition,
          form?.key,
          form?.added,
        ],
        (previous) =>
          flattenTree(
            {
              tree,
              keyed,
              expanded,
              expandedRows: detailSet,
              hasDetail,
              added,
              newRowPosition,
              form,
            },
            previous,
          ),
      );

      // Step 9, the page.
      const total = remote ? (totalCount ?? data.length) : counted([flat], () => countRows(flat));
      const pageIndex = page ? clampPageIndex(page.index, total, page.size) : 0;
      const pages = page ? pageCount(total, page.size) : 1;
      // Server mode shows what it was given.
      const size = page && !remote ? page.size : undefined;
      const visible = paged([flat, pageIndex, size], () =>
        size === undefined ? flat : pageRows(flat, { index: pageIndex, size }),
      );

      return whole(
        [
          afterSearch,
          rows,
          tree,
          keyed,
          keyedSaved,
          totals,
          flat,
          visible,
          total,
          pages,
          pageIndex,
        ],
        () => ({
          searched: afterSearch,
          rows,
          tree,
          keyed,
          savedRows: keyedSaved,
          totals,
          flat,
          total,
          pageCount: pages,
          pageIndex,
          visible,
        }),
      );
    },
  };
}
