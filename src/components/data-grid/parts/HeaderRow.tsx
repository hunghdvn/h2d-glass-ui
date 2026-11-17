import { useGridContext } from '../grid-context';
import { HeaderCell } from './HeaderCell';

export function HeaderRow() {
  const { columns } = useGridContext();
  return (
    <thead className="flg-table-header">
      <tr className="flg-table-row">
        {columns.map((column, index) => (
          <HeaderCell key={column.id} column={column} index={index} />
        ))}
      </tr>
    </thead>
  );
}
