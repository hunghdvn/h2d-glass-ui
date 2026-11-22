import { memo } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import { ChevronIcon } from '../../../internal/icons';
import type { FlatGroupRow } from '../engine/flatten';
import type { PinPlace } from '../engine/layout';
import { useGridContext } from '../grid-context';
import { highlightText } from '../highlight';
import { useFoldedSearch } from '../search-context';
import { IndentCell } from './IndentCells';
import { pinAttributes } from './pin-attributes';

interface GroupRowProps<TRow> {
  flat: FlatGroupRow<TRow>;
  /** Whether this row is the active place, the one Tab stop of the grid: a prop, so the keyboard draws only the rows it leaves and enters. */
  active: boolean;
  /** The place of the row for a screen reader, in a virtual grid, where the rows are not all drawn. */
  ariaRowIndex: number | undefined;
}

// The pin of a cell that stands for a run of columns of one zone: the place of the first, and the edge
// of the last, so the cell sticks where the run starts and ends the zone as the run does.
function runPin(
  pins: readonly (PinPlace | undefined)[],
  from: number,
  to: number,
): PinPlace | undefined {
  const first = pins[from];
  return first ? { ...first, edge: pins[to]?.edge ?? false } : undefined;
}

function GroupRowImpl<TRow>({ flat, active, ariaRowIndex }: GroupRowProps<TRow>) {
  const { layoutColumns, layoutPins, filler, labels, resolved, groups } = useGridContext<TRow>();
  const search = useFoldedSearch();
  const { node, level } = flat;
  const column = resolved.find((candidate) => candidate.id === node.field);

  // A press anywhere on the row toggles the group; the second click of a double press (`detail` 2 or
  // more) is part of it and toggles nothing, so a double click opens the group once.
  const onClick = (event: MouseEvent<HTMLTableRowElement>): void => {
    if (event.detail > 1) return;
    groups.toggle(flat.key);
  };

  // The cells in the order of the layout. Those before the chevron are empty (the band starts at the
  // row's own chevron); the chevron stands in the indent column of the level; the caption goes on from
  // there to the end of the left zone, or to the end of the row; the band goes on in an empty cell
  // across the middle, and the cells of the right zone are empty, pinned.
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
  // The filler column sits before the right zone, or at the end: the middle takes it in.
  const middle = rightStart - leftEnd + (filler ? 1 : 0);
  const value =
    node.value === null
      ? labels.blank
      : column?.allowSearch
        ? highlightText(node.text, search)
        : node.text;
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
    </>
  );
  const captionCell = (span: number, pin: PinPlace | undefined) => (
    <td
      key="flg:caption"
      colSpan={span}
      className="flg-table-cell flg-data-grid-group-cell flg-data-grid-group-caption"
      {...pinAttributes(pin)}
    >
      {caption}
    </td>
  );
  let captioned = true;
  if (leftEnd > rest) {
    cells.push(captionCell(leftEnd - rest, runPin(layoutPins, rest, leftEnd - 1)));
    if (middle > 0) {
      cells.push(
        <td
          key="flg:band"
          colSpan={middle}
          className="flg-table-cell flg-data-grid-group-cell"
          aria-hidden="true"
        />,
      );
    }
  } else if (middle > 0) {
    cells.push(captionCell(middle, undefined));
  } else {
    // Only the right zone is left of the row: its first cell carries the caption.
    captioned = false;
  }
  for (let at = rightStart; at < layoutColumns.length; at++) {
    if (!captioned) {
      captioned = true;
      cells.push(captionCell(1, layoutPins[at]));
      continue;
    }
    cells.push(
      <td
        key={layoutColumns[at]!.id}
        className="flg-table-cell flg-data-grid-group-cell"
        aria-hidden="true"
        {...pinAttributes(layoutPins[at])}
      />,
    );
  }

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
 * chevron that says whether it is open, the group's column, value and count, and the band that runs
 * across the rest of the row. A press on it toggles the group. Memoized: it draws again when its group
 * row, whether it is the active place, or something the whole grid shares changes.
 */
export const GroupRow = memo(GroupRowImpl) as typeof GroupRowImpl;
