import { withDefaults } from '../../internal/with-defaults';
import type { DataGridLabels, DataGridLabelsInput, DataGridSortDirection } from './types';

const directionWord = (direction: DataGridSortDirection) =>
  direction === 'asc' ? 'ascending' : 'descending';

/** The English default of every label; `labels` of the grid is merged over it with `withDefaults`. */
export const DEFAULT_LABELS: DataGridLabels = {
  yes: 'Yes',
  no: 'No',
  // One sorted column is said by `aria-sort` and needs nothing more.
  sortState: (direction, level, count) =>
    count > 1 ? `, sorted ${directionWord(direction)}, ${level} of ${count}` : '',
  announceSort: (sorted) =>
    `Sorted by ${sorted
      .map((item) => `${item.caption}, ${directionWord(item.direction)}`)
      .join(', then ')}`,
  announceSortCleared: 'Sorting cleared',
  pageInfo: (from, to, total) => `${from}–${to} of ${total}`,
  rowsPerPage: 'Rows per page',
  pageSize: (size) => `${size} / page`,
  pagination: 'Pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  page: (page) => `Page ${page}`,
  selectAllOnPage: 'Select all rows on this page',
  selectAll: 'Select all rows',
  selectRow: (name) => `Select ${name}`,
  announceSelected: (count) => `${count} ${count === 1 ? 'row' : 'rows'} selected`,
  loading: 'Loading…',
  search: 'Search',
  searchPlaceholder: 'Search…',
  noData: 'No data',
  noMatches: 'No rows match the filter',
  clearFilter: 'Clear filter',
  filterCell: (caption) => `Filter ${caption}`,
  operator: (name) => `Operator: ${name}`,
  operators: {
    '=': 'Equals',
    '<>': 'Does not equal',
    '<': 'Less than',
    '>': 'Greater than',
    '<=': 'Less than or equal to',
    '>=': 'Greater than or equal to',
    between: 'Between',
    contains: 'Contains',
    notContains: 'Does not contain',
    startsWith: 'Starts with',
    endsWith: 'Ends with',
  },
  panelOperators: {
    '=': '=',
    '<>': '≠',
    '<': '<',
    '>': '>',
    '<=': '≤',
    '>=': '≥',
    contains: 'contains',
    notContains: 'does not contain',
    startsWith: 'starts with',
    endsWith: 'ends with',
  },
  quoted: (text) => `‘${text}’`,
  all: '(All)',
  between: 'From – to',
  from: 'From',
  to: 'To',
  range: (from, to) => `${from} – ${to}`,
  filterColumn: (caption, active) => `Filter ${caption}${active ? ' (filtered)' : ''}`,
  searchValues: 'Search values…',
  searchValuesName: 'Search values',
  selectAllValues: '(Select all)',
  blank: '(Blanks)',
  moreValues: (shown, total) => `Showing ${shown} of ${total} values. Search to narrow them.`,
  and: 'and',
  isAnyOf: 'is any of',
  isNoneOf: 'is none of',
  applyFilter: 'Apply filter',
  ok: 'OK',
  cancel: 'Cancel',
  announceRowsFound: (count) => (count === 0 ? 'No rows' : count === 1 ? '1 row' : `${count} rows`),
  columnWidth: (px) => `${px} px`,
  announceResized: (caption, px) => `${caption}, ${px} pixels wide`,
  announceMoved: (caption, position, count) => `${caption} moved to column ${position} of ${count}`,
  columnMenu: (caption) => `${caption} column menu`,
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  clearSorting: 'Clear sorting',
  pinLeft: 'Pin to the left',
  pinRight: 'Pin to the right',
  unpin: 'Unpin',
  moveLeft: 'Move left',
  moveRight: 'Move right',
  autoFit: 'Fit width to content',
  hideColumn: 'Hide column',
  announcePinned: (caption, side) => `${caption} pinned to the ${side}`,
  announceUnpinned: (caption) => `${caption} unpinned`,
  announceHidden: (caption) => `${caption} hidden`,
  announceShown: (caption) => `${caption} shown`,
  columnChooser: 'Columns',
  lockedColumn: 'Always shown',
  lastShownColumn: 'At least one column stays shown',
  groupCount: (count) => `(${count})`,
  continued: '(continued)',
  groupsAndDetails: 'Groups and details',
  groupColumn: (caption) => `${caption}:`,
  groupPanel: 'Grouping',
  groupBy: 'Group by',
  groupPanelHint: 'Drag a column header here to group by that column',
  groupDirection: (caption, next) => `Sort ${caption} groups ${directionWord(next)}`,
  ungroup: (caption) => `Ungroup ${caption}`,
  groupByColumn: 'Group by this column',
  announceGrouped: (caption) => `Grouped by ${caption}`,
  announceUngrouped: (caption) => `${caption} ungrouped`,
  announceGroupMoved: (caption, level, count) =>
    `${caption} moved to grouping level ${level} of ${count}`,
};

/**
 * The labels of a grid: the defaults with the caller's over them. `operators` and `panelOperators` are
 * records, merged one level deep (`withDefaults` of their own), so a partial record keeps the words it
 * leaves out.
 */
export function mergeLabels(given: DataGridLabelsInput | undefined): DataGridLabels {
  const { operators, panelOperators, ...others } = given ?? {};
  return {
    ...withDefaults(DEFAULT_LABELS, others),
    operators: withDefaults(DEFAULT_LABELS.operators, operators),
    panelOperators: withDefaults(DEFAULT_LABELS.panelOperators, panelOperators),
  };
}
