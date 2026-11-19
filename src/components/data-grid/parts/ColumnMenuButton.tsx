import { useRef } from 'react';
import { dataAttr } from '../../../internal/data-attr';
import { MoreVerticalIcon } from '../../../internal/icons';
import { useTriggerPress } from '../../../internal/use-popover-trigger';
import { useGridContext } from '../grid-context';
import { pressTitle } from '../grid-dom';
import { useColumnMenuView } from '../hooks/use-column-menu';

/**
 * The button on a title that opens the menu of its column (spec phase 6 §4.3 G1, C1). It reads the
 * menu's state apart from what the rows read, so opening and closing the menu draws this button and no
 * title, row or toolbar.
 *
 * A press on it is a press on the title, which is where the focus goes (the arrows go on from the title
 * after the menu): the `mousedown` is cancelled and the title focused, as the sort button does; the
 * click opens the menu. A second press on the button of the open menu closes it and does not open it
 * again, which the click cannot tell by the state alone: the press has light-dismissed the menu before
 * the click arrives (`useTriggerPress`).
 */
export function ColumnMenuButton({ columnId, caption }: { columnId: string; caption: string }) {
  const { labels, menu } = useGridContext();
  const view = useColumnMenuView(menu.store);
  const open = view?.open === true && view.columnId === columnId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const press = useTriggerPress(open, (wasOpen) => {
    if (wasOpen) menu.close();
    else if (buttonRef.current) menu.open(columnId, { from: buttonRef.current });
  });
  return (
    <button
      ref={buttonRef}
      type="button"
      className="flg-data-grid-head-button"
      // Shown only while its title is hovered or has the focus, or while its menu is open (data-grid.css).
      data-more={dataAttr(true)}
      aria-label={labels.columnMenu(caption)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menu.contentId : undefined}
      onPointerDown={press.onPointerDown}
      onPointerCancel={press.onPointerCancel}
      onMouseDown={pressTitle}
      onClick={press.onClick}
    >
      <MoreVerticalIcon />
    </button>
  );
}
