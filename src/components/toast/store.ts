import type { MouseEvent, ReactNode } from 'react';
import { devWarn } from '../../internal/warn';

export type ToastStatus = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  /**
   * Runs on a click of the action button; the toast closes after it, unless `onClick` calls
   * `event.preventDefault()` or replaces the toast by its id.
   */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastOptions {
  /** Names the toast: `toast()` with the same id updates it and starts its time again. */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Default `"info"`. */
  status?: ToastStatus;
  /** A button that runs `onClick`, then closes the toast unless `onClick` says otherwise. */
  action?: ToastAction;
  /**
   * How long it stays, in ms; `Infinity` keeps it until it is closed. Default: the Toaster's
   * `duration`, or `Infinity` for a toast with an `action`.
   */
  duration?: number;
}

/** A toast as the store holds it. */
export interface ToastEntry {
  readonly id: string;
  readonly title: ReactNode;
  readonly description: ReactNode | undefined;
  readonly status: ToastStatus;
  readonly action: ToastAction | undefined;
  readonly duration: number | undefined;
}

/** What the mounted Toaster asks for. */
export interface ToasterConfig {
  /** How many toasts show at once; the others wait. */
  max: number;
  /** The time of a toast that sets none, in ms. */
  duration: number;
}

export interface ToastState {
  /** Every toast, oldest first: the ones shown, then the ones waiting for room. */
  readonly toasts: readonly ToastEntry[];
  /** The first `max` toasts, while a Toaster shows them; none while no Toaster does. */
  readonly shown: readonly ToastEntry[];
}

/** Why the time of the toasts stands still: the pointer, focus, or the page being hidden. */
export type PauseReason = 'hover' | 'focus' | 'hidden';

interface Clock {
  /** Time left, in ms, as of `startedAt` while running. */
  remaining: number;
  /**
   * When it last ran, by `performance.now()`: a monotonic clock, so a change of the system clock
   * (a sleep, a correction) does not shorten or stretch the time of a toast.
   */
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | undefined;
}

/** The longest delay setTimeout can count, in ms (2^31 - 1). */
const MAX_TIMEOUT = 2147483647;

const DEFAULT_MAX = 3;
const DEFAULT_DURATION = 5000;

/** A time that can run: a positive number, `Infinity` included. */
const isTime = (value: unknown): value is number => typeof value === 'number' && value > 0;

/**
 * What a Toaster asks for, made usable. The library never throws on misuse: a wrong value is
 * replaced and named in a development warning, since a `max` of 0 or less shows nothing and a
 * `duration` of 0 or NaN closes every toast at once.
 */
function checked(next: ToasterConfig): ToasterConfig {
  let { max, duration } = next;
  if (typeof max !== 'number' || Number.isNaN(max)) {
    devWarn(
      `<Toaster max> must be an integer of at least 1; got ${String(max)}. Using ${DEFAULT_MAX}.`,
    );
    max = DEFAULT_MAX;
  } else if (max < 1 || (max !== Infinity && !Number.isInteger(max))) {
    const fixed = Math.max(1, Math.floor(max));
    devWarn(`<Toaster max> must be an integer of at least 1; got ${String(max)}. Using ${fixed}.`);
    max = fixed;
  }
  if (!isTime(duration)) {
    devWarn(
      `<Toaster duration> must be a positive number of ms; got ${String(duration)}. Using ${DEFAULT_DURATION}.`,
    );
    duration = DEFAULT_DURATION;
  }
  return max === next.max && duration === next.duration ? next : { max, duration };
}

const sameList = (a: readonly ToastEntry[], b: readonly ToastEntry[]) =>
  a.length === b.length && a.every((entry, index) => entry === b[index]);

/**
 * The toasts of the page, kept apart from React so `toast()` works anywhere and before a Toaster
 * mounts. Only a toast that shows has a running time: one waiting for room starts when it shows.
 */
