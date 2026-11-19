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
  useState,
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
import { isTabbableKind } from '../../internal/focus';
import { mergeRefs } from '../../internal/merge-refs';
import { isCoveredByModal, subscribeModals } from '../../internal/modal-stack';
import { OPEN_POPOVER_CLOSES_ON_ESC } from '../../internal/popover';
import { resolveLazy } from '../../internal/react-lazy';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import type { Align, Side } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn, isProduction } from '../../internal/warn';

/** How long after one tooltip closes the next one opens without waiting, in ms. */
const SKIP_DELAY = 300;
/** How long the pointer may be off both the trigger and the tooltip before it closes, in ms. */
const CLOSE_DELAY = 100;
/**
 * Every open tooltip and its close function; shared by every tooltip on the page. Keyed by an object
 * per tooltip, not by its `useId()`: hydrated roots (islands) and separate copies of React repeat
 * ids.
 */
const openTooltips = new Map<object, () => void>();
/** When the last tooltip closed. */
let lastClosedAt = Number.NEGATIVE_INFINITY;

/** Overlays that close on Esc. A dialog opened with `show()` and a manual popover do not. */
const CLOSES_ON_ESC = 'dialog:modal, [popover]:not([popover="manual"])';

/**
 * Focus is in an open overlay that Esc closes and that the trigger is not part of, such as a menu
 * opened while the pointer rests on the trigger: Esc belongs to that overlay. So does focus on the
 * trigger of an open popover that keeps focus there, such as a Select's listbox (`aria-expanded`
 * and `aria-controls` name it). With focus in an overlay that Esc does not close, the tooltip still
 * takes it (WCAG 1.4.13). (A closed popover holds no focus, so any popover around it is open.)
 */
function isFocusInAnotherOverlay(trigger: HTMLElement | null): boolean {
  const focused = document.activeElement;
  const controls =
    focused?.getAttribute('aria-expanded') === 'true'
      ? focused.getAttribute('aria-controls')
      : null;
  const controlled = controls ? document.getElementById(controls) : null;
  const overlay = controlled?.matches(OPEN_POPOVER_CLOSES_ON_ESC)
    ? controlled
    : focused?.closest(CLOSES_ON_ESC);
  return overlay != null && trigger !== null && !overlay.contains(trigger);
}

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
  /** Set by a press, or by Esc with the pointer on the trigger, until the pointer leaves it. */
  held: MutableRefObject<boolean>;
  /** Whether the trigger is described by the tooltip (`aria-describedby`). */
  describe: boolean;
  /** Whether it may show now; while it may not, the trigger starts no timer. */
  enabled: boolean;
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

/** What only the library's own parts say to a Tooltip: not in the public props (spec phase 5 §5). */
interface TooltipInternalProps {
  /**
   * Whether the trigger gets `aria-describedby` to the tooltip. Default `true`; `false` when the text
   * of the tooltip is the name of the trigger (an item of the rail), or is said another way, so that
   * a screen reader does not read it twice.
   */
  describe?: boolean;
  /**
   * Whether it may show now. Default `true`; `false` starts no hover or focus timer, closes no other
   * tooltip and keeps this one shut, and closes it if it was open, so that it does not come back by
   * itself when it is turned on again. For a part whose trigger stays mounted where the tooltip may
   * not show (an item of the rail in the expanded sidebar, a group's button under its flyout).
   */
  enabled?: boolean;
}

/**
 * The Tooltip with the internal options. Not exported from the package: the parts of the library
 * that need `describe` or `enabled` use it, and `Tooltip` hands it only the public props, so a caller
 * cannot reach the options from plain JavaScript either.
 */
