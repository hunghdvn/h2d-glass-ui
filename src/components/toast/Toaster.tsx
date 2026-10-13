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
import type { ReactNode } from 'react';
import { strokeIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
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

function ToastItem({ entry, labels }: { entry: ToastEntry; labels: ToasterLabels }) {
  const { id, status, action } = entry;
  return (
    <li
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
 * page the toasts are a manual popover, in the top layer above the page.
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

  // On the page the region is a manual popover, shown as soon as it mounts. A region that goes away
  // takes the pointer and focus with it.
  useIsoLayoutEffect(() => {
    const region = regionRef.current;
    if (!active || !region) return;
    if (typeof region.showPopover === 'function' && !region.matches(':popover-open')) {
      region.showPopover();
    }
    return () => {
      toastStore.resume('hover');
      toastStore.resume('focus');
    };
  }, [active]);

  // Focus that left with a closed toast (to <body>) no longer holds the time.
  useIsoLayoutEffect(() => {
    const region = regionRef.current;
    if (region && !region.contains(document.activeElement)) toastStore.resume('focus');
  }, [state.shown]);

  if (!active) return null;
  const errors = state.shown.filter((entry) => entry.status === 'error');
  return (
    <section
      ref={mergedRef}
      popover="manual"
      className={clsx('flg-toaster', className)}
      data-position={position}
      aria-label={`${labels.region} (${hotkey})`}
      tabIndex={-1}
      onPointerEnter={() => toastStore.pause('hover')}
      onPointerLeave={() => toastStore.resume('hover')}
      onFocus={() => toastStore.pause('focus')}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          toastStore.resume('focus');
        }
      }}
    >
      <ol className="flg-toaster-list" aria-live="polite">
        {state.shown.map((entry) => (
          <ToastItem key={entry.id} entry={entry} labels={labels} />
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
});
