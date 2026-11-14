import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { MouseEvent, PointerEvent, RefObject } from 'react';
import { takesOwnPress } from '../../internal/controls';
import { clamp, px } from '../../internal/number';
import { isApplePlatform } from '../../internal/platform';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useMediaQuery } from '../../internal/use-media-query';
import { usePointerDrag } from '../../internal/use-pointer-drag';
import { devWarn } from '../../internal/warn';

// Dragging a dialog by its header (spec phase 6 §3.4). The offset of the panel from the middle lives
// in two custom properties on the panel, written straight to the style so that a move costs no render;
// the CSS turns them into a `translate` (dialog.css).

const OFFSET_X = '--flg-dialog-x';
const OFFSET_Y = '--flg-dialog-y';

/** From this width the dialog can be moved; below it the panel fills the width and stays put. */
const WIDE = '(min-width: 640px)';

/**
 * How far the offset may go on each axis, so that the panel stays inside the padding of the frame,
 * which is the margin around a panel that has not been moved.
 */
interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MovableOptions {
  /** `DialogContent`'s `movable`. */
  enabled: boolean;
  /** Whether the dialog is open: the panel exists only then. */
  open: boolean;
  /** The `<dialog>`: the frame the panel stays in, and the element that shows `data-dragging`. */
  dialogRef: RefObject<HTMLDialogElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
}

/** What `DialogHeader` takes from its own dialog: the handlers it puts on itself, and `register`. */
export interface MovableHeaderHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLElement>) => void;
  onDoubleClick: (event: MouseEvent<HTMLElement>) => void;
  /** Called by the header once it is mounted: this opening has something to drag the dialog by. */
  register: () => void;
}

/** Takes the offset off the panel: it is back in the middle, with nothing left on its style. */
function removeOffset(panel: HTMLElement | null) {
  panel?.style.removeProperty(OFFSET_X);
  panel?.style.removeProperty(OFFSET_Y);
}

/**
 * The state machine of a movable dialog: a press on the header, filtered, becomes a drag past 3px; the
 * panel follows the pointer and is kept inside the frame, also when the frame or the panel changes
 * size; a double click on the header puts it back in the middle; below 640px none of it applies, and
 * what was set is removed. Returns the handlers for the header.
 */
