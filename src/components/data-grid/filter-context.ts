import { createContext, useContext } from 'react';
import type { DistinctItem } from './engine/filter';
import type { PopupOpener } from './grid-dom';
import type { FilterPopoverControl } from './hooks/use-filter-popover';
import type { OperatorMenuControl } from './hooks/use-operator-menu';
import type { DataGridFilter } from './types';

/**
 * What the parts that show the filter share (spec phase 6 §3.6). It is apart from `GridContext`: the
 * rows read that, and a change of the filter must draw only what shows it. Internal: nothing of it is
 * exported.
 */
export interface HeaderList {
  /** The values listed, in the order of the column, the blank last. */
  items: readonly DistinctItem[];
  /** Whether the list shows less than the column holds (`listIsNarrowed`): what OK may change is the rest. */
  narrowed: boolean;
}

export interface FilterView {
  /** The filter as the grid holds it. */
  filter: DataGridFilter;
  /**
   * Whether the grid is filtering: there is a search, or the conditions are enabled and a column has one
   * that filters (`isFiltering`). The one answer every part gives to "is the grid filtered".
   */
  filtering: boolean;
  /** Asks for a filter the way the user does (`applyFilter` of the grid): callbacks, page 0, the count said. */
  apply: (next: DataGridFilter) => void;
  /** Asks for no search and no condition. */
  clear: () => void;
  /**
   * Tells `listener` each time the filter is cleared (`clear`, `clearFilter()` of the handle: the button of
   * the empty grid and of the panel), before it is asked for, whether or not it changes anything: a search
   * box or a cell that holds text it has not sent yet drops it, as the clear says there is no search and
   * no condition. Returns the way to stop. Stable.
   */
  onClear: (listener: () => void) => () => void;
  /** The one menu of operators of the grid, which the buttons of the filter cells open. Stable. */
  operatorMenu: OperatorMenuControl;
  /** The one popover of the grid that holds a filter's own controls (a range's two ends). Stable. */
  popover: FilterPopoverControl;
  /**
   * The values the header filter lists for a column (`distinctValues` of the rows after the search and the
   * conditions of the other columns, or the column's own list in server mode), as the grid holds them at the
   * moment of the call, and whether that list is narrowed. Stable; the popover asks once each time it opens.
   */
  listValues: (columnId: string) => HeaderList;
  /**
   * Where the focus goes when a popup opened from `from` for a column closes (`popupHome`): the one rule of
   * the operator menu and the filter popover. Stable; reads the grid as of the last commit.
   */
  popupHome: (opener: PopupOpener, columnId: string, from: HTMLElement) => HTMLElement | null;
}

export const FilterContext = createContext<FilterView | null>(null);

/** The filter view of the grid the part is in; like `useGridContext`, a mistake of the library's own if missing. */
export function useFilterView(): FilterView {
  const view = useContext(FilterContext);
  if (!view) throw new Error('A part of the DataGrid was used outside a DataGrid.');
  return view;
}
