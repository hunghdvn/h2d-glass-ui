import type { ReactNode } from 'react';
import { isNumber, isPositive } from '../../../internal/number';
import { isIsoDate } from '../../../internal/date';
import { devWarn, isProduction } from '../../../internal/warn';
import type {
  DataGridCellContext,
  DataGridColumn,
  DataGridColumnInfo,
  DataGridDataType,
  DataGridFilterOperator,
  DataGridLookup,
  DataGridPin,
} from '../types';
import { operatorsFor } from './operators';
import type { Comparable } from './values';
import { formatValue, isBlank, toComparable, toFilterKey } from './values';

/**
 * A column's `cell` was typed for the value of its own field, and the grid calls it with the value
 * it read from that field, so `any` is the one honest type for a list of columns.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResolvedCell<TRow> = (ctx: DataGridCellContext<TRow, any>) => ReactNode;

/** A column as the grid works with it: every default filled in, every read and format ready. */
export interface ResolvedColumn<TRow> {
  readonly id: string;
  readonly caption: string;
  readonly dataType: DataGridDataType;
  readonly align: 'start' | 'center' | 'end';
  /** A fixed width in pixels, or `undefined` for a flexible column. */
  readonly width: number | undefined;
  readonly minWidth: number;
  /** The column's own start values for the layout: where it is pinned, and whether it is hidden. */
  readonly pinned: DataGridPin | undefined;
  /** `false` only for a column that says `visible: false`. */
  readonly visible: boolean;
  readonly rowHeader: boolean;
  readonly allowSorting: boolean;
  readonly allowResizing: boolean;
  readonly allowReordering: boolean;
  readonly allowPinning: boolean;
  readonly allowHiding: boolean;
  /** Whether the filter row has a cell for the column. */
  readonly allowFiltering: boolean;
  /** Whether the column has a funnel that lists its values. */
  readonly allowHeaderFiltering: boolean;
  /** Whether the grid's search reads the column's text, when the column is shown. */
  readonly allowSearch: boolean;
  /**
   * The operators of the filter row: the column's type offers some, `filterOperators` narrows them, and
   * the first is the default. Empty for a column that is no data column.
   */
  readonly operators: readonly DataGridFilterOperator[];
  /** The items of a lookup as `{ value, text }`, in the lookup's order; `undefined` without a lookup. */
  readonly choices: readonly { readonly value: unknown; readonly text: string }[] | undefined;
  /**
   * The values the header filter lists when the column has its own list (`headerFilter.values`, for a
   * server grid), without the items that are not `{ value, text }`; `undefined` when it has none.
   */
  readonly headerValues: readonly { readonly value: unknown; readonly text: string }[] | undefined;
  /**
   * What a filter holds of the row's value in this column, as JSON: the raw value of a lookup, the
   * number, the boolean, the string, an ISO day for a date and for a datetime (its calendar day in
   * the grid's zone), and `null` for a blank. A value the type cannot read is its text. The header
   * filter's `values` and its list are made of these.
   */
  filterKey(row: TRow): unknown;
  /**
   * A filter key as the column writes it, for a value that no row holds (a condition's value that
   * the rows do not have): the lookup's text, the formatted number or day, `Yes` or `No`.
   */
  keyText(key: unknown): string;
  /** Set on the columns the grid adds for itself (their ids start with `flg:`); a caller's column has none. */
  readonly service?: 'select';
  /** The raw value of the row. */
  value(row: TRow): unknown;
  /** The text of the value: the lookup, the format function, the Intl options or the type's default. */
  text(row: TRow): string;
  /**
   * Whether the text is the caller's words for the value, from a format function or a lookup: a
   * boolean column then draws its text, and not its check.
   */
  readonly ownText: boolean;
  /** What a sort compares; `null` is a blank, which sorts last. */
  sortKey(row: TRow): Comparable;
  readonly cell: ResolvedCell<TRow> | undefined;
  readonly info: DataGridColumnInfo;
  /** The object the caller gave. */
  readonly column: DataGridColumn<TRow>;
}

export interface ResolveOptions {
  locale: string;
  timeZone: string;
  /** The text of a boolean's `true` and `false`. */
  yes: string;
  no: string;
  /** The grid's `allowSorting`, for a column that does not say. */
  allowSorting: boolean;
  /** The grid's `allowResizing`, for a column that does not say. */
  allowResizing: boolean;
  /** The grid's `allowReordering`, for a column that does not say. */
  allowReordering: boolean;
  /** The grid's `allowPinning`, for a column that does not say. */
  allowPinning: boolean;
  /** The grid's `allowHiding`, for a column that does not say. */
  allowHiding: boolean;
  /** The grid's `allowFiltering`, for a column that does not say. */
  allowFiltering: boolean;
  /** The grid's `allowHeaderFiltering`, for a column that does not say. */
  allowHeaderFiltering: boolean;
}

