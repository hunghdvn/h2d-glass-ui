'use client';

import { clsx } from 'clsx';
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import type {
  FocusEvent,
  HTMLAttributes,
  MutableRefObject,
  PointerEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { isTabbable } from '../../internal/focus';
import { mergeRefs } from '../../internal/merge-refs';
import { resolveLazy } from '../../internal/react-lazy';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import type { Align, Side } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { devWarn, isProduction } from '../../internal/warn';

/** How long after one tooltip closes the next one opens without waiting, in ms. */
const SKIP_DELAY = 300;
/** How long the pointer may be off both the trigger and the tooltip before it closes, in ms. */
const CLOSE_DELAY = 100;
/** Every open tooltip and its close function; shared by every tooltip on the page. */
const openTooltips = new Map<string, () => void>();
/** When the last tooltip closed. */
let lastClosedAt = Number.NEGATIVE_INFINITY;

interface TooltipContextValue {
  open: boolean;
  contentId: string;
  triggerRef: MutableRefObject<HTMLElement | null>;
  /** Open after the hover delay (or at once, inside the skip window). */
  openSoon: () => void;
  openNow: () => void;
  /** Close after the grace period, unless the pointer comes back. */
  closeSoon: () => void;
  closeNow: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(part: string): TooltipContextValue | null {
  const ctx = useContext(TooltipContext);
  if (!ctx) devWarn(`<${part}> must be rendered inside a <Tooltip>.`);
  return ctx;
}

export interface TooltipProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** How long the pointer rests on the trigger before it opens, in ms. Default 500. */
  delay?: number;
  children?: ReactNode;
}
export interface TooltipTriggerProps {
  /** Exactly one element that can take keyboard focus, such as a button or a link. */
  children: ReactElement;
}
export interface TooltipContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** The side of the trigger it opens on. It flips when there is no room. Default `"top"`. */
  side?: Side;
  /** How it lines up with the trigger along that side. Default `"center"`. */
  align?: Align;
  /** Gap to the trigger, in px. Default 6. */
  sideOffset?: number;
}

/** A short text label for its trigger, on hover and keyboard focus. Renders no element. */
export function Tooltip({
  open,
  defaultOpen = false,
  onOpenChange,
  delay = 500,
  children,
}: TooltipProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Tooltip',
  });
  const contentId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = () => clearTimeout(timer.current);
  // Only one tooltip shows at a time: opening this one closes any other in the same render.
  const show = useCallback(() => {
    for (const [id, close] of openTooltips) if (id !== contentId) close();
    setOpen(true);
  }, [contentId, setOpen]);
  const openNow = useCallback(() => {
    clearTimeout(timer.current);
    show();
  }, [show]);
  const closeNow = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, [setOpen]);
  const openSoon = useCallback(() => {
    clearTimeout(timer.current);
    // Moving from one tooltip to the next skips the delay.
    const skip = openTooltips.size > 0 || performance.now() - lastClosedAt < SKIP_DELAY;
    timer.current = setTimeout(show, skip ? 0 : delay);
  }, [delay, show]);
  const closeSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(closeNow, CLOSE_DELAY);
  }, [closeNow]);
  useEffect(() => clear, []);

  useEffect(() => {
    if (!isOpen) return;
    openTooltips.set(contentId, closeNow);
    return () => {
      openTooltips.delete(contentId);
      lastClosedAt = performance.now();
    };
  }, [isOpen, contentId, closeNow]);

  // Esc closes it wherever focus is. Prevented, so a Dialog around it stays open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeNow();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, closeNow]);

  const value = useMemo(
    () => ({ open: isOpen, contentId, triggerRef, openSoon, openNow, closeSoon, closeNow }),
    [isOpen, contentId, openSoon, openNow, closeSoon, closeNow],
  );
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

const isTouch = (event: PointerEvent) => event.pointerType === 'touch';

/** Wires its single child to the tooltip: hover, focus and `aria-describedby`. */
export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(function TooltipTrigger(
  { children },
  ref,
) {
  const ctx = useTooltipContext('TooltipTrigger');
  const triggerRef = ctx?.triggerRef;
  // Set from a press until the pointer leaves: hover does not open the tooltip again meanwhile.
  const pressed = useRef(false);

  // Whether it is a kind of element that keyboard users can focus, not whether they can right now:
  // a trigger may mount hidden (for another breakpoint) or inside an inert region.
  useEffect(() => {
    if (isProduction()) return;
    const el = triggerRef?.current;
    if (el && !isTabbable(el)) {
      devWarn(
        '<TooltipTrigger> needs a child that keyboard users can focus, such as a button or a link.',
      );
    }
  }, [triggerRef]);

  if (!ctx) return children;
  // The child keeps its own description, and the tooltip's is added after it. Slot lets the child's
  // props win, so the merged value goes on the child itself.
  const child = resolveLazy(children);
  const described = isValidElement<HTMLAttributes<HTMLElement>>(child)
    ? cloneElement(child, {
        'aria-describedby': [child.props['aria-describedby'], ctx.contentId]
          .filter(Boolean)
          .join(' '),
      })
    : child;
  return (
    <Slot
      ref={mergeRefs(ref, ctx.triggerRef)}
      onPointerEnter={(event: PointerEvent<HTMLElement>) => {
        if (!isTouch(event) && !pressed.current) ctx.openSoon();
      }}
      onPointerLeave={(event: PointerEvent<HTMLElement>) => {
        pressed.current = false;
        if (!isTouch(event)) ctx.closeSoon();
      }}
      onPointerDown={() => {
        // A press closes it. Safari does not focus a clicked button, so no blur would, and an open
        // tooltip would take the first Esc from the overlay that the press opened.
        pressed.current = true;
        ctx.closeNow();
      }}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        // Keyboard focus only: a click or a tap also focuses, and must not show it.
        if (event.currentTarget.matches(':focus-visible')) ctx.openNow();
      }}
      onBlur={() => ctx.closeNow()}
    >
      {described}
    </Slot>
  );
});

/** The tooltip text. Always in the DOM, hidden until open, so `aria-describedby` can read it. */
export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent(
    {
      side = 'top',
      align = 'center',
      sideOffset = 6,
      className,
      onPointerEnter,
      onPointerLeave,
      ...props
    },
    ref,
  ) {
    const ctx = useTooltipContext('TooltipContent');
    const contentRef = useRef<HTMLDivElement>(null);
    const open = ctx?.open ?? false;
    usePopover(contentRef, {
      open,
      onOpenChange: (next) => (next ? ctx?.openNow() : ctx?.closeNow()),
    });
    useFloating({
      open,
      reference: () => ctx?.triggerRef.current ?? null,
      floating: contentRef,
      side,
      align,
      offset: sideOffset,
    });
    return (
      <div
        ref={mergeRefs(ref, contentRef)}
        popover="manual"
        role="tooltip"
        data-side={side}
        data-align={align}
        {...props}
        id={ctx?.contentId}
        className={clsx('flg-tooltip', className)}
        onPointerEnter={composeEventHandlers(onPointerEnter, () => ctx?.openNow())}
        onPointerLeave={composeEventHandlers(onPointerLeave, () => ctx?.closeSoon())}
      />
    );
  },
);
