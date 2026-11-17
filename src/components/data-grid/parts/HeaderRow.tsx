import { useGridContext } from '../grid-context';
import { HeaderCell } from './HeaderCell';
import { SelectAllCell } from './SelectCells';

export function HeaderRow() {
  const { columns, active } = useGridContext();
  return (
    <thead className="flg-table-header">
      <tr className="flg-table-row">
        {columns.map((column, index) =>
          column.service === 'select' ? (
            <SelectAllCell
              key={column.id}
              isActive={active?.row === -1 && active.column === index}
            />
          ) : (
            <HeaderCell key={column.id} column={column} index={index} />
          ),
        )}
      </tr>
    </thead>
  );
}
