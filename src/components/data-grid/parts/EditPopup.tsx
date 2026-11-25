import { useEffect, useId, useRef } from 'react';
import type { FormEvent } from 'react';
import { getFocusables } from '../../../internal/focus';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { Button } from '../../button/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../dialog/Dialog';
import type { DialogSize } from '../../dialog/Dialog';
import { DIALOG_WIDE_QUERY } from '../../dialog/use-movable';
import { useEditContext } from '../edit-context';
import type { EditTarget } from '../edit-context';
import { canEdit } from '../engine/edit';
import type { FlatDataRow } from '../engine/flatten';
import { isRequired } from '../engine/validate';
import { useGridContext } from '../grid-context';
import { EditFields } from './EditFields';

const SIZES: readonly DialogSize[] = ['sm', 'md', 'lg'];

/** The field of a column in the popup, and the first control in it. */
function controlOf(form: HTMLElement | null, column: string): HTMLElement | undefined {
  const field = Array.from(form?.querySelectorAll<HTMLElement>('[data-column]') ?? []).find(
    (one) => one.getAttribute('data-column') === column,
  );
  return field ? getFocusables(field)[0] : undefined;
}

interface PopupContentProps<TRow> {
  flat: FlatDataRow<TRow>;
  editing: EditTarget;
  /** What `DialogContent` gives the focus to when it opens: this part sets it, before the Dialog reads it. */
  initial: { current: HTMLElement | null };
  /** `editing.popup.fullScreenOnPhone`: the Dialog fills the screen where the Dialog's own query says it is a phone. */
  fullScreenOnPhone: boolean;
}

/** What the Dialog holds while it is open: its title, the fields and the buttons. */
function PopupContent<TRow>({
  flat,
  editing,
  initial,
  fullScreenOnPhone,
}: PopupContentProps<TRow>) {
  const { labels, rowHeader, textOf } = useGridContext<TRow>();
  const edit = useEditContext<TRow>()!;
  const formId = useId();
  const form = useRef<HTMLFormElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const { fields } = edit;
  const added = flat.added === true;
  // The row is named by the text of the row header, whether that column is drawn or not; its key when there is none.
  const text = rowHeader ? textOf(flat.row, rowHeader) : '';
  const name = text === '' ? String(flat.key) : text;
  const required = fields.some(
    (column) => isRequired(column) && canEdit(column, flat.row, edit.config, added),
  );
  // The Dialog reads `initialFocus` in its own layout effect, which runs after this one: the field the edit was started
  // on, else the first that can be edited. Full screen on a phone, where a field with the focus brings up the keyboard
  // over half the form, it is the title (a static element at the top, WAI-ARIA APG), and Tab reaches the first field.
  useIsoLayoutEffect(() => {
    const phone =
      fullScreenOnPhone &&
      typeof window.matchMedia === 'function' &&
      !window.matchMedia(DIALOG_WIDE_QUERY).matches;
    if (phone) {
      initial.current = title.current;
      return;
    }
    const own = editing.focus === null ? undefined : fields.find((one) => one.id === editing.focus);
    const column =
      own && canEdit(own, flat.row, edit.config, added)
        ? own
        : fields.find((one) => canEdit(one, flat.row, edit.config, added));
    initial.current = (column ? controlOf(form.current, column.id) : undefined) ?? null;
    // Once, when the popup appears: a later render never takes the focus back.
  }, []);
  // A save that found a field wrong asks for the focus there.
  const ask = editing.refocus;
  useIsoLayoutEffect(() => {
    if (ask === null) return;
    controlOf(form.current, ask.column)?.focus();
  }, [ask]);
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    edit.save();
  };
  return (
    <>
      <DialogHeader>
        {/* Focusable by script only, for the phone's first focus; a heading nobody operates draws no ring. */}
        <DialogTitle ref={title} tabIndex={-1} className="flg-data-grid-popup-title">
          {added ? labels.newRowTitle : labels.editRowTitle(name)}
        </DialogTitle>
        {required ? <DialogDescription>{labels.requiredHint}</DialogDescription> : null}
      </DialogHeader>
      {/* The form is the fields only, so the footer stays a child of the panel (the phone's footer sticks to its bottom); Save
          belongs to it by `form`, and `Enter` in a field submits it. */}
      <form
        ref={form}
        id={formId}
        noValidate
        className="flg-data-grid-popup-form"
        onSubmit={onSubmit}
      >
        <EditFields
          row={flat.row}
          columns={fields}
          errors={editing.errors}
          size="md"
          saving={editing.saving}
          added={added}
        />
      </form>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={() => edit.cancel()}>
          {labels.cancelButton}
        </Button>
        <Button type="submit" form={formId} variant="primary" loading={editing.saving}>
          {labels.saveButton}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * The popup of `popup` mode (spec phase 6 §4.3 EF1 "Popup", §6.3): one Dialog for the grid, after the table, which holds
 * the fields of the row being edited (`EditFields`) under a title and, when a field is required, the hint. The row
 * stays in the table as it is. The Dialog is `lg` and neither movable nor full screen unless `editing.popup` says so
 * below 640px; a press outside does not close it, so a stray press does not lose what was typed. Esc and Cancel give the
 * edit up, Save checks every field and sends it, and while a save is pending the Dialog stays. It goes for good when its
 * row is no longer among the rows shown, and with the feature (the grid does not render it then). The Dialog gives the
 * focus back to what had it when it opened (the cell, or Edit); when that is gone, which a new row's popup comes to,
 * the focus goes to the place of the grid, never `<body>`.
 */
export function EditPopup<TRow>({
  editing,
  flat,
  restoreFocus,
}: {
  /** The row being edited; `null` while the popup is closed. */
  editing: EditTarget | null;
  /** The row of that key among the rows shown; `undefined` when it is not there. */
  flat: FlatDataRow<TRow> | undefined;
  /** Gives the focus to the place of the grid. */
  restoreFocus: () => void;
}) {
  const edit = useEditContext<TRow>()!;
  const initial = useRef<HTMLElement | null>(null);
  const open = editing !== null && flat !== undefined;
  // A row that went while it was edited: the popup is closed for good.
  useEffect(() => {
    if (editing !== null && flat === undefined) edit.cancel();
  }, [editing, flat, edit]);
  // Once, when it goes from open to closed: after the Dialog has given the focus back.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      const active = document.activeElement;
      if (active === null || active === document.body) restoreFocus();
    }
  }, [open, restoreFocus]);
  const given = edit.config.popup;
  const size = SIZES.find((one) => one === given?.size) ?? 'lg';
  const fullScreenOnPhone = given?.fullScreenOnPhone !== false;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && edit.cancel()}>
      <DialogContent
        size={size}
        movable={given?.movable === true}
        fullScreenOnPhone={fullScreenOnPhone}
        closeOnOutsideClick={false}
        initialFocus={initial}
      >
        {open ? (
          <PopupContent
            flat={flat}
            editing={editing}
            initial={initial}
            fullScreenOnPhone={fullScreenOnPhone}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
