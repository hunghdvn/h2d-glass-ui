'use client';

import { clsx } from 'clsx';
import {
  Fragment,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

export interface ToasterProps {
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
}

function ToastItem({ entry, labels, register }: ToastItemProps) {
  const { id, status, action } = entry;
  return (
    <li
      ref={(el) => register(id, el)}
      // Focus goes to the toast itself when the one that held it closes.
      tabIndex={-1}
      className="flg-surface flg-toast"
      data-status={status}
      // An error is read at once from the assertive region instead (spec §6.3).
      aria-live={status === 'error' ? 'off' : undefined}
    >
      <span className="flg-toast-icon">
        {/* Named, so the status is not told by its colour alone. */}
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
            toastStore.dismiss(id);
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
  },
  ref,
) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [token] = useState<object>(() => ({}));
  const [active, setActive] = useState(false);
  const state = useSyncExternalStore(toastStore.subscribe, toastStore.getState, () => EMPTY);
  // A modal dialog makes the rest of the page inert, a popover of the page among it: the region
  // goes into the host of the modal on top, as a plain fixed element in the dialog's top layer.
  const modal = useSyncExternalStore(subscribeModals, getTopModal, noModal);
  const regionRef = useRef<HTMLElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, regionRef), [ref]);

  // The first Toaster to mount shows the toasts. Nothing renders on the server, or before this.
  useIsoLayoutEffect(() => {
    if (!toastStore.claim(token)) {
      devWarn(
        'More than one <Toaster> is mounted. Only the first shows toasts; this one renders nothing.',
      );
      return;
    }
    setActive(true);
    return () => {
      toastStore.release(token);
      setActive(false);
    };
  }, [token]);

  const config = useRef({ max, duration });
  useEffect(() => {
    config.current = { max, duration };
    toastStore.configure(config.current);
  }, [max, duration]);
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
    return () => {
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
    const region = regionRef.current;
    const gone = focused.current;
    if (region && gone !== null && !state.shown.some((entry) => entry.id === gone)) {
      focused.current = null;
      const index = before.findIndex((entry) => entry.id === gone);
      const next = state.shown[Math.min(index, state.shown.length - 1)];
      const el = next ? items.current.get(next.id) : undefined;
      const now = document.activeElement;
      // Unless the user had already moved focus somewhere else.
      if (now === null || now === document.body || region.contains(now)) {
        if (el) el.focus();
        else returnFocus(previous.current, region);
      }
    }
    // Focus that left with a closed toast no longer holds the time.
    if (region && !region.contains(document.activeElement)) {
      inside.current = false;
      toastStore.resume('focus');
    }
  }, [state.shown]);

  // The hotkey moves focus to the region, when there is a toast to go to.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const region = regionRef.current;
      if (event.key !== hotkey || hasModifier(event) || event.defaultPrevented || !region) return;
      if (toastStore.getState().shown.length === 0 || region.contains(document.activeElement)) {
        return;
      }
      event.preventDefault();
      region.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, hotkey]);

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    toastStore.pause('focus');
    if (!inside.current) {
      inside.current = true;
      previous.current = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
    }
    focused.current = toastAround(event.target);
  };
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    inside.current = false;
    focused.current = null;
    toastStore.resume('focus');
  };
  // Esc closes the toast that holds focus. Prevented, so a Dialog around the region stays open. An
  // Esc that something else already took, such as an open Tooltip, is left alone.
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    const id = toastAround(event.target);
    if (id === null) return;
    event.preventDefault();
    toastStore.dismiss(id);
  };

  if (!active) return null;
  const errors = state.shown.filter((entry) => entry.status === 'error');
  // The toasts that show are there as the region comes in, so a moved region does not read them again.
  const region = (
    // The region acts on what bubbles up from its toasts: Esc, and the pointer or focus that holds
    // the time. Its controls are the toasts' buttons.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      ref={mergedRef}
      popover={modal ? undefined : 'manual'}
      className={clsx('flg-toaster', className)}
      data-position={position}
      aria-label={`${labels.region} (${hotkey})`}
      tabIndex={-1}
      onPointerEnter={() => toastStore.pause('hover')}
      onPointerLeave={() => toastStore.resume('hover')}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <ol className="flg-toaster-list" aria-live="polite">
        {state.shown.map((entry) => (
          <ToastItem key={entry.id} entry={entry} labels={labels} register={register} />
        ))}
      </ol>
      <div className="flg-visually-hidden" aria-live="assertive" aria-atomic="true">
        {errors.map((entry) => (
          <Fragment key={entry.id}>
            <p>
              {labels.error}: {entry.title}
            </p>
            {entry.description == null ? null : <p>{entry.description}</p>}
          </Fragment>
        ))}
      </div>
    </section>
  );
  return modal ? createPortal(region, modal.host) : region;
});
