import { useContext } from 'react';
import type { ReactElement } from 'react';
import {
  ActiveContext,
  SelectionViewContext,
  WindowContext,
  useGridContext,
} from '../grid-context';
import { FIRST_ROW_INDEX } from '../grid-dom';
import { DataRow } from './DataRow';

/**
 * The rows. A stripe is on the even rows of the list and not on the even children of the `<tbody>`,
 * so it stays with its row when rows come and go at the top of a window. What a row needs of the
 * active cell is passed as a prop, so that the cell moving draws only the rows it leaves and enters.
 *
 * A virtual grid draws the parts of its window: the rows, and between them the spacers, empty
 * boxes as tall as the rows they stand for. A spacer is not a data row, and is hidden from what reads
 * the page. The rows keep their keys when a spacer comes or goes, so a row with the focus is not
 * made again (which would drop the focus), and a spacer's key cannot be a row's.
 */
export function Body() {
  const { rows, rowReactKeys, variant, columns, virtual } = useGridContext();
  const { chosen } = useContext(SelectionViewContext);
  const active = useContext(ActiveContext);
  const parts = useContext(WindowContext);

  const row = (index: number): ReactElement => (
    <DataRow
      key={rowReactKeys[index]}
      flat={rows[index]!}
      stripe={variant === 'striped' && index % 2 === 0}
      selected={chosen.has(rows[index]!.key)}
      activeColumn={active?.row === index ? active.column : -1}
      ariaRowIndex={virtual ? index + FIRST_ROW_INDEX : undefined}
    />
  );

  const children: ReactElement[] = [];
  if (parts === null) {
    for (let index = 0; index < rows.length; index++) children.push(row(index));
  } else {
    parts.forEach((part, at) => {
      if (part.kind === 'spacer') {
        children.push(
          <tr key={`\u0000spacer-${at}`} className="flg-data-grid-spacer" aria-hidden="true">
            <td colSpan={columns.length} style={{ height: part.height }} />
          </tr>,
        );
      } else {
        for (let index = part.start; index < part.end; index++) children.push(row(index));
      }
    });
  }
  return <tbody className="flg-table-body">{children}</tbody>;
}
