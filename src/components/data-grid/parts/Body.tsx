import { useContext } from 'react';
import { SelectionViewContext, useGridContext } from '../grid-context';
import { DataRow } from './DataRow';

/**
 * The rows. A stripe is on the even rows of what is drawn and not on the even children of the
 * `<tbody>`, so it stays with its row when rows come and go at the top of a window.
 */
export function Body() {
  const { rows, rowReactKeys, variant } = useGridContext();
  const { chosen } = useContext(SelectionViewContext);
  return (
    <tbody className="flg-table-body">
      {rows.map((flat, index) => (
        <DataRow
          key={rowReactKeys[index]}
          flat={flat}
          index={index}
          stripe={variant === 'striped' && index % 2 === 0}
          selected={chosen.has(flat.key)}
        />
      ))}
    </tbody>
  );
}
