import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  offset as offsetMiddleware,
  shift,
  size,
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
  /** Shift along the side, in px: a negative value moves a `start`-aligned element back. */
  alignOffset?: number | undefined;
  /**
   * Caps the height at the space left in the viewport, and at this many px; `Infinity` means the
   * space left only. The element scrolls past it. Leave it out to let the element keep its height.
   */
  maxHeight?: number | undefined;
  /** Makes the element at least as wide as the reference (a listbox under its trigger). */
  matchWidth?: boolean | undefined;
  /** An element inside `floating` that points at the reference. */
  arrow?: RefObject<HTMLElement | null> | undefined;
  /**
   * Called once each time it opens, right after the first placement is written: its size is final
   * then, so whatever must be scrolled into view inside it can be.
   */
  onPlaced?: (() => void) | undefined;
}

/** Margin kept between a floating element and the edge of the viewport, in px. */
const VIEWPORT_PADDING = 8;

/**
 * The finite animations running on `el` and on every element around it. A `translate` there (the menu
 * a sub-trigger sits in, still sliding in) moves `el` without changing any layout, so `autoUpdate`
 * may not see it. Empty where the browser has no `getAnimations` (jsdom).
 */
function animationsAround(el: Element): Animation[] {
  const found: Animation[] = [];
  let node: Element | null = el;
  while (node) {
    if (typeof node.getAnimations !== 'function') return found;
    for (const animation of node.getAnimations()) {
      if (
        animation.playState === 'running' &&
        animation.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY
      ) {
        found.push(animation);
      }
    }
    const root = node.getRootNode();
    node = node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return found;
}

/**
 * Places `floating` next to `reference` while `open`, and keeps it there as either moves (scroll,
 * resize, layout; and once the animations moving the reference when it opens have ended). Writes
 * `left`/`top` straight to the element, so nothing re-renders, and sets `data-side`/`data-align` to
 * where it really landed after flipping. Uses the `fixed` strategy, which is what an element in the
 * top layer needs.
 */
export function useFloating({
  open,
  reference,
  floating,
  side,
  align,
  offset,
  alignOffset = 0,
  maxHeight,
  matchWidth = false,
  arrow,
  onPlaced,
}: UseFloatingOptions): void {
  const getReference = useRef(reference);
  const latestOnPlaced = useRef(onPlaced);
  // Written after the commit, not during a render that React may throw away. It comes before the
  // effect below that reads them, which runs in the order the effects are written.
  useIsoLayoutEffect(() => {
    getReference.current = reference;
    latestOnPlaced.current = onPlaced;
  });

  useIsoLayoutEffect(() => {
    if (!open) return;
    const placement = (align === 'center' ? side : `${side}-${align}`) as Placement;
    let active = true;
    let placed = false;
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
            offsetMiddleware({ mainAxis: offset, alignmentAxis: alignOffset }),
            flip({ padding: VIEWPORT_PADDING }),
            shift({ padding: VIEWPORT_PADDING }),
            ...(maxHeight === undefined && !matchWidth
              ? []
              : [
                  size({
                    padding: VIEWPORT_PADDING,
                    apply({ availableHeight, elements, rects }) {
                      if (maxHeight !== undefined) {
                        const cap = Math.min(Math.max(availableHeight, 0), maxHeight);
                        elements.floating.style.maxHeight = `${cap}px`;
                      }
                      if (matchWidth) {
                        elements.floating.style.minWidth = `${rects.reference.width}px`;
                      }
                    },
                  }),
                ]),
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
          if (!placed) {
            placed = true;
            latestOnPlaced.current?.();
          }
        });
      };
      stop = autoUpdate(ref, el, update);
      // Placed against a reference that an animation around it is still moving, it would stay where
      // the reference was when it opened: place it again once they end. A cancelled one counts as
      // ended. A virtual reference (a point) has nothing around it.
      if (!(ref instanceof Element)) return;
      const moving = animationsAround(ref);
      if (moving.length === 0) return;
      void Promise.all(moving.map((animation) => animation.finished.catch(() => undefined))).then(
        () => {
          if (active) update();
        },
      );
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
  }, [open, floating, side, align, offset, alignOffset, maxHeight, matchWidth, arrow]);
}
