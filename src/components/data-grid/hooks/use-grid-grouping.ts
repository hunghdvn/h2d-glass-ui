import { useCallback, useMemo, useRef } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import { effectiveGrouping, sameGrouping } from '../engine/group';
import type { DataGridExpandedGroups, DataGridGroupItem, DataGridPage } from '../types';
import { sameList, useKept } from './use-kept';

export interface GridGroupingOptions<TRow> {
  /** The grouping as the grid holds it. */
  grouping: readonly DataGridGroupItem[];
  /** Every resolved column: a column the layout hides still groups. */
  resolved: readonly ResolvedColumn<TRow>[];
  /** Server mode groups nothing: the grouping is held, and the app groups on the server. */
  remote: boolean;
  /** `useGridState`'s setters and the reader of the open groups. */
  setGrouping: (grouping: readonly DataGridGroupItem[]) => boolean;
  setExpandedGroups: (expanded: DataGridExpandedGroups) => boolean;
  expandedNow: () => DataGridExpandedGroups;
  setPage: (page: DataGridPage) => void;
  /** The page the state holds and its size, and whether the grid has pages. */
  pageIndex: number;
  size: number;
  paged: boolean;
  announce: (text: string) => void;
}

export interface GridGrouping {
  /** The items that group, in order (`effectiveGrouping`); none in server mode. */
  levels: readonly DataGridGroupItem[];
  /** The fields of `levels`, kept by value: what the columns and the indents are made from. */
  fields: readonly string[];
  /**
   * The one way the user changes the grouping (the panel and the menu call it): `onGroupingChange` and
   * `onStateChange`, then the first page as a second change with its own pair of callbacks when the
   * page was not the first, then `said`. A grouping that says what is held, or what an earlier request
   * of the same event asked, does nothing at all.
   */
  applyGrouping: (next: readonly DataGridGroupItem[], said?: string) => void;
  /** Opens or closes the group with this key: `onExpandedGroupsChange` and `onStateChange`, no sentence. */
  toggleGroup: (key: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

/**
 * The grouping: which items group, and the three things the user does to it, each through one function
 * so the callbacks, the page and what is said cannot differ between the parts that ask. The functions
 * read what they need when they are called and are the same for as long as the grid lives, so a press
 * on a group row draws no row but the ones it changes.
 */
export function useGridGrouping<TRow>(options: GridGroupingOptions<TRow>): GridGrouping {
  const { grouping, resolved, remote } = options;
  const levels = useKept(
    useMemo(
      () => (remote ? [] : effectiveGrouping(grouping, resolved)),
      [grouping, resolved, remote],
    ),
    sameGrouping,
  );
  const fieldList = useMemo(() => levels.map((item) => item.field), [levels]);
  const fields = useKept(fieldList, sameList);

  const latest = useRef(options);
  useWriteOnCommit(() => {
    latest.current = options;
  });

  const applyGrouping = useCallback((next: readonly DataGridGroupItem[], said?: string) => {
    const { setGrouping, setPage, pageIndex, size, paged, announce } = latest.current;
    if (!setGrouping(next)) return;
    if (paged && pageIndex !== 0) setPage({ index: 0, size });
    if (said) announce(said);
  }, []);

  const toggleGroup = useCallback((key: string) => {
    const { setExpandedGroups, expandedNow } = latest.current;
    const now = expandedNow();
    const except = now.except.includes(key)
      ? now.except.filter((other) => other !== key)
      : [...now.except, key];
    setExpandedGroups({ allExpanded: now.allExpanded, except });
  }, []);
  const expandAll = useCallback(
    () => void latest.current.setExpandedGroups({ allExpanded: true, except: [] }),
    [],
  );
  const collapseAll = useCallback(
    () => void latest.current.setExpandedGroups({ allExpanded: false, except: [] }),
    [],
  );
  return { levels, fields, applyGrouping, toggleGroup, expandAll, collapseAll };
}
