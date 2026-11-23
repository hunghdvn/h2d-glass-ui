import { memo, useContext } from 'react';
import { ActiveContext, useGridContext } from '../grid-context';
import { headRowCount, isFilterPlace } from '../grid-dom';
import { rowCells } from './row-cells';
import { FilterCell } from './FilterCell';
import { IndentCell } from './IndentCells';

/**
 * The filter row (spec phase 6 §3.6, §4.3 F1): the second row of the heading, with a cell for each shown
 * column, the filler where the titles have it. Memoized like the titles: it takes no prop, so it draws again
 * only when what the grid shares or the active cell changes. A virtual grid says its place, 2, as the
 * titles say 1.
 */
export const FilterRow = memo(function FilterRow() {
  const { layoutColumns, filler, fillerAt, layoutPins, virtual } = useGridContext();
  const active = useContext(ActiveContext);
  return (
    <tr className="flg-table-row flg-data-grid-filter-row" aria-rowindex={virtual ? 2 : undefined}>
      {rowCells(layoutColumns, fillerAt, filler, false, ({ column, index, place, indent }) =>
        indent ? (
          <IndentCell key={column.id} pin={layoutPins[index]} />
        ) : (
          <FilterCell
            key={column.id}
            column={column}
            isActive={
              active !== null &&
              isFilterPlace(active.row, headRowCount(true)) &&
              active.column === place
            }
            pin={layoutPins[index]}
          />
        ),
      )}
    </tr>
  );
});
