'use client';

import { clsx } from 'clsx';
import { createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef } from 'react';
import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { devWarn } from '../../internal/warn';
import { MenuTreeContext } from '../menu/menu-context';
import type { FocusOnOpen, Point } from '../menu/menu-context';
import { MenuPanel } from '../menu/MenuPanel';

/** How long a touch rests before the menu opens, in ms. */
const LONG_PRESS = 500;
/** How far a resting touch may drift, in px. */
const LONG_PRESS_SLOP = 10;

interface ContextMenuContextValue {
  open: boolean;
  /** Opens the menu at a point in viewport coordinates. Focus returns to `from` when it closes. */
  openAt: (point: Point, from: HTMLElement | null) => void;
  /** Reports a change that the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  contentId: string;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  point: MutableRefObject<Point>;
  returnTo: MutableRefObject<HTMLElement | null>;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenu(part: string): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <ContextMenu>.`);
    return {
      open: false,
      openAt: () => {},
      report: () => {},
      contentId: '',
      contentRef: { current: null },
      point: { current: [0, 0] },
      returnTo: { current: null },
    };
  }
  return ctx;
}

export interface ContextMenuProps {
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export interface ContextMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element as the area instead of a `<div>`. */
  asChild?: boolean;
}
export interface ContextMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Gap to the point it opens at, in px. Default 2. */
  sideOffset?: number;
}

const FIRST: MutableRefObject<FocusOnOpen> = { current: 'first' };

/**
 * A menu that opens where the user asks for it: a right click, a touch held still, or Shift+F10 and
 * the ContextMenu key on the focused element. Uncontrolled: opening always comes with a place.
 */
export function ContextMenu({ onOpenChange, children }: ContextMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    value: undefined,
    defaultValue: false,
    onChange: onOpenChange,
    name: 'ContextMenu',
  });
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const point = useRef<Point>([0, 0]);
  const returnTo = useRef<HTMLElement | null>(null);
  const openNow = useRef(isOpen);
  openNow.current = isOpen;
  const reopen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(reopen.current), []);

  const value = useMemo<ContextMenuContextValue>(
    () => ({
      open: isOpen,
      openAt: (at, from) => {
        clearTimeout(reopen.current);
        const show = () => {
          point.current = at;
          returnTo.current = from;
          setOpen(true);
        };
        if (!openNow.current) {
          show();
          return;
        }
        // Asked again while open: the press that asked has already light-dismissed the menu, and
        // the browser reports that a task later. Close, then open afresh at the new place.
        setOpen(false);
        reopen.current = setTimeout(show, 0);
      },
      report: setOpen,
      contentId,
      contentRef,
      point,
      returnTo,
    }),
    [isOpen, setOpen, contentId],
  );
  const tree = useMemo(() => ({ closeAll: () => setOpen(false) }), [setOpen]);
  return (
    <ContextMenuContext.Provider value={value}>
      <MenuTreeContext.Provider value={tree}>{children}</MenuTreeContext.Provider>
    </ContextMenuContext.Provider>
  );
}

interface Press {
  id: number;
  start: Point;
  /** Where the menu opens once the press ends; set by `contextmenu` or a long touch. */
  armed: Point | null;
  timer: ReturnType<typeof setTimeout> | undefined;
  stop: () => void;
}

/**
 * The area that has the menu. A press opens it when the press ends: the browser light-dismisses a
 * popover shown while a pointer is down as soon as that pointer comes up, and WebKit and Firefox fire
 * `contextmenu` before the button is released.
 */
