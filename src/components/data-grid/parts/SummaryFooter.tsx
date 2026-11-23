import { memo } from 'react';
import { isPlaceColumn } from '../engine/columns';
import { remoteSummaryText, summaryText } from '../engine/summary';
import type { ResolvedSummaryItem, SummaryValues as Totals } from '../engine/summary';
import { useGridContext } from '../grid-context';
import { pinAttributes } from './pin-attributes';
import { rowCells } from './row-cells';
import { SummaryValues } from './SummaryValue';

interface SummaryFooterProps<TRow> {
  /** The totals of the footer, resolved: the grid keeps them while the `summary` prop says the same. */
  items: readonly ResolvedSummaryItem<TRow>[];
  /** The totals of every row after the filter; `null` in server mode. */
  totals: Totals<TRow> | null;
  /** Server mode: what the server computed, by the id of each item. */
  remoteValues: Readonly<Record<string, unknown>> | undefined;
  /** The column of the active cell when it is in the footer, else -1: a prop, as for a row. */
  activeColumn: number;
  /** The place of the row for a screen reader, in a virtual grid, where the rows are not all drawn. */
  ariaRowIndex: number | undefined;
}

function SummaryFooterImpl<TRow>({
  items,
  totals,
  remoteValues,
  activeColumn,
  ariaRowIndex,
}: SummaryFooterProps<TRow>) {
  const { layoutColumns, layoutPins, filler, fillerAt, labels, locale, summaryReader } =
    useGridContext<TRow>();
  const indents = layoutColumns.filter((column) => !isPlaceColumn(column)).length;
  const firstIndent = layoutColumns.find((column) => !isPlaceColumn(column));
  const textOf = (item: ResolvedSummaryItem<TRow>): string =>
    remoteValues
      ? remoteSummaryText(
          item,
          Object.hasOwn(remoteValues, item.id) ? remoteValues[item.id] : undefined,
          locale,
        )
      : summaryText(item, totals?.get(item.id), { locale, read: summaryReader });

  // The columns the keyboard visits have a cell each, the group indents one between them (as the
  // heading has), and the filler column its own where the row says it goes.
  const cells = rowCells(
    layoutColumns,
    fillerAt,
    filler,
    false,
    ({ column, index, place, indent }) => {
      if (indent) {
        return column.id === firstIndent!.id ? (
          <td
            key="flg:indents"
            colSpan={indents}
            className="flg-table-cell flg-data-grid-indent"
            aria-hidden="true"
            {...pinAttributes(layoutPins[index])}
          />
        ) : null;
      }
      const here = items
        .filter((item) => item.column === column.id)
        .map((item) => ({ item, text: textOf(item) }));
      return (
        <td
          key={column.id}
          className="flg-table-cell flg-data-grid-foot-cell"
          data-align={column.align}
          tabIndex={place === activeColumn ? 0 : -1}
          {...pinAttributes(layoutPins[index])}
        >
          {here.length > 0 ? (
            <SummaryValues items={here} column={column} labels={labels} footer />
          ) : null}
        </td>
      );
    },
  );
  return (
    <tfoot className="flg-table-footer">
      <tr className="flg-table-row flg-data-grid-summary-row" aria-rowindex={ariaRowIndex}>
        {cells}
      </tr>
    </tfoot>
  );
}

/**
 * The footer (spec phase 6 §4.3 R1 "Tổng cuối bảng"): one row of totals under the body, Table's footer
 * of the variant, that sticks at the bottom of a grid with a height. It is a row of the keyboard (its
 * cells have `tabindex`, one of them the Tab stop when the active place is here). Memoized: it draws
 * again when its totals, its items or the active column change, or something the whole grid shares.
 */
export const SummaryFooter = memo(SummaryFooterImpl) as typeof SummaryFooterImpl;
