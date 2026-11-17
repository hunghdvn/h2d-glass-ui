import { clsx } from 'clsx';
import { dataAttr } from '../../../internal/data-attr';
import type { FlatRow } from '../engine/flatten';
import { useGridContext } from '../grid-context';
import { Cell } from './Cell';

interface DataRowProps<TRow> {
  flat: FlatRow<TRow>;
  /** Whether this row has the stripe of a `striped` grid. */
  stripe: boolean;
}

export function DataRow<TRow>({ flat, stripe }: DataRowProps<TRow>) {
  const { columns, rowClassName } = useGridContext<TRow>();
  return (
    <tr
      className={clsx('flg-table-row', 'flg-data-grid-row', rowClassName?.(flat.row))}
      data-stripe={dataAttr(stripe)}
    >
      {columns.map((column) => (
        <Cell key={column.id} column={column} flat={flat} />
      ))}
    </tr>
  );
}
