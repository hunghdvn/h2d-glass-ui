'use client';

import { createContext, forwardRef, useCallback, useContext, useId, useMemo, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, MutableRefObject, ReactNode } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllableState } from '../../internal/use-controllable-state';
import type { Align, Side } from '../../internal/use-floating';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';
import { MenuTreeContext, focusMenuEdge } from '../menu/menu-context';
import type { FocusOnOpen } from '../menu/menu-context';
import { MenuPanel } from '../menu/MenuPanel';

interface DropdownMenuContextValue {
  open: boolean;
  /** Asks for a change: the trigger, a chosen item, Tab. */
  setOpen: (open: boolean) => void;
  /** Reports a change that the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  contentId: string;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  pendingToggle: MutableRefObject<boolean | null>;
  focusOnOpen: MutableRefObject<FocusOnOpen>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu(part: string): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <DropdownMenu>.`);
    return {
      open: false,
      setOpen: () => {},
      report: () => {},
      contentId: '',
      triggerId: '',
      triggerRef: { current: null },
      contentRef: { current: null },
      pendingToggle: { current: null },
      focusOnOpen: { current: 'menu' },
    };
  }
  return ctx;
}

export interface DropdownMenuProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export type DropdownMenuTriggerProps = Omit<ButtonProps, 'id'>;
export interface DropdownMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** The side of the trigger it opens on. It flips when there is no room. Default `"bottom"`. */
  side?: Side;
  /** How it lines up with the trigger along that side. Default `"start"`. */
  align?: Align;
  /** Gap to the trigger, in px. Default 4. */
  sideOffset?: number;
}

/** A menu of commands that a button opens, on the native `popover="auto"`. Renders no element. */
export function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'DropdownMenu',
  });
  const contentId = useId();
  const triggerId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pendingToggle = useRef<boolean | null>(null);
  const focusOnOpen = useRef<FocusOnOpen>('menu');
  // Read through a ref, so that `request`, and the tree context made from it, keep their identity
  // when the menu opens and closes: every item would otherwise re-render on each change.
  const openNow = useRef(isOpen);
  openNow.current = isOpen;
  // A press on the trigger light-dismisses the menu before its click asks to close it; the browser's
  // late `toggle` for that close must not reach the parent a second time (see Popover).
  const request = useCallback(
    (next: boolean) => {
      const el = contentRef.current;
      const alreadyMade =
        el !== null && next !== openNow.current && el.matches(':popover-open') === next;
      pendingToggle.current = alreadyMade ? next : null;
      setOpen(next);
    },
    [setOpen],
  );
  const tree = useMemo(() => ({ closeAll: () => request(false) }), [request]);
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: request,
      report: setOpen,
      contentId,
      triggerId,
      triggerRef,
      contentRef,
      pendingToggle,
      focusOnOpen,
    }),
    [isOpen, request, setOpen, contentId, triggerId],
  );
  return (
    <DropdownMenuContext.Provider value={value}>
      <MenuTreeContext.Provider value={tree}>{children}</MenuTreeContext.Provider>
    </DropdownMenuContext.Provider>
  );
}

/**
 * Opens the menu. Renders the library's `Button` and takes its props. Enter, Space and ↓ open it on
 * the first item, ↑ on the last; a click opens it on the menu itself.
 */
export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger(
    { onPointerDown, onPointerCancel, onClick, onKeyDown, ...props },
    ref,
  ) {
    const ctx = useDropdownMenu('DropdownMenuTrigger');
    const openAtPress = useRef<boolean | null>(null);
    const triggerRef = ctx.triggerRef;
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);

    const openOn = (where: FocusOnOpen) => {
      ctx.focusOnOpen.current = where;
      if (!ctx.open) {
        ctx.setOpen(true);
        return;
      }
      // Already open: the keyboard moves into it now.
      const content = ctx.contentRef.current;
      if (content) focusMenuEdge(content, where === 'last' ? 'End' : 'Home');
    };

    return (
      <Button
        ref={mergedRef}
        aria-haspopup="menu"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        {...props}
        id={ctx.triggerId}
        onKeyDown={composeEventHandlers(onKeyDown, (event: KeyboardEvent<HTMLButtonElement>) => {
          const where =
            event.key === 'ArrowUp'
              ? 'last'
              : ['Enter', ' ', 'ArrowDown'].includes(event.key)
                ? 'first'
                : null;
          if (!where) return;
          event.preventDefault();
          // A held key opens it once: the repeats are not presses of their own.
          if (event.repeat) return;
          openOn(where);
        })}
        onPointerDown={composeEventHandlers(onPointerDown, () => {
          openAtPress.current = ctx.open;
        })}
        onPointerCancel={composeEventHandlers(onPointerCancel, () => {
          openAtPress.current = null;
        })}
        onClick={composeEventHandlers(onClick, (event) => {
          // Like PopoverTrigger: a press decides from the state at the press, anything else from now.
          const fromPress = (event?.detail ?? 0) !== 0;
          const wasOpen = (fromPress ? openAtPress.current : null) ?? ctx.open;
          openAtPress.current = null;
          ctx.focusOnOpen.current = fromPress ? 'menu' : 'first';
          ctx.setOpen(!wasOpen);
        })}
      />
    );
  },
);

/** The menu panel. Rendered right after the trigger, and named by it. */
export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent(
    { side = 'bottom', align = 'start', sideOffset = 4, ...props },
    ref,
  ) {
    const ctx = useDropdownMenu('DropdownMenuContent');
    const contentRef = ctx.contentRef;
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref, contentRef]);
    const { triggerRef } = ctx;
    return (
      <MenuPanel
        ref={mergedRef}
        aria-labelledby={ctx.triggerId}
        {...props}
        open={ctx.open}
        report={ctx.report}
        pendingToggle={ctx.pendingToggle}
        contentId={ctx.contentId}
        reference={() => triggerRef.current}
        restoreFocusTo={() => triggerRef.current}
        focusOnOpen={ctx.focusOnOpen}
        side={side}
        align={align}
        offset={sideOffset}
      />
    );
  },
);
