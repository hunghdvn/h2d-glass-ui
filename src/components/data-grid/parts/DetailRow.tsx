import { memo } from 'react';
import type { FlatDetailRow } from '../engine/flatten';
import { useGridContext } from '../grid-context';
import { IndentCell } from './IndentCells';

interface DetailRowProps<TRow> {
  flat: FlatDetailRow<TRow>;
  /** The id the button of the master row points at (`aria-controls`). */
  id: string;
  /** Whether this row is the active place, the one Tab stop of the grid: a prop, so the keyboard draws only the rows it leaves and enters. */
  active: boolean;
  /** The place of the row for a screen reader, in a virtual grid, where the rows are not all drawn. */
  ariaRowIndex: number | undefined;
}

function DetailRowImpl<TRow>({ flat, id, active, ariaRowIndex }: DetailRowProps<TRow>) {
  const { layoutColumns, layoutPins, filler, details } = useGridContext<TRow>();
  // The cells before the column of the buttons (the box, the indents of the groups) are empty, with no band;
  // one cell goes on from the column of the buttons to the end of the row, the filler column in it.
  const at = layoutColumns.findIndex((column) => column.service === 'detail');
  return (
    <tr
      id={id}
      className="flg-table-row flg-data-grid-detail-row"
      // Under groups the row says the level of its master; without them it says none, as the rows do not.
      aria-level={flat.level > 1 ? flat.level : undefined}
      aria-rowindex={ariaRowIndex}
    >
      {layoutColumns.slice(0, at).map((column, index) => (
        <IndentCell key={column.id} pin={layoutPins[index]} />
      ))}
      <td
        colSpan={layoutColumns.length - at + (filler ? 1 : 0)}
        className="flg-table-cell flg-data-grid-detail-cell"
        tabIndex={active ? 0 : -1}
      >
        <div className="flg-data-grid-detail-content">{details?.render(flat.row)}</div>
      </td>
    </tr>
  );
}

/**
 * The row under a master row that has its detail open (spec phase 6 §4.3 R1 "Dòng chi tiết"): a place of
 * the keyboard with one cell, a cell of the grid that holds whatever `renderDetail` draws. The cell
 * spans every column from the button's on, and what is in it stays in sight when the frame is scrolled
 * sideways (the stylesheet sticks the content, and `--flg-data-grid-frame-width` is what it is as
 * wide as). It is memoized: it draws again when its row, whether it is the active place, or something the
 * whole grid shares (what `renderDetail` is, the pins) changes.
 */
export const DetailRow = memo(DetailRowImpl) as typeof DetailRowImpl;
