'use client';

import { clsx } from 'clsx';
import {
  useCallback,
  forwardRef,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { FocusEvent, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { returnFocus } from '../../internal/focus';
import { strokeIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { getTopModal, subscribeModals } from '../../internal/modal-stack';
import { hasModifier } from '../../internal/roving';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import { toastStore } from './store';
import type { ToastEntry, ToastState, ToastStatus } from './store';

export type ToastPosition =
  'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

/** The words the Toaster says; translate them here. */
export interface ToasterLabels {
  /** The name of the region, before the hotkey. */
  region: string;
  /** The name of the close button. */
  dismiss: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export interface ToasterProps extends Omit<
  HTMLAttributes<HTMLElement>,
  // The library names the region, makes it a manual popover and focuses it from a script, so the
  // props that would change that are not part of the type.
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'aria-label'
  | 'aria-labelledby'
  | 'role'
  | 'popover'
  | 'tabIndex'
> {
  /** Where the toasts sit. Default `"bottom-center"`. */
  position?: ToastPosition;
  /** How many toasts show at once; the others wait for room. Default 3. */
  max?: number;
  /** How long a toast stays, in ms, when it sets no `duration`. Default 5000. */
  duration?: number;
  /** The key that moves focus to the toasts. Default `"F8"`. */
  hotkey?: string;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<ToasterLabels>;
  className?: string;
}

/** True for a target the user types into, or a descendant of one. */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !==
      null
  );
}

const DEFAULT_LABELS: ToasterLabels = {
  region: 'Notifications',
  dismiss: 'Dismiss notification',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const EMPTY: ToastState = { toasts: [], shown: [] };
const noModal = () => undefined;

const ICONS: Record<ToastStatus, ReactNode> = {
  success: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
};

interface ToastItemProps {
  entry: ToastEntry;
  labels: ToasterLabels;
  /** Keeps the toast's element, by id, for moving focus to it. */
  register: (id: string, el: HTMLLIElement | null) => void;
  /** The toast came along as the region moved, so it must not slide in again. */
  moved: boolean;
}

function ToastItem({ entry, labels, register, moved }: ToastItemProps) {
  const { id, status, action } = entry;
  // A stable ref callback keeps React from calling register with null on every render.
  const refCallback = useCallback((el: HTMLLIElement | null) => register(id, el), [id, register]);
  return (
    <li
      ref={refCallback}
      // Focus goes to the toast itself when the one that held it closes.
      tabIndex={-1}
      className="flg-surface flg-toast"
      data-status={status}
      // A newly inserted <li> replays its slide-in; one that moved with the region should not.
      data-moved={moved ? '' : undefined}
      // An error is read at once from the assertive region instead (spec §6.3).
      aria-live={status === 'error' ? 'off' : undefined}
    >
      <span className="flg-toast-icon">
        {/* Named, so the status is not told by its colour alone. */}
        {/* `aria-hidden` is left undefined: the icon carries its own name (`role="img"` +
            `aria-label`), so it must not be hidden from assistive tech. */}
        <svg {...strokeIcon} aria-hidden={undefined} role="img" aria-label={labels[status]}>
          {ICONS[status]}
        </svg>
      </span>
      <div className="flg-toast-text">
        <div className="flg-toast-title">{entry.title}</div>
        {entry.description == null ? null : (
          <div className="flg-toast-description">{entry.description}</div>
        )}
      </div>
      {action ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={(event) => {
            action.onClick(event);
            // The action closes the toast unless it said otherwise: it called preventDefault(), or it
            // replaced the toast by id, in which case the closing would take the new one away.
            const current = toastStore.getState().toasts.find((item) => item.id === id);
            if (!event.defaultPrevented && current === entry) toastStore.dismiss(id);
          }}
        >
          {action.label}
        </Button>
      ) : null}
      <button
        type="button"
        className="flg-toast-close"
        aria-label={labels.dismiss}
        onClick={() => toastStore.dismiss(id)}
      >
        <svg {...strokeIcon}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}

/**
 * Shows the toasts of `toast()`. Place one in the app; any other Toaster renders nothing. On the
 * page the toasts are a manual popover, in the top layer above the page. While a Dialog or Drawer of
 * the library is open, they move into it, so they can still be seen, clicked and read.
 */
export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
  {
    position = 'bottom-center',
    max = 3,
    duration = 5000,
    hotkey = 'F8',
    labels: labelsProp,
    className,
    onKeyDown: userKeyDown,
    onFocus: userFocus,
    onBlur: userBlur,
    ...props
  },
  ref,
) {
  // A label given as `undefined` keeps its default, which a plain spread would replace.
  const labels = { ...DEFAULT_LABELS };
  for (const key of Object.keys(DEFAULT_LABELS) as (keyof ToasterLabels)[]) {
    const value = labelsProp?.[key];
    if (value !== undefined) labels[key] = value;
  }
  const [token] = useState<object>(() => ({}));
  const [active, setActive] = useState(false);
  const state = useSyncExternalStore(toastStore.subscribe, toastStore.getState, () => EMPTY);
  // A modal dialog makes the rest of the page inert, a popover of the page among it: the region
  // goes into the host of the modal on top, as a plain fixed element in the dialog's top layer.
  const modal = useSyncExternalStore(subscribeModals, getTopModal, noModal);
  const regionRef = useRef<HTMLElement | null>(null);
  // The region is a new element each time the top modal changes. The toasts that a region has shown
  // for a task come with the new one at once; the others wait a task, so that a screen reader knows
  // the new live region before something is put in it. `rendered` is what the last commit showed;
  // `settled` is what a region has shown for at least a task. A library Dialog leaves the modal
  // stack in a layout effect, after the commit that put a toast into the old region, so what that
  // commit rendered is not yet known to a screen reader.
  const rendered = useRef<ReadonlySet<string>>(new Set());
  const settled = useRef<ReadonlySet<string>>(new Set());
  const moveRef = useRef<{
    modal: typeof modal;
    moved: Set<string>;
    holding: boolean;
  }>({ modal, moved: new Set(), holding: false });
  const [, release] = useReducer((n: number) => n + 1, 0);
  // The hold only ever depends on the last commit (`rendered`, `settled` and the ref are written
  // after one), so a render that React throws away and runs again works it out the same. The ref
  // takes it over only once a render has committed.
  const move = useMemo(
    () =>
      moveRef.current.modal === modal
        ? moveRef.current
        : {
            modal,
            moved: new Set([...rendered.current].filter((id) => settled.current.has(id))),
            holding: true,
          },
    [modal],
  );
  useIsoLayoutEffect(() => {
    moveRef.current = move;
  });
  const mergedRef = useMemo(() => mergeRefs(ref, regionRef), [ref]);
  // The newest toast sits nearest the edge, so at the top it is first on screen. The DOM follows the
  // screen, so that Tab does (WCAG 2.4.3), and so does the focus that moves on after a close.
  const newestFirst = position.startsWith('top');

  // The first Toaster to mount shows the toasts. Nothing renders on the server, or before this. One
  // that finds the claim taken waits, and takes over, in mount order, when the active one unmounts.
  useIsoLayoutEffect(() => {
    if (!toastStore.claim(token, () => setActive(true))) {
      devWarn(
        'More than one <Toaster> is mounted. Only the first shows toasts; this one renders nothing.',
      );
    } else {
      setActive(true);
    }
    return () => {
      toastStore.release(token);
      setActive(false);
    };
  }, [token]);

  const config = useRef({ max, duration });
  // Only the Toaster that shows configures the store: one that waits would push its own `max` and
  // `duration` over those of the Toaster on screen.
  useEffect(() => {
    config.current = { max, duration };
    if (active) toastStore.configure(config.current);
  }, [max, duration, active]);
  // A task after the empty region is in the page: a screen reader announces what changes in a live
  // region it already knows, so toasts shown before the Toaster mounted come in only then.
  useEffect(() => {
    if (!active) return;
    let detach: (() => void) | undefined;
    const timer = setTimeout(() => {
      detach = toastStore.attach(config.current);
    }, 0);
    return () => {
      clearTimeout(timer);
      detach?.();
    };
  }, [active]);

  // While the region is new, only the toasts the old region has shown for at least a task come
  // along with it: they are already there as the region comes in, so they are not read again;
  // the rest come in a task later.
  const visible = move.holding
    ? state.shown.filter((entry) => move.moved.has(entry.id))
    : state.shown;
  const onScreen = newestFirst ? [...visible].reverse() : visible;
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useIsoLayoutEffect(() => {
    const ids = active ? visible.map((entry) => entry.id) : [];
    // A render that shows the same toasts as the last one has nothing new to settle: the timer that
    // the last one queued still settles them.
    if (ids.length === rendered.current.size && ids.every((id) => rendered.current.has(id))) return;
    rendered.current = new Set(ids);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      settled.current = new Set(
        [...settled.current, ...ids].filter((id) => rendered.current.has(id)),
      );
    }, 0);
    timers.current.add(timer);
  });
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
    };
  }, []);
  useEffect(() => {
    if (!move.holding) return;
    const timer = setTimeout(() => {
      move.holding = false;
      release();
    }, 0);
    return () => clearTimeout(timer);
  }, [move]);

  // The time stands still while the page is hidden.
  useEffect(() => {
    if (!active) return;
    const update = () =>
      document.visibilityState === 'hidden'
        ? toastStore.pause('hidden')
        : toastStore.resume('hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      toastStore.resume('hidden');
    };
  }, [active]);

  const items = useRef(new Map<string, HTMLLIElement>());
  const register = useMemo(
    () => (id: string, el: HTMLLIElement | null) => {
      if (el) items.current.set(id, el);
      else items.current.delete(id);
    },
    [],
  );
  /** The toast that holds focus, and where focus was before it came into the region. */
  const focused = useRef<string | null>(null);
  const previous = useRef<HTMLElement | null>(null);
  // Focus that moves on from a removed toast comes from nowhere (no `relatedTarget`), yet it never
  // left the region: whether focus is in the region is kept here, not read off the event.
  const inside = useRef(false);
  // With nowhere to go back to, focus goes to the body, not to stay on an empty region.
  const giveFocusBack = (region: HTMLElement) => {
    returnFocus(previous.current, region);
    if (document.activeElement === region) region.blur();
  };
  const toastAround = (target: EventTarget | null) => {
    for (const [id, el] of items.current) if (el.contains(target as Node | null)) return id;
    return null;
  };

  // On the page the region is a manual popover, shown as soon as it mounts, again each time it comes
  // back from a modal. A region that goes away takes the pointer and focus with it.
  useIsoLayoutEffect(() => {
    const region = regionRef.current;
    if (!active || !region) return;
    if (
      region.hasAttribute('popover') &&
      typeof region.showPopover === 'function' &&
      !region.matches(':popover-open')
    ) {
      region.showPopover();
    }
    // The pointer is read off the element, not from React's onPointerLeave: React derives that from
    // `pointerout`, which Firefox does not send for a toast that is removed under the pointer, so
    // the hover pause would never end.
    const enter = () => toastStore.pause('hover');
    const leave = () => toastStore.resume('hover');
    region.addEventListener('pointerenter', enter);
    region.addEventListener('pointerleave', leave);
    return () => {
      region.removeEventListener('pointerenter', enter);
      region.removeEventListener('pointerleave', leave);
      inside.current = false;
      toastStore.resume('hover');
      toastStore.resume('focus');
    };
  }, [active, modal]);

  // A closed toast that held focus hands it to the toast that takes its place, else the one before
  // it; with none left, focus goes back to where it was before it came into the region (spec §6.3).
  const shownBefore = useRef(state.shown);
  useIsoLayoutEffect(() => {
    const before = shownBefore.current;
    shownBefore.current = state.shown;
    // A toast that has left is no longer a moved one: a new toast that reuses its id must slide in.
    const { moved } = moveRef.current;
    for (const id of moved) if (!state.shown.some((entry) => entry.id === id)) moved.delete(id);
    const region = regionRef.current;
    const gone = focused.current;
    if (region && gone !== null && !state.shown.some((entry) => entry.id === gone)) {
      focused.current = null;
      // In the order of the screen: the toast that takes its place, else the one before it.
      const order = (list: readonly ToastEntry[]) => (newestFirst ? [...list].reverse() : list);
      const index = order(before).findIndex((entry) => entry.id === gone);
      const after = order(state.shown);
      const next = after[Math.min(index, after.length - 1)];
      const el = next ? items.current.get(next.id) : undefined;
      const now = document.activeElement;
      // Unless the user had already moved focus somewhere else.
      if (now === null || now === document.body || region.contains(now)) {
        if (el) el.focus();
        else giveFocusBack(region);
      }
    } else if (region && state.shown.length === 0 && document.activeElement === region) {
      // Focus on the region itself, such as after the hotkey, must not stay on an empty region.
      giveFocusBack(region);
    }
    // Focus that left with a closed toast no longer holds the time.
    // That includes the toast it was on: nothing blurred, so `focused` is not cleared by a blur.
    if (region && !region.contains(document.activeElement)) {
      inside.current = false;
      focused.current = null;
      toastStore.resume('focus');
    }
  }, [state.shown]);

  // The hotkey moves focus to the region, when there is a toast to go to.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const region = regionRef.current;
      if (
        typeof event.key !== 'string' ||
        event.key !== hotkey ||
        hasModifier(event) ||
        event.isComposing ||
        event.defaultPrevented ||
        !region
      )
        return;
      // A letter hotkey must not eat what the user types; a named key such as F8 is no text.
      if (hotkey.length === 1 && isEditable(event.target)) return;
      if (toastStore.getState().shown.length === 0 || region.contains(document.activeElement)) {
        return;
      }
      event.preventDefault();
      region.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, hotkey]);

  // Focus holds the time only when it is keyboard focus: a click into a toast, which does not match
  // `:focus-visible`, would otherwise hold it for good, since focus moves on to the next toast
  // after a close and the pointer has long left. The pointer has its own pause. Where the
  // selector is not supported the focus counts as keyboard focus, the safe side for a reader.
  const isKeyboardFocus = (target: EventTarget) => {
    try {
      return !(target instanceof Element) || target.matches(':focus-visible');
    } catch {
      return true;
    }
  };
  // The focus handlers run after the user's even when it prevented the event: they keep the time
  // and the way back for Esc, which are not optional behaviour. Only a key is the user's to claim.
  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    if (isKeyboardFocus(event.target)) toastStore.pause('focus');
    else toastStore.resume('focus');
    if (!inside.current) {
      inside.current = true;
      previous.current = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
    }
    focused.current = toastAround(event.target);
  };
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    // Switching to another window blurs with no `relatedTarget` while focus stays in the page's
    // memory; it is no move out of the region, and `previous` must survive it.
    if (event.relatedTarget === null && !document.hasFocus()) return;
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    inside.current = false;
    focused.current = null;
    toastStore.resume('focus');
  };
  // Esc closes the toast that holds focus; on the region itself it hands focus back to where it
  // came from. Prevented either way, so a Dialog around the region stays open. An Esc that
  // something else already took, such as an open Tooltip, is left alone.
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (event.target === event.currentTarget) {
      event.preventDefault();
      giveFocusBack(event.currentTarget);
      return;
    }
    const id = toastAround(event.target);
    if (id === null) return;
    event.preventDefault();
    toastStore.dismiss(id);
  };

  if (!active) return null;
  const errors = visible.filter((entry) => entry.status === 'error');
  const region = (
    // The region acts on what bubbles up from its toasts: Esc, and the pointer or focus that holds
    // the time. Its controls are the toasts' buttons.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      ref={mergedRef}
      {...props}
      // Not in the type, but plain JS can pass them: they would replace what the library sets.
      role={undefined}
      aria-labelledby={undefined}
      popover={modal ? undefined : 'manual'}
      className={clsx('flg-toaster', className)}
      data-position={position}
      aria-label={`${labels.region} (${hotkey})`}
      tabIndex={-1}
      onFocus={(event) => {
        userFocus?.(event);
        handleFocus(event);
      }}
      onBlur={(event) => {
        userBlur?.(event);
        handleBlur(event);
      }}
      onKeyDown={composeEventHandlers(userKeyDown, handleKeyDown)}
    >
      <ol className="flg-toaster-list" aria-live="polite">
        {onScreen.map((entry) => (
          <ToastItem
            key={entry.id}
            entry={entry}
            labels={labels}
            register={register}
            moved={move.moved.has(entry.id)}
          />
        ))}
      </ol>
      {/* Each error is atomic, not the whole region: a new error announces only itself, and an
          updated one is read whole. */}
      <div className="flg-visually-hidden" aria-live="assertive">
        {errors.map((entry) => (
          <div key={entry.id} aria-atomic="true">
            <div>
              {labels.error}: {entry.title}
            </div>
            {entry.description == null ? null : <div>{entry.description}</div>}
          </div>
        ))}
      </div>
    </section>
  );
  return modal ? createPortal(region, modal.host) : region;
});