export const ContextMenuTrigger = forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  function ContextMenuTrigger(
    {
      asChild = false,
      className,
      onPointerDownCapture,
      onContextMenu,
      onKeyDown,
      onClickCapture,
      ...props
    },
    ref,
  ) {
    const ctx = useContextMenu('ContextMenuTrigger');
    const press = useRef<Press | null>(null);
    // Focus as it was before the press, which may have moved it.
    const focusBefore = useRef<HTMLElement | null>(null);
    // A touch that opened the menu must not also click what it rested on.
    const swallowClickUntil = useRef(0);
    useEffect(() => () => press.current?.stop(), []);

    const currentFocus = (): HTMLElement | null => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || active === document.body) return null;
      // Pressed again while open: focus is in the menu; it still goes back where it came from.
      return ctx.contentRef.current?.contains(active) ? ctx.returnTo.current : active;
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      press.current?.stop();
      focusBefore.current = currentFocus();
      const { pointerId, pointerType, button, clientX, clientY } = event;
      const current: Press = {
        id: pointerId,
        start: [clientX, clientY],
        armed: null,
        timer: undefined,
        stop: () => {},
      };
      if (pointerType === 'touch') {
        current.timer = setTimeout(() => {
          current.armed = current.start;
        }, LONG_PRESS);
      }
      const onMove = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointerId || current.armed) return;
        const [x, y] = current.start;
        if (Math.hypot(e.clientX - x, e.clientY - y) > LONG_PRESS_SLOP) {
          clearTimeout(current.timer);
          current.timer = undefined;
        }
      };
      // A cancelled press (the browser took the gesture over) is followed by no `pointerup`, so
      // there is no light dismiss to wait for.
      const onEnd = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        current.stop();
        if (press.current === current) press.current = null;
        if (!current.armed) {
          // Chromium on Windows fires `contextmenu` after a right press ends; keep its focus note.
          if (button !== 2) focusBefore.current = null;
          return;
        }
        if (pointerType === 'touch') swallowClickUntil.current = performance.now() + 400;
        ctx.openAt(current.armed, focusBefore.current);
        focusBefore.current = null;
      };
      current.stop = () => {
        clearTimeout(current.timer);
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onEnd, true);
        document.removeEventListener('pointercancel', onEnd, true);
      };
      document.addEventListener('pointermove', onMove, true);
      document.addEventListener('pointerup', onEnd, true);
      document.addEventListener('pointercancel', onEnd, true);
      press.current = current;
    };

    const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      // The lift of a long touch has just opened the menu; where `contextmenu` follows it (Chrome
      // on Windows), opening again would close the menu and open it once more.
      if (performance.now() < swallowClickUntil.current) return;
      const at: Point = [event.clientX, event.clientY];
      const current = press.current;
      if (current) {
        clearTimeout(current.timer);
        current.armed = at;
        return;
      }
      // After the press (Chromium on Windows), or from assistive technology: open now.
      ctx.openAt(at, focusBefore.current ?? currentFocus());
      focusBefore.current = null;
    };

    // Not every browser turns these keys into `contextmenu`, so the menu handles them itself.
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const isMenuKey =
        event.key === 'ContextMenu' ||
        (event.key === 'F10' &&
          event.shiftKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.metaKey);
      if (!isMenuKey) return;
      event.preventDefault();
      const target = event.target as HTMLElement;
      const box = target.getBoundingClientRect();
      ctx.openAt([box.left, box.bottom], target);
    };

    const shared = {
      ...props,
      className: clsx('flg-context-menu-trigger', className),
      // Capture phase and no `defaultPrevented` gate: a descendant that stops or prevents its own
      // `pointerdown` must not switch the press off, or the menu would open and be dismissed at once.
      onPointerDownCapture: (event: PointerEvent<HTMLDivElement>) => {
        onPointerDownCapture?.(event);
        handlePointerDown(event);
      },
      onContextMenu: composeEventHandlers(onContextMenu, handleContextMenu),
      onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
      onClickCapture: composeEventHandlers(onClickCapture, (event: MouseEvent<HTMLDivElement>) => {
        if (performance.now() >= swallowClickUntil.current) return;
        swallowClickUntil.current = 0;
        event.preventDefault();
        event.stopPropagation();
      }),
    };
    return asChild ? <Slot ref={ref} {...shared} /> : <div ref={ref} {...shared} />;
  },
);

/** The menu panel. It opens at the point the trigger reports, and flips to stay on screen. */
export const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(
  function ContextMenuContent({ sideOffset = 2, onContextMenu, ...props }, ref) {
    const ctx = useContextMenu('ContextMenuContent');
    const { contentRef, point, returnTo } = ctx;
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref, contentRef]);
    return (
      <MenuPanel
        ref={mergedRef}
        {...props}
        open={ctx.open}
        report={ctx.report}
        contentId={ctx.contentId}
        reference={() => {
          const [x, y] = point.current;
          return { getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }) };
        }}
        restoreFocusTo={() => returnTo.current}
        focusOnOpen={FIRST}
        side="right"
        align="start"
        offset={sideOffset}
        // The ContextMenu key fires `contextmenu` after the menu opened, at the item it focused.
        onContextMenu={composeEventHandlers(onContextMenu, (event: MouseEvent<HTMLDivElement>) =>
          event.preventDefault(),
        )}
      />
    );
  },
);
