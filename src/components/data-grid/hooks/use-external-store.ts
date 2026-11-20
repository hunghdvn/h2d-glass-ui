import { useSyncExternalStore } from 'react';

/**
 * A value that one writer sets and a few parts read, outside what the rows read: a part that reads it
 * draws again for each change, and nothing that does not read it does. `null` while there is nothing
 * to say (no drag is in flight).
 */
export interface ExternalStore<T> {
  get(): T | null;
  set(next: T | null): void;
  subscribe(listener: () => void): () => void;
}

/** One store for one grid. */
export function createExternalStore<T>(): ExternalStore<T> {
  let current: T | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(next) {
      current = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

const NONE = () => null;

/** What the store holds, `null` when it holds nothing (and on the server). */
export function useExternalStore<T>(store: ExternalStore<T>): T | null {
  return useSyncExternalStore(store.subscribe, store.get, NONE);
}
