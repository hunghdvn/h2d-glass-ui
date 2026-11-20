import { memo, useContext } from 'react';
import { ActiveContext, useGridContext } from '../grid-context';
import { placeFiller } from './FillerCell';
import { HeaderCell } from './HeaderCell';
import { SelectAllCell } from './SelectCells';

/**
 * The titles. Memoized: it takes no prop, so it draws again only when what the grid shares or the
 * active cell changes, and not when the grid draws for something it does not read (a width, which
 * is the table's alone).
 */
export const HeaderRow = memo(function HeaderRow() {
  const { columns, filler, fillerAt, pins, virtual } = useGridContext();
  const active = useContext(ActiveContext);
  return (
    <thead className="flg-table-header">
      {/* The heading is the first row, and the rows of data count on from it. */}
      <tr className="flg-table-row" aria-rowindex={virtual ? 1 : undefined}>
        {placeFiller(
          columns.map((column, index) =>
            column.service === 'select' ? (
              <SelectAllCell
                key={column.id}
                isActive={active?.row === -1 && active.column === index}
                pin={pins[index]}
              />
            ) : (
              <HeaderCell
                key={column.id}
                column={column}
                isActive={active?.row === -1 && active.column === index}
                pin={pins[index]}
              />
            ),
          ),
          fillerAt,
          filler,
          true,
        )}
      </tr>
    </thead>
  );
});
