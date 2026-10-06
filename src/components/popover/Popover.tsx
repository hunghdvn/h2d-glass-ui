'use client';

import { clsx } from 'clsx';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import type { HTMLAttributes, MutableRefObject, ReactNode } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { focusFirst } from '../../internal/focus';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import type { Align, Side } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';

interface PopoverContextValue {
  open: boolean;
  /** Asks for a change: the trigger and the close buttons. */
  setOpen: (open: boolean) => void;
  /** Reports a change that the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  contentId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  /** A change asked for after the browser had already made it; its `toggle` event is on its way. */
  pendingToggle: MutableRefObject<boolean | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(part: string): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <Popover>.`);
    return {
      open: false,
      setOpen: () => {},
      report: () => {},
      contentId: '',
      triggerRef: { current: null },
      contentRef: { current: null },
      pendingToggle: { current: null },
    };
  }
  return ctx;
}

export interface PopoverProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export type PopoverTriggerProps = ButtonProps;
export type PopoverCloseProps = ButtonProps;
export interface PopoverContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** The side of the trigger it opens on. It flips when there is no room. Default `"bottom"`. */
  side?: Side;
  /** How it lines up with the trigger along that side. Default `"start"`. */
  align?: Align;
  /** Gap to the trigger, in px, before the 10px that the arrow adds. Default 8. */
  sideOffset?: number;
  /** Show the arrow pointing at the trigger. Default `true`. */
  arrow?: boolean;
}

/** A non-modal panel anchored to its trigger, on the native `popover="auto"`. Renders no element. */
export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Popover',
  });
  const contentId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pendingToggle = useRef<boolean | null>(null);
  // A press on the trigger light-dismisses the popover before its click asks to close it. The
  // browser's `toggle` event for that close comes a task later and says nothing new, so the parent
  // must not hear it twice: usePopover skips the toggle that matches.
  const request = useCallback(
    (next: boolean) => {
      const el = contentRef.current;
      const alreadyMade = el !== null && next !== isOpen && el.matches(':popover-open') === next;
      pendingToggle.current = alreadyMade ? next : null;
      setOpen(next);
    },
    [isOpen, setOpen],
  );
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: request,
      report: setOpen,
      contentId,
      triggerRef,
      contentRef,
      pendingToggle,
    }),
    [isOpen, request, setOpen, contentId],
  );
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

/** Opens and closes the popover. Renders the library's `Button` and takes its props. */
export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  function PopoverTrigger({ onPointerDown, onPointerCancel, onClick, ...props }, ref) {
    const ctx = usePopoverContext('PopoverTrigger');
    // A press on the trigger light-dismisses an open popover before the click arrives. Remember
    // whether it was open at the press, so that click closes it instead of opening it again.
    const openAtPress = useRef<boolean | null>(null);
    const triggerRef = ctx.triggerRef;
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
    return (
      <Button
        ref={mergedRef}
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        {...props}
        onPointerDown={composeEventHandlers(onPointerDown, () => {
          openAtPress.current = ctx.open;
        })}
        onPointerCancel={composeEventHandlers(onPointerCancel, () => {
          openAtPress.current = null;
        })}
        onClick={composeEventHandlers(onClick, (event) => {
          // A press that never became a click (dragged off, right-clicked) leaves a stale value, so
          // a click from the keyboard or from code (`detail` 0) goes by the current state.
          const fromPress = (event?.detail ?? 0) !== 0;
          const wasOpen = (fromPress ? openAtPress.current : null) ?? ctx.open;
          openAtPress.current = null;
          ctx.setOpen(!wasOpen);
        })}
      />
    );
  },
);

/** Closes the popover. Renders the library's `Button` and takes its props. */
export const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(function PopoverClose(
  { onClick, ...props },
  ref,
) {
  const ctx = usePopoverContext('PopoverClose');
  return (
    <Button
      ref={ref}
      {...props}
      onClick={composeEventHandlers(onClick, () => ctx.setOpen(false))}
    />
  );
});

/** Extra distance that makes room for the arrow, in px. */
const ARROW_SPACE = 10;

/** The glass panel. Rendered right after the trigger, so Tab moves into it naturally. */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    {
      side = 'bottom',
      align = 'start',
      sideOffset = 8,
      arrow = true,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const ctx = usePopoverContext('PopoverContent');
    const contentRef = useRef<HTMLDivElement>(null);
    const arrowRef = useRef<HTMLSpanElement>(null);
    const ctxContentRef = ctx.contentRef;
    const mergedRef = useMemo(
      () => mergeRefs(ref, contentRef, ctxContentRef),
      [ref, ctxContentRef],
    );
    const { open, report, triggerRef, pendingToggle } = ctx;

    usePopover(contentRef, {
      open,
      onOpenChange: report,
      pendingToggle,
      restoreFocusTo: () => triggerRef.current,
      // Focus moves in once it really shows, which a refused show delays by a task: to the first
      // focusable element, else the panel itself.
      onShown: () => {
        const el = contentRef.current;
        if (el) focusFirst(el);
      },
    });
    useFloating({
      open,
      reference: () => triggerRef.current,
      floating: contentRef,
      side,
      align,
      offset: sideOffset + (arrow ? ARROW_SPACE : 0),
      arrow: arrow ? arrowRef : undefined,
    });

    const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
    useEffect(() => {
      if (!named) {
        devWarn('<PopoverContent> needs a name: pass aria-label or aria-labelledby.');
      }
    }, [named]);

    return (
      <div
        ref={mergedRef}
        popover="auto"
        role="dialog"
        tabIndex={-1}
        data-side={side}
        data-align={align}
        {...props}
        id={ctx.contentId}
        className={clsx('flg-surface flg-popover', className)}
      >
        {open ? (
          <>
            {arrow ? (
              <span ref={arrowRef} className="flg-popover-arrow" aria-hidden="true" />
            ) : null}
            {children}
          </>
        ) : null}
      </div>
    );
  },
);
