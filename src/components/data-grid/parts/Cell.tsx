import { CheckIcon } from '../../../internal/icons';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatRow } from '../engine/flatten';
import { useGridContext } from '../grid-context';

interface CellProps<TRow> {
  column: ResolvedColumn<TRow>;
  flat: FlatRow<TRow>;
}

/**
 * A cell of a data row: a `<td>`, or the `<th scope="row">` of the row header column. The `cell` of
 * the column replaces what is in it; otherwise it is the text of the column, which is nothing for a
 * blank value. A boolean is a check for `true` and no mark for `false`; the words are in the cell
 * for a screen reader, and are what a search and an export read.
 */
export function Cell<TRow>({ column, flat }: CellProps<TRow>) {
  const { textOf } = useGridContext<TRow>();
  const text = textOf(flat.row, column);
  const value = column.value(flat.row);
  let content;
  if (column.cell) {
    content = column.cell({
      row: flat.row,
      rowKey: flat.key,
      value,
      text,
      column: column.info,
      // Selection comes with its own plan.
      selected: false,
    });
  } else if (column.dataType === 'boolean' && typeof value === 'boolean') {
    content = (
      <>
        {value && (
          <span className="flg-data-grid-check">
            <CheckIcon width={16} height={16} />
          </span>
        )}
        <span className="flg-visually-hidden">{text}</span>
      </>
    );
  } else {
    content = text === '' ? null : text;
  }
  return column.rowHeader ? (
    <th scope="row" className="flg-table-head flg-data-grid-cell" data-align={column.align}>
      {content}
    </th>
  ) : (
    <td className="flg-table-cell flg-data-grid-cell" data-align={column.align}>
      {content}
    </td>
  );
}
