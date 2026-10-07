import { useEffect, useReducer, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import { isInsideControl, registerPopoverReturn, returnFocus } from './focus';
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
  /**
   * Called right after the popover shows because `open` turned true: once `showPopover()` succeeds,
   * on the first try or on the retry. Not called when it is shown again only to stay in step with a
   * parent that kept `open` true after the browser closed it.
   */
  onShown?: (() => void) | undefined;
  /**
   * A change that the component already reported, which the browser had made before it asked: the
   * `toggle` event that matches it is not reported again.
   */
  pendingToggle?: MutableRefObject<boolean | null> | undefined;
}

const isShowing = (el: HTMLElement) => el.matches(':popover-open');

type Action = 'show' | 'hide';

/** A show or hide that the browser refused once, tried again on the next task. */
interface Retry {
  action: Action | null;
  /** The refused show was the one that follows `open` turning true. */
  opening: boolean;
  timer: ReturnType<typeof setTimeout> | undefined;
}

const NO_RETRY: Retry = { action: null, opening: false, timer: undefined };

const REFUSED =
  'The browser refused to show or hide a popover twice, a task apart, because another popover was ' +
  'being shown or hidden at that moment. This happens when code opens a popover from an event that ' +
  'fires while another popover closes, such as a focus handler. Open it a task later instead.';

/**
 * The press that closes it by light dismiss: one on another control, which keeps focus, or one on
 * the element focus returns to (its trigger).
 */
type Press = 'none' | 'elsewhere' | 'home';

/** Returns focus to the trigger, unless the press that closed the popover was on another control. */
function restoreFocus(
  el: HTMLElement,
  press: Press,
  target: (() => HTMLElement | null) | undefined,
) {
  if (press === 'elsewhere') return;
  const home = target?.();
  // A press on the trigger itself: Safari does not focus a pressed button, and moves focus to the
  // nearest focusable element around it, such as a dialog's panel. That is no move of the user's,
  // so focus goes back to the trigger.
  if (press === 'home' && home?.isConnected) {
    home.focus({ preventScroll: true });
    return;
  }
  returnFocus(home, el);
}

/**
 * Keeps an element with the `popover` attribute in step with `open`. The `toggle` event is attached
 * with `addEventListener`, since React 18 does not deliver `onToggle` for popovers. When the parent
 * controls `open` and keeps it `true` after the browser closed the popover, the popover reopens.
 */