export function TooltipRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  delay = 500,
  describe = true,
  enabled = true,
  children,
}: TooltipProps & TooltipInternalProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Tooltip',
  });
  // What shows: a tooltip that is turned off is shut from the render that turns it off.
  const shown = enabled && isOpen;
  const contentId = useId();
  const [self] = useState<object>(() => ({}));
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Read by the timers, which may fire after a render that turned it off and before its effects.
  const enabledNow = useRef(enabled);
  useWriteOnCommit(() => {
    enabledNow.current = enabled;
  });

  const clear = () => clearTimeout(timer.current);
  // Only one tooltip shows at a time: opening this one closes any other in the same render. One that
  // is turned off opens nothing, and so closes nothing.
  const show = useCallback(() => {
    if (!enabledNow.current) return;
    for (const [other, close] of openTooltips) if (other !== self) close();
    setOpen(true);
  }, [self, setOpen]);
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
    if (!enabledNow.current) return;
    // Moving from one tooltip to the next skips the delay.
    const skip = openTooltips.size > 0 || performance.now() - lastClosedAt < SKIP_DELAY;
    timer.current = setTimeout(show, skip ? 0 : delay);
  }, [delay, show]);
  const closeSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(closeNow, CLOSE_DELAY);
  }, [closeNow]);
  useEffect(() => clear, []);

  // Turned off: a timer that runs stops, and an open tooltip closes. Nothing tells it that the
  // pointer or the focus left the trigger meanwhile, so it must not open by itself when it is turned
  // on again.
  useEffect(() => {
    if (enabled) return;
    clearTimeout(timer.current);
    closeNow();
  }, [enabled, closeNow]);

  useEffect(() => {
    if (!shown) return;
    openTooltips.set(self, closeNow);
    return () => {
      openTooltips.delete(self);
      lastClosedAt = performance.now();
    };
  }, [shown, self, closeNow]);

  // A modal that opens over the trigger, without holding it, covers it: the tooltip closes, even
  // though the pointer may not have moved off the trigger.
  useEffect(() => {
    if (!shown) return;
    const closeWhenCovered = () => {
      if (isCoveredByModal(triggerRef.current)) closeNow();
    };
    closeWhenCovered();
    return subscribeModals(closeWhenCovered);
  }, [shown, closeNow]);

  // Set by a press on the trigger, or by Esc while the pointer is on it, until the pointer leaves the
  // trigger: hover does not open the tooltip meanwhile (WCAG 1.4.13, dismissed without moving the
  // pointer). Browsers report a pointer that rests on the trigger as entering it again, without a
  // move, when the page changes under it, as when the tooltip hides; inside the skip window that
  // would open it again at once.
  const held = useRef(false);

  // Esc closes it wherever focus is. Prevented, so a Dialog around it stays open. Under a modal that
  // does not hold the trigger, Esc belongs to that modal.
  useEffect(() => {
    if (!shown) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const trigger = triggerRef.current;
      if (event.key !== 'Escape' || isCoveredByModal(trigger) || isFocusInAnotherOverlay(trigger)) {
        return;
      }
      event.preventDefault();
      if (trigger && isPointerOn(trigger)) held.current = true;
      closeNow();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [shown, closeNow]);

  const value = useMemo(
    () => ({
      open: shown,
      contentId,
      triggerRef,
      openSoon,
      openNow,
      closeSoon,
      closeNow,
      held,
      describe,
      enabled,
    }),
    [shown, contentId, openSoon, openNow, closeSoon, closeNow, describe, enabled],
  );
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

/** A short text label for its trigger, on hover and keyboard focus. Renders no element. */
export function Tooltip({ open, defaultOpen, onOpenChange, delay, children }: TooltipProps) {
  return (
    <TooltipRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} delay={delay}>
      {children}
    </TooltipRoot>
  );
}

const isTouch = (event: PointerEvent) => event.pointerType === 'touch';

/** The key of the last `keydown` on the page, shared by every TooltipTrigger. */
let lastKey: string | undefined;
let trackingKeys = false;

/** Starts, once for the page, the listener that remembers the last key pressed. */
function trackKeys(): void {
  if (trackingKeys) return;
  trackingKeys = true;
  document.addEventListener(
    'keydown',
    (event) => {
      lastKey = event.key;
    },
    true,
  );
}

/**
 * Where the last mouse or pen event on the page happened, shared by every TooltipTrigger. Touch is
 * left out: a tap elsewhere does not move the mouse. Like `lastKey`, it hears only this document.
 */
