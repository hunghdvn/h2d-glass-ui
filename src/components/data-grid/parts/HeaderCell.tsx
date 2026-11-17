import type { MouseEvent } from 'react';
import { dataAttr } from '../../../internal/data-attr';
import { isApplePlatform } from '../../../internal/platform';
import { SortIcon } from '../../table/table-parts';
import type { ResolvedColumn } from '../engine/columns';
import { useGridContext } from '../grid-context';

/** Whether a press adds a level to the sort: Shift, or ⌘ on Apple and Ctrl elsewhere. */
function addsLevel(event: MouseEvent): boolean {
  return event.shiftKey || (isApplePlatform() ? event.metaKey : event.ctrlKey);
}

/**
 * The title of a column. One that sorts is a button holding the title, the arrow, the number of its
 * level when more than one column is sorted, and hidden words for what the arrow says; one that does
 * not sort is a plain title, with no arrow that would promise a control.
 */
export function HeaderCell<TRow>({
  column,
  isActive,
}: {
  column: ResolvedColumn<TRow>;
  /** Whether this title is the active cell, the one Tab stop of the grid. */
  isActive: boolean;
}) {
  const { labels, sorting, sortMode, onSortPress } = useGridContext();
  const level = sorting.levels.get(column.id);
  const direction = level?.direction;
  const title = <span className="flg-data-grid-head-title">{column.caption}</span>;
  const state = level ? labels.sortState(level.direction, level.level, sorting.count) : '';
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
    >
      <div className="flg-data-grid-head-content">
        {column.allowSorting ? (
          <button
            type="button"
            className="flg-table-sort"
            // A press that adds a level must not start a text selection, which Shift does in a
            // browser: cancelled here, on the `mousedown`, and never on the `pointerdown`, whose
            // cancelling would also take the mouse events away from what listens for them.
            onMouseDown={(event) => {
              if (sortMode === 'multiple' && event.button === 0 && addsLevel(event)) {
                event.preventDefault();
              }
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
      </div>
    </th>
  );
}
