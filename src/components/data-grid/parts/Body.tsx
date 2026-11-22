import { useCallback, useContext, useMemo, useRef } from 'react';
import type { ReactElement } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import {
  ActiveContext,
  RowsContext,
  SelectionViewContext,
  VirtualContext,
  useGridContext,
} from '../grid-context';
import { firstRowIndex, headRowCount } from '../grid-dom';
import { useVirtualRows } from '../hooks/use-virtual-rows';
import { DataRow } from './DataRow';
import { EmptyRow } from './EmptyRow';
import { GroupRow } from './GroupRow';
import { SkeletonRows } from './SkeletonRows';

/**
 * The rows. A stripe is on the even rows of the list and not on the even children of the `<tbody>`,
 * so it stays with its row when rows come and go at the top of a window. What a row needs of the
 * active cell is passed as a prop, so that the cell moving draws only the rows it leaves and enters.
 *
 * A virtual grid draws the parts of its window: the rows, and between them the spacers, empty
 * boxes as tall as the rows they stand for. A spacer is not a data row, and is hidden from what reads
 * the page. The rows keep their keys when a spacer comes or goes, so a row with the focus is not
 * made again (which would drop the focus), and a spacer's key cannot be a row's. The window is the
 * body's own state (`useVirtualRows`): a frame of a scroll draws the body and the rows that come,
 * and nothing above it. The row of the active cell and the row the keyboard holds are kept in it;
 * the grid scrolls it through `link.scrollToIndex`, and hears from `link.drawn` that it moved.
 *
 * With no row there is no data to draw: the skeleton rows of a grid that loads, or the one row of
 * an empty grid, which say so in the place of the rows.
 */
export function Body() {
  const { variant, layoutColumns, filler, virtual, filterRow } = useGridContext();
  const { rows, rowReactKeys, placeholder } = useContext(RowsContext);
  const { chosen } = useContext(SelectionViewContext);
  const active = useContext(ActiveContext);
  const windowOf = useContext(VirtualContext);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  // Whether a row is a group row, for the offsets of the window: new with the list, as the rows are.
  const isGroup = useCallback((index: number) => rows[index]?.kind === 'group', [rows]);
  const windowRows = useVirtualRows({
    enabled: windowOf !== null,
    bodyRef,
    count: rows.length,
    rowHeight: windowOf?.rowHeight ?? 0,
    groupRowHeight: windowOf?.groupRowHeight ?? 0,
    isGroup,
    estimate: windowOf?.estimate ?? 0,
    keep: active && active.row >= 0 ? active.row : undefined,
    hold: windowOf?.held,
    firstRows: windowOf?.firstRows ?? 0,
  });
  const link = windowOf?.link;
  useWriteOnCommit(() => {
    if (link) link.current.scrollToIndex = windowRows.scrollToIndex;
  });
  useIsoLayoutEffect(() => {
    link?.current.drawn();
  }, [windowRows.parts, link]);
  const parts = windowOf ? windowRows.parts : null;

  // The stripe of `striped` is on every other data row: a group row never shifts it, so each data row
  // knows its place among the data rows of the list. Without a group row this is its index.
  const stripes = useMemo(() => {
    if (variant !== 'striped') return null;
    let count = 0;
    return rows.map((flat) => (flat.kind === 'data' ? count++ % 2 === 0 : false));
  }, [variant, rows]);

  const row = (index: number): ReactElement | null => {
    const flat = rows[index]!;
    const ariaRowIndex = virtual ? index + firstRowIndex(headRowCount(filterRow)) : undefined;
    if (flat.kind === 'group') {
      return (
        <GroupRow
          key={rowReactKeys[index]}
          flat={flat}
          active={active?.row === index}
          ariaRowIndex={ariaRowIndex}
        />
      );
    }
    // The detail rows come with master-detail (a later part of Plan E): the list holds none until then.
    if (flat.kind !== 'data') return null;
    return (
      <DataRow
        key={rowReactKeys[index]}
        flat={flat}
        stripe={stripes?.[index] === true}
        selected={chosen.has(flat.key)}
        activeColumn={active?.row === index ? active.column : -1}
        ariaRowIndex={ariaRowIndex}
      />
    );
  };

  if (placeholder !== null) {
    return (
      <tbody ref={bodyRef} className="flg-table-body">
        {placeholder === 'skeleton' ? <SkeletonRows /> : <EmptyRow />}
      </tbody>
    );
  }

  const children: (ReactElement | null)[] = [];
  if (parts === null) {
    for (let index = 0; index < rows.length; index++) children.push(row(index));
  } else {
    parts.forEach((part, at) => {
      if (part.kind === 'spacer') {
        children.push(
          <tr key={`\u0000spacer-${at}`} className="flg-data-grid-spacer" aria-hidden="true">
            <td colSpan={layoutColumns.length + (filler ? 1 : 0)} style={{ height: part.height }} />
          </tr>,
        );
      } else {
        for (let index = part.start; index < part.end; index++) children.push(row(index));
      }
    });
  }
  return (
    <tbody ref={bodyRef} className="flg-table-body">
      {children}
    </tbody>
  );
}
