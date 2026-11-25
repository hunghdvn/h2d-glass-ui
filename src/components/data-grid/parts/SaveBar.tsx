import { useId, useRef } from 'react';
import { PencilIcon } from '../../../internal/icons';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { Button } from '../../button/Button';
import type { DataGridLabels } from '../types';

/**
 * The bar of the changes not saved yet (spec phase 6 §3.6, §4.3 E2 "Batch"): the first child of the main part, joined
 * to the top of the frame, while a grid in `batch` mode holds a change. It says how many rows have one and has the two
 * buttons that decide them: Discard changes and Save changes, which is `loading` while the save is pending (it keeps
 * the focus, and a press on it does nothing). It is a place of Tab before the table, as the toolbar is.
 *
 * A press on its words moves no focus (cancelled on the `mousedown`, as a press on a cell that is no place is), so the
 * grid that held the focus keeps it. When the bar goes (saved, discarded) while the focus is in it, the focus goes to
 * the place of the grid first, never to the page.
 */
export function SaveBar({
  count,
  saving,
  labels,
  onSave,
  onDiscard,
  restoreFocus,
}: {
  /** The number of rows that have a change. */
  count: number;
  /** Whether the save is pending. */
  saving: boolean;
  labels: DataGridLabels;
  onSave: () => void;
  onDiscard: () => void;
  /** Gives the focus to the place of the grid. */
  restoreFocus: () => void;
}) {
  const id = useId();
  const bar = useRef<HTMLDivElement>(null);
  const restore = useRef(restoreFocus);
  useWriteOnCommit(() => {
    restore.current = restoreFocus;
  });
  // The cleanup of a layout effect runs before the bar leaves the DOM, so the focus is still in it.
  useIsoLayoutEffect(
    () => () => {
      if (bar.current?.contains(document.activeElement)) restore.current();
    },
    [],
  );
  return (
    // A press on the words of the bar is only cancelled, which keeps the focus: no control of its own.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={bar}
      className="flg-data-grid-savebar"
      role="group"
      aria-labelledby={id}
      onMouseDown={(event) => {
        if (!(event.target as Element).closest('button')) event.preventDefault();
      }}
    >
      <PencilIcon width={15} height={15} aria-hidden="true" />
      <span id={id} className="flg-data-grid-savebar-text">
        {labels.unsavedChanges(count)}
      </span>
      <span className="flg-data-grid-savebar-spacer" />
      <Button variant="ghost" size="sm" onClick={onDiscard}>
        {labels.discardChanges}
      </Button>
      <Button variant="primary" size="sm" loading={saving} onClick={onSave}>
        {labels.saveChanges}
      </Button>
    </div>
  );
}
