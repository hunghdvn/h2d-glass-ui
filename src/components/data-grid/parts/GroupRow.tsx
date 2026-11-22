import { memo } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import { ChevronIcon } from '../../../internal/icons';
import type { FlatGroupRow } from '../engine/flatten';
import { summaryText } from '../engine/summary';
import type { ResolvedSummaryItem } from '../engine/summary';
import { useGridContext } from '../grid-context';
import { highlightText } from '../highlight';
import { useFoldedSearch } from '../search-context';
import { IndentCell } from './IndentCells';
import { pinAttributes, runPin } from './pin-attributes';
import { SummaryValues } from './SummaryValue';

interface GroupRowProps<TRow> {
  flat: FlatGroupRow<TRow>;
  /** Whether this row is the active place, the one Tab stop of the grid: a prop, so the keyboard draws only the rows it leaves and enters. */
  active: boolean;
  /** The place of the row for a screen reader, in a virtual grid, where the rows are not all drawn. */
  ariaRowIndex: number | undefined;
}

function GroupRowImpl<TRow>({ flat, active, ariaRowIndex }: GroupRowProps<TRow>) {
  const {
    layoutColumns,
    layoutPins,
    filler,
    fillerAt,
    labels,
    locale,
    resolved,
    groups,
    groupTotals,
    summaryReader,
  } = useGridContext<TRow>();
  const search = useFoldedSearch();
  const { node, level } = flat;
  const column = resolved.find((candidate) => candidate.id === node.field);

  // A press anywhere on the row toggles the group; the second click of a double press (`detail` 2 or
  // more) is part of it and toggles nothing, so a double click opens the group once.
  const onClick = (event: MouseEvent<HTMLTableRowElement>): void => {
    if (event.detail > 1) return;
    groups.toggle(flat.key);
  };

  // The totals of the group under a column of the layout, written; `null` where the column has none
  // or its totals are blank.
  const totalsAt = (at: number): ReactElement | null => {
    const shown = layoutColumns[at]!;
    const items: readonly ResolvedSummaryItem<TRow>[] | undefined = groupTotals.get(shown.id);
    if (!items) return null;
    const entries = items.map((item) => ({
      item,
      text: summaryText(item, node.totals?.get(item.id), { locale, read: summaryReader }),
    }));
    return <SummaryValues items={entries} column={shown} labels={labels} footer={false} />;
  };

  // The cells in the order of the layout. Those before the chevron are empty (the band starts at the
  // row's own chevron); the chevron stands in the indent column of the level; the caption goes on from
  // there to the column before the first one that has a total, but never past the left zone, which it
  // ends and is pinned with (the band goes on in an empty cell); then one cell for each column, the
  // total in it or empty, pinned as its column. A total of a column the caption covers is written in the
  // caption, after the count. With no total in the row the caption runs to the end of the left zone, or
  // across the middle, as it does when no total is asked for.
  const chevronAt =
    layoutColumns.findIndex((candidate) => candidate.service === 'indent') + level - 1;
  const cells: ReactElement[] = [];
  layoutColumns.slice(0, chevronAt).forEach((candidate, at) => {
    cells.push(<IndentCell key={candidate.id} pin={layoutPins[at]} />);
  });
  cells.push(
    <td
      key={layoutColumns[chevronAt]!.id}
      className="flg-table-cell flg-data-grid-group-cell flg-data-grid-group-toggle"
      {...pinAttributes(layoutPins[chevronAt])}
    >
      <span className="flg-data-grid-group-chevron" aria-hidden="true">
        <ChevronIcon direction={flat.expanded ? 'down' : 'right'} width={16} height={16} />
      </span>
    </td>,
  );
  const rest = chevronAt + 1;
  let leftEnd = rest;
  while (leftEnd < layoutColumns.length && layoutPins[leftEnd]?.side === 'left') leftEnd++;
  let rightStart = layoutColumns.length;
  while (rightStart > leftEnd && layoutPins[rightStart - 1]?.side === 'right') rightStart--;
  // Where the caption ends, as a column of the layout it does not cover.
  let firstTotal = -1;
  for (let at = rest; at < layoutColumns.length && firstTotal < 0; at++) {
    if (groupTotals.has(layoutColumns[at]!.id)) firstTotal = at;
  }
  const reach = firstTotal < 0 ? Infinity : Math.max(rest + 1, firstTotal);
  const zoneEnd = leftEnd > rest ? leftEnd : rightStart;
  let end = Math.min(zoneEnd, reach);
  // The filler column sits before the right zone, or at the end: a caption in the middle takes it in
  // when it reaches it. A pinned caption never does.
  const pinnedCaption = leftEnd > rest;
  const takesFiller = filler && !pinnedCaption && end === fillerAt;
  // No column to cover and no filler to stand on: the first cell of the right zone carries the caption.
  if (end === rest && !takesFiller) end = rest + 1;

  const value =
    node.value === null
      ? labels.blank
      : column?.allowSearch
        ? highlightText(node.text, search)
        : node.text;
  const covered: ReactElement[] = [];
  for (let at = rest; at < end; at++) {
    const written = totalsAt(at);
    if (written) covered.push(<span key={layoutColumns[at]!.id}> {written}</span>);
  }
  const caption = (
    <>
      <span className="flg-data-grid-group-column">
        {labels.groupColumn(column?.caption ?? node.field)}
      </span>{' '}
      <span className="flg-data-grid-group-value">{value}</span>{' '}
      <span className="flg-data-grid-group-count">{labels.groupCount(node.rows.length)}</span>
      {flat.continued ? (
        <>
          {' '}
          <span className="flg-data-grid-group-continued">{labels.continued}</span>
        </>
      ) : null}
      {covered}
    </>
  );
  cells.push(
    <td
      key="flg:caption"
      colSpan={end - rest + (takesFiller ? 1 : 0)}
      className="flg-table-cell flg-data-grid-group-cell flg-data-grid-group-caption"
      {...pinAttributes(end > rest ? runPin(layoutPins, rest, end - 1) : undefined)}
    >
      {caption}
    </td>,
  );
  // The empty cells that are next to each other and not pinned are one: the band across the middle.
  let bandFrom = -1;
  let bandSpan = 0;
  const flushBand = (): void => {
    if (bandSpan === 0) return;
    cells.push(
      <td
        key={`flg:band-${bandFrom}`}
        colSpan={bandSpan}
        className="flg-table-cell flg-data-grid-group-cell"
        aria-hidden="true"
      />,
    );
    bandSpan = 0;
  };
  const addEmpty = (at: number): void => {
    if (bandSpan === 0) bandFrom = at;
    bandSpan++;
  };
  // The filler column is an empty cell where the row says it goes, which is not before the caption.
  for (let at = end; at <= layoutColumns.length; at++) {
    if (filler && !takesFiller && at === fillerAt) addEmpty(at);
    if (at === layoutColumns.length) break;
    const shown = layoutColumns[at]!;
    const written = totalsAt(at);
    if (written) {
      flushBand();
      cells.push(
        <td
          key={shown.id}
          className="flg-table-cell flg-data-grid-group-cell flg-data-grid-summary-cell"
          data-align={shown.align}
          {...pinAttributes(layoutPins[at])}
        >
          {written}
        </td>,
      );
    } else if (layoutPins[at]) {
      flushBand();
      cells.push(
        <td
          key={shown.id}
          className="flg-table-cell flg-data-grid-group-cell"
          aria-hidden="true"
          {...pinAttributes(layoutPins[at])}
        />,
      );
    } else {
      addEmpty(at);
    }
  }
  flushBand();

  return (
    <tr
      className="flg-table-row flg-data-grid-group-row"
      data-level={level}
      tabIndex={active ? 0 : -1}
      aria-level={level}
      aria-expanded={flat.expanded}
      aria-setsize={flat.setsize}
      aria-posinset={flat.posinset}
      aria-rowindex={ariaRowIndex}
      onClick={onClick}
    >
      {cells}
    </tr>
  );
}

/**
 * The row of a group: a stop of the keyboard (`tabindex` on the row itself, never a control) with the
 * chevron that says whether it is open, the group's column, value and count, the totals of the group
 * under their columns, and the band that runs across the rest of the row. A press on it toggles the
 * group. Memoized: it draws again when its group row, whether it is the active place, or something the
 * whole grid shares (the totals asked for, a pin, the labels) changes.
 */
export const GroupRow = memo(GroupRowImpl) as typeof GroupRowImpl;
