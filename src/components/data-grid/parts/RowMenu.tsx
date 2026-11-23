import { useMemo } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { ArrowIcon, ChevronIcon } from '../../../internal/icons';
import { MenuTreeContext } from '../../menu/menu-context';
import type { FocusOnOpen } from '../../menu/menu-context';
import { MenuItem } from '../../menu/Menu';
import { MenuPanel } from '../../menu/MenuPanel';
import { askOfMove } from '../engine/row-reorder';
import type { RowMove } from '../engine/row-reorder';
import { useGridContext } from '../grid-context';
import { useExternalStore } from '../hooks/use-external-store';
import type { RowMenuControl } from '../hooks/use-row-menu';
import type { DataGridKey } from '../types';

// The menu opens on its first item, whichever way it was asked for.
const FIRST: MutableRefObject<FocusOnOpen> = { current: 'first' };

const ITEMS: readonly { move: RowMove; icon: ReactNode }[] = [
  { move: 'up', icon: <ArrowIcon direction="up" /> },
  { move: 'down', icon: <ArrowIcon direction="down" /> },
  { move: 'top', icon: <ChevronIcon direction="up" /> },
  { move: 'bottom', icon: <ChevronIcon direction="down" /> },
];

/**
 * The one menu of the grid's rows (spec phase 6 §3.6, §6.3), the menu of the library (`MenuPanel`) as
 * `ColumnMenu` composes it, after the frame and outside the table. It opens under the handle of a row with
 * four items, Move up, Move down, Move to top and Move to bottom; the ones that would not move the row (at
 * an edge of the rows after the filter) are turned off. Choosing one moves the row as the keys do and
 * closes the menu, and the focus goes where the active cell's home is (`restoreFocusTo`), read after the
 * commit: the handle of the row, which the active place follows by its key.
 */
export function RowMenu({
  menu,
  keys,
  move,
  restoreFocusTo,
}: {
  menu: RowMenuControl;
  /** The keys of the rows after the filter, in the order shown. */
  keys: readonly DataGridKey[];
  move: (key: DataGridKey, how: RowMove) => void;
  restoreFocusTo: () => HTMLElement | null;
}) {
  const { labels, rowReorder } = useGridContext();
  const view = useExternalStore(menu.store);
  const tree = useMemo(() => ({ closeAll: menu.close }), [menu.close]);
  const words: Record<RowMove, string> = {
    up: labels.moveUp,
    down: labels.moveDown,
    top: labels.moveToTop,
    bottom: labels.moveToBottom,
  };
  return (
    <MenuTreeContext.Provider value={tree}>
      <MenuPanel
        className="flg-data-grid-row-menu"
        aria-label={view ? labels.reorderRow(view.name) : undefined}
        open={view?.open === true}
        report={(open) => {
          if (!open) menu.close();
        }}
        contentId={rowReorder?.contentId ?? ''}
        reference={() => view?.from ?? null}
        restoreFocusTo={restoreFocusTo}
        focusOnOpen={FIRST}
        side="bottom"
        align="start"
        offset={4}
      >
        {view
          ? ITEMS.map(({ move: how, icon }) => (
              <MenuItem
                key={how}
                icon={icon}
                disabled={askOfMove(keys, view.key, how) === null}
                onSelect={() => move(view.key, how)}
              >
                {words[how]}
              </MenuItem>
            ))
          : null}
      </MenuPanel>
    </MenuTreeContext.Provider>
  );
}
