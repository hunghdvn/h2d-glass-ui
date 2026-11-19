import { useRef } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useGridContext } from '../grid-context';
import { useLiveWidths } from '../hooks/use-live-widths';
import type { LiveWidthsStore } from '../hooks/use-live-widths';

/**
 * The line down the grid from the handle that is dragged, and the label that says the width (spec
 * phase 6 §4.3 C1 "Đang kéo độ rộng"). One per grid, and only while a column is dragged: it is in
 * `.flg-data-grid-main`, which is the box the loading layer is placed against too, and not in the
 * frame, whose content it would scroll with. It reads the live widths and nothing the rows read, so
 * a move of the pointer draws only this and the table.
 *
 * Where it stands is read from the DOM after each commit of a drag, which is after the table has
 * taken the new width: the middle of the handle, from the bottom of the handle (the heading's own
 * border, a pixel above the bottom of the heading, is under it, as in the mockup) to the bottom of
 * what the frame shows (the frame's scrollbar is not part of it). It is hidden while the handle is
 * outside what the frame shows (the frame scrolls under a pointer at its edge). Sizes are in layout
 * pixels, scaled back by the one the grid is drawn at, so a grid in a panel that scales in measures
 * right. It is for the eye alone: it takes no pointer and is hidden from a screen reader, which hears
 * the width from the keys' announcement.
 */
export function ResizeGuide({
  live,
  frameRef,
}: {
  live: LiveWidthsStore;
  frameRef: RefObject<HTMLElement | null>;
}) {
  const { labels } = useGridContext();
  const dragged = useLiveWidths(live);
  const guide = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const line = guide.current;
    const main = line?.parentElement;
    const frame = frameRef.current;
    if (!dragged || !line || !main || !frame) return;
    const box = main.getBoundingClientRect();
    const scale = box.width > 0 ? main.offsetWidth / box.width : 1;
    const handle = dragged.handle.getBoundingClientRect();
    const middle = (handle.left + handle.right) / 2;
    const top = handle.bottom;
    const area = frame.getBoundingClientRect();
    const bottom = area.top + frame.clientTop + frame.clientHeight;
    const left = area.left + frame.clientLeft;
    line.style.left = `${(middle - box.left) * scale - 1}px`;
    line.style.top = `${(top - box.top) * scale}px`;
    line.style.height = `${Math.max(0, (bottom - top) * scale)}px`;
    line.style.visibility = middle < left || middle > left + frame.clientWidth ? 'hidden' : '';
  }, [dragged, frameRef]);

  if (!dragged) return null;
  return (
    <div ref={guide} className="flg-data-grid-resize-guide" aria-hidden="true">
      <span className="flg-data-grid-width-pill">
        {labels.columnWidth(dragged.widths[dragged.id] ?? 0)}
      </span>
    </div>
  );
}
