import type { ResolvedColumn } from './columns';
import { readOfRow } from './edit';
import { isBlank, rawText } from './values';

/** One column of a CSV: its heading, how it writes a row, and whether a formula in it is a danger. */
export interface CsvColumn<TRow> {
  caption: string;
  /** The text of the row in this column, before any quoting. */
  text(row: TRow): string;
  /**
   * Whether `escapeFormulas` applies to a field: `true` for a column of free text (a `string` column or a lookup), a
   * function of the row where the column is free text only for some of its values.
   */
  guard: boolean | ((row: TRow) => boolean);
}

/** The options of a CSV as `exportCsv` resolves them: no member is left out. */
export interface CsvOptions {
  separator: ',' | ';' | '\t';
  /** Whether the text starts with a byte order mark, which makes Excel read it as UTF-8. */
  bom: boolean;
  escapeFormulas: boolean;
}

// The byte order mark, U+FEFF: written by its code so that no invisible character stands in the source.
const BOM = String.fromCharCode(0xfeff);
// What a spreadsheet reads as the start of a formula (OWASP "CSV injection"): the characters of the spec
// and the two that can hide one behind a blank.
const FORMULA = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /["\r\n]|^\s|\s$/;

/**
 * One field of a record (RFC 4180): quoted when it holds the separator, a quote, a line break or a space
 * at either end, with every inner quote doubled. A `guard`ed field that starts like a formula gets a quote
 * mark before it first, so a spreadsheet reads it as text; the quoting then looks at the field as it is
 * written.
 */
export function csvField(text: string, separator: string, guard: boolean): string {
  const safe = guard && FORMULA.test(text) ? `'${text}` : text;
  return safe.includes(separator) || NEEDS_QUOTES.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
}

const guarded = <TRow>(guard: boolean | ((row: TRow) => boolean), row: TRow) =>
  typeof guard === 'function' ? guard(row) : guard;

/**
 * The CSV of rows (spec phase 6 §6.3 "Xuất CSV"): a heading row of the captions, then a record for each row,
 * every record ended with CRLF (the last too), and the BOM first when asked. With no column there is no record:
 * the BOM alone, or nothing. The rows are read once each, column by column; what a field says is the column's.
 */
export function toCsv<TRow>(
  rows: readonly TRow[],
  columns: readonly CsvColumn<TRow>[],
  { separator, bom, escapeFormulas }: CsvOptions,
): string {
  if (columns.length === 0) return bom ? BOM : '';
  // The headings are free text too: a caption may come from data in an app whose columns are dynamic.
  const records = [
    columns.map((column) => csvField(column.caption, separator, escapeFormulas)).join(separator),
  ];
  const guards = columns.map((column) => (escapeFormulas ? column.guard : false));
  for (const row of rows) {
    records.push(
      columns
        .map((column, at) => csvField(column.text(row), separator, guarded(guards[at]!, row)))
        .join(separator),
    );
  }
  return `${bom ? BOM : ''}${records.join('\r\n')}\r\n`;
}

/**
 * The columns of a CSV for the grid's columns. `formatted` writes the text of the cell, which `textOf` gives (the
 * grid's text cache behind its guard for a new row); `raw` writes the value as `rawText` does: a lookup by its value,
 * and, for a column whose own `format` writes a value its type cannot read, that text, as the filter key does. A
 * value is read through `readOfRow`: a throw on a saved row is the app's and goes on, as it does when the cell draws.
 */
export function csvColumns<TRow>(
  columns: readonly ResolvedColumn<TRow>[],
  values: 'formatted' | 'raw',
  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string,
): CsvColumn<TRow>[] {
  return columns.map((column) => ({
    caption: column.caption,
    // `formatted` writes the text of a cell, which for a lookup is its words: text. `raw` writes the value of a lookup, which
    // is guarded unless it is a number, a bigint or a boolean (-1 stays a number); any other value is written as
    // its text and guarded, so an object whose text starts like a formula cannot slip through.
    guard:
      column.dataType === 'string' || (column.choices !== undefined && values === 'formatted')
        ? true
        : column.choices !== undefined
          ? (row) =>
              readOfRow(
                row,
                () => {
                  const value = column.value(row);
                  return !(
                    typeof value === 'number' ||
                    typeof value === 'bigint' ||
                    typeof value === 'boolean'
                  );
                },
                true,
              )
          : false,
    text:
      values === 'formatted'
        ? (row) => textOf(row, column)
        : (row) =>
            readOfRow(
              row,
              () => {
                const value = column.value(row);
                if (isBlank(value)) return '';
                if (column.choices !== undefined) return String(value);
                const raw = rawText(value, column.dataType);
                return raw === '' && column.ownText ? textOf(row, column) : raw;
              },
              '',
            ),
  }));
}
