import { useRef, useSyncExternalStore } from 'react';
import type { MouseEvent } from 'react';
import { GripIcon } from '../../../internal/icons';
import { useTriggerPress } from '../../../internal/use-popover-trigger';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../../tooltip/Tooltip';
import type { FlatDataRow } from '../engine/flatten';
import type { PinPlace } from '../engine/layout';
import { useGridContext } from '../grid-context';
import { pinAttributes } from './pin-attributes';

/**
 * The cell of the column of handles in a data row. The handle is the cell's one control (the data grid
 * pattern of the APG: a cell that holds one simple control gives the focus to it), so it is the Tab stop
 * when this is the active cell and the cell never is.
 *
 * A press on it is a press on the row's handle: the `mousedown` is cancelled and the handle focused (the
 * drag may begin, and a text selection must not), the pointer goes to the drag, and a click that stays
 * under the threshold opens the row menu (`useTriggerPress`: a second press on the handle of the open menu
 * closes it). Enter and Space, which the keyboard turns into that click, open it the same way. While the
 * grid sorts or groups the handle is `aria-disabled` and does nothing but say why (a tooltip, which is also
 * its description), and it stays focusable, so that a keyboard user finds the reason too.
 */
export function HandleCell<TRow>({
  flat,
  isActive,
  pin,
}: {
  flat: FlatDataRow<TRow>;
  isActive: boolean;
  pin: PinPlace | undefined;
}) {
  const { labels, rowHeader, textOf, rowReorder } = useGridContext<TRow>();
  const reorder = rowReorder!;
  const { menu, off } = reorder;
  const text = rowHeader ? textOf(flat.row, rowHeader) : '';
  const name = text === '' ? String(flat.key) : text;
  // Whether the menu is open for this row: a boolean, so opening or closing it draws this cell only when it
  // is the row's, and never the others.
  const open = useSyncExternalStore(
    menu.store.subscribe,
    () => {
      const view = menu.store.get();
      return view?.open === true && Object.is(view.key, flat.key);
    },
    () => false,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const press = useTriggerPress(open, (wasOpen) => {
    if (off) return;
    if (wasOpen) menu.close();
    else if (buttonRef.current) menu.open(flat.key, name, buttonRef.current);
  });
  const onMouseDown = (event: MouseEvent<HTMLButtonElement>): void => {
    if (off || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
  };
  const handle = (
    <button
      ref={buttonRef}
      type="button"
      className="flg-data-grid-row-handle"
      aria-label={labels.reorderRow(name)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? reorder.contentId : undefined}
      aria-disabled={off ? true : undefined}
      tabIndex={isActive ? 0 : -1}
      onPointerDown={(event) => {
        if (off) return;
        press.onPointerDown();
        reorder.onPointerDown(event, flat.key);
      }}
      onPointerCancel={press.onPointerCancel}
      onMouseDown={onMouseDown}
      onClick={press.onClick}
    >
      <GripIcon width={8} height={14} aria-hidden="true" />
    </button>
  );
  return (
    <td
      className="flg-table-cell flg-data-grid-cell flg-data-grid-handle-cell"
      data-service="drag"
      tabIndex={-1}
      {...pinAttributes(pin)}
    >
      {/* The same tree on and off, so a sort or a grouping that starts or ends remounts no handle, and
          the focus stays on the one that has it: only the tooltip is turned on and off. */}
      <TooltipRoot enabled={off} describe={off}>
        <TooltipTrigger>{handle}</TooltipTrigger>
        {off ? (
          <TooltipContent side="right" align="center" sideOffset={8}>
            {labels.reorderDisabled}
          </TooltipContent>
        ) : null}
      </TooltipRoot>
    </td>
  );
}

/**
 * The title of the column of handles: a place of the keyboard with no control, and the words
 * `labels.reorderColumn` hidden in it, which a table header with no name would fail an accessibility check
 * without.
 */
export function HandleHead({ isActive, pin }: { isActive: boolean; pin: PinPlace | undefined }) {
  const { labels } = useGridContext();
  return (
    <th
      scope="col"
      className="flg-table-head flg-data-grid-head"
      data-service="drag"
      tabIndex={isActive ? 0 : -1}
      {...pinAttributes(pin)}
    >
      <span className="flg-visually-hidden">{labels.reorderColumn}</span>
    </th>
  );
}
