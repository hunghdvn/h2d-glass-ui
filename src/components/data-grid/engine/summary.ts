import { numberFormat } from '../../../internal/intl';
import { isNumber } from '../../../internal/number';
import type { DataGridSummaryItem, DataGridSummaryProp } from '../types';
import type { ResolvedColumn } from './columns';
import { isDataColumn } from './columns';
import type { TextReader } from './filter';
import { toComparable } from './values';

const NAMED_TYPES: readonly string[] = ['count', 'sum', 'avg', 'min', 'max'];

/** A total as the engine works with it: the column it shows in and the column it reads, found. */
export interface ResolvedSummaryItem<TRow> {
  /** What the item is known by: the caller's `id`, else the type and the field. */
  readonly id: string;
  /** The id of the column the total is shown under. */
  readonly column: string;
  /** The column the values are read from. */
  readonly source: ResolvedColumn<TRow>;
  readonly type: DataGridSummaryItem<TRow>['type'];
  readonly label: string | undefined;
  readonly format: DataGridSummaryItem<TRow>['format'];
}

/**
 * One total: the value, and for a least or greatest the row that holds it (its text is that row's).
 * `null` is a blank: the average, least or greatest of no number.
 */
export interface SummaryEntry<TRow> {
  readonly value: unknown;
  readonly row: TRow | undefined;
}

/** The totals of a set of rows, each under the id of its item. */
export type SummaryValues<TRow> = ReadonlyMap<string, SummaryEntry<TRow>>;

/**
 * The items as the engine reads them. An item that does not name a column of the grid (the one it
 * shows in, and the one it reads), or whose type is not one of the five or a function, is left out and
 * handed back in `leftOut`, so the grid can warn once after the commit: this function is pure. An item
 * whose `id` an earlier item has (the id the caller gave, or the one the type and the field make) is
 * left out too and handed back in `repeated`, as the second of two columns with one id is: the first is
 * kept, so no two cells and no two React keys come from one id.
 */
export function resolveSummaryItems<TRow>(
  items: readonly DataGridSummaryItem<TRow>[],
  columns: readonly ResolvedColumn<TRow>[],
): {
  items: ResolvedSummaryItem<TRow>[];
  leftOut: DataGridSummaryItem<TRow>[];
  repeated: DataGridSummaryItem<TRow>[];
} {
  const resolved: ResolvedSummaryItem<TRow>[] = [];
  const leftOut: DataGridSummaryItem<TRow>[] = [];
  const repeated: DataGridSummaryItem<TRow>[] = [];
  const taken = new Set<string>();
  for (const item of items) {
    const field = item.field ?? item.column;
    const shownIn = columns.find((candidate) => candidate.id === item.column);
    const source = columns.find((candidate) => candidate.id === field);
    const named = typeof item.type === 'function' || NAMED_TYPES.includes(item.type);
    if (!shownIn || !source || !isDataColumn(source) || !named) {
      leftOut.push(item);
      continue;
    }
    const kind = typeof item.type === 'function' ? 'custom' : item.type;
    const id = typeof item.id === 'string' && item.id !== '' ? item.id : `${kind}:${field}`;
    if (taken.has(id)) {
      repeated.push(item);
      continue;
    }
    taken.add(id);
    resolved.push({
      id,
      column: item.column,
      source,
      type: item.type,
      label: item.label,
      format: item.format,
    });
  }
  return { items: resolved, leftOut, repeated };
}

const sameItem = (a: DataGridSummaryItem<never>, b: DataGridSummaryItem<never>): boolean =>
  a.id === b.id &&
  a.column === b.column &&
  a.field === b.field &&
  Object.is(a.type, b.type) &&
  a.label === b.label &&
  (a.format === b.format ||
    (typeof a.format === 'object' &&
      typeof b.format === 'object' &&
      JSON.stringify(a.format) === JSON.stringify(b.format)));

const sameItems = (
  a: readonly DataGridSummaryItem<never>[] | undefined,
  b: readonly DataGridSummaryItem<never>[] | undefined,
): boolean => {
  const left = a ?? [];
  const right = b ?? [];
  return left.length === right.length && left.every((item, at) => sameItem(item, right[at]!));
};

const shapeOfItems = (items: readonly DataGridSummaryItem<never>[] | undefined): string =>
  (items ?? [])
    .map((item) =>
      [
        item.id,
        item.column,
        item.field,
        typeof item.type === 'function' ? 'function' : item.type,
        item.label,
        typeof item.format === 'function' ? 'function' : JSON.stringify(item.format),
      ].join('\u0001'),
    )
    .join('\u0002');

/**
 * Whether two `summary` props are the same but for the identity of their functions (the type that is a
 * function, the `format` that is one): what a `summary` written in the JSX looks like from one render to
 * the next, which the grid warns about when it goes on.
 */
export function sameSummaryShape(
  a: DataGridSummaryProp<never> | undefined,
  b: DataGridSummaryProp<never> | undefined,
): boolean {
  return (
    shapeOfItems(a?.total) === shapeOfItems(b?.total) &&
    shapeOfItems(a?.group) === shapeOfItems(b?.group)
  );
}

/**
 * Whether two `summary` props say the same: the same items in the same order, each with the same
 * fields, Intl options compared by value and functions by identity. A `summary` written in the JSX is
 * a new object every render; the one of an earlier render is kept while it says the same.
 */
export function sameSummary(
  a: DataGridSummaryProp<never> | undefined,
  b: DataGridSummaryProp<never> | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return sameItems(a.total, b.total) && sameItems(a.group, b.group);
}

