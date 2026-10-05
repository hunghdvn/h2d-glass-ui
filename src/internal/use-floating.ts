import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  offset as offsetMiddleware,
  shift,
} from '@floating-ui/dom';
import type { Placement, ReferenceElement } from '@floating-ui/dom';
import { useRef } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from './use-iso-layout-effect';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';

export interface UseFloatingOptions {
  open: boolean;
  /** What the floating element is placed against. Read when it opens. */
  reference: () => ReferenceElement | null;
  floating: RefObject<HTMLElement | null>;
  side: Side;
  align: Align;
  /** Distance from the reference, in px. */
  offset: number;
  /** An element inside `floating` that points at the reference. */
  arrow?: RefObject<HTMLElement | null> | undefined;
}

/** Margin kept between a floating element and the edge of the viewport, in px. */
const VIEWPORT_PADDING = 8;

/**
 * Places `floating` next to `reference` while `open`, and keeps it there as either moves (scroll,
 * resize, layout). Writes `left`/`top` straight to the element, so nothing re-renders, and sets
 * `data-side`/`data-align` to where it really landed after flipping. Uses the `fixed` strategy, which
 * is what an element in the top layer needs.
 */
export function useFloating({
  open,
  reference,
  floating,
  side,
  align,
  offset,
  arrow,
}: UseFloatingOptions): void {
  const getReference = useRef(reference);
  getReference.current = reference;

  useIsoLayoutEffect(() => {
    if (!open) return;
    const placement = (align === 'center' ? side : `${side}-${align}`) as Placement;
    let active = true;
    let stop: (() => void) | undefined;
    const start = () => {
      const ref = getReference.current();
      const el = floating.current;
      if (!active || !ref || !el) return;
      const update = () => {
        const arrowEl = arrow?.current ?? null;
        void computePosition(ref, el, {
          strategy: 'fixed',
          placement,
          middleware: [
            offsetMiddleware(offset),
            flip({ padding: VIEWPORT_PADDING }),
            shift({ padding: VIEWPORT_PADDING }),
            ...(arrowEl ? [arrowMiddleware({ element: arrowEl, padding: 8 })] : []),
          ],
        }).then(({ x, y, placement: landed, middlewareData }) => {
          if (!active) return;
          const [landedSide, landedAlign = 'center'] = landed.split('-');
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
          el.dataset.side = landedSide;
          el.dataset.align = landedAlign;
          if (arrowEl && middlewareData.arrow) {
            const { x: ax, y: ay } = middlewareData.arrow;
            arrowEl.style.left = ax === undefined ? '' : `${ax}px`;
            arrowEl.style.top = ay === undefined ? '' : `${ay}px`;
          }
        });
      };
      stop = autoUpdate(ref, el, update);
    };
    // A reference placed after the floating element in the tree gets its ref later in this same
    // commit, after this effect has run. Then it starts once the commit is done, still before the
    // browser paints.
    if (getReference.current()) start();
    else queueMicrotask(start);
    return () => {
      active = false;
      stop?.();
    };
  }, [open, floating, side, align, offset, arrow]);
}
