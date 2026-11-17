import type { ResolvedColumn } from '../engine/columns';

/** The title of a column. It is a plain title for now; sorting gives it a button. */
export function HeaderCell<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
  return (
    <th scope="col" className="flg-table-head flg-data-grid-head" data-align={column.align}>
      <div className="flg-data-grid-head-content">
        <span>{column.caption}</span>
      </div>
    </th>
  );
}
