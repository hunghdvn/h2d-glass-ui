import { POPUP_SELECTOR } from '../../../internal/controls';
import type { MouseEvent, PointerEvent } from 'react';
import { dataAttr } from '../../../internal/data-attr';
import { SortIcon } from '../../table/table-parts';
import { hasMenu } from '../engine/column-menu';
import type { ResolvedColumn } from '../engine/columns';
import { useGridContext } from '../grid-context';
import { addsLevel, focusHomeOf } from '../grid-dom';
import type { PinPlace } from '../engine/layout';
import { ColumnMenuButton } from './ColumnMenuButton';
import { pinAttributes } from './pin-attributes';

/**
 * The title of a column. One that sorts is a button holding the title, the arrow, the number of its
 * level when more than one column is sorted, and hidden words for what the arrow says; one that does
 * not sort is a plain title, with no arrow that would promise a control. After it comes the cluster of
 * the buttons of the title: the one that opens the menu of the column, when the menu has an item.
 */
export function HeaderCell<TRow>({
  column,
  isActive,
  pin,
}: {
  column: ResolvedColumn<TRow>;
  /** Whether this title is the active cell, the one Tab stop of the grid. */
  isActive: boolean;
  /** Where the title sticks, if its column is pinned. */
  pin: PinPlace | undefined;
}) {
  const { labels, sorting, onSortPress, resize, reorder, dragSource, menu } = useGridContext();
  const level = sorting.levels.get(column.id);
  const direction = level?.direction;
  const title = <span className="flg-data-grid-head-title">{column.caption}</span>;
  const state = level ? labels.sortState(level.direction, level.level, sorting.count) : '';
  const hasMore = hasMenu(column, menu.hideable);
  return (
    <th
      scope="col"
      className="flg-table-head flg-data-grid-head"
      // The title is a cell of the grid, and the one Tab stop when it is the active one.
      tabIndex={isActive ? 0 : -1}
      data-align={column.align}
      // Every sorted title has the look of one (the text colour, the accent of the arrow): `aria-sort`
      // is on the first level only, so the look cannot hang on it.
      data-sorted={dataAttr(level !== undefined)}
      // A table has one column that is sorted: the first level says it, and the hidden words of the
      // buttons say the others.
      aria-sort={
        level?.level === 1 ? (direction === 'asc' ? 'ascending' : 'descending') : undefined
      }
      // The title is dimmed while its column is dragged, with every cell of the column.
      data-drag-source={dataAttr(dragSource === column.id)}
      {...pinAttributes(pin)}
      {...(hasMore
        ? {
            // A right press opens the menu of the column at the pointer, and the press that comes before
            // it is told of, for it ends before the menu opens. Where the column has no menu the browser's
            // own menu is left alone.
            onPointerDownCapture: menu.onPointerDown,
            onContextMenu: (event: MouseEvent<HTMLElement>) => menu.onContextMenu(event, column.id),
          }
        : null)}
      {...(column.allowReordering
        ? {
            // A press on the title may become a drag of the column (the handle that resizes has its own).
            // As the sort button's does, it cancels the `mousedown`, so that no text is selected as the
            // pointer goes, and takes the title for the focus; never the `pointerdown`, which the drag
            // reads. A press in a popup inside the title is that popup's.
            onPointerDown: (event: PointerEvent<HTMLElement>) =>
              reorder.onPointerDown(event, column.id),
            onMouseDown: (event: MouseEvent<HTMLElement>) => {
              if (event.button !== 0) return;
              if (event.target instanceof Element && event.target.closest(POPUP_SELECTOR)) return;
              event.preventDefault();
              focusHomeOf(event.currentTarget as HTMLTableCellElement);
            },
          }
        : null)}
    >
      <div className="flg-data-grid-head-content">
        {column.allowSorting ? (
          <button
            type="button"
            className="flg-table-sort"
            // A press on the button is a press on the title, which is where the focus goes, as after a
            // sort by the keyboard: the arrows go on from the title, and Tab leaves the grid. The
            // browser would focus the button, a control of the title, and so put the grid in widget
            // mode, where Tab goes round the title. So the `mousedown` is cancelled, which also keeps
            // a press with Shift from starting a text selection, and the title is focused here; the
            // click still comes and sorts. Never the `pointerdown`, whose cancelling would also take
            // the mouse events away from what listens for them.
            onMouseDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              const title = event.currentTarget.closest('th');
              if (title) focusHomeOf(title);
            }}
            onClick={(event) => onSortPress(column.id, addsLevel(event))}
          >
            {title}
            <SortIcon
              sort={direction ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            />
            {level && sorting.count > 1 ? (
              <span className="flg-data-grid-sort-index" aria-hidden="true">
                {level.level}
              </span>
            ) : null}
            {state === '' ? null : <span className="flg-visually-hidden">{state}</span>}
          </button>
        ) : (
          title
        )}
        {hasMore ? (
          <span className="flg-data-grid-head-icons">
            <ColumnMenuButton columnId={column.id} caption={column.caption} />
          </span>
        ) : null}
      </div>
      {column.allowResizing ? (
        // The handle is for a pointer: it is no control and no stop of Tab, and a screen reader does not
        // meet it. The keys are `Alt+Shift+←` and `Alt+Shift+→` on the title (and, later, the column menu).
        // Its press cancels the `mousedown` as the sort button's does: no text is selected as the pointer
        // goes, and the title takes the focus. Never the `pointerdown`, which the drag reads.
        <div
          className="flg-data-grid-resizer"
          aria-hidden="true"
          onPointerDown={(event) => resize.onPointerDown(event, column.id)}
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            const title = event.currentTarget.closest('th');
            if (title) focusHomeOf(title);
          }}
          onDoubleClick={() => resize.onDoubleClick(column.id)}
        />
      ) : null}
    </th>
  );
}
