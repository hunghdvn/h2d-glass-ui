import { clsx } from 'clsx';
import { memo } from 'react';
import type { MouseEvent } from 'react';
import { takesOwnPress } from '../../../internal/controls';
import { dataAttr } from '../../../internal/data-attr';
import type { FlatRow } from '../engine/flatten';
import { useGridContext } from '../grid-context';
import { Cell } from './Cell';

interface DataRowProps<TRow> {
  flat: FlatRow<TRow>;
  /** The place of the row among the rows that are drawn. */
  index: number;
  /** Whether this row has the stripe of a `striped` grid. */
  stripe: boolean;
  /** Whether this row is chosen: a prop, so that a choice draws again only the rows it changes. */
  selected: boolean;
}

/** The cell of this row that holds `target`, which may be a control in it; a grid in a cell has its own. */
function cellOf(target: EventTarget, row: HTMLTableRowElement): HTMLTableCellElement | null {
  const cell = target instanceof Element ? target.closest('td, th') : null;
  return cell && cell.parentElement === row ? (cell as HTMLTableCellElement) : null;
}

function DataRowImpl<TRow>({ flat, index, stripe, selected }: DataRowProps<TRow>) {
  const { columns, rowClassName, active, selection } = useGridContext<TRow>();
  const activeColumn = active?.row === index ? active.column : -1;
  const { mode, onRowClick, actions } = selection;

  // A press on a row. It is the row's only when it is not a control's: a link, a button or a box in a
  // cell does its own thing and chooses nothing here. The cell is the one to ask, since the active cell
  // has a `tabindex` of its own and would count as a control to the row. Shift adds a range, and in
  // `multiple` a row is not chosen by a plain press unless `selectOnRowClick` says so.
  const onClick =
    mode === 'none'
      ? undefined
      : (event: MouseEvent<HTMLTableRowElement>) => {
          const cell = cellOf(event.target, event.currentTarget);
          if (!cell || takesOwnPress({ target: event.target, currentTarget: cell })) return;
          const range = mode === 'multiple' && event.shiftKey;
          if (range || onRowClick) actions.press(flat.key, range);
        };
  // Shift with a press starts a text selection across the rows, in a browser. It is cancelled on the
  // `mousedown` and never on the `pointerdown`, whose cancelling takes the mouse events away from what
  // listens for them (a click-away listener). A control in a cell keeps its press, but the box of a
  // row is one that does not: a Shift press on it is as much a press on the row as any.
  const onMouseDown =
    mode === 'multiple'
      ? (event: MouseEvent<HTMLTableRowElement>) => {
          if (!event.shiftKey || event.button !== 0) return;
          const cell = cellOf(event.target, event.currentTarget);
          if (!cell) return;
          if (
            cell.hasAttribute('data-service') ||
            !takesOwnPress({ target: event.target, currentTarget: cell })
          ) {
            event.preventDefault();
          }
        }
      : undefined;

  return (
    <tr
      className={clsx('flg-table-row', 'flg-data-grid-row', rowClassName?.(flat.row))}
      data-stripe={dataAttr(stripe)}
      data-selected={dataAttr(selected)}
      aria-selected={mode === 'none' ? undefined : selected}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {columns.map((column, columnIndex) => (
        <Cell
          key={column.id}
          column={column}
          flat={flat}
          isActive={columnIndex === activeColumn}
          selected={selected}
        />
      ))}
    </tr>
  );
}

/**
 * Memoized: a row draws again when its own row, its place, its stripe or whether it is chosen
 * changes, or when something the whole grid shares does (the active cell, as the keyboard moves it).
 * A choice changes none of the shared things, so it draws only the rows it changes.
 */
export const DataRow = memo(DataRowImpl) as typeof DataRowImpl;
