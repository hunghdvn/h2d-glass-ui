import { useContext } from 'react';
import { Checkbox } from '../../checkbox/Checkbox';
import type { FlatRow } from '../engine/flatten';
import type { PinPlace } from '../engine/layout';
import { SelectionViewContext, useGridContext } from '../grid-context';
import { pinAttributes } from './pin-attributes';

/**
 * The box of a row, in the column of boxes. The box is the focus target of its cell (the data grid
 * pattern of the APG: a cell that holds one simple control gives the focus to it), so it is the Tab
 * stop when this is the active cell, and the cell is never one.
 *
 * The press is read from the click of the box, which every way of pressing it makes once (a pointer,
 * a press on its label, Enter), so that Shift is the click's own. A press on the box never reaches the
 * `selectOnRowClick` of the row: a box is a control in a cell, and a control takes its own press.
 */
export function SelectRowCell<TRow>({
  flat,
  isActive,
  selected,
  pin,
}: {
  flat: FlatRow<TRow>;
  isActive: boolean;
  selected: boolean;
  pin: PinPlace | undefined;
}) {
  const { labels, rowHeader, selection, textOf } = useGridContext<TRow>();
  const text = rowHeader ? textOf(flat.row, rowHeader) : '';
  return (
    <td
      className="flg-table-cell flg-data-grid-cell flg-data-grid-select-cell"
      data-service="select"
      tabIndex={-1}
      {...pinAttributes(pin)}
    >
      <Checkbox
        aria-label={labels.selectRow(text === '' ? String(flat.key) : text)}
        checked={selected}
        tabIndex={isActive ? 0 : -1}
        onClick={(event) => selection.actions.press(flat.key, event.shiftKey)}
      />
    </td>
  );
}

/**
 * The box in the title of the column of boxes: it chooses, or takes off, the rows of its scope (the
 * page, or every row), and is mixed when only some of them are chosen. With no row in its scope it is
 * disabled and cannot have the focus, so the title cell takes the Tab stop for itself.
 */
export function SelectAllCell({ isActive, pin }: { isActive: boolean; pin: PinPlace | undefined }) {
  const { labels, selection } = useGridContext();
  const { header } = useContext(SelectionViewContext);
  const name = selection.allMode === 'all' ? labels.selectAll : labels.selectAllOnPage;
  return (
    <th
      scope="col"
      className="flg-table-head flg-data-grid-head flg-data-grid-select-cell"
      data-service="select"
      tabIndex={isActive && header.disabled ? 0 : -1}
      {...pinAttributes(pin)}
    >
      <Checkbox
        aria-label={name}
        checked={header.checked}
        indeterminate={header.indeterminate}
        disabled={header.disabled}
        tabIndex={isActive && !header.disabled ? 0 : -1}
        onCheckedChange={selection.actions.setAll}
      />
      {/* A title with no words is a table header with no name: the box has its own, and this says it
          for the column. */}
      <span className="flg-visually-hidden">{name}</span>
    </th>
  );
}
