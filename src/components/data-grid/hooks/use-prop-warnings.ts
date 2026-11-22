import { useEffect } from 'react';
import { devWarn } from '../../../internal/warn';

interface PropWarnings {
  /** What `normalizeProps` found wrong with the props that hold data and state, said once each. */
  normalized: readonly string[];
  rowHeightIsValid: boolean;
  /** `selectAllMode="all"` in server mode, which has no rows beyond the page. */
  allIsPage: boolean;
  /** `scrolling="virtual"` without a `height` that is a prop. */
  virtualNeedsHeight: boolean;
  /** `scrolling="virtual"` in server mode. */
  virtualNotRemote: boolean;
  /** `scrolling="virtual"` with `paging` given. */
  virtualHasNoPages: boolean;
  /** Server mode without `totalCount`. */
  missingCount: boolean;
  /** Server mode with a funnel on a column that has no `headerFilter.values`. */
  missingHeaderValues: boolean;
  /** Server mode with a grouping, which the grid holds and does not apply. */
  remoteGrouping: boolean;
  remoteGroupPanel: boolean;
  /** A summary item that names a column the grid does not have, or has a type that is none. */
  summaryLeftOut: boolean;
  /** Two summary items with one id: the first stays. */
  summaryRepeated: boolean;
  /** Server mode with group totals asked for, which are not drawn. */
  remoteGroupTotals: boolean;
}

/**
 * The warnings about the props of a grid, each from an effect, so each is said after the commit and
 * once. The grid works the booleans out where it uses the values; this says what is wrong with them.
 */
export function usePropWarnings({
  normalized,
  rowHeightIsValid,
  allIsPage,
  virtualNeedsHeight,
  virtualNotRemote,
  virtualHasNoPages,
  missingCount,
  missingHeaderValues,
  remoteGrouping,
  remoteGroupPanel,
  summaryLeftOut,
  summaryRepeated,
  remoteGroupTotals,
}: PropWarnings): void {
  useEffect(() => {
    for (const message of normalized) devWarn(message);
  }, [normalized]);
  useEffect(() => {
    if (!rowHeightIsValid) {
      devWarn(
        '<DataGrid> rowHeight is not a finite number above 0; the height of the density and variant is used.',
      );
    }
  }, [rowHeightIsValid]);
  useEffect(() => {
    if (allIsPage) {
      devWarn(
        '<DataGrid> selectAllMode "all" needs every row, which server mode does not have; "page" is used.',
      );
    }
  }, [allIsPage]);
  useEffect(() => {
    if (virtualNeedsHeight) {
      devWarn('<DataGrid> scrolling="virtual" needs the height prop; the grid scrolls as usual.');
    }
  }, [virtualNeedsHeight]);
  useEffect(() => {
    if (virtualNotRemote) {
      devWarn(
        '<DataGrid> scrolling="virtual" is not for server mode (remote); the grid scrolls as usual.',
      );
    }
  }, [virtualNotRemote]);
  useEffect(() => {
    if (virtualHasNoPages) {
      devWarn('<DataGrid> scrolling="virtual" has no pages; paging is ignored.');
    }
  }, [virtualHasNoPages]);
  useEffect(() => {
    if (missingCount) {
      devWarn(
        '<DataGrid> remote needs totalCount for the count and the pages; the rows of data are counted.',
      );
    }
  }, [missingCount]);
  useEffect(() => {
    if (missingHeaderValues) {
      devWarn(
        "<DataGrid> in server mode a column's header filter needs headerFilter.values; the values of the page are listed.",
      );
    }
  }, [missingHeaderValues]);
  useEffect(() => {
    if (remoteGrouping) {
      devWarn(
        '<DataGrid> remote does not group: grouping is held and ignored; group on the server.',
      );
    }
  }, [remoteGrouping]);
  useEffect(() => {
    if (remoteGroupPanel) {
      devWarn('<DataGrid> remote does not group: the group panel is not shown.');
    }
  }, [remoteGroupPanel]);
  useEffect(() => {
    if (summaryLeftOut) {
      devWarn('<DataGrid> a summary item names a column the grid does not have; it is left out.');
    }
  }, [summaryLeftOut]);
  useEffect(() => {
    if (summaryRepeated) {
      devWarn('<DataGrid> two summary items have the same id; the second is left out.');
    }
  }, [summaryRepeated]);
  useEffect(() => {
    if (remoteGroupTotals) {
      devWarn('<DataGrid> remote has no group totals; they are not shown.');
    }
  }, [remoteGroupTotals]);
}