const DEFAULT_MIN_WIDTH = 60;
const FIELD_CHECK_ROWS = 20;
const ALIGNS = ['start', 'center', 'end'] as const;
const DATA_TYPES: readonly DataGridDataType[] = ['string', 'number', 'date', 'datetime', 'boolean'];

// The type's operators, narrowed by what the column asks, in the type's order. A request that leaves
// none keeps all, with a warning that holds no value. A column with one operator (a boolean, a lookup)
// is not narrowed: there is nothing to choose.
function offeredOperators(
  base: readonly DataGridFilterOperator[],
  wanted: unknown,
): readonly DataGridFilterOperator[] {
  if (base.length < 2 || !Array.isArray(wanted)) return base;
  const kept = base.filter((operator) => wanted.includes(operator));
  if (kept.length > 0) return kept;
  devWarn(
    "<DataGrid> a column's filterOperators has none of its type's operators; all of them are offered.",
  );
  return base;
}

// The items of a `headerFilter.values` that have a value and a text, as new objects. A value listed twice
// keeps its first item: a list is of values, so each has one box.
function readHeaderValues(headerFilter: unknown): { value: unknown; text: string }[] | undefined {
  if (!isRecord(headerFilter) || !Array.isArray(headerFilter.values)) return undefined;
  const items: { value: unknown; text: string }[] = [];
  const seen = new Set<unknown>();
  for (const item of headerFilter.values as unknown[]) {
    if (isRecord(item) && 'value' in item && typeof item.text === 'string') {
      if (seen.has(item.value)) continue;
      seen.add(item.value);
      items.push({ value: item.value, text: item.text });
    }
  }
  return items;
}

// A value outside a union is the default; `includes` over the list narrows without a cast.
const isDataType = (value: unknown): value is DataGridDataType =>
  DATA_TYPES.some((type) => type === value);
const isAlign = (value: unknown): value is (typeof ALIGNS)[number] =>
  ALIGNS.some((align) => align === value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function readField(row: unknown, field: string): unknown {
  return isRecord(row) ? row[field] : undefined;
}

// What a `sortValue` gave, as a comparable: the same reading as `toComparable`, but a `sortValue`
// has no data type, so it takes what it gets without a warning.
function fromSortValue(value: unknown): Comparable {
  if (isNumber(value)) return value;
  if (typeof value === 'boolean') return Number(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'string') return value === '' ? null : value;
  return null;
}

// The value of a lookup item as text. A number or a null in `displayField` is still a text.
function lookupMap(lookup: DataGridLookup): Map<unknown, string> {
  const { items, valueField, displayField } = lookup;
  const map = new Map<unknown, string>();
  if (!Array.isArray(items)) return map;
  const first: unknown = items[0];
  if (first !== undefined && !(isRecord(first) && valueField in first && displayField in first)) {
    devWarn('<DataGrid> the first item of a lookup lacks its valueField or its displayField.');
  }
  for (const item of items) {
    if (!isRecord(item) || map.has(item[valueField])) continue;
    const shown = item[displayField];
    map.set(item[valueField], shown === null || shown === undefined ? '' : String(shown));
  }
  return map;
}

// A value of each type that has Intl options; a string or a boolean column has none.
const SAMPLES: Partial<Record<DataGridDataType, unknown>> = {
  number: 1,
  date: '2000-01-01',
  datetime: 0,
};

// `numberFormat` and `dateTimeFormat` throw on options they do not accept and do not remember the
// failure, so the options are tried once here, on a sample of the column's type, and a bad set is
// dropped before any cell asks for its text.
function usableOptions(
  options: object,
  dataType: DataGridDataType,
  locale: string,
  timeZone: string,
): object | undefined {
  const sample = SAMPLES[dataType];
  if (sample === undefined) return undefined;
  try {
    formatValue(sample, dataType, { locale, timeZone, yes: '', no: '', options });
    return options;
  } catch {
    devWarn('<DataGrid> a column format is not valid Intl options; the default format is used.');
    return undefined;
  }
}

function usableTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    devWarn('<DataGrid> timeZone is not a time zone Intl knows; "UTC" is used.');
    return 'UTC';
  }
}

/**
 * The columns the caller gave, resolved. A column with no usable id, with a repeated id or with an
 * id of the grid's own (`flg:`) is left out with a warning; everything else the caller left out
 * has a default. Nothing the caller gave is changed.
 */
