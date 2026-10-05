import { useEffect, useReducer, useRef } from 'react';
import type { RefObject } from 'react';
import { returnFocus } from './focus';
import { useIsoLayoutEffect } from './use-iso-layout-effect';

export interface UsePopoverOptions {
  open: boolean;
  /** Called when the browser opens or closes the popover itself (light dismiss, Esc). */
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus goes when the popover closes while focus is inside it or nowhere (on `<body>`).
   * Focus that the user moved elsewhere, for example by clicking another control, is left alone.
   */
  restoreFocusTo?: (() => HTMLElement | null) | undefined;
}

const isShowing = (el: HTMLElement) => el.matches(':popover-open');

/** Retries in a row before giving up, so a state the browser never accepts cannot loop forever. */
const MAX_RETRIES = 3;

/**
 * Keeps an element with the `popover` attribute in step with `open`. The `toggle` event is attached
 * with `addEventListener`, since React 18 does not deliver `onToggle` for popovers. When the parent
 * controls `open` and keeps it `true` after the browser closed the popover, the popover reopens.
 */
export function usePopover(
  ref: RefObject<HTMLElement | null>,
  { open, onOpenChange, restoreFocusTo }: UsePopoverOptions,
): void {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const latest = useRef({ open, onOpenChange, restoreFocusTo });
  latest.current = { open, onOpenChange, restoreFocusTo };
  // Whether the last render asked for it to be open. The browser may already have hidden it (light
  // dismiss happens before the click that sets `open` to false), so focus is restored on every
  // change from open to closed, not only when this hook hides it.
  const wasOpen = useRef(false);
  // A show or hide that the browser refused, tried again on the next task.
  const retry = useRef<{
    timer: ReturnType<typeof setTimeout> | undefined;
    count: number;
    /** A hide was refused, so it may still show although `open` is false. */
    hide: boolean;
  }>({ timer: undefined, count: 0, hide: false });
  useEffect(() => () => clearTimeout(retry.current.timer), []);

  // Runs after every render: the DOM follows `open`, whatever closed or opened it last.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.isConnected) return;
    // The browser refuses to show or hide a popover while it is showing or hiding one. That happens
    // when closing a popover returns focus to a trigger whose tooltip then opens, all inside the
    // browser's own hide. Throwing here would unmount the whole React root, so this render is
    // retried on the next task, once the browser has finished.
    const attempt = (action: () => void): boolean => {
      try {
        action();
        retry.current.count = 0;
        return true;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'InvalidStateError')) throw error;
        clearTimeout(retry.current.timer);
        if (retry.current.count < MAX_RETRIES) {
          retry.current.count += 1;
          retry.current.timer = setTimeout(forceRender, 0);
        }
        return false;
      }
    };
    if (open) {
      retry.current.hide = false;
      if (!isShowing(el)) attempt(() => el.showPopover());
    } else if (wasOpen.current || retry.current.hide) {
      // Focus leaves first, so the browser's own hide has no focus inside the popover to move.
      returnFocus(latest.current.restoreFocusTo?.(), el);
      retry.current.hide = isShowing(el) && !attempt(() => el.hidePopover());
    }
    wasOpen.current = open;
  });

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onToggle = (event: Event) => {
      const nowOpen = (event as ToggleEvent).newState === 'open';
      if (nowOpen === latest.current.open) return;
      if (!nowOpen) returnFocus(latest.current.restoreFocusTo?.(), el);
      latest.current.onOpenChange(nowOpen);
      // A controlled parent that keeps the old value does not re-render; this render resyncs the DOM.
      forceRender();
    };
    el.addEventListener('toggle', onToggle);
    return () => el.removeEventListener('toggle', onToggle);
  }, [ref]);
}