// What one item gathers while the rows go by.
interface Gathered<TRow> {
  sum: number;
  numbers: number;
  best: number | null;
  bestRow: TRow | undefined;
}

// A value a least or a greatest can be of: a number, a date or a datetime, as a number to compare.
function comparableOf<TRow>(row: TRow, source: ResolvedColumn<TRow>): number | null {
  if (
    source.dataType !== 'number' &&
    source.dataType !== 'date' &&
    source.dataType !== 'datetime'
  ) {
    return null;
  }
  const comparable = toComparable(source.value(row), source.dataType);
  return typeof comparable === 'number' ? comparable : null;
}

/**
 * The totals of `rows`, one pass for all the items. `count` is the number of rows. `sum` and `avg` read the
 * finite numbers of the item's field and skip the rest: the sum of none is 0, the average of none is
 * blank. `min` and `max` read the numbers, dates and datetimes of a column of those types and keep the
 * row that holds the value (the first, when two do), blank when there is none. A function type is called
 * once with the rows, and its result is the value.
 */
export function computeSummary<TRow>(
  rows: readonly TRow[],
  items: readonly ResolvedSummaryItem<TRow>[],
): SummaryValues<TRow> {
  const gathered = items.map((): Gathered<TRow> => ({
    sum: 0,
    numbers: 0,
    best: null,
    bestRow: undefined,
  }));
  for (const row of rows) {
    items.forEach((item, index) => {
      const now = gathered[index]!;
      switch (item.type) {
        case 'sum':
        case 'avg': {
          const value = item.source.value(row);
          if (isNumber(value)) {
            now.sum += value;
            now.numbers++;
          }
          break;
        }
        case 'min':
        case 'max': {
          const value = comparableOf(row, item.source);
          if (value === null) break;
          if (now.best === null || (item.type === 'min' ? value < now.best : value > now.best)) {
            now.best = value;
            now.bestRow = row;
          }
          break;
        }
      }
    });
  }
  const values = new Map<string, SummaryEntry<TRow>>();
  items.forEach((item, index) => {
    const now = gathered[index]!;
    let entry: SummaryEntry<TRow>;
    if (typeof item.type === 'function') {
      entry = { value: item.type(rows), row: undefined };
    } else {
      switch (item.type) {
        case 'count':
          entry = { value: rows.length, row: undefined };
          break;
        case 'sum':
          entry = { value: now.sum, row: undefined };
          break;
        case 'avg':
          entry = { value: now.numbers === 0 ? null : now.sum / now.numbers, row: undefined };
          break;
        default:
          entry = { value: now.best, row: now.bestRow };
      }
    }
    values.set(item.id, entry);
  });
  return values;
}

// A value written by the item's `format`: a function writes it, Intl options write a number, and a
// set of options Intl refuses writes it as the locale does, since a bad option never throws here.
function writeValue(
  value: unknown,
  format: NonNullable<ResolvedSummaryItem<unknown>['format']>,
  locale: string,
) {
  if (typeof format === 'function') return format(value);
  if (!isNumber(value)) return String(value);
  try {
    return numberFormat(locale, format).format(value);
  } catch {
    return numberFormat(locale).format(value);
  }
}

/**
 * The text of a total. A `count` is a whole number. Otherwise the `format` of the item writes the value
 * when it has one; without it a `min` or `max` is the text of the row that holds it (so a column's format
 * function and its Intl options both write it, as in the cells), and a `sum` or `avg` is written as the
 * column writes a number (its Intl options when it has them) or as the locale does; a function type's
 * value is written as a string. A blank is the empty text.
 */
export function summaryText<TRow>(
  item: ResolvedSummaryItem<TRow>,
  entry: SummaryEntry<TRow> | undefined,
  { locale, read }: { locale: string; read: TextReader<TRow> },
): string {
  if (!entry || entry.value === null || entry.value === undefined) return '';
  const { value } = entry;
  if (item.type === 'count') {
    return numberFormat(locale, { maximumFractionDigits: 0 }).format(value as number);
  }
  if (item.format !== undefined) return writeValue(value, item.format, locale);
  if (item.type === 'min' || item.type === 'max') {
    return entry.row === undefined ? '' : read.text(entry.row, item.source);
  }
  if ((item.type === 'sum' || item.type === 'avg') && isNumber(value)) {
    const { source } = item;
    // `keyText` writes a number with the column's own Intl options; a lookup writes its items instead.
    return source.dataType === 'number' && !source.choices
      ? source.keyText(value)
      : numberFormat(locale).format(value);
  }
  return String(value);
}

/**
 * The text of a total the server computed (`totalSummary`, server mode): there is no row, so a least or
 * greatest cannot take the text of the row that holds it. The `format` of the item writes the value when
 * it has one; else a `count` is a whole number, a function type's value is a string, and every other
 * type is written as the column writes a value that no row holds (`keyText`: its Intl options, its
 * lookup, its day). A blank, or a value that is not there, is the empty text.
 */
export function remoteSummaryText<TRow>(
  item: ResolvedSummaryItem<TRow>,
  value: unknown,
  locale: string,
): string {
  if (value === null || value === undefined || value === '') return '';
  if (item.type === 'count' && isNumber(value)) {
    return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  }
  if (item.format !== undefined) return writeValue(value, item.format, locale);
  if (typeof item.type === 'function') return String(value);
  return item.source.keyText(value);
}