export function resolveColumns<TRow>(
  columns: readonly DataGridColumn<TRow>[],
  options: ResolveOptions,
): ResolvedColumn<TRow>[] {
  const { locale, yes, no } = options;
  const timeZone = columns.some((column) => isRecord(column) && column.dataType === 'datetime')
    ? usableTimeZone(options.timeZone)
    : options.timeZone;
  const resolved: ResolvedColumn<TRow>[] = [];
  const seen = new Set<string>();
  let rowHeaderTaken = false;

  for (const column of columns) {
    const raw: unknown = column;
    if (!isRecord(raw)) {
      devWarn(
        '<DataGrid> a column has neither a field nor an id with a value function; it is left out.',
      );
      continue;
    }
    const field =
      typeof column.field === 'string' && column.field !== '' ? column.field : undefined;
    const given = typeof column.id === 'string' && column.id !== '' ? column.id : undefined;
    const compute = typeof column.value === 'function' ? column.value : undefined;
    const id = field !== undefined ? (given ?? field) : compute ? given : undefined;
    if (id === undefined) {
      devWarn(
        '<DataGrid> a column has neither a field nor an id with a value function; it is left out.',
      );
      continue;
    }
    if (id.startsWith('flg:')) {
      devWarn(
        '<DataGrid> a column id starts with "flg:", which is for the grid\'s own columns; the column is left out.',
      );
      continue;
    }
    if (seen.has(id)) {
      devWarn('<DataGrid> two columns have the same id; the second is left out.');
      continue;
    }
    seen.add(id);

    const dataType = isDataType(column.dataType) ? column.dataType : 'string';
    const lookup = column.lookup ? lookupMap(column.lookup) : undefined;
    const format = column.format;
    const formatFunction =
      typeof format === 'function' ? (format as (value: unknown, row: TRow) => string) : undefined;
    const intl =
      isRecord(format) && !lookup && !formatFunction
        ? usableOptions(format, dataType, locale, timeZone)
        : undefined;
    // A datetime's day is the day in the zone its cells are shown in: the one the column's own
    // (already checked) Intl options name, else the grid's. `formatValue` lets the options win too.
    const shownZone = (intl as Intl.DateTimeFormatOptions | undefined)?.timeZone;
    const dayZone = dataType === 'datetime' && typeof shownZone === 'string' ? shownZone : timeZone;

    let width: number | undefined;
    if (column.width !== undefined) {
      if (isPositive(column.width)) width = column.width;
      else
        devWarn(
          '<DataGrid> a column width is not a finite number above 0; the column is flexible.',
        );
    }
    let minWidth = DEFAULT_MIN_WIDTH;
    if (column.minWidth !== undefined) {
      if (isPositive(column.minWidth)) minWidth = column.minWidth;
      else devWarn('<DataGrid> a column minWidth is not a finite number above 0; 60 is used.');
    }

    let rowHeader = false;
    if (column.rowHeader === true) {
      if (rowHeaderTaken)
        devWarn('<DataGrid> more than one column is a row header; only the first is.');
      else rowHeader = rowHeaderTaken = true;
    }

    const align =
      (isAlign(column.align) ? column.align : undefined) ??
      (lookup
        ? 'start'
        : dataType === 'number'
          ? 'end'
          : dataType === 'boolean'
            ? 'center'
            : 'start');
    const caption = typeof column.caption === 'string' ? column.caption : id;
    const sortValue = column.sortValue;

    const value = (row: TRow): unknown =>
      field !== undefined ? readField(row, field) : compute?.call(column, row);
    const textOf = (row: TRow): string => {
      const raw = value(row);
      if (isBlank(raw)) return '';
      // A format function takes the value as it is, and wins over a lookup.
      if (formatFunction) {
        const text = formatFunction(raw, row) as unknown;
        return text === null || text === undefined ? '' : String(text);
      }
      if (lookup) return lookup.get(raw) ?? '';
      return formatValue(raw, dataType, { locale, timeZone, yes, no, options: intl });
    };
    resolved.push({
      id,
      caption,
      dataType,
      align,
      width,
      minWidth,
      // A value outside the union is no pin: it may come from JavaScript, and the layout stays silent.
      pinned: column.pinned === 'left' || column.pinned === 'right' ? column.pinned : undefined,
      visible: column.visible !== false,
      rowHeader,
      allowSorting:
        typeof column.allowSorting === 'boolean' ? column.allowSorting : options.allowSorting,
      allowResizing:
        typeof column.allowResizing === 'boolean' ? column.allowResizing : options.allowResizing,
      allowReordering:
        typeof column.allowReordering === 'boolean'
          ? column.allowReordering
          : options.allowReordering,
      allowPinning:
        typeof column.allowPinning === 'boolean' ? column.allowPinning : options.allowPinning,
      allowHiding:
        typeof column.allowHiding === 'boolean' ? column.allowHiding : options.allowHiding,
      allowFiltering:
        typeof column.allowFiltering === 'boolean' ? column.allowFiltering : options.allowFiltering,
      allowHeaderFiltering:
        typeof column.allowHeaderFiltering === 'boolean'
          ? column.allowHeaderFiltering
          : options.allowHeaderFiltering,
      allowSearch: typeof column.allowSearch === 'boolean' ? column.allowSearch : true,
      operators: offeredOperators(
        operatorsFor(dataType, lookup !== undefined),
        column.filterOperators,
      ),
      choices: lookup && [...lookup].map(([key, text]) => ({ value: key, text })),
      headerValues: readHeaderValues(column.headerFilter),
      filterKey(row) {
        const raw = value(row);
        if (isBlank(raw)) return null;
        // A lookup is filtered by the value it holds, whether or not an item has it.
        if (lookup) return raw;
        const key = toFilterKey(raw, dataType, dayZone);
        if (key !== null) return key;
        // A value the type cannot read (an object that a `format` function writes) is its text.
        const text = textOf(row);
        return text === '' ? null : text;
      },
      keyText(key) {
        if (key === null || key === undefined) return '';
        if (lookup) return lookup.get(key) ?? String(key);
        if (dataType === 'boolean' && typeof key === 'boolean') return key ? yes : no;
        if (dataType === 'number' && isNumber(key)) {
          return formatValue(key, 'number', { locale, timeZone, yes, no, options: intl });
        }
        if ((dataType === 'date' || dataType === 'datetime') && isIsoDate(key)) {
          // A datetime is listed by its day: the Intl options of the column are for the instant.
          const dayOptions = dataType === 'date' ? intl : undefined;
          return formatValue(key, 'date', { locale, timeZone, yes, no, options: dayOptions });
        }
        return String(key);
      },
      value,
      ownText: formatFunction !== undefined || lookup !== undefined,
      text: textOf,
      sortKey(row) {
        if (sortValue) return fromSortValue(sortValue.call(column, row));
        const raw = value(row);
        if (lookup) {
          const text = isBlank(raw) ? undefined : lookup.get(raw);
          return text === undefined || text === '' ? null : text;
        }
        return toComparable(raw, dataType);
      },
      cell: column.cell as ResolvedCell<TRow> | undefined,
      info: { id, caption, dataType, align },
      column,
    });
  }
  return resolved;
}

