import { useRef } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { GripVerticalIcon } from '../../../internal/icons';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { placeLine } from '../grid-dom';
import { useDragView } from '../hooks/use-drag-view';
import type { DragViewStore } from '../hooks/use-drag-view';

/** How far the chip is from the pointer, to the right and below it (spec phase 6 §4.3 C1 "Kéo cột"). */
const CHIP_OFFSET = 16;

/**
 * The chip that follows the pointer while a column is dragged: the grip and the caption of the column,
 * on glass, in the top layer (`popover="manual"`, where the browser has it) so that nothing clips it or
 * covers it, and with no pointer of its own. One per grid, drawn at the end of its root and only while
 * a column is dragged, so no element sits in the top layer at rest. It is for the eye alone: a screen
 * reader hears where the column went from the announcement after the drop.
 */
export function DragLayer({ view }: { view: DragViewStore }) {
  const dragged = useDragView(view);
  const chip = useRef<HTMLDivElement>(null);
  const dragging = dragged !== null;

  // Shown once, when the chip comes: the element goes with the drag, and with it its place in the top
  // layer. Not every browser has popovers, and the chip is then a fixed box on the page.
  useIsoLayoutEffect(() => {
    const element = chip.current;
    if (dragging && element && typeof element.showPopover === 'function') {
      try {
        element.showPopover();
      } catch {
        // Not connected or already open: it shows as a plain fixed box.
      }
    }
  }, [dragging]);

  if (!dragged) return null;
  return (
    <div
      ref={chip}
      popover="manual"
      aria-hidden="true"
      className="flg-surface flg-data-grid-drag-chip"
      style={{ left: dragged.x + CHIP_OFFSET, top: dragged.y + CHIP_OFFSET } as CSSProperties}
    >
      <GripVerticalIcon width={13} height={13} />
      {dragged.caption}
    </div>
  );
}

/**
 * The line where the dragged column would be dropped, with a dot at its top (spec phase 6 §4.3 C1):
 * 3px wide, from the top of the heading to the bottom of what the frame shows, its middle 0.5px left of
 * the boundary. The line of a dragged row (§4.3 R1 "Kéo dòng") is the same part turned: 3px high, from the
 * left edge of what the frame shows to its right edge, its middle on the boundary, the dot at its left
 * end. It is in `.flg-data-grid-main`, as the guide of a resize is, and not in the frame,
 * whose content it would scroll with. It is placed from the DOM after each commit of the drag
 * (`placeLine`, which places the guide of a resize too), and is drawn only while there is a boundary
 * a drop would move the column or the row to. It takes no pointer: it is for the eye alone.
 */
export function DropLine({
  view,
  frameRef,
  tableRef,
}: {
  view: DragViewStore;
  frameRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
}) {
  const dragged = useDragView(view);
  const line = useRef<HTMLDivElement>(null);
  const edge = dragged?.edge ?? null;
  const axis = dragged?.axis ?? 'x';

  useIsoLayoutEffect(() => {
    const element = line.current;
    const frame = frameRef.current;
    const head = tableRef.current?.tHead;
    if (edge === null || !element || !frame || !head) return;
    if (axis === 'y') {
      placeLine(
        element,
        frame,
        edge,
        frame.getBoundingClientRect().left + frame.clientLeft,
        3,
        'y',
      );
      return;
    }
    // The heading sticks at the top of the frame when the rows have scrolled, and stands where it is
    // when they have not (a `striped` frame has padding above it).
    const top = Math.max(
      head.getBoundingClientRect().top,
      frame.getBoundingClientRect().top + frame.clientTop,
    );
    // 3px wide, its middle half a pixel left of the boundary.
    placeLine(element, frame, edge - 0.5, top, 3);
  }, [edge, axis, dragged, frameRef, tableRef]);

  if (edge === null) return null;
  return (
    <div
      ref={line}
      className="flg-data-grid-drop-line"
      data-axis={axis === 'y' ? 'y' : undefined}
      aria-hidden="true"
    />
  );
}
