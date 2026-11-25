import type { MouseEvent, ReactNode } from 'react';
import { CheckIcon, CloseIcon, PencilIcon, TrashIcon } from '../../../internal/icons';
import { IconButton } from '../../icon-button/IconButton';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../../tooltip/Tooltip';
import type { EditTarget } from '../edit-context';
import { useEditContext } from '../edit-context';
import { canDelete, canUpdate, hasEditButton } from '../engine/edit';
import type { FlatDataRow } from '../engine/flatten';
import type { PinPlace } from '../engine/layout';
import { focusInto } from '../grid-dom';
import { useGridContext } from '../grid-context';
import { pinAttributes } from './pin-attributes';

/** One button of the column of buttons: named, with its own tooltip, which says what the name says. */
function ActionButton({
  label,
  children,
  ...props
}: {
  label: string;
  variant: 'primary' | 'ghost';
  loading?: boolean;
  /** `-1` takes the button out of the Tab order: the grid's keys reach it. */
  tabIndex?: number;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <TooltipRoot describe={false}>
      <TooltipTrigger>
        <IconButton size="sm" aria-label={label} {...props}>
          {children}
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </TooltipRoot>
  );
}

/**
 * The cell of the column of buttons in a data row (spec phase 6 §3.6 "Ô có nhiều control", §4.3 E2). It is a
 * place of the keyboard with several controls, so it is no cell of one control (no `data-service`): `Enter` and
 * `F2` go into its buttons, which are out of the Tab order, but ✓ and ✕ of the row being edited, which Tab
 * visits after the editors. A row no action is allowed on has an empty cell, which is still a place. Edit is
 * there for the screen reader and the keyboard always, and drawn only when the row is hovered or holds the focus
 * (`opacity`, never `visibility`); Delete stands after it, 2px apart, in the same way, on a row that can be
 * deleted and is not being edited.
 */
export function ActionsCell<TRow>({
  flat,
  isActive,
  editing,
  pin,
}: {
  flat: FlatDataRow<TRow>;
  isActive: boolean;
  /** The row being edited, when it is this one. */
  editing: EditTarget | null;
  pin: PinPlace | undefined;
}) {
  const { labels, rowHeader, textOf } = useGridContext<TRow>();
  const edit = useEditContext<TRow>();
  const text = rowHeader ? textOf(flat.row, rowHeader) : '';
  const name = text === '' ? String(flat.key) : text;
  let buttons: ReactNode = null;
  if (edit && editing) {
    buttons = (
      <>
        <ActionButton
          key="save"
          label={labels.save(name)}
          variant="primary"
          loading={editing.saving}
          onClick={(event) => {
            // A button that is not focused by a press (Safari) leaves the editor focused, whose text is
            // settled on blur: the button takes the focus first, so the draft a save reads is complete.
            event.currentTarget.focus({ preventScroll: true });
            edit.save();
          }}
        >
          <CheckIcon width={16} height={16} />
        </ActionButton>
        <ActionButton
          key="cancel"
          label={labels.cancelEdit(name)}
          variant="ghost"
          onClick={() => edit.cancel()}
        >
          <CloseIcon width={16} height={16} />
        </ActionButton>
      </>
    );
  } else if (edit) {
    const update = hasEditButton(edit.mode) && canUpdate(flat.row, edit.config);
    const remove = canDelete(flat.row, edit.config);
    if (update || remove) {
      buttons = (
        <>
          {update ? (
            <ActionButton
              key="edit"
              label={labels.edit(name)}
              variant="ghost"
              tabIndex={-1}
              onClick={() => edit.start(flat.key)}
            >
              <PencilIcon width={16} height={16} />
            </ActionButton>
          ) : null}
          {remove ? (
            <ActionButton
              key="delete"
              label={labels.delete(name)}
              variant="ghost"
              tabIndex={-1}
              onClick={(event) => {
                // A button that is not focused by a press (Safari) leaves the focus where it was: the button
                // takes it first, so the place of the grid is this cell whatever happens next.
                const button = event.currentTarget;
                button.focus({ preventScroll: true });
                edit.remove(flat.key);
                // Without the dialog the row goes now: the focus is the cell's, which the button is not drawn
                // without hover to hold. With the dialog, it comes back there when the dialog closes.
                const cell = button.closest('td');
                if (edit.config.confirmDelete === false && cell) focusInto(cell, cell);
              }}
            >
              <TrashIcon width={16} height={16} />
            </ActionButton>
          ) : null}
        </>
      );
    }
  }
  return (
    <td
      className="flg-table-cell flg-data-grid-cell flg-data-grid-actions"
      data-actions=""
      data-align="end"
      // While the row is edited its buttons ✓ and ✕ are in the Tab order, so the cell is not a stop of its own.
      tabIndex={isActive && !editing ? 0 : -1}
      {...pinAttributes(pin)}
    >
      {buttons ? (
        <span className="flg-data-grid-action-buttons" data-editing={editing ? '' : undefined}>
          {buttons}
        </span>
      ) : null}
    </td>
  );
}

/**
 * The title of the column of buttons: a place of the keyboard with no control, and the words `labels.actions`
 * hidden in it, which a table header with no name would fail an accessibility check without.
 */
export function ActionsHead({ isActive, pin }: { isActive: boolean; pin: PinPlace | undefined }) {
  const { labels } = useGridContext();
  return (
    <th
      scope="col"
      className="flg-table-head flg-data-grid-head"
      tabIndex={isActive ? 0 : -1}
      {...pinAttributes(pin)}
    >
      <span className="flg-visually-hidden">{labels.actions}</span>
    </th>
  );
}
