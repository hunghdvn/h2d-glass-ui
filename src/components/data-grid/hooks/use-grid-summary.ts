import { useMemo } from 'react';
import { resolveSummaryItems, sameSummary } from '../engine/summary';
import type { ResolvedSummaryItem } from '../engine/summary';
import type { ResolvedColumn } from '../engine/columns';
import type { DataGridSummaryProp } from '../types';
import { useSummaryWarning } from './use-renewal-warning';
import { useKept } from './use-kept';

/** The totals asked for, resolved against the columns, and the part of them the pipeline reads. */
export interface GridSummary<TRow> {
  summaryResolved: {
    total: ResolvedSummaryItem<TRow>[];
    group: ResolvedSummaryItem<TRow>[];
    byColumn: Map<string, ResolvedSummaryItem<TRow>[]>;
    noColumn: boolean;
    noType: boolean;
    repeated: boolean;
  };
  pipelineSummary: {
    total: ResolvedSummaryItem<TRow>[];
    group: ResolvedSummaryItem<TRow>[];
  } | null;
}

/**
 * The totals asked for, kept while the prop says the same (an object written in the JSX is new on every
 * render, and functions count by identity), and resolved against the columns: each list drops the item
 * that names no column and the later of two with one id, and says so once, from an effect.
 */
export function useGridSummary<TRow>({
  summary,
  resolved,
}: {
  summary: DataGridSummaryProp<TRow> | undefined;
  resolved: readonly ResolvedColumn<TRow>[];
}): GridSummary<TRow> {
  const summaryKept = useKept(summary, sameSummary);
  useSummaryWarning(summary);
  const summaryResolved = useMemo(() => {
    const total = resolveSummaryItems(summaryKept?.total ?? [], resolved);
    const group = resolveSummaryItems(summaryKept?.group ?? [], resolved);
    // The group totals by the column they stand under, for the group rows to find theirs.
    const byColumn = new Map<string, ResolvedSummaryItem<TRow>[]>();
    for (const item of group.items) {
      const list = byColumn.get(item.column);
      if (list) list.push(item);
      else byColumn.set(item.column, [item]);
    }
    return {
      total: total.items,
      group: group.items,
      byColumn,
      // With no column yet (they may come later, as the fields of `checkFields` wait for data) every item
      // names one the grid does not have, which is no mistake to say.
      noColumn: resolved.length > 0 && total.why.column.length + group.why.column.length > 0,
      noType: resolved.length > 0 && total.why.type.length + group.why.type.length > 0,
      repeated: total.repeated.length + group.repeated.length > 0,
    };
  }, [summaryKept, resolved]);
  const pipelineSummary = useMemo(
    () =>
      summaryResolved.total.length + summaryResolved.group.length > 0
        ? { total: summaryResolved.total, group: summaryResolved.group }
        : null,
    [summaryResolved],
  );
  return { summaryResolved, pipelineSummary };
}
