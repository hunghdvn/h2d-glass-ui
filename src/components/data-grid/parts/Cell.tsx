import { dataAttr } from '../../../internal/data-attr';
import { CheckIcon } from '../../../internal/icons';
import { useEditContext } from '../edit-context';
import type { EditTarget } from '../edit-context';
import type { ResolvedColumn } from '../engine/columns';
import { canEdit } from '../engine/edit';
import type { FlatDataRow } from '../engine/flatten';
import type { PinPlace } from '../engine/layout';
import { useGridContext } from '../grid-context';
import { highlightText } from '../highlight';
import { useFoldedSearch } from '../search-context';
import { ActionsCell } from './ActionsCell';
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
}: CellProps<TRow>) {
  const { textOf, dragSource } = useGridContext<TRow>();
  const edit = useEditContext<TRow>();
  const search = useFoldedSearch();
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
    return <ActionsCell flat={flat} isActive={isActive} editing={editing} pin={pin} />;
  }
  const text = textOf(flat.row, column);
  const value = column.value(flat.row);
  // A cell of the row being edited that can be edited holds its editor in the place of its content.
  const editor =
    editing !== null &&
    edit !== null &&
    canEdit(column, flat.row, edit.config, flat.added === true);
  let content;
  if (editor) {
    content = (
      <CellEditor
        column={column}
        flat={flat}
        takeFocus={column.id === focusColumn}
        saving={editing.saving}
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
  return column.rowHeader ? (
    <th
      scope="row"
      className="flg-table-head flg-data-grid-cell"
      data-align={column.align}
      tabIndex={isActive && !editor ? 0 : -1}
      data-drag-source={dataAttr(dragSource === column.id)}
      data-editor={dataAttr(editor)}
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
      {...pinAttributes(pin)}
    >
      {content}
    </td>
  );
}
