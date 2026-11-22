import { memo, useContext } from 'react';
import { ActiveContext, useGridContext } from '../grid-context';
import { headRowCount, isFilterPlace } from '../grid-dom';
import { placeFiller } from './FillerCell';
import { FilterCell } from './FilterCell';

/**
 * The filter row (spec phase 6 §3.6, §4.3 F1): the second row of the heading, with a cell for each shown
 * column, the filler where the titles have it. Memoized like the titles: it takes no prop, so it draws again
 * only when what the grid shares or the active cell changes. A virtual grid says its place, 2, as the
 * titles say 1.
 */
export const FilterRow = memo(function FilterRow() {
  const { columns, filler, fillerAt, pins, virtual } = useGridContext();
  const active = useContext(ActiveContext);
  return (
    <tr className="flg-table-row flg-data-grid-filter-row" aria-rowindex={virtual ? 2 : undefined}>
      {placeFiller(
        columns.map((column, index) => (
          <FilterCell
            key={column.id}
            column={column}
            isActive={
              active !== null &&
              isFilterPlace(active.row, headRowCount(true)) &&
              active.column === index
            }
            pin={pins[index]}
          />
        )),
        fillerAt,
        filler,
      )}
    </tr>
  );
});
