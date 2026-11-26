import { useId } from 'react';
import { dataAttr } from '../../../internal/data-attr';
import { CheckIcon, PlusIcon } from '../../../internal/icons';
import { useEditContext } from '../edit-context';
import type { EditTarget } from '../edit-context';
import { isDataColumn } from '../engine/columns';
import type { ResolvedColumn } from '../engine/columns';
import { canEdit, editsCells } from '../engine/edit';
import type { RowMarks } from '../engine/edit';
import type { FlatDataRow } from '../engine/flatten';
import type { PinPlace } from '../engine/layout';
import { useGridContext } from '../grid-context';
import { highlightText } from '../highlight';
import { useFoldedSearch } from '../search-context';
import { ActionsCell } from './ActionsCell';
import { CellFault } from './EditError';
import { CellEditor } from './editors/CellEditor';
import { pinAttributes } from './pin-attributes';
import { DetailToggleCell } from './DetailToggle';
import { HandleCell } from './RowHandle';
import { SelectRowCell } from './SelectCells';

interface CellProps<TRow> {
  column: ResolvedColumn<TRow>;
  flat: FlatDataRow<TRow>;
  /** Whether this is the active cell, the one Tab stop of the grid. */
  isActive: boolean;
  /** Whether the row of the cell is chosen. */
  selected: boolean;
  /** Whether the detail row of this row is in the list: the button of the detail's column says so. */
  expanded: boolean;
  /** The id of that detail row, while it is in the list. */
  detailId: string | undefined;
  /** Where the cell sticks, if its column is pinned. */
  pin: PinPlace | undefined;
  /** The row being edited, when it is this cell's row: its editable cells hold their editors. */
  editing: EditTarget | null;
  /** The column whose editor takes the focus when the edit starts; `undefined` for any other. */
  focusColumn: string | undefined;
  /** What the row shows of the change held over it (batch mode): a deleted row, the cells that changed. */
  marks: RowMarks | undefined;
}

/** The id of the column whose cell names a new row: the row header's when it is drawn, else the first data column. */
function newKeyId<TRow>(
  rowHeader: ResolvedColumn<TRow> | undefined,
  layoutColumns: readonly ResolvedColumn<TRow>[],
): string | undefined {
  if (rowHeader && layoutColumns.includes(rowHeader)) return rowHeader.id;
  return layoutColumns.find(isDataColumn)?.id;
}

/** The cell of a service column (the box, the handle, the toggle) in a new row: empty, and the place's stop. */
function NewRowServiceCell<TRow>({
  column,
  isActive,
  pin,
}: {
  column: ResolvedColumn<TRow>;
  isActive: boolean;
  pin: PinPlace | undefined;
}) {
  const kind =
    column.service === 'select'
      ? 'flg-data-grid-select-cell'
      : column.service === 'drag'
        ? 'flg-data-grid-handle-cell'
        : 'flg-data-grid-toggle-cell';
  return (
    <td
      className={`flg-table-cell flg-data-grid-cell ${kind}`}
      data-service={column.service}
      tabIndex={isActive ? 0 : -1}
      {...pinAttributes(pin)}
    />
  );
}

/**
 * A cell of a data row: a `<td>`, or the `<th scope="row">` of the row header column. The `cell` of
 * the column replaces what is in it; otherwise it is the text of the column, which is nothing for a
 * blank value. A boolean is a check for `true` and no mark for `false`; the words are in the cell
 * for a screen reader, and are what a search and an export read. A boolean column whose words are
 * the caller's (a format function, a lookup) draws them as a cell of text does. A cell of text marks
 * what the search found in it (`highlightText`), unless its column has `allowSearch: false`; the hidden
 * words of a check are not marked, and a `cell` marks the text it draws with `ctx.highlight`.
 */
