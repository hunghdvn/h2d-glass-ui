import { memo, useContext } from 'react';
import { ActiveContext, useGridContext } from '../grid-context';
import { headRowCount, isTitlePlace } from '../grid-dom';
import { placeFiller } from './FillerCell';
import { FilterRow } from './FilterRow';
import { HeaderCell } from './HeaderCell';
import { IndentHead } from './IndentCells';
import { SelectAllCell } from './SelectCells';
import { isPlaceColumn } from '../engine/columns';

/**
 * The heading: the titles, and the filter row under them when the grid has one. Memoized: it takes
 * no prop, so it draws again only when what the grid shares or the active cell changes, and not
 * when the grid draws for something it does not read (a width, which is the table's alone).
 */
export const HeaderRow = memo(function HeaderRow() {
  const { layoutColumns, filler, fillerAt, layoutPins, virtual, filterRow } = useGridContext();
  const active = useContext(ActiveContext);
  // The place of a title counts up from the body: -1, or -2 when a filter row stands between.
  const onTitle = (index: number) =>
    active !== null && isTitlePlace(active.row, headRowCount(filterRow)) && active.column === index;
  // The indent columns have one title between them, which stands over all of them, and are no place.
  const indents = layoutColumns.filter((column) => !isPlaceColumn(column)).length;
  let place = -1;
  return (
    <thead className="flg-table-header">
      {/* The heading is the first row, and the rows of data count on from it. */}
      <tr className="flg-table-row" aria-rowindex={virtual ? 1 : undefined}>
        {placeFiller(
          layoutColumns.flatMap((column, index) => {
            if (!isPlaceColumn(column)) {
              return column.id === layoutColumns.find((other) => !isPlaceColumn(other))!.id
                ? [<IndentHead key="flg:indents" span={indents} pin={layoutPins[index]} />]
                : [];
            }
            place++;
            return column.service === 'select' ? (
              <SelectAllCell key={column.id} isActive={onTitle(place)} pin={layoutPins[index]} />
            ) : (
              <HeaderCell
                key={column.id}
                column={column}
                isActive={onTitle(place)}
                pin={layoutPins[index]}
              />
            );
          }),
          // The merged title takes the places of the indent columns, so the filler goes that much earlier.
          indents > 0 ? fillerAt - (indents - 1) : fillerAt,
          filler,
          true,
        )}
      </tr>
      {filterRow ? <FilterRow /> : null}
    </thead>
  );
});
