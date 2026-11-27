import { withDefaults } from '../../internal/with-defaults';
import type { DatePickerLabels } from '../date-picker/DatePicker';
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
  exportCsv: 'Export CSV',
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
  summary: { count: 'Count', sum: 'Total', avg: 'Average', min: 'Min', max: 'Max' },
  summaryLabel: (label) => `${label}:`,
  summaryOf: (type, caption) => `${type} of ${caption}`,
  showDetails: (name) => `Show details of ${name}`,
  hideDetails: (name) => `Hide details of ${name}`,
  reorderColumn: 'Reorder',
  reorderRow: (name) => `Reorder ${name}`,
  moveUp: 'Move up',
  moveDown: 'Move down',
  moveToTop: 'Move to top',
  moveToBottom: 'Move to bottom',
  reorderDisabled: 'Clear sorting and grouping to reorder rows',
  announceRowMoved: (name, position, count) => `${name} moved to row ${position} of ${count}`,
  actions: 'Actions',
  edit: (name) => `Edit ${name}`,
  save: (name) => `Save ${name}`,
  cancelEdit: (name) => `Cancel editing ${name}`,
  editRowTitle: (name) => `Edit ${name}`,
  newRowTitle: 'New row',
  requiredHint: 'Fields marked * are required.',
  saveButton: 'Save',
  announceSaved: 'Changes saved',
  delete: (name) => `Delete ${name}`,
  deleteTitle: 'Delete this row?',
  deleteDescription: (name) => `${name} will be deleted.`,
  deleteConfirm: 'Delete',
  saveFailed: 'The changes could not be saved.',
  dismissError: 'Dismiss',
  announceRowDeleted: 'Row deleted',
  addRow: 'Add row',
  newRow: '(new)',
  announceRowAdded: 'Row added',
  changedCell: 'changed',
  deletedRow: 'marked for deletion',
  announceRowMarkedDeleted: 'Row marked for deletion',
  undoDelete: (name) => `Undo deleting ${name}`,
  unsavedChanges: (count) => (count === 1 ? '1 unsaved change' : `${count} unsaved changes`),
  saveChanges: 'Save changes',
  discardChanges: 'Discard changes',
  announceErrors: (count) =>
    count === 1 ? '1 field needs attention' : `${count} fields need attention`,
  validation: {
    required: (caption) => `${caption} is required`,
    range: (caption, min, max) =>
      min !== undefined && max !== undefined
        ? `${caption} must be between ${min} and ${max}`
        : min !== undefined
          ? `${caption} must be at least ${min}`
          : `${caption} must be at most ${max}`,
    stringLength: (caption, min, max) =>
      min !== undefined && max !== undefined
        ? `${caption} must be between ${min} and ${max} characters`
        : min !== undefined
          ? `${caption} must be at least ${min} characters`
          : `${caption} must be at most ${max} characters`,
    pattern: (caption) => `${caption} is not valid`,
    email: (caption) => `${caption} must be an email address`,
  },
  // Each is the default of the control that takes it, written out: the controls keep theirs.
  controls: {
    chooseDate: 'Choose date',
    invalidDate: 'Invalid date',
    unavailableDate: 'This date is not available',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    increase: 'Increase',
    decrease: 'Decrease',
    noResults: 'No results',
    results: (count) => (count === 1 ? '1 result' : `${count} results`),
    clearSearch: 'Clear search',
  },
};

/**
 * The labels that are records of words: `mergeLabels` merges them one level deep and `sameLabels` compares
 * them by their words. The one list, so a record added to the labels is handled in both.
 */
export const LABEL_RECORDS = [
  'operators',
  'panelOperators',
  'summary',
  'validation',
  'controls',
] as const satisfies readonly (keyof DataGridLabels)[];

/**
 * The labels of a grid: the defaults with the caller's over them. The records of `LABEL_RECORDS` are merged
 * one level deep (`withDefaults` of their own), so a partial record keeps the words it leaves out.
 */
export function mergeLabels(given: DataGridLabelsInput | undefined): DataGridLabels {
  const merged = withDefaults(DEFAULT_LABELS, given as Partial<DataGridLabels> | undefined);
  return Object.assign(
    merged,
    Object.fromEntries(
      LABEL_RECORDS.map((key) => [key, withDefaults<object>(DEFAULT_LABELS[key], given?.[key])]),
    ),
  );
}

/** The words the grid hands to the controls it draws, each in the shape of that control's own `labels`. */
export interface ControlLabels {
  /** For a DatePicker: the button, the dialog, the faults and the calendar's month buttons. */
  date: DatePickerLabels;
  /** For a NumberInput. */
  number: { increment: string; decrement: string };
  /** For a Combobox. */
  combobox: { noResults: string; results: (count: number) => string };
  /** For a SearchField. */
  search: { clear: string };
}

/**
 * The `controls` labels in the shape each control takes. The grid makes it once per `labels` (the controls'
 * parts get the same objects on every draw), never in a cell's render.
 */
export function controlLabelsOf(controls: DataGridLabels['controls']): ControlLabels {
  return {
    date: {
      openCalendar: controls.chooseDate,
      dialog: controls.chooseDate,
      invalidDate: controls.invalidDate,
      unavailableDate: controls.unavailableDate,
      previousMonth: controls.previousMonth,
      nextMonth: controls.nextMonth,
    },
    number: { increment: controls.increase, decrement: controls.decrease },
    combobox: { noResults: controls.noResults, results: controls.results },
    search: { clear: controls.clearSearch },
  };
}