export function Cell<TRow>({
  column,
  flat,
  isActive,
  selected,
  expanded,
  detailId,
  pin,
  editing,
  focusColumn,
  marks,
}: CellProps<TRow>) {
  const { textOf, dragSource, labels, rowHeader, layoutColumns } = useGridContext<TRow>();
  const edit = useEditContext<TRow>();
  const search = useFoldedSearch();
  const faultId = useId();
  // A new row has no box, no handle and no toggle: their cells are empty and are places of the keyboard still.
  if (
    flat.added === true &&
    (column.service === 'select' || column.service === 'drag' || column.service === 'detail')
  ) {
    return <NewRowServiceCell column={column} isActive={isActive} pin={pin} />;
  }
  if (column.service === 'select') {
    return <SelectRowCell flat={flat} isActive={isActive} selected={selected} pin={pin} />;
  }
  if (column.service === 'drag') return <HandleCell flat={flat} isActive={isActive} pin={pin} />;
  if (column.service === 'detail') {
    return (
      <DetailToggleCell
        flat={flat}
        isActive={isActive}
        expanded={expanded}
        detailId={detailId}
        pin={pin}
      />
    );
  }
  if (column.service === 'actions') {
    // The buttons of a row being edited (✓ ✕) are of the modes that edit the row; a cell has none.
    return (
      <ActionsCell
        flat={flat}
        isActive={isActive}
        editing={edit && editsCells(edit.mode) ? null : editing}
        marks={marks}
        pin={pin}
      />
    );
  }
  const text = textOf(flat.row, column);
  const value = column.value(flat.row);
  // A cell of the row being edited that can be edited holds its editor in the place of its content.
  // In `cell` mode only the cell being edited holds an editor.
  const editor =
    editing !== null &&
    edit !== null &&
    (editing.column === null || editing.column === column.id) &&
    canEdit(column, flat.row, edit.config, flat.added === true);
  // A cell that a press, a double press or a key may start editing, which names its column (`cell` mode).
  const editable =
    !editor &&
    edit !== null &&
    editsCells(edit.mode) &&
    marks?.deleted !== true &&
    canEdit(column, flat.row, edit.config, flat.added === true);
  // The cell that names a new row, where an id would be: the row header's, else the first data cell.
  const names =
    flat.added === true &&
    !editor &&
    column.id === newKeyId(rowHeader, layoutColumns) &&
    (column.rowHeader === true || text === '');
  let content;
  if (names) {
    content = (
      <span className="flg-data-grid-new-key">
        <PlusIcon width={14} height={14} aria-hidden="true" />
        <span className="flg-data-grid-new-text">{labels.newRow}</span>
      </span>
    );
  } else if (editor) {
    content = (
      <CellEditor
        column={column}
        flat={flat}
        takeFocus={column.id === focusColumn && editing.take}
        typed={column.id === focusColumn ? editing.typed : null}
        caretAtEnd={editing.column !== null}
        saving={editing.saving}
        message={editing.errors.get(column.id)}
        refocus={editing.refocus?.column === column.id ? editing.refocus.n : 0}
      />
    );
  } else if (column.cell) {
    content = column.cell({
      row: flat.row,
      rowKey: flat.key,
      value,
      text,
      column: column.info,
      selected,
      highlight: (shown) => (column.allowSearch ? highlightText(shown, search) : shown),
    });
  } else if (column.dataType === 'boolean' && typeof value === 'boolean' && !column.ownText) {
    content = (
      <>
        {value && (
          <span className="flg-data-grid-check">
            <CheckIcon width={16} height={16} />
          </span>
        )}
        <span className="flg-visually-hidden">{text}</span>
      </>
    );
  } else {
    content = text === '' ? null : column.allowSearch ? highlightText(text, search) : text;
  }
  // A change not saved yet is said after the value, hidden; a row marked for deletion says so in its first cell.
  const changed = marks?.changed.has(column.id) === true;
  const deletedHere = marks?.deleted === true && column.id === newKeyId(rowHeader, layoutColumns);
  if (changed || deletedHere) {
    content = (
      <>
        {content}
        {changed ? <span className="flg-visually-hidden">{labels.changedCell}</span> : null}
        {deletedHere ? <span className="flg-visually-hidden">{labels.deletedRow}</span> : null}
      </>
    );
  }
  // A cell that a refused save named (`batch` mode), or a refused value of `cell` mode held over its row, says why, as an
  // editor that is refused does; once it is edited again it is an editor and the mark is gone.
  const fault = editor ? undefined : marks?.invalid?.get(column.id);
  if (fault !== undefined) {
    content = (
      <CellFault message={fault} faultId={faultId}>
        {content}
      </CellFault>
    );
  }
  // A cell of a new row that is read-only and blank says so with a dash, for the eye only.
  if (flat.added === true && !editor && !names && content === null) {
    content = (
      <span className="flg-data-grid-new-blank" aria-hidden="true">
        —
      </span>
    );
  }
  return column.rowHeader ? (
    <th
      scope="row"
      className="flg-table-head flg-data-grid-cell"
      data-align={column.align}
      tabIndex={isActive && !editor ? 0 : -1}
      data-drag-source={dataAttr(dragSource === column.id)}
      data-editor={dataAttr(editor)}
      data-editing={dataAttr(editor && editing.column !== null)}
      data-editable={editable ? column.id : undefined}
      data-invalid={dataAttr(editor ? editing.errors.has(column.id) : fault !== undefined)}
      aria-describedby={fault === undefined ? undefined : faultId}
      data-changed={dataAttr(changed && !editor)}
      {...pinAttributes(pin)}
    >
      {content}
    </th>
  ) : (
    <td
      className="flg-table-cell flg-data-grid-cell"
      data-align={column.align}
      // The editor is the stop of its cell: the cell itself is not one, so Tab goes from editor to editor.
      tabIndex={isActive && !editor ? 0 : -1}
      data-drag-source={dataAttr(dragSource === column.id)}
      data-editor={dataAttr(editor)}
      data-editing={dataAttr(editor && editing.column !== null)}
      data-editable={editable ? column.id : undefined}
      data-invalid={dataAttr(editor ? editing.errors.has(column.id) : fault !== undefined)}
      aria-describedby={fault === undefined ? undefined : faultId}
      data-changed={dataAttr(changed && !editor)}
      {...pinAttributes(pin)}
    >
      {content}
    </td>
  );
}