let pointerX = 0;
let pointerY = 0;
let pointerKnown = false;
let trackingPointer = false;

/** Starts, once for the page, the listeners that remember where the mouse or pen last was. */
function trackPointer(): void {
  if (trackingPointer) return;
  trackingPointer = true;
  const remember = (event: globalThis.PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerKnown = true;
  };
  for (const type of ['pointerover', 'pointermove', 'pointerdown'] as const) {
    document.addEventListener(type, remember, true);
  }
}

/**
 * Whether the mouse or pen was last seen on `el`. False while no such event has happened since the
 * page loaded: the browser does not say where a pointer that has not moved rests (not even through
 * `:hover`, measured in WebKit and Chromium).
 */
function isPointerOn(el: Element): boolean {
  if (!pointerKnown) return false;
  const box = el.getBoundingClientRect();
  return (
    pointerX >= box.left && pointerX <= box.right && pointerY >= box.top && pointerY <= box.bottom
  );
}

/** Wires its single child to the tooltip: hover, focus and `aria-describedby`. */
export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(function TooltipTrigger(
  { children },
  ref,
) {
  const ctx = useTooltipContext('TooltipTrigger');
  const triggerRef = ctx?.triggerRef;
  const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
  // Keyboard focus opens it a task later.
  const focusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    trackKeys();
    trackPointer();
    return () => clearTimeout(focusTimer.current);
  }, []);

  // Whether it is a kind of element that keyboard users can focus, not whether they can right now:
  // a trigger may mount hidden (for another breakpoint), inside an inert region, or inside a
  // disabled fieldset.
  useEffect(() => {
    if (isProduction()) return;
    const el = triggerRef?.current;
    if (el && !isTabbableKind(el)) {
      devWarn(
        '<TooltipTrigger> needs a child that keyboard users can focus, such as a button or a link.',
      );
    }
  }, [triggerRef]);

  // Without the element, the tooltip has nothing to be placed next to.
  const open = ctx?.open ?? false;
  useEffect(() => {
    if (isProduction() || !open || !triggerRef || triggerRef.current) return;
    devWarn(
      '<TooltipTrigger> could not reach its child element: the child must forward its ref to a ' +
        'DOM element.',
    );
  }, [open, triggerRef]);

  if (!ctx) return children;
  // The child keeps its own description, and the tooltip's is added after it. Slot lets the child's
  // props win, so the merged value goes on the child itself.
  const child = resolveLazy(children);
  const described =
    ctx.describe && isValidElement<HTMLAttributes<HTMLElement>>(child)
      ? cloneElement(child, {
          'aria-describedby': [child.props['aria-describedby'], ctx.contentId]
            .filter(Boolean)
            .join(' '),
        })
      : child;
  return (
    <Slot
      ref={mergedRef}
      onPointerEnter={(event: PointerEvent<HTMLElement>) => {
        if (!isTouch(event) && !ctx.held.current) ctx.openSoon();
      }}
      onPointerLeave={(event: PointerEvent<HTMLElement>) => {
        ctx.held.current = false;
        if (!isTouch(event)) ctx.closeSoon();
      }}
      onPointerDown={() => {
        // A press closes it. Safari does not focus a clicked button, so no blur would, and an open
        // tooltip would take the first Esc from the overlay that the press opened.
        ctx.held.current = true;
        ctx.closeNow();
      }}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        // Keyboard focus only: a click or a tap also focuses, and must not show it. Nor does focus
        // that comes back to the trigger after Esc closed another overlay, nor focus on the trigger
        // of a tooltip that is turned off.
        if (!ctx.enabled) return;
        if (!event.currentTarget.matches(':focus-visible') || lastKey === 'Escape') return;
        // A task later: this focus may arrive inside the browser's hide of another popover, and the
        // browser refuses to show a popover until that hide is done.
        clearTimeout(focusTimer.current);
        focusTimer.current = setTimeout(ctx.openNow, 0);
      }}
      onBlur={() => {
        clearTimeout(focusTimer.current);
        ctx.closeNow();
      }}
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
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref]);
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
        ref={mergedRef}
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
