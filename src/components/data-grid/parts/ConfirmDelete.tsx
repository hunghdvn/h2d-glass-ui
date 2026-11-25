import { useEffect, useRef } from 'react';
import { Button } from '../../button/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../dialog/Dialog';
import type { DeleteAsk } from '../hooks/use-editing';
import { useGridContext } from '../grid-context';

/**
 * The dialog that asks before a row is deleted (spec phase 6 §6.3 "Xoá"): one for the grid, after the table.
 * `DialogContent alert` of size `sm`; Cancel has the focus first, and Esc or Cancel close it. Delete closes it and
 * sends the delete, which the dialog does not wait for. It goes for good when its row is no longer among the rows
 * shown, and with the feature (the grid does not render it then). When it closes, the focus goes back to the place
 * of the grid, which is the cell the button that opened it is in: that button is not drawn until the row is
 * hovered, so the dialog's own way back would leave the focus on something nobody sees.
 */
export function ConfirmDelete<TRow>({
  ask,
  present,
  onClose,
  onDelete,
  restoreFocus,
}: {
  /** The row asked about; `null` while the dialog is closed. */
  ask: DeleteAsk<TRow> | null;
  /** Whether that row is among the rows shown. */
  present: boolean;
  onClose: () => void;
  onDelete: () => void;
  /** Gives the focus to the place of the grid. */
  restoreFocus: () => void;
}) {
  const { labels, rowHeader, textOf } = useGridContext<TRow>();
  const cancel = useRef<HTMLButtonElement>(null);
  const open = ask !== null && present;
  // A row that went while it was asked about: the dialog is closed for good.
  useEffect(() => {
    if (ask !== null && !present) onClose();
  }, [ask, present, onClose]);
  // Once, when it goes from open to closed: after the dialog has put the focus where it keeps it.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      restoreFocus();
    }
  }, [open, restoreFocus]);
  const text = ask && rowHeader ? textOf(ask.row, rowHeader) : '';
  const name = ask ? (text === '' ? String(ask.key) : text) : '';
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent alert size="sm" initialFocus={cancel}>
        <DialogHeader>
          <DialogTitle>{labels.deleteTitle}</DialogTitle>
          <DialogDescription>{labels.deleteDescription(name)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button ref={cancel} variant="secondary" onClick={onClose}>
            {labels.cancelButton}
          </Button>
          <Button variant="danger" onClick={onDelete}>
            {labels.deleteConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
