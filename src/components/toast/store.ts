import type { MouseEvent, ReactNode } from 'react';

export type ToastStatus = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  /** Runs on a click of the action button; the toast closes after it. */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastOptions {
  /** Names the toast: `toast()` with the same id updates it and starts its time again. */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Default `"info"`. */
  status?: ToastStatus;
  /** A button that runs `onClick`, then closes the toast. */
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
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | undefined;
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
  let state: ToastState = { toasts, shown: [] };
  let owner: object | null = null;
  const clocks = new Map<string, Clock>();
  const pauses = new Set<PauseReason>();
  const listeners = new Set<() => void>();

  const stop = (clock: Clock) => {
    if (clock.handle === undefined) return;
    clearTimeout(clock.handle);
    clock.handle = undefined;
    clock.remaining -= Date.now() - clock.startedAt;
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
        const duration = entry.duration ?? (entry.action ? Infinity : (config?.duration ?? 0));
        clock = { remaining: duration, startedAt: 0, handle: undefined };
        clocks.set(entry.id, clock);
      }
      if (!running) {
        stop(clock);
      } else if (clock.handle === undefined && Number.isFinite(clock.remaining)) {
        const id = entry.id;
        clock.startedAt = Date.now();
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
      config = next;
      sync();
      return () => {
        if (config !== next) return;
        config = null;
        sync();
      };
    },
    pause(reason: PauseReason) {
      pauses.add(reason);
      sync();
    },
    resume(reason: PauseReason) {
      if (!pauses.delete(reason)) return;
      sync();
    },
    /** Makes `token` the Toaster that shows the toasts, unless another one already is. */
    claim(token: object): boolean {
      if (owner !== null && owner !== token) return false;
      owner = token;
      return true;
    },
    release(token: object) {
      if (owner === token) owner = null;
    },
  };
}

export type ToastStore = ReturnType<typeof createToastStore>;

/** The page's toasts: one store for `toast()` and the Toaster. */
export const toastStore = createToastStore();
