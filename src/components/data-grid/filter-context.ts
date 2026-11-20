import { createContext, useContext } from 'react';
import type { OperatorMenuControl } from './hooks/use-operator-menu';
import type { DataGridFilter } from './types';

/**
 * What the parts that show the filter share (spec phase 6 §3.6). It is apart from `GridContext`: the
 * rows read that, and a change of the filter must draw only what shows it. Internal: nothing of it is
 * exported.
 */
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
  /** The one menu of operators of the grid, which the buttons of the filter cells open. Stable. */
  operatorMenu: OperatorMenuControl;
}

export const FilterContext = createContext<FilterView | null>(null);

/** The filter view of the grid the part is in; like `useGridContext`, a mistake of the library's own if missing. */
export function useFilterView(): FilterView {
  const view = useContext(FilterContext);
  if (!view) throw new Error('A part of the DataGrid was used outside a DataGrid.');
  return view;
}