/**
 * Whether a column is a data column: no service column (the column of boxes, and those of later
 * plans). The one rule for what the keys of a title, the menu, a resize and a move work on.
 */
export function isDataColumn(column: { readonly service?: unknown }): boolean {
  return column.service === undefined;
}

/** The id of the column of boxes that `selectionMode="multiple"` adds. */
export const SELECT_COLUMN_ID = 'flg:select';

/** The width of the selection column in pixels (spec phase 6 §4.3). */
export const SELECT_COLUMN_WIDTH = 40;

/**
 * The column of boxes: a column like any other to the layout and the keyboard (a width, an id, a
 * place), with no value, no text and nothing to sort, which is why it is made here and not by
 * `resolveColumns`: it is never the caller's.
 */
export function selectColumn<TRow>(): ResolvedColumn<TRow> {
  const info = { id: SELECT_COLUMN_ID, caption: '', dataType: 'string', align: 'start' } as const;
  return {
    id: SELECT_COLUMN_ID,
    caption: '',
    dataType: 'string',
    align: 'start',
    width: SELECT_COLUMN_WIDTH,
    minWidth: SELECT_COLUMN_WIDTH,
    pinned: undefined,
    visible: true,
    rowHeader: false,
    allowSorting: false,
    allowResizing: false,
    allowReordering: false,
    allowPinning: false,
    allowHiding: false,
    allowFiltering: false,
    allowHeaderFiltering: false,
    allowSearch: false,
    operators: [],
    choices: undefined,
    headerValues: undefined,
    filterKey: () => null,
    keyText: () => '',
    service: 'select',
    value: () => undefined,
    text: () => '',
    ownText: false,
    sortKey: () => null,
    cell: undefined,
    info,
    column: { id: SELECT_COLUMN_ID, value: () => undefined },
  };
}

/**
 * Development only: warns when no row of the first 20 has the property a field column names, which
 * is how a misspelt field shows. Not computed in production, where the rows are never read.
 */
export function checkFields<TRow>(
  columns: readonly ResolvedColumn<TRow>[],
  rows: readonly TRow[],
): void {
  if (isProduction()) return;
  const sample = rows.slice(0, FIELD_CHECK_ROWS);
  if (sample.length === 0) return;
  for (const { column } of columns) {
    const field = column.field;
    if (typeof field !== 'string') continue;
    if (!sample.some((row) => isRecord(row) && field in row)) {
      devWarn(
        '<DataGrid> no row has the property a column names as its field; check its spelling.',
      );
      return;
    }
  }
}
