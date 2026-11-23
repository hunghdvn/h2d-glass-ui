import { useCallback, useRef } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import { conditionOf, distinctValues, filterRows, listIsNarrowed } from '../engine/filter';
import type { TextCache } from '../engine/values';
import type { HeaderList } from '../filter-context';
import type { DataGridFilter } from '../types';

export interface HeaderValuesOptions<TRow> {
  /** Whether the grid has funnels: only then is a listing kept. */
  enabled: boolean;
  /** The rows after the search, as of this commit (server mode: the page). */
  rows: readonly TRow[];
  filter: DataGridFilter;
  resolved: readonly ResolvedColumn<TRow>[];
  remote: boolean;
  read: TextCache<TRow>;
  locale: string;
}

interface Listing<TRow> {
  rows: readonly TRow[];
  filter: DataGridFilter;
  resolved: readonly ResolvedColumn<TRow>[];
  remote: boolean;
}

// Shared by every column with nothing to list, so it is frozen: nothing may write into it.
const NOTHING: HeaderList = Object.freeze({ items: Object.freeze([]) as never[], narrowed: false });

/**
 * What the header filter lists, read when its popover opens: the rows after the search and the
 * conditions of the other columns (server mode lists the column's own values, or the page), as of the
 * last commit. The listing is written on commit only while `enabled`: a grid without funnels keeps none.
 */
export function useHeaderValues<TRow>({
  enabled,
  rows,
  filter,
  resolved,
  remote,
  read,
  locale,
}: HeaderValuesOptions<TRow>): (columnId: string) => HeaderList {
  const listing = useRef<Listing<TRow> | null>(enabled ? { rows, filter, resolved, remote } : null);
  useWriteOnCommit(() => {
    if (enabled) listing.current = { rows, filter, resolved, remote };
  });
  return useCallback(
    (columnId: string) => {
      if (!listing.current) return NOTHING;
      const { rows: searchedRows, filter: held, resolved: every, remote: server } = listing.current;
      const column = every.find((candidate) => candidate.id === columnId);
      if (!column) return NOTHING;
      const others = server ? searchedRows : filterRows(searchedRows, every, held, read, columnId);
      const { values } = conditionOf(held, columnId) ?? {};
      const { items } = distinctValues(
        others,
        column,
        { named: Array.isArray(values) ? values : [], limit: Infinity, locale },
        read,
      );
      return { items, narrowed: listIsNarrowed(held, every, columnId, server) };
    },
    [read, locale],
  );
}
