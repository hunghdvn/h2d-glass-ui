import { memo, useContext } from 'react';
import { ActiveContext, useGridContext } from '../grid-context';
import { headRowCount, isTitlePlace } from '../grid-dom';
import { rowCells } from './row-cells';
import { FilterRow } from './FilterRow';
import { HeaderCell } from './HeaderCell';
import { DetailHead, IndentHead } from './IndentCells';
import { runPin } from './pin-attributes';
import { HandleHead } from './RowHandle';
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
  const firstIndent = layoutColumns.find((column) => !isPlaceColumn(column));
  // With details the one title over the indents also stands over the column of the buttons, and is its title.
  const detailAt = layoutColumns.findIndex((column) => column.service === 'detail');
  const merged = indents + (detailAt >= 0 ? 1 : 0);
  return (
    <thead className="flg-table-header">
      {/* The heading is the first row, and the rows of data count on from it. */}
      <tr className="flg-table-row" aria-rowindex={virtual ? 1 : undefined}>
        {rowCells(layoutColumns, fillerAt, filler, true, ({ column, index, place, indent }) => {
          // The merged title stands in the place of the indent columns, and of the column of the buttons.
          if (indent) {
            return detailAt < 0 && column.id === firstIndent!.id ? (
              <IndentHead key="flg:indents" span={indents} pin={layoutPins[index]} />
            ) : null;
          }
          if (column.service === 'detail') {
            return (
              <DetailHead
                key="flg:indents"
                span={merged}
                isActive={onTitle(place)}
                pin={runPin(layoutPins, index - indents, index)}
              />
            );
          }
          if (column.service === 'drag') {
            return <HandleHead key={column.id} isActive={onTitle(place)} pin={layoutPins[index]} />;
          }
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
        })}
      </tr>
      {filterRow ? <FilterRow /> : null}
    </thead>
  );
});
