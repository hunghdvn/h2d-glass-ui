import { dataAttr } from '../../../internal/data-attr';
import { SortIcon } from '../../table/table-parts';
import type { ResolvedColumn } from '../engine/columns';
import { useGridContext } from '../grid-context';
import { addsLevel, focusHomeOf } from '../grid-dom';

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
  const { labels, sorting, onSortPress } = useGridContext();
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
      </div>
    </th>
  );
}
