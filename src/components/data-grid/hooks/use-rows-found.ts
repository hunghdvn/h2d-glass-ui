import { useCallback, useEffect, useRef } from 'react';
import type { UseAnnounceResult } from '../../../internal/use-announce';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { sameFilter } from '../engine/filter';
import type { DataGridFilter } from '../types';

/**
 * How long after the last change of the filter the rows found are said, in milliseconds. The live
 * region joins the calls of a burst (`useAnnounce`), so a search that is typed says it once, this long
 * after the last key.
 */
export const FILTER_ANNOUNCE_DELAY = 500;

export interface RowsFoundOptions {
  /** The filter the grid shows in this commit. */
  filter: DataGridFilter;
  /** How many data rows the filter keeps: every page and group of them, or `totalCount` in server mode. */
  total: number;
  remote: boolean;
  loading: boolean;
  /** The `data` of this commit: in server mode, new rows are one of the two ends of the request. */
  data: readonly unknown[];
  /** The sentence of a count. */
  say: (count: number) => string;
  announce: UseAnnounceResult['announce'];
}

/**
 * Says how many rows a change of the filter that the user made leaves, once for the change. The grid
 * calls the returned `ask` with the filter it asked for, and the first commit after that says the
 * count. In a client grid that is the commit that shows the asked filter, which a state of the grid or
 * a parent that takes the request makes at once. A parent that keeps its own filter never shows it, so
 * the ask is dropped when that moment has passed (`FILTER_ANNOUNCE_DELAY`) and nothing is said for a
 * change that did not happen; a filter that changes from outside is no ask, so it is not said. In
 * server mode the rows come later, so the count is said at the first commit after the ask where the
 * grid is not loading and either `data` is another array (the rows the app fetched for the filter) or
 * the grid was loading at some commit since the ask (an app that loads into the same array, or whose
 * rows came back the same); that ask has no timer, and ends there. Nothing is said on mount, and the
 * timer goes with the grid.
 */
export function useRowsFound({
  filter,
  total,
  remote,
  loading,
  data,
  say,
  announce,
}: RowsFoundOptions): (asked: DataGridFilter, data: readonly unknown[]) => void {
  const asked = useRef<{
    filter: DataGridFilter;
    data: readonly unknown[];
    /** Whether a commit since the ask had the grid loading. */
    loaded: boolean;
  } | null>(null);
  const expiry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ say, remote });
  useWriteOnCommit(() => {
    latest.current = { say, remote };
  });
  const ask = useCallback((next: DataGridFilter, dataThen: readonly unknown[]) => {
    const mine = { filter: next, data: dataThen, loaded: false };
    asked.current = mine;
    clearTimeout(expiry.current);
    if (latest.current.remote) return;
    expiry.current = setTimeout(() => {
      if (asked.current === mine) asked.current = null;
    }, FILTER_ANNOUNCE_DELAY);
  }, []);
  useEffect(() => () => clearTimeout(expiry.current), []);

  useEffect(() => {
    const pending = asked.current;
    if (pending === null) return;
    if (remote) {
      if (loading) pending.loaded = true;
      if (loading || (data === pending.data && !pending.loaded)) return;
    } else if (!sameFilter(filter, pending.filter)) {
      return;
    }
    asked.current = null;
    clearTimeout(expiry.current);
    announce(latest.current.say(total), { delay: FILTER_ANNOUNCE_DELAY });
  });
  return ask;
}
