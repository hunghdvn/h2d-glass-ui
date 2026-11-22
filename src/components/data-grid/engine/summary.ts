import { numberFormat } from '../../../internal/intl';
import { isNumber } from '../../../internal/number';
import type { DataGridSummaryItem } from '../types';
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
 * handed back in `leftOut`, so the grid can warn once after the commit: this function is pure. An `id`
 * the caller gives twice is the caller's to keep apart; the later item wins in the values.
 */
export function resolveSummaryItems<TRow>(
  items: readonly DataGridSummaryItem<TRow>[],
  columns: readonly ResolvedColumn<TRow>[],
): { items: ResolvedSummaryItem<TRow>[]; leftOut: DataGridSummaryItem<TRow>[] } {
  const resolved: ResolvedSummaryItem<TRow>[] = [];
  const leftOut: DataGridSummaryItem<TRow>[] = [];
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
    resolved.push({
      id: typeof item.id === 'string' && item.id !== '' ? item.id : `${kind}:${field}`,
      column: item.column,
      source,
      type: item.type,
      label: item.label,
      format: item.format,
    });
  }
  return { items: resolved, leftOut };
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
