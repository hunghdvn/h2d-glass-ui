import { useContext } from 'react';
import { FunnelXIcon } from '../../../internal/icons';
import { Button } from '../../button/Button';
import { useFilterView } from '../filter-context';
import { ActiveContext, useGridContext } from '../grid-context';

/**
 * What a grid with no row says: one row with one cell across every column, and the words in it. The
 * words are in a box that sticks to the left edge of the frame and is as wide as what the frame
 * shows (`--flg-data-grid-frame-width`, which the grid measures while this is drawn), so they stay
 * in sight when the columns are wider than the frame and it has been scrolled sideways.
 *
 * With no data it says `labels.noData`, is not a row of data and nothing in it takes the keyboard. When
 * the grid is empty because of its filter it says `labels.noMatches` under a ring with a funnel, and
 * holds the button that clears the filter (spec phase 6 §4.3, "Trống do lọc"). The button is then
 * the cell's one control: the cell is a place of the grid (the one of the body, reached by ↓ from the
 * titles), and its `data-home` makes the button what has the focus, as the box of a cell of the
 * column of boxes does. The button is the Tab stop while that place is the active one.
 */
export function EmptyRow() {
  const { layoutColumns, filler, labels } = useGridContext();
  const { filtering, clear } = useFilterView();
  const active = useContext(ActiveContext);
  const span = layoutColumns.length + (filler ? 1 : 0);
  if (!filtering) {
    return (
      <tr className="flg-data-grid-empty">
        <td className="flg-data-grid-empty-cell" colSpan={span}>
          <div className="flg-data-grid-empty-content">{labels.noData}</div>
        </td>
      </tr>
    );
  }
  return (
    <tr className="flg-data-grid-empty">
      <td className="flg-data-grid-empty-cell" colSpan={span} data-home="control" tabIndex={-1}>
        <div className="flg-data-grid-empty-content" data-filtered="">
          <span className="flg-data-grid-empty-icon">
            <FunnelXIcon width={18} height={18} />
          </span>
          <span className="flg-data-grid-empty-title">{labels.noMatches}</span>
          <Button
            variant="secondary"
            size="sm"
            tabIndex={active?.row === 0 ? 0 : -1}
            onClick={clear}
          >
            {labels.clearFilter}
          </Button>
        </div>
      </td>
    </tr>
  );
}
