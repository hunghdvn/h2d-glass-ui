import type { FocusEvent } from 'react';
import { Field } from '../../field/Field';
import { useEditContext } from '../edit-context';
import type { ResolvedColumn } from '../engine/columns';
import { canEdit, formSpan } from '../engine/edit';
import { isRequired } from '../engine/validate';
import { leavesField } from '../grid-dom';
import { useGridContext } from '../grid-context';
import { FieldEditor } from './editors/CellEditor';

/**
 * The fields of the row being edited, as a form lays them out (spec phase 6 §4.3 EF1 "Dòng form", §6.3): one `Field` for
 * each of `columns`, in the order they are given, a label above, a star and `required` for a column with a `required`
 * rule, and its error in the Field. A column the row cannot edit (`canEdit` says no: read-only, computed with no
 * `setValue`) is a label over its text, written as the cell writes it. The editors are the grid's, each reading and
 * writing its own field of the draft, so a key typed in one draws that one only; a field is checked when the focus
 * leaves it (a popup of its own is part of it). A field that spans both columns says so with `data-span`, which the
 * stylesheet reads.
 *
 * The form and the popup (`popup` mode) lay their fields out alike, so it is one part: it knows nothing of the card
 * or the Dialog it is in.
 */
export function EditFields<TRow>({
  row,
  columns,
  errors,
  size,
  saving,
  added,
}: {
  /** The row the draft is over: the saved row, or the fields of a new one. */
  row: TRow;
  /** The fields, in the order they are laid out. */
  columns: readonly ResolvedColumn<TRow>[];
  /** The messages of the row's fields, by column id. */
  errors: ReadonlyMap<string, string>;
  /** The size the editors are drawn at. */
  size: 'sm' | 'md';
  /** Whether a save is pending: the editors cannot change. */
  saving: boolean;
  /** Whether the row is a new one, which is edited whatever `allowUpdating` says. */
  added: boolean;
}) {
  const edit = useEditContext<TRow>()!;
  const { textOf } = useGridContext<TRow>();
  // The field is settled when the focus goes out of it to another place: a popup of the field is part of it.
  const settle = (event: FocusEvent<HTMLElement>, id: string): void => {
    if (leavesField(event)) edit.commit(id);
  };
  return (
    <div className="flg-data-grid-form-fields">
      {columns.map((column) => {
        const span = formSpan(column) === 2 ? '2' : undefined;
        if (!canEdit(column, row, edit.config, added)) {
          return (
            <div key={column.id} className="flg-field" data-span={span} data-column={column.id}>
              <span className="flg-field-label">{column.caption}</span>
              <div className="flg-data-grid-form-static">{textOf(row, column)}</div>
            </div>
          );
        }
        return (
          <Field
            key={column.id}
            label={column.caption}
            required={isRequired(column)}
            error={errors.get(column.id)}
            data-span={span}
            data-column={column.id}
            onBlur={(event) => settle(event, column.id)}
          >
            <FieldEditor
              column={column}
              row={row}
              edit={edit}
              size={size}
              saving={saving}
              errorId={undefined}
              takeFocus={false}
            />
          </Field>
        );
      })}
    </div>
  );
}
