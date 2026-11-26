import { memo, useId, useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { POPUP_SELECTOR } from '../../../internal/controls';
import { getFocusables } from '../../../internal/focus';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { hasModifier, isComposing } from '../../../internal/roving';
import { Button } from '../../button/Button';
import { useEditContext } from '../edit-context';
import type { EditTarget } from '../edit-context';
import { canEdit } from '../engine/edit';
import type { FlatFormRow } from '../engine/flatten';
import { isRequired } from '../engine/validate';
import { focusInto, holdsEnter } from '../grid-dom';
import { useGridContext } from '../grid-context';
import { EditFields } from './EditFields';

interface EditFormProps<TRow> {
  flat: FlatFormRow<TRow>;
  /** Whether the form row is the active place, a Tab stop of the grid: a prop, so the keyboard draws only the rows it leaves and enters. */
  active: boolean;
  /** The place of the row for a screen reader, in a virtual grid, where the rows are not all drawn. */
  ariaRowIndex: number | undefined;
  /** The row being edited: this one, or the form would not be here. */
  editing: EditTarget;
}

/** The field of a column in the form, and the first control in it. */
function controlOf(form: HTMLElement | null, column: string): HTMLElement | undefined {
  const field = Array.from(form?.querySelectorAll<HTMLElement>('[data-column]') ?? []).find(
    (one) => one.getAttribute('data-column') === column,
  );
  return field ? getFocusables(field)[0] : undefined;
}

function EditFormImpl<TRow>({ flat, active, ariaRowIndex, editing }: EditFormProps<TRow>) {
  const { layoutColumns, filler, labels, rowHeader, textOf } = useGridContext<TRow>();
  const edit = useEditContext<TRow>()!;
  const titleId = useId();
  const hintId = useId();
  const form = useRef<HTMLFormElement>(null);
  const { fields } = edit;
  const added = flat.added;
  // The row is named by the text of the row header, whether that column is drawn or not; its key when there is none.
  const text = rowHeader ? textOf(flat.row, rowHeader) : '';
  const name = text === '' ? String(flat.key) : text;
  const required = fields.some(
    (column) => isRequired(column) && canEdit(column, flat.row, edit.config, added),
  );
  // Whether the form takes the focus when it appears: not when it comes back after a page or a group that hid it.
  const takeFocus = editing.take;
  // The first field that can be edited takes the focus when the form opens, or the one the edit was started on.
  useIsoLayoutEffect(() => {
    if (!takeFocus) return;
    const own = editing.focus === null ? undefined : fields.find((one) => one.id === editing.focus);
    const column =
      own && canEdit(own, flat.row, edit.config, added)
        ? own
        : fields.find((one) => canEdit(one, flat.row, edit.config, added));
    const control = column ? controlOf(form.current, column.id) : undefined;
    const cell = form.current?.closest<HTMLElement>('td');
    if (control && cell) focusInto(control, cell);
    edit.taken();
    // Once, when the form appears: a later render never takes the focus back.
  }, []);
  // A save that found a field wrong asks for the focus there.
  const ask = editing.refocus;
  useIsoLayoutEffect(() => {
    if (ask === null) return;
    const control = controlOf(form.current, ask.column);
    const cell = form.current?.closest<HTMLElement>('td');
    if (control && cell) focusInto(control, cell);
  }, [ask]);
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    edit.save();
  };
  // `Esc` gives the form up, unless a field has a list or a calendar open, which takes that first `Esc`.
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>): void => {
    if (holdsEnter(event)) return;
    if (event.key !== 'Escape' || hasModifier(event) || event.shiftKey || isComposing(event))
      return;
    const target = event.target as Element;
    if (target.closest('[aria-expanded="true"]')) return;
    // A calendar or a list of a field is a popup inside the form: the field closes it with this key, and the form stays.
    const popup = target.closest(POPUP_SELECTOR);
    if (popup && event.currentTarget.contains(popup)) return;
    event.preventDefault();
    edit.cancel();
  };
  return (
    <tr
      className="flg-table-row flg-data-grid-form-row"
      data-editing=""
      aria-rowindex={ariaRowIndex}
      aria-level={flat.level > 1 ? flat.level : undefined}
    >
      <td
        colSpan={layoutColumns.length + (filler ? 1 : 0)}
        className="flg-table-cell flg-data-grid-form-cell"
        data-editor=""
        tabIndex={active ? 0 : -1}
      >
        {/* The form only watches the keys of the fields it holds (for `Esc`): it is no control. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <form
          ref={form}
          noValidate
          className="flg-surface flg-card flg-data-grid-form"
          aria-labelledby={titleId}
          aria-describedby={required ? hintId : undefined}
          onSubmit={onSubmit}
          onKeyDown={onKeyDown}
        >
          <div className="flg-data-grid-form-head">
            <span id={titleId} className="flg-data-grid-form-title">
              {added ? labels.newRowTitle : labels.editRowTitle(name)}
            </span>
            {required ? (
              <span id={hintId} className="flg-data-grid-form-hint">
                {labels.requiredHint}
              </span>
            ) : null}
          </div>
          <EditFields
            row={flat.row}
            columns={fields}
            errors={editing.errors}
            size="md"
            saving={editing.saving}
            added={added}
          />
          <div className="flg-data-grid-form-foot">
            <Button type="button" variant="secondary" size="sm" onClick={() => edit.cancel()}>
              {labels.cancelButton}
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={editing.saving}>
              {labels.saveButton}
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
}

/**
 * The form of the row being edited (spec phase 6 §4.3 EF1 "Dòng form", §6.3 `form`), which stands in the place of its
 * row: one cell across every column, and in it a card with a title, the fields (`EditFields`) and the buttons. It is a
 * place of the keyboard with one cell, as a detail row is, and a cell that holds editors, so the grid does not order the
 * controls in it. `Enter` in a field submits the form, which saves; `Esc` and Cancel give it up. The first field that
 * can be edited has the focus when it opens.
 */
export const EditForm = memo(EditFormImpl) as typeof EditFormImpl;
