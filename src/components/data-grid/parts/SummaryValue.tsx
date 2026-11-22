import { Fragment } from 'react';
import type { ReactNode } from 'react';
import type { ResolvedColumn } from '../engine/columns';
import type { ResolvedSummaryItem } from '../engine/summary';
import type { DataGridLabels } from '../types';

/**
 * The words a total has before its value, `undefined` where it has none. A group row labels every item
 * (`label`, else the word of the type); the footer only an item with a `label` or one that is not a
 * `sum` (R1: "Orders: 12", and the sum alone); a function type has no word of its own.
 */
export function summaryLabelOf<TRow>(
  item: ResolvedSummaryItem<TRow>,
  labels: DataGridLabels,
  footer: boolean,
): string | undefined {
  if (item.label !== undefined) return item.label;
  if (typeof item.type === 'function' || (footer && item.type === 'sum')) return undefined;
  return labels.summary[item.type];
}

interface SummaryValuesProps<TRow> {
  /** The items of one column, in order, with the text of each: an item whose text is empty draws nothing. */
  items: readonly { item: ResolvedSummaryItem<TRow>; text: string }[];
  /** The column the totals stand under: its caption is what an item with no label says it is the total of. */
  column: ResolvedColumn<TRow>;
  labels: DataGridLabels;
  /** Whether this is the footer, which leaves the label of a `sum` out. */
  footer: boolean;
}

/**
 * The totals of one column as they are written in a cell: for each item the label
 * (`flg-data-grid-summary-label`) and a space, then the value (`flg-data-grid-summary-value`); an item
 * with no label has hidden words in front of its value instead, "Total of Amount", so that it reads
 * alone. The items are in the order they were given, a space between two. Returns `null` when no item
 * has a text.
 */
export function SummaryValues<TRow>({ items, column, labels, footer }: SummaryValuesProps<TRow>) {
  const written = items.filter(({ text }) => text !== '');
  if (written.length === 0) return null;
  const nodes: ReactNode[] = written.map(({ item, text }, at) => {
    const label = summaryLabelOf(item, labels, footer);
    // A function type has no word of its own: the column's caption says what it is the total of.
    const hidden =
      typeof item.type === 'function'
        ? column.caption
        : labels.summaryOf(labels.summary[item.type], column.caption);
    return (
      <Fragment key={item.id}>
        {at > 0 ? ' ' : null}
        {label === undefined ? (
          <span className="flg-visually-hidden">{hidden} </span>
        ) : (
          <>
            <span className="flg-data-grid-summary-label">{labels.summaryLabel(label)}</span>{' '}
          </>
        )}
        <span className="flg-data-grid-summary-value">{text}</span>
      </Fragment>
    );
  });
  return <>{nodes}</>;
}
