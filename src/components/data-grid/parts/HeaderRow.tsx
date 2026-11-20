import { memo, useContext } from 'react';
import { ActiveContext, useGridContext } from '../grid-context';
import { headRowCount, isTitlePlace } from '../grid-dom';
import { placeFiller } from './FillerCell';
import { FilterRow } from './FilterRow';
import { HeaderCell } from './HeaderCell';
import { SelectAllCell } from './SelectCells';

/**
 * The heading: the titles, and the filter row under them when the grid has one. Memoized: it takes no prop, so it draws again only when what the grid shares or the
 * active cell changes, and not when the grid draws for something it does not read (a width, which
 * is the table's alone).
 */
export const HeaderRow = memo(function HeaderRow() {
  const { columns, filler, fillerAt, pins, virtual, filterRow } = useGridContext();
  const active = useContext(ActiveContext);
  // The place of a title counts up from the body: -1, or -2 when a filter row stands between.
  const onTitle = (index: number) =>
    active !== null && isTitlePlace(active.row, headRowCount(filterRow)) && active.column === index;
  return (
    <thead className="flg-table-header">
      {/* The heading is the first row, and the rows of data count on from it. */}
      <tr className="flg-table-row" aria-rowindex={virtual ? 1 : undefined}>
        {placeFiller(
          columns.map((column, index) =>
            column.service === 'select' ? (
              <SelectAllCell key={column.id} isActive={onTitle(index)} pin={pins[index]} />
            ) : (
              <HeaderCell
                key={column.id}
                column={column}
                isActive={onTitle(index)}
                pin={pins[index]}
              />
            ),
          ),
          fillerAt,
          filler,
          true,
        )}
      </tr>
      {filterRow ? <FilterRow /> : null}
    </thead>
  );
});
