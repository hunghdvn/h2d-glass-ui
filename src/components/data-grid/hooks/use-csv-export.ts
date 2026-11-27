import { useCallback, useRef } from 'react';
import { downloadText } from '../../../internal/download';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { devWarn } from '../../../internal/warn';
import { csvColumns, toCsv } from '../engine/csv';
import { isDataColumn, type ResolvedColumn } from '../engine/columns';
import type { FlatDataRow } from '../engine/flatten';
import { csvOptionsOf } from '../normalize';
import type { DataGridCsvOptions, DataGridKey, DataGridSelectionMode } from '../types';

/** What the export reads of the grid, as the last commit showed it. */
export interface CsvSource<TRow> {
  /** The saved rows after the search and the filter, in the order shown (`PipelineResult.savedRows`). */
  savedRows: readonly FlatDataRow<TRow>[];
  /** The shown columns in the order drawn; the call keeps the data columns that are not `exportable: false`. */
  columns: readonly ResolvedColumn<TRow>[];
  selectedKeys: readonly DataGridKey[];
  selectionMode: DataGridSelectionMode;
  remote: boolean;
  /** The options of `csvExport`, of their type; `undefined` when the prop is off. */
  options: DataGridCsvOptions | undefined;
  /** The text of a cell, through the one guard drawing uses. */
  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string;
}

const CSV_TYPE = 'text/csv;charset=utf-8';

/** Whether two `csvExport` values say the same: the same options, member by member. */
export function sameCsvExport(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const left = a as DataGridCsvOptions;
  const right = b as DataGridCsvOptions;
  return (
    left.fileName === right.fileName &&
    left.separator === right.separator &&
    left.values === right.values &&
    left.bom === right.bom &&
    left.selectedOnly === right.selectedOnly &&
    left.escapeFormulas === right.escapeFormulas
  );
}

/**
 * The handle's `exportCsv` (spec phase 6 §6.3 "Xuất CSV"), the one function the toolbar's button and an app share. It
 * reads what the last commit showed through a ref written on commit, never during a render, so it is the same
 * function for as long as the grid lives and says what is on the screen when it is called. The options of the call are
 * laid over those of `csvExport`, each outside its union is its default with one warning, and the text is always
 * returned; the file is downloaded when the call says `download: true`, or gives a `fileName` and does not say
 * `download: false`. A `fileName` of the prop alone never downloads by itself: it names the download of the button.
 */
export function useCsvExport<TRow>(source: CsvSource<TRow>) {
  const latest = useRef(source);
  useWriteOnCommit(() => {
    latest.current = source;
  });
  return useCallback((given?: DataGridCsvOptions & { download?: boolean }): string => {
    const now = latest.current;
    const { options: call, warnings } = csvOptionsOf(given, 'exportCsv');
    for (const warning of warnings) devWarn(warning);
    const { download, ...callOptions } = call;
    const options = { ...now.options, ...callOptions };
    if (now.remote) {
      devWarn(
        '<DataGrid> exportCsv() in server mode writes only the rows of the current page; export the whole data on the server.',
      );
    }
    // A grid that cannot choose rows has no chosen row, whatever keys it was given.
    const chosen = new Set(now.selectionMode === 'none' ? [] : now.selectedKeys);
    const rows = (
      options.selectedOnly === true
        ? now.savedRows.filter((one) => chosen.has(one.key))
        : now.savedRows
    ).map((one) => one.row);
    const text = toCsv(
      rows,
      csvColumns(
        now.columns.filter((column) => isDataColumn(column) && column.column.exportable !== false),
        options.values ?? 'formatted',
        now.textOf,
      ),
      {
        separator: options.separator ?? ',',
        bom: options.bom ?? true,
        escapeFormulas: options.escapeFormulas ?? true,
      },
    );
    if (download ?? callOptions.fileName !== undefined) {
      downloadText(text, options.fileName ?? 'data.csv', CSV_TYPE);
    }
    return text;
  }, []);
}
