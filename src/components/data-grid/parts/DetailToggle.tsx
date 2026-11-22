import { ChevronIcon } from '../../../internal/icons';
import type { FlatDataRow } from '../engine/flatten';
import type { PinPlace } from '../engine/layout';
import { useGridContext } from '../grid-context';
import { pinAttributes } from './pin-attributes';

/**
 * The cell of the column of detail buttons in a data row. The button is the cell's one control (the data
 * grid pattern of the APG: a cell that holds one simple control gives the focus to it), so it is the Tab
 * stop when this is the active cell and the cell never is. It says whether the detail is open
 * (`aria-expanded`) and, while it is, which row is the detail (`aria-controls`); the row is drawn only
 * while it is open, so the button points at nothing before. A row that has no detail
 * (`rowHasDetail`) draws the cell empty: the place stays, with nothing to press.
 *
 * The press is the button's click, which every way of pressing it makes once (a pointer, Enter, Space),
 * so a press on it is never the row's (`selectOnRowClick`): a button is a control in a cell.
 */
export function DetailToggleCell<TRow>({
  flat,
  isActive,
  expanded,
  detailId,
  pin,
}: {
  flat: FlatDataRow<TRow>;
  isActive: boolean;
  /** Whether the detail row of this row is in the list. */
  expanded: boolean;
  /** The id of that detail row, given while it is in the list. */
  detailId: string | undefined;
  pin: PinPlace | undefined;
}) {
  const { labels, rowHeader, details, textOf } = useGridContext<TRow>();
  const has = details?.has(flat.row) === true;
  const text = has && rowHeader ? textOf(flat.row, rowHeader) : '';
  const name = text === '' ? String(flat.key) : text;
  return (
    <td
      className="flg-table-cell flg-data-grid-cell flg-data-grid-toggle-cell"
      data-service="detail"
      tabIndex={-1}
      {...pinAttributes(pin)}
    >
      {has ? (
        <button
          type="button"
          className="flg-data-grid-detail-toggle"
          aria-label={expanded ? labels.hideDetails(name) : labels.showDetails(name)}
          aria-expanded={expanded}
          aria-controls={expanded ? detailId : undefined}
          tabIndex={isActive ? 0 : -1}
          onClick={() => details?.toggle(flat.key)}
        >
          <ChevronIcon direction={expanded ? 'down' : 'right'} width={16} height={16} />
        </button>
      ) : null}
    </td>
  );
}
