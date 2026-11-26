import { clsx } from 'clsx';
import { memo } from 'react';
import type { MouseEvent } from 'react';
import { takesOwnPress } from '../../../internal/controls';
import { dataAttr } from '../../../internal/data-attr';
import { useEditContext } from '../edit-context';
import type { EditTarget } from '../edit-context';
import { canEdit, editsCells } from '../engine/edit';
import type { RowMarks } from '../engine/edit';
import type { FlatDataRow } from '../engine/flatten';
import { useGridContext } from '../grid-context';
import { focusHomeOf, holdsEditing } from '../grid-dom';
import { Cell } from './Cell';
import { rowCells } from './row-cells';
import { IndentCell } from './IndentCells';

interface DataRowProps<TRow> {
  flat: FlatDataRow<TRow>;
  /** Whether this row has the stripe of a `striped` grid. */
  stripe: boolean;
  /** Whether this row is chosen: a prop, so that a choice draws again only the rows it changes. */
  selected: boolean;
  /** Whether the detail row of this row is in the list: a prop, so a toggle draws this row and the detail only. */
  expanded: boolean;
  /** The id of that detail row while it is in the list; the same for a key whatever else opens or closes. */
  detailId: string | undefined;
  /** Whether this row is the one a drag of its handle is moving: dimmed, a prop for the same reason. */
  dragged: boolean;
  /** The column of the active cell when it is in this row, else -1: a prop, for the same reason. */
  activeColumn: number;
  /** The place of the row for a screen reader, in a virtual grid, where the rows are not all drawn. */
  ariaRowIndex: number | undefined;
  /** The row being edited, when it is this one: a prop, so starting and ending an edit draws this row only. */
  editing: EditTarget | null;
  /** What this row shows of the change held over it (batch mode): the same object while the change is. */
  marks: RowMarks | undefined;
}

/**
 * The cell of this row that holds `target`, which may be a control in it; a grid in a cell has its
 * own. The cell of the filler column is none: it is no cell of the grid, and takes no press.
 */
function cellOf(target: EventTarget, row: HTMLTableRowElement): HTMLTableCellElement | null {
  const cell = target instanceof Element ? target.closest('td, th') : null;
  return cell && cell.parentElement === row && !cell.classList.contains('flg-data-grid-filler')
    ? (cell as HTMLTableCellElement)
    : null;
}