export function useMovable({
  enabled,
  open,
  dialogRef,
  panelRef,
}: MovableOptions): MovableHeaderHandlers {
  const wide = useMediaQuery(WIDE);
  // The panel is rendered only while open, so a closed dialog has nothing to move, and every opening
  // starts in the middle because the properties go with the element.
  const active = enabled && open && wide;
  // What the handlers read, written once React has committed: a render it sets aside (a transition
  // that closes the dialog and suspends) must not stop a dialog that is still on the screen.
  const activeRef = useRef(active);
  useIsoLayoutEffect(() => {
    activeRef.current = active;
  });

  /** Where the panel is now, as the properties say. */
  const offset = useRef({ x: 0, y: 0 });
  const bounds = useRef<Bounds | null>(null);
  /** The press that is being dragged: where the panel was when it started. */
  const session = useRef<{ x: number; y: number } | null>(null);

  const place = useCallback(
    (x: number, y: number) => {
      const panel = panelRef.current;
      if (!panel || (x === offset.current.x && y === offset.current.y)) return;
      offset.current = { x, y };
      panel.style.setProperty(OFFSET_X, `${x}px`);
      panel.style.setProperty(OFFSET_Y, `${y}px`);
    },
    [panelRef],
  );

  const measure = useCallback(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;
    // The size is the layout size, which the `scale` of a lifted panel does not touch; the middle of
    // the rectangle does not move with a scale either, so together they say where the panel would be
    // without the offset, lifted or not.
    const rect = panel.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - offset.current.x - panel.offsetWidth / 2;
    const top = rect.top + rect.height / 2 - offset.current.y - panel.offsetHeight / 2;
    // The margin is the frame's padding (dialog.css), read on each side, so a theme that changes it
    // moves the clamp with it.
    const frame = getComputedStyle(dialog);
    bounds.current = {
      minX: px(frame.paddingLeft) - left,
      maxX: dialog.clientWidth - px(frame.paddingRight) - (left + panel.offsetWidth),
      minY: px(frame.paddingTop) - top,
      maxY: dialog.clientHeight - px(frame.paddingBottom) - (top + panel.offsetHeight),
    };
  }, [dialogRef, panelRef]);

  const endDrag = useCallback(() => {
    session.current = null;
    dialogRef.current?.toggleAttribute('data-dragging', false);
  }, [dialogRef]);

  const { onPointerDown: startDrag } = usePointerDrag({
    threshold: 3,
    // Esc closes the dialog, whatever else is going on (spec §3.4): the drag is not its to cancel.
    cancelOnEscape: false,
    onPress: () => {
      session.current = { ...offset.current };
      measure();
    },
    onStart: () => dialogRef.current?.toggleAttribute('data-dragging', true),
    onMove: ({ dx, dy }) => {
      const start = session.current;
      const limits = bounds.current;
      if (!start || !limits) return;
      place(
        clamp(start.x + dx, limits.minX, limits.maxX),
        clamp(start.y + dy, limits.minY, limits.maxY),
      );
    },
    onEnd: endDrag,
    // The browser took the pointer (a touch that became a scroll, say): that is not the user taking
    // the move back, so the panel stays where it got to.
    onCancel: endDrag,
  });

  // While the dialog can be moved: keep the panel inside the frame as either of them changes size.
  // Whatever ends it (a window below 640px, `movable` turned off, the dialog closing, an unmount)
  // takes back exactly what it set, and ends a drag still in flight.
  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    const dialog = dialogRef.current;
    if (!panel || !dialog) return;
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measure();
        const limits = bounds.current;
        if (limits) {
          place(
            clamp(offset.current.x, limits.minX, limits.maxX),
            clamp(offset.current.y, limits.minY, limits.maxY),
          );
        }
      });
      observer.observe(panel);
      observer.observe(dialog);
    }
    return () => {
      observer?.disconnect();
      session.current = null;
      bounds.current = null;
      offset.current = { x: 0, y: 0 };
      removeOffset(panel);
      dialog.toggleAttribute('data-dragging', false);
    };
  }, [active, dialogRef, panelRef, measure, place]);

  // A movable dialog with no header has nothing to drag it by. Its own header says it is there
  // (`register`, through the context of this dialog, so the header of a dialog nested in it does not
  // count), and the check is made when the opening ends, closed or unmounted: a header may come
  // after the opening (behind Suspense, or a loading state).
  const hadHeader = useRef(false);
  const register = useCallback(() => {
    hadHeader.current = true;
  }, []);
  useEffect(() => {
    if (!enabled || !open) return;
    const panel = panelRef.current;
    return () => {
      // The opening has ended once its panel has left the document. StrictMode's simulated
      // unmount, right after the opening, leaves the panel where it is, and the opening goes on.
      if (panel?.isConnected) return;
      if (!hadHeader.current) {
        devWarn('<DialogContent movable> needs a <DialogHeader> to drag it by.');
      }
      hadHeader.current = false;
    };
  }, [enabled, open, panelRef]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!activeRef.current || takesOwnPress(event)) return;
      startDrag(event);
    },
    [startDrag],
  );

  // A press of the header keeps the focus where it is, so a field being typed in keeps it. The
  // browser moves the focus (and starts a selection) as the default of the `mousedown`, so that is
  // what is cancelled, with the filter of the drag. Cancelling the `pointerdown` would also take the
  // `mousedown` and `mouseup` away from the rest of the page (a click-away listener that waits for
  // them), and the dialog's own press handler, which runs after this one, would see it cancelled.
  const onMouseDown = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!activeRef.current || event.button !== 0 || takesOwnPress(event)) return;
    // A Ctrl press of the mouse is a right click on Apple systems, as the drag takes it.
    if (event.ctrlKey && isApplePlatform()) return;
    event.preventDefault();
  }, []);

  const onDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!activeRef.current || takesOwnPress(event)) return;
      offset.current = { x: 0, y: 0 };
      removeOffset(panelRef.current);
    },
    [panelRef],
  );

  // The value of a context: the same object on every render, so a header is not rendered again for
  // nothing.
  return useMemo(
    () => ({ onPointerDown, onMouseDown, onDoubleClick, register }),
    [onPointerDown, onMouseDown, onDoubleClick, register],
  );
}
