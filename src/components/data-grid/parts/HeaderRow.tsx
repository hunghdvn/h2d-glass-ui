import { useGridContext } from '../grid-context';
import { HeaderCell } from './HeaderCell';

export function HeaderRow() {
  const { columns } = useGridContext();
  return (
    <thead className="flg-table-header">
      <tr className="flg-table-row">
        {columns.map((column) => (
          <HeaderCell key={column.id} column={column} />
        ))}
      </tr>
    </thead>
  );
}