export function usePopover(
  ref: RefObject<HTMLElement | null>,
  { open, onOpenChange, restoreFocusTo, onShown, pendingToggle }: UsePopoverOptions,
): void {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const latest = useRef({ open, onOpenChange, restoreFocusTo, onShown, pendingToggle });
  latest.current = { open, onOpenChange, restoreFocusTo, onShown, pendingToggle };
  // Whether the last render asked for it to be open. The browser may already have hidden it (light
  // dismiss happens before the click that sets `open` to false), so focus is restored on every
  // change from open to closed, not only when this hook hides it.
  const wasOpen = useRef(false);
  // A refused hide leaves it showing although `open` is false.
  const retry = useRef<Retry>(NO_RETRY);
  useEffect(() => () => clearTimeout(retry.current.timer), []);

  // The press that closes it by light dismiss, while it is open:
  // - On another control, outside both the popover and the element focus returns to: focus stays
  //   with that control. Safari does not focus a pressed button, and the focus left on <body> would
  //   otherwise go back to the trigger.
  // - On the element focus returns to (the trigger, pressed to close it): focus goes back to it,
  //   wherever the press moved it (see restoreFocus).
  // It only speaks for the close that this press causes. Every press decides it afresh, and a key
  // press, a press released inside the panel or cancelled, the popover showing, or a close that has
  // been handled clears it: none of those leaves a light dismiss for it to speak for.
  const lastPress = useRef<Press>('none');
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const { target } = event;
      const home = latest.current.restoreFocusTo?.();
      if (!(target instanceof Node) || (ref.current?.contains(target) ?? false)) {
        lastPress.current = 'none';
      } else if (home?.contains(target)) {
        lastPress.current = 'home';
      } else {
        lastPress.current = isInsideControl(target) ? 'elsewhere' : 'none';
      }
    };
    const clear = () => {
      lastPress.current = 'none';
    };
    // A press released inside the panel, or cancelled, light-dismisses nothing.
    const onPointerUp = (event: PointerEvent) => {
      const { target } = event;
      if (target instanceof Node && (ref.current?.contains(target) ?? false)) clear();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', clear, true);
    document.addEventListener('keydown', clear, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', clear, true);
      document.removeEventListener('keydown', clear, true);
    };
  }, [open, ref]);

  // Runs after every render: the DOM follows `open`, whatever closed or opened it last.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.isConnected) return;
    // The browser refuses to show or hide a popover while it is showing or hiding another one, for
    // example when a focus handler opens one inside the browser's hide of another. Throwing here
    // would unmount the whole React root, so the change is tried once more on the next task, once
    // the browser has finished. Refused again, it is given up: the parent hears the state that the
    // popover is really in, so a trigger's `aria-expanded` never says open while nothing shows.
    const run = (action: Action, opening = false) => {
      const retried = retry.current.action === action;
      clearTimeout(retry.current.timer);
      retry.current = NO_RETRY;
      try {
        if (action === 'show') el.showPopover();
        else el.hidePopover();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'InvalidStateError')) throw error;
        if (!retried) {
          retry.current = { action, opening, timer: setTimeout(forceRender, 0) };
          return;
        }
        devWarn(REFUSED);
        latest.current.onOpenChange(isShowing(el));
        return;
      }
      if (opening) latest.current.onShown?.();
    };
    // A retry that `open` has turned around since is dropped.
    if (retry.current.action !== null && retry.current.action !== (open ? 'show' : 'hide')) {
      clearTimeout(retry.current.timer);
      retry.current = NO_RETRY;
    }
    if (open) {
      // On the retry, `wasOpen` already says open: the first try knew whether this was the opening.
      const opening = retry.current.action === 'show' ? retry.current.opening : !wasOpen.current;
      if (!isShowing(el)) {
        lastPress.current = 'none';
        run('show', opening);
      }
    } else if (wasOpen.current || retry.current.action === 'hide') {
      // Focus leaves first, so the browser's own hide has no focus inside the popover to move.
      restoreFocus(el, lastPress.current, latest.current.restoreFocusTo);
      lastPress.current = 'none';
      if (isShowing(el)) run('hide');
    }
    wasOpen.current = open;
  });

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The browser's own close on Esc sends focus that is still inside back to where it was when the
    // popover opened. Safari does not focus a clicked button, so that can be the nearest focusable
    // element around the trigger, such as a dialog's panel, where `toggle` no longer moves it from.
    // As before the library's own hide, focus leaves first.
    const onBeforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== 'closed' || !latest.current.open) return;
      restoreFocus(el, lastPress.current, latest.current.restoreFocusTo);
    };
    const onToggle = (event: Event) => {
      const nowOpen = (event as ToggleEvent).newState === 'open';
      const pending = latest.current.pendingToggle;
      const reported = pending?.current === nowOpen;
      if (pending) pending.current = null;
      if (nowOpen === latest.current.open) return;
      if (!nowOpen) restoreFocus(el, lastPress.current, latest.current.restoreFocusTo);
      if (!reported) latest.current.onOpenChange(nowOpen);
      // A controlled parent that keeps the old value does not re-render; this render resyncs the DOM.
      forceRender();
    };
    el.addEventListener('beforetoggle', onBeforeToggle);
    el.addEventListener('toggle', onToggle);
    // An element inside the closed popover that something else returns focus to, such as the item
    // that opened a dialog, hands focus on to where the popover returns it.
    const unregister = registerPopoverReturn(el, () => latest.current.restoreFocusTo?.());
    return () => {
      el.removeEventListener('beforetoggle', onBeforeToggle);
      el.removeEventListener('toggle', onToggle);
      unregister();
    };
  }, [ref]);
}
