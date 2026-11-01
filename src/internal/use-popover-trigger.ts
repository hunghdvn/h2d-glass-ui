import { useCallback, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useControllableState } from './use-controllable-state';
import { useWriteOnCommit } from './use-write-on-commit';

export interface PopoverStateOptions {
  open: boolean | undefined;
  defaultOpen: boolean;
  onOpenChange: ((open: boolean) => void) | undefined;
  /** The component's name, for the dev warning about switching between controlled and not. */
  name: string;
}

export interface PopoverState<E extends HTMLElement> {
  open: boolean;
  /**
   * Asks for a change: a trigger, a chosen item, a close button. Stable across opening and closing.
   */
  request: (open: boolean) => void;
  /** Reports a change that the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  contentRef: MutableRefObject<E | null>;
  /** Pass to `usePopover`: the toggle the browser fires for a change already reported. */
  pendingToggle: MutableRefObject<boolean | null>;
}

/**
 * The open state of a `popover="auto"` panel that a trigger toggles: Popover, DropdownMenu, Select.
 *
 * A press on the trigger light-dismisses the open panel before the trigger's click asks to close
 * it. The browser's `toggle` event for that close comes a task later and says nothing new, so the
 * parent must not hear it twice: `request` notes it in `pendingToggle`, and `usePopover` skips the
 * toggle that matches. The open state is read through a ref, so `request` keeps its identity when
 * the panel opens and closes.
 */
export function usePopoverState<E extends HTMLElement>({
  open,
  defaultOpen,
  onOpenChange,
  name,
}: PopoverStateOptions): PopoverState<E> {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name,
  });
  const contentRef = useRef<E | null>(null);
  const pendingToggle = useRef<boolean | null>(null);
  // The state of the last commit, for `request` to compare against. Written after the commit, not
  // during a render that React may throw away.
  const openNow = useRef(isOpen);
  useWriteOnCommit(() => {
    openNow.current = isOpen;
  });
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
  return { open: isOpen, request, report: setOpen, contentRef, pendingToggle };
}

export interface TriggerPress {
  onPointerDown: () => void;
  onPointerCancel: () => void;
  onClick: (event: { detail: number } | undefined) => void;
}

/**
 * The handlers a trigger of a `popover="auto"` panel needs to toggle it on a click. A press on the
 * trigger light-dismisses the open panel before the click arrives, so the click goes by whether it
 * was open at the press. A press that never became a click (dragged off, right-clicked) leaves a
 * stale note, so a click from the keyboard or from code (`detail` 0) goes by the state now.
 * `toggle` receives the state to leave and whether a pointer press made the click.
 */
export function useTriggerPress(
  open: boolean,
  toggle: (wasOpen: boolean, fromPress: boolean) => void,
): TriggerPress {
  const openAtPress = useRef<boolean | null>(null);
  return {
    onPointerDown: () => {
      openAtPress.current = open;
    },
    onPointerCancel: () => {
      openAtPress.current = null;
    },
    onClick: (event) => {
      const fromPress = (event?.detail ?? 0) !== 0;
      const wasOpen = (fromPress ? openAtPress.current : null) ?? open;
      openAtPress.current = null;
      toggle(wasOpen, fromPress);
    },
  };
}
