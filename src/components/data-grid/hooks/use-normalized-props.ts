import { useMemo } from 'react';
import { normalizeProps } from '../normalize';
import type { GivenProps, SafeProps } from '../normalize';

/**
 * The props that hold data and state in shapes the grid can use (`normalizeProps`), made again only
 * when one of them changes: each is a dependency by itself, never the object that carries them, which
 * is new in every render.
 */
export function useNormalizedProps<TRow>(given: GivenProps<TRow>): SafeProps<TRow> {
  const {
    data,
    columns,
    paging,
    sort,
    defaultSort,
    filter,
    defaultFilter,
    page,
    defaultPage,
    selectedKeys,
    defaultSelectedKeys,
    columnLayout,
    defaultColumnLayout,
    grouping,
    defaultGrouping,
    expandedGroups,
    defaultExpandedGroups,
    expandedRows,
    defaultExpandedRows,
    summary,
    totalSummary,
    editing,
    csvExport,
  } = given;
  return useMemo(
    () =>
      normalizeProps({
        data,
        columns,
        paging,
        sort,
        defaultSort,
        filter,
        defaultFilter,
        page,
        defaultPage,
        selectedKeys,
        defaultSelectedKeys,
        columnLayout,
        defaultColumnLayout,
        grouping,
        defaultGrouping,
        expandedGroups,
        defaultExpandedGroups,
        expandedRows,
        defaultExpandedRows,
        summary,
        totalSummary,
        editing,
        csvExport,
      }),
    [
      data,
      columns,
      paging,
      sort,
      defaultSort,
      filter,
      defaultFilter,
      page,
      defaultPage,
      selectedKeys,
      defaultSelectedKeys,
      columnLayout,
      defaultColumnLayout,
      grouping,
      defaultGrouping,
      expandedGroups,
      defaultExpandedGroups,
      expandedRows,
      defaultExpandedRows,
      summary,
      totalSummary,
      editing,
      csvExport,
    ],
  );
}
