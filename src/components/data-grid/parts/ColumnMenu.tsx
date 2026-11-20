import { useMemo, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import {
  ArrowIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
  MoveHorizontalIcon,
  PanelIcon,
  PinLeftIcon,
  PinRightIcon,
} from '../../../internal/icons';
import { MenuTreeContext } from '../../menu/menu-context';
import type { FocusOnOpen } from '../../menu/menu-context';
import { MenuItem, MenuSeparator } from '../../menu/Menu';
import { MenuPanel } from '../../menu/MenuPanel';
import { columnMenuGroups } from '../engine/column-menu';
import type { ColumnMenuAction } from '../engine/column-menu';
import { columnStep, dataColumnsOf } from '../engine/layout';
import { useGridContext } from '../grid-context';
import { useColumnMenuView } from '../hooks/use-column-menu';
import type { DataGridColumnLayout, DataGridPin, DataGridSortDirection } from '../types';

/** What the items of the menu do. Each is one change, with its callbacks and what is said about it. */
export interface ColumnMenuActions {
  /** Sorts by the column alone in a direction, or (`null`) takes its level out of the sort. */
  sort: (columnId: string, direction: DataGridSortDirection | null) => void;
  /** Pins the column to a side, or (`null`) unpins it. */
  pin: (columnId: string, side: DataGridPin | null) => void;
  move: (columnId: string, step: -1 | 1) => void;
  fit: (columnId: string) => void;
  hide: (columnId: string) => void;
}

// The menu opens on its first item, whichever way it was asked for.
const FIRST: MutableRefObject<FocusOnOpen> = { current: 'first' };

const icon = {
  sortAscending: <ArrowIcon direction="up" />,
  sortDescending: <ArrowIcon direction="down" />,
  clearSorting: <ChevronsUpDownIcon />,
  pinLeft: <PinLeftIcon />,
  pinRight: <PinRightIcon />,
  unpin: <PanelIcon />,
  moveLeft: <ArrowIcon direction="left" />,
  moveRight: <ArrowIcon direction="right" />,
  autoFit: <MoveHorizontalIcon />,
  hide: <EyeOffIcon />,
} satisfies Record<ColumnMenuAction, ReactNode>;

/**
 * The one menu of the grid's columns (spec phase 6 §3.6, §4.3 C1, §6.3), the menu of the library
 * (`MenuPanel`) as `ContextMenu` composes it, after the frame and outside the table so that the title
 * a screen reader reads stays short. It opens under the button of a title or at the pointer, for the
 * column the store says, and its items are built for that column from the layout as it is now.
 *
 * The focus goes where the active cell's home is when it closes (`restoreFocusTo`), read after the
 * commit of the item that was chosen: the title of the column it was opened for, or, for a column that
 * was hidden, the title that took its place. The items stay while the menu closes, and for a column that
 * has just gone they are the last ones drawn, so the focus does not leave with the item that had it.
 */
export function ColumnMenu<TRow>({
  layout,
  actions,
  restoreFocusTo,
}: {
  /** The layout as shown. */
  layout: DataGridColumnLayout;
  actions: ColumnMenuActions;
  restoreFocusTo: () => HTMLElement | null;
}) {
  const { columns, pins, labels, sorting, menu } = useGridContext<TRow>();
  const view = useColumnMenuView(menu.store);
  const tree = useMemo(() => ({ closeAll: menu.close }), [menu.close]);
  const found = view ? columns.find((column) => column.id === view.columnId) : undefined;
  // The column that was hidden is no column of the grid any more, but its menu is still closing.
  const [kept, setKept] = useState(found);
  if (found && found !== kept) setKept(found);
  const column = found ?? kept;
  const point = view?.point ?? null;

  const groups = (() => {
    if (!view || !column) return [];
    // Moved left or right where the keys would move it: one rule for both (`columnStep`).
    const data = dataColumnsOf(
      columns,
      pins.map((place) => place?.side),
    );
    const canStep = (step: -1 | 1) => columnStep(data, column.id, step) !== null;
    return columnMenuGroups({
      allowSorting: column.allowSorting,
      allowPinning: column.allowPinning,
      allowReordering: column.allowReordering,
      allowResizing: column.allowResizing,
      allowHiding: column.allowHiding,
      sorted: sorting.levels.has(column.id),
      pinned: layout.pinned[column.id],
      canMoveLeft: canStep(-1),
      canMoveRight: canStep(1),
      canHide: menu.hideable,
    });
  })();

  const run = (action: ColumnMenuAction, id: string): void => {
    switch (action) {
      case 'sortAscending':
        return actions.sort(id, 'asc');
      case 'sortDescending':
        return actions.sort(id, 'desc');
      case 'clearSorting':
        return actions.sort(id, null);
      case 'pinLeft':
        return actions.pin(id, 'left');
      case 'pinRight':
        return actions.pin(id, 'right');
      case 'unpin':
        return actions.pin(id, null);
      case 'moveLeft':
        return actions.move(id, -1);
      case 'moveRight':
        return actions.move(id, 1);
      case 'autoFit':
        return actions.fit(id);
      case 'hide':
        return actions.hide(id);
    }
  };
  const words: Record<ColumnMenuAction, string> = {
    sortAscending: labels.sortAscending,
    sortDescending: labels.sortDescending,
    clearSorting: labels.clearSorting,
    pinLeft: labels.pinLeft,
    pinRight: labels.pinRight,
    unpin: labels.unpin,
    moveLeft: labels.moveLeft,
    moveRight: labels.moveRight,
    autoFit: labels.autoFit,
    hide: labels.hideColumn,
  };

  return (
    <MenuTreeContext.Provider value={tree}>
      <MenuPanel
        className="flg-data-grid-column-menu"
        aria-label={column ? labels.columnMenu(column.caption) : undefined}
        open={view?.open === true}
        report={(open) => {
          if (!open) menu.close();
        }}
        contentId={menu.contentId}
        reference={() => {
          if (view?.from) return view.from;
          const [x, y] = point ?? [0, 0];
          return { getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }) };
        }}
        restoreFocusTo={restoreFocusTo}
        focusOnOpen={FIRST}
        // Under the button, or at the pointer as a context menu is.
        side={point ? 'right' : 'bottom'}
        align="start"
        offset={point ? 2 : 4}
      >
        {column
          ? groups.map((group, at) => (
              <MenuGroup key={group[0]?.action} first={at === 0}>
                {group.map((entry) => (
                  <MenuItem
                    key={entry.action}
                    icon={icon[entry.action]}
                    disabled={entry.disabled}
                    onSelect={() => run(entry.action, column.id)}
                  >
                    {words[entry.action]}
                  </MenuItem>
                ))}
              </MenuGroup>
            ))
          : null}
      </MenuPanel>
    </MenuTreeContext.Provider>
  );
}

/** A group of items, set off from the one before it by a separator. */
function MenuGroup({ first, children }: { first: boolean; children: ReactNode }) {
  return (
    <>
      {first ? null : <MenuSeparator />}
      {children}
    </>
  );
}
