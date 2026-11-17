import { clsx } from 'clsx';
import { dataAttr } from '../../../internal/data-attr';
import type { FlatRow } from '../engine/flatten';
import { useGridContext } from '../grid-context';
import { Cell } from './Cell';

interface DataRowProps<TRow> {
  flat: FlatRow<TRow>;
  /** The place of the row among the rows that are drawn. */
  index: number;
  /** Whether this row has the stripe of a `striped` grid. */
  stripe: boolean;
}

export function DataRow<TRow>({ flat, index, stripe }: DataRowProps<TRow>) {
  const { columns, rowClassName, active } = useGridContext<TRow>();
  const activeColumn = active?.row === index ? active.column : -1;
  return (
    <tr
      className={clsx('flg-table-row', 'flg-data-grid-row', rowClassName?.(flat.row))}
      data-stripe={dataAttr(stripe)}
    >
      {columns.map((column, columnIndex) => (
        <Cell key={column.id} column={column} flat={flat} isActive={columnIndex === activeColumn} />
      ))}
    </tr>
  );
}