export function createToastStore() {
  let toasts: readonly ToastEntry[] = [];
  let config: ToasterConfig | null = null;
  /** The current `attach()` call, so a stale detach does nothing. */
  let attachment: object | null = null;
  let state: ToastState = { toasts, shown: [] };
  let owner: object | null = null;
  /** The Toasters that asked for the claim while another held it, in mount order. */
  let waiting: { token: object; onGranted: () => void }[] = [];
  const clocks = new Map<string, Clock>();
  const pauses = new Set<PauseReason>();
  const listeners = new Set<() => void>();

  const stop = (clock: Clock) => {
    if (clock.handle === undefined) return;
    clearTimeout(clock.handle);
    clock.handle = undefined;
    clock.remaining -= performance.now() - clock.startedAt;
  };

  const sync = () => {
    const shown = config ? toasts.slice(0, config.max) : [];
    const running = config !== null && pauses.size === 0;
    for (const [id, clock] of clocks) {
      if (!toasts.some((entry) => entry.id === id)) {
        stop(clock);
        clocks.delete(id);
      }
    }
    for (const entry of toasts) {
      let clock = clocks.get(entry.id);
      if (!shown.includes(entry)) {
        if (clock) stop(clock);
        continue;
      }
      if (!clock) {
        let own = entry.duration;
        if (own !== undefined && !isTime(own)) {
          devWarn(
            `toast() duration must be a positive number of ms; got ${String(own)}. Using the Toaster's time.`,
          );
          // Not the `Infinity` of an action: a time was asked for, only not given right.
          own = config?.duration;
        }
        const wanted = own ?? (entry.action ? Infinity : (config?.duration ?? 0));
        // A longer time overflows setTimeout, which then fires at once: it means "forever".
        const duration = wanted > MAX_TIMEOUT ? Infinity : wanted;
        clock = { remaining: duration, startedAt: 0, handle: undefined };
        clocks.set(entry.id, clock);
      }
      if (!running) {
        stop(clock);
      } else if (clock.handle === undefined && Number.isFinite(clock.remaining)) {
        const id = entry.id;
        clock.startedAt = performance.now();
        clock.handle = setTimeout(() => dismiss(id), Math.max(0, clock.remaining));
      }
    }
    if (sameList(state.toasts, toasts) && sameList(state.shown, shown)) return;
    state = { toasts, shown };
    for (const listener of listeners) listener();
  };

  /** Adds a toast, or updates the one with the same id in place and starts its time again. */
  const add = (entry: ToastEntry) => {
    const index = toasts.findIndex((item) => item.id === entry.id);
    if (index < 0) {
      toasts = [...toasts, entry];
    } else {
      const clock = clocks.get(entry.id);
      if (clock) stop(clock);
      clocks.delete(entry.id);
      toasts = toasts.map((item, at) => (at === index ? entry : item));
    }
    sync();
  };

  /** Closes one toast, or every toast without an id. */
  const dismiss = (id?: string) => {
    const next = id === undefined ? [] : toasts.filter((entry) => entry.id !== id);
    if (next.length === toasts.length) return;
    toasts = next;
    sync();
  };

  return {
    add,
    dismiss,
    getState: () => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Shows the toasts as `next` says. The returned function hides them again. */
    attach(next: ToasterConfig): () => void {
      const self = {};
      attachment = self;
      config = checked(next);
      sync();
      return () => {
        if (attachment !== self) return;
        attachment = null;
        config = null;
        sync();
      };
    },
    /** Changes what the attached Toaster asks for, without hiding the toasts in between. */
    configure(next: ToasterConfig) {
      if (attachment === null) return;
      config = checked(next);
      sync();
    },
    pause(reason: PauseReason) {
      pauses.add(reason);
      sync();
    },
    resume(reason: PauseReason) {
      if (!pauses.delete(reason)) return;
      sync();
    },
    /**
     * Makes `token` the Toaster that shows the toasts, unless another one already is. Then it waits
     * its turn, in mount order, and `onGranted` runs when the claim is handed to it.
     */
    claim(token: object, onGranted: () => void): boolean {
      if (owner === null || owner === token) {
        owner = token;
        return true;
      }
      if (!waiting.some((item) => item.token === token)) waiting.push({ token, onGranted });
      return false;
    },
    /** Gives the claim up, to the Toaster that waited longest; a Toaster that waits is dropped. */
    release(token: object) {
      if (owner !== token) {
        waiting = waiting.filter((item) => item.token !== token);
        return;
      }
      const next = waiting.shift();
      owner = next?.token ?? null;
      next?.onGranted();
    },
  };
}

export type ToastStore = ReturnType<typeof createToastStore>;

/** The page's toasts: one store for `toast()` and the Toaster. */
export const toastStore = createToastStore();
