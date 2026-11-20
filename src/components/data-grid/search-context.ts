import { createContext, useContext } from 'react';

/**
 * The search the cells mark, as `foldedSearch` reads it: trimmed and folded, and `''` when there is none.
 * It is read by the cells alone (spec phase 6 §3.6), apart from `GridContext` and `FilterContext`, so a
 * change of the search draws the cells it marks and nothing else that reads the filter; it is a string,
 * so a render that says the same search changes nothing. Internal: nothing of it is exported.
 */
export const SearchContext = createContext('');

/** The folded search of the grid the cell is in. */
export const useFoldedSearch = (): string => useContext(SearchContext);
