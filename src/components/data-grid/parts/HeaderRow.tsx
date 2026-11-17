import { useContext } from 'react';
import { ActiveContext, useGridContext } from '../grid-context';
import { FillerCell } from './FillerCell';
import { HeaderCell } from './HeaderCell';
import { SelectAllCell } from './SelectCells';

export function HeaderRow() {
  const { columns, filler, virtual } = useGridContext();
  const active = useContext(ActiveContext);
  return (
    <thead className="flg-table-header">
      {/* The heading is the first row, and the rows of data count on from it. */}
      <tr className="flg-table-row" aria-rowindex={virtual ? 1 : undefined}>
        {columns.map((column, index) =>
          column.service === 'select' ? (
            <SelectAllCell
              key={column.id}
              isActive={active?.row === -1 && active.column === index}
            />
          ) : (
            <HeaderCell
              key={column.id}
              column={column}
              isActive={active?.row === -1 && active.column === index}
            />
          ),
        )}
        {filler ? <FillerCell head /> : null}
      </tr>
    </thead>
  );
}
