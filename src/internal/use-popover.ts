import { useReducer, useRef } from 'react';
import type { RefObject } from 'react';
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

function restoreFocus(
  el: HTMLElement,
  hadFocus: boolean,
  target: (() => HTMLElement | null) | undefined,
) {
  const active = document.activeElement;
  if (hadFocus || active === null || active === document.body || el.contains(active)) {
    target?.()?.focus({ preventScroll: true });
  }
}

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

  // Runs after every render: the DOM follows `open`, whatever closed or opened it last.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.isConnected) return;
    if (open && !isShowing(el)) {
      el.showPopover();
    } else if (!open && wasOpen.current) {
      const hadFocus = el.contains(document.activeElement);
      if (isShowing(el)) el.hidePopover();
      restoreFocus(el, hadFocus, latest.current.restoreFocusTo);
    }
    wasOpen.current = open;
  });

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onToggle = (event: Event) => {
      const nowOpen = (event as ToggleEvent).newState === 'open';
      if (nowOpen === latest.current.open) return;
      if (!nowOpen) restoreFocus(el, false, latest.current.restoreFocusTo);
      latest.current.onOpenChange(nowOpen);
      // A controlled parent that keeps the old value does not re-render; this render resyncs the DOM.
      forceRender();
    };
    el.addEventListener('toggle', onToggle);
    return () => el.removeEventListener('toggle', onToggle);
  }, [ref]);
}