function DataRowImpl<TRow>({
  flat,
  stripe,
  selected,
  expanded,
  detailId,
  dragged,
  activeColumn,
  ariaRowIndex,
  editing,
  marks,
}: DataRowProps<TRow>) {
  const { layoutColumns, filler, fillerAt, layoutPins, rowClassName, selection } =
    useGridContext<TRow>();
  const { mode, onRowClick, activates, actions } = selection;
  const edit = useEditContext<TRow>();
  // The editor that takes the focus when the edit starts: the column asked for if it can be edited, else the
  // first column that can.
  let focusColumn: string | undefined;
  // The cells of the row being edited that can be edited, asked of the app once for each cell: the cells read this set.
  let editable: ReadonlySet<string> | undefined;
  if (editing !== null && edit !== null) {
    const ids = new Set<string>();
    for (const column of layoutColumns) {
      if (canEdit(column, flat.row, edit.config, flat.added === true)) ids.add(column.id);
    }
    editable = ids;
    const asked =
      editing.focus === null ? undefined : layoutColumns.find((c) => c.id === editing.focus);
    focusColumn = (asked && ids.has(asked.id) ? asked : layoutColumns.find((c) => ids.has(c.id)))
      ?.id;
  }

  // A press on a row. It is the row's only when it is not a control's: a link, a button or a box in a
  // cell does its own thing and chooses nothing here. The cell is the one to ask, since the active cell
  // has a `tabindex` of its own and would count as a control to the row. Shift adds a range, and in
  // `multiple` a row is not chosen by a plain press unless `selectOnRowClick` says so. When a double
  // press activates the row, its second click (`detail` 2 or more) is part of that and chooses
  // nothing, or `multiple` would choose the row and take it off again; a click of the keyboard has
  // no count (`detail` 0) and is a press. Without `onRowActivate` a quick second press is a press.
  const onClick =
    mode === 'none' && !(edit && editsCells(edit.mode))
      ? undefined
      : (event: MouseEvent<HTMLTableRowElement>) => {
          const cell = cellOf(event.target, event.currentTarget);
          // A press on a cell that can be edited (`cell` mode) starts its edit, or only places the focus with
          // `startEditAction: 'dblClick'`; either way it chooses no row and activates nothing.
          const editable = cell?.getAttribute('data-editable');
          if (cell && editable && !takesOwnPress({ target: event.target, currentTarget: cell })) {
            if (edit!.config.startEditAction !== 'dblClick') edit!.press(flat.key, editable);
            return;
          }
          // A new row is no row that is chosen or activated (`isSavedRow`).
          if (mode === 'none' || flat.added === true) return;
          if (activates && event.detail > 1) return;
          if (!cell || takesOwnPress({ target: event.target, currentTarget: cell })) return;
          // The cells of editing are no press on the row (a press beside an editor, on the buttons' cell).
          if (holdsEditing(cell)) return;
          const range = mode === 'multiple' && event.shiftKey;
          if (range || onRowClick) actions.press(flat.key, range);
        };
  // The double press that starts the edit of a cell (or flips a boolean one) with `startEditAction: 'dblClick'`.
  const onDoubleClick =
    edit && editsCells(edit.mode) && edit.config.startEditAction === 'dblClick'
      ? (event: MouseEvent<HTMLTableRowElement>) => {
          const cell = cellOf(event.target, event.currentTarget);
          const editable = cell?.getAttribute('data-editable');
          if (cell && editable && !takesOwnPress({ target: event.target, currentTarget: cell })) {
            edit.press(flat.key, editable);
          }
        }
      : undefined;
  // Shift with a press starts a text selection across the rows, in a browser. It is cancelled on the
  // `mousedown` and never on the `pointerdown`, whose cancelling takes the mouse events away from what
  // listens for them (a click-away listener). A control in a cell keeps its press, but the box of a
  // row is one that does not: a Shift press on it is as much a press on the row as any. A cancelled
  // `mousedown` moves no focus, so the focus is given here to the cell pressed (its box, in the column
  // of boxes), which the press makes the active one: Shift+Space and the arrows go on from there.
  const onMouseDown =
    mode === 'multiple'
      ? (event: MouseEvent<HTMLTableRowElement>) => {
          if (!event.shiftKey || event.button !== 0) return;
          const cell = cellOf(event.target, event.currentTarget);
          if (!cell || holdsEditing(cell)) return;
          if (
            cell.getAttribute('data-service') === 'select' ||
            !takesOwnPress({ target: event.target, currentTarget: cell })
          ) {
            event.preventDefault();
            focusHomeOf(cell);
          }
        }
      : undefined;

  // The active column is a place of the keyboard, which the indent columns are not: `rowCells` counts
  // the places over the columns that are.
  return (
    <tr
      className={clsx('flg-table-row', 'flg-data-grid-row', rowClassName?.(flat.row))}
      data-stripe={dataAttr(stripe)}
      data-selected={dataAttr(selected)}
      data-drag-source={dataAttr(dragged)}
      data-new={dataAttr(flat.added === true)}
      data-deleted={dataAttr(marks?.deleted === true)}
      data-editing={dataAttr(editing !== null && editing.column === null)}
      aria-selected={mode === 'none' ? undefined : selected}
      aria-rowindex={ariaRowIndex}
      // Under groups a row says its level and its place in its group; without them it says neither.
      aria-level={flat.setsize > 0 ? flat.level : undefined}
      aria-setsize={flat.setsize > 0 ? flat.setsize : undefined}
      aria-posinset={flat.setsize > 0 ? flat.posinset : undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      {rowCells(layoutColumns, fillerAt, filler, false, ({ column, index, place, indent }) =>
        indent ? (
          <IndentCell key={column.id} pin={layoutPins[index]} />
        ) : (
          <Cell
            key={column.id}
            column={column}
            flat={flat}
            isActive={place === activeColumn}
            selected={selected}
            expanded={expanded}
            detailId={detailId}
            pin={layoutPins[index]}
            editing={editing}
            focusColumn={focusColumn}
            editable={editable}
            marks={marks}
          />
        ),
      )}
    </tr>
  );
}

/**
 * Memoized: a row draws again when its own row, its stripe, whether it is chosen or whether the
 * active cell is in it changes, or when something the whole grid shares does. Neither a choice nor
 * the keyboard moving the active cell changes a shared thing, so each draws only the rows it changes.
 */
export const DataRow = memo(DataRowImpl) as typeof DataRowImpl;
