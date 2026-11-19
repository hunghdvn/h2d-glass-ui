import type { DataGridLabels, DataGridSortDirection } from './types';

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
  noData: 'No data',
  columnWidth: (px) => `${px} px`,
  announceResized: (caption, px) => `${caption}, ${px} pixels wide`,
  announceMoved: (caption, position, count) => `${caption} moved to column ${position} of ${count}`,
};
