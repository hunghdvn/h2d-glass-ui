import { useEffect, useReducer, useRef } from 'react';
import type { RefObject } from 'react';
import { returnFocus } from './focus';
import { useIsoLayoutEffect } from './use-iso-layout-effect';
import { devWarn } from './warn';

export interface UsePopoverOptions {
  open: boolean;
  /** Called when the browser opens or closes the popover itself (light dismiss, Esc). */
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus goes when the popover closes while focus is inside it or nowhere (on `<body>`).
   * Focus that the user moved elsewhere, for example by clicking another control, is left alone.
   */
  restoreFocusTo?: (() => HTMLElement | null) | undefined;
  /** Called right after the popover really shows: after `showPopover()` succeeds, retried or not. */
  onShown?: (() => void) | undefined;
}

const isShowing = (el: HTMLElement) => el.matches(':popover-open');

type Action = 'show' | 'hide';

/** A show or hide that the browser refused once, tried again on the next task. */
interface Retry {
  action: Action | null;
  timer: ReturnType<typeof setTimeout> | undefined;
}

const NO_RETRY: Retry = { action: null, timer: undefined };

const REFUSED =
  'The browser refused to show or hide a popover twice, a task apart, because another popover was ' +
  'being shown or hidden at that moment. This happens when code opens a popover from an event that ' +
  'fires while another popover closes, such as a focus handler. Open it a task later instead.';

/**
 * Keeps an element with the `popover` attribute in step with `open`. The `toggle` event is attached
 * with `addEventListener`, since React 18 does not deliver `onToggle` for popovers. When the parent
 * controls `open` and keeps it `true` after the browser closed the popover, the popover reopens.
 */
export function usePopover(
  ref: RefObject<HTMLElement | null>,
  { open, onOpenChange, restoreFocusTo, onShown }: UsePopoverOptions,
): void {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const latest = useRef({ open, onOpenChange, restoreFocusTo, onShown });
  latest.current = { open, onOpenChange, restoreFocusTo, onShown };
  // Whether the last render asked for it to be open. The browser may already have hidden it (light
  // dismiss happens before the click that sets `open` to false), so focus is restored on every
  // change from open to closed, not only when this hook hides it.
  const wasOpen = useRef(false);
  // A refused hide leaves it showing although `open` is false.
  const retry = useRef<Retry>(NO_RETRY);
  useEffect(() => () => clearTimeout(retry.current.timer), []);

  // Runs after every render: the DOM follows `open`, whatever closed or opened it last.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.isConnected) return;
    // The browser refuses to show or hide a popover while it is showing or hiding another one, for
    // example when a focus handler opens one inside the browser's hide of another. Throwing here
    // would unmount the whole React root, so the change is tried once more on the next task, once
    // the browser has finished. Refused again, it is given up: the parent hears the state that the
    // popover is really in, so a trigger's `aria-expanded` never says open while nothing shows.
    const run = (action: Action) => {
      const retried = retry.current.action === action;
      clearTimeout(retry.current.timer);
      retry.current = NO_RETRY;
      try {
        if (action === 'show') el.showPopover();
        else el.hidePopover();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'InvalidStateError')) throw error;
        if (!retried) {
          retry.current = { action, timer: setTimeout(forceRender, 0) };
          return;
        }
        devWarn(REFUSED);
        latest.current.onOpenChange(isShowing(el));
        return;
      }
      if (action === 'show') latest.current.onShown?.();
    };
    // A retry that `open` has turned around since is dropped.
    if (retry.current.action !== null && retry.current.action !== (open ? 'show' : 'hide')) {
      clearTimeout(retry.current.timer);
      retry.current = NO_RETRY;
    }
    if (open) {
      if (!isShowing(el)) run('show');
    } else if (wasOpen.current || retry.current.action === 'hide') {
      // Focus leaves first, so the browser's own hide has no focus inside the popover to move.
      returnFocus(latest.current.restoreFocusTo?.(), el);
      if (isShowing(el)) run('hide');
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
