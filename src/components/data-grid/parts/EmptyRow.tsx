import { useGridContext } from '../grid-context';

/**
 * What a grid with no row says: one row with one cell across every column, and the words in it. The
 * words are in a box that sticks to the left edge of the frame and is as wide as what the frame
 * shows (`--flg-data-grid-frame-width`, which the grid measures while this is drawn), so they stay
 * in sight when the columns are wider than the frame and it has been scrolled sideways. It is not a
 * row of data and nothing in it takes the keyboard.
 */
export function EmptyRow() {
  const { columns, labels } = useGridContext();
  return (
    <tr className="flg-data-grid-empty">
      <td className="flg-data-grid-empty-cell" colSpan={columns.length}>
        <div className="flg-data-grid-empty-content">{labels.noData}</div>
      </td>
    </tr>
  );
}
