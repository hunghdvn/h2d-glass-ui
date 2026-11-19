import { useCallback, useRef, useSyncExternalStore } from 'react';
import { noSubscription } from './no-subscription';
import { isThemeValue } from './theme-value';
import type { ThemeValue } from './theme-value';
import { useWriteOnCommit } from './use-write-on-commit';

/** The attribute of `<html>` that the theme of the library is chosen by. */
const ATTRIBUTE = 'data-flg-theme';

/**
 * Puts the theme on `<html>`: `light` and `dark` as the attribute, `system` as no attribute, which
 * leaves the choice to `prefers-color-scheme` (the CSS of the library does that through
 * `:root:not([data-flg-theme])`).
 */
export function applyTheme(value: ThemeValue): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (value === 'light' || value === 'dark') root.setAttribute(ATTRIBUTE, value);
  else root.removeAttribute(ATTRIBUTE);
}

/** `localStorage`, or `null` where reaching it throws (blocked site data, some private windows). */
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStored(key: string): ThemeValue | undefined {
  try {
    const stored = storage()?.getItem(key);
    return isThemeValue(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

function writeStored(key: string, value: ThemeValue): void {
  try {
    storage()?.setItem(key, value);
  } catch {
    // The choice lives in the page until it is closed; there is nowhere to keep it longer.
  }
}

/** What `<html>` says: a page that `ThemeScript` or a stylesheet of its own has set up. */
function readAttribute(): ThemeValue | undefined {
  const attribute = document.documentElement.getAttribute(ATTRIBUTE);
  return attribute === 'light' || attribute === 'dark' ? attribute : undefined;
}

interface ThemeStore {
  /** `undefined` until the first subscriber has read it. */
  value: ThemeValue | undefined;
  listeners: Set<() => void>;
}

/** One store for each `storageKey`: the consumers of a key agree with each other, and only they. */
const stores = new Map<string, ThemeStore>();

/**
 * The store of `key`, made the first time it is asked for. It lives as long as the page, and so does
 * its listener of `storage` events: while no ThemeSwitch or ThemeMenuGroup is mounted (a route
 * without the header), the store and `<html>` still follow the other tabs, and the next consumer
 * renders the theme they chose from its first render.
 */
function storeFor(key: string): ThemeStore {
  let store = stores.get(key);
  if (!store) {
    const made: ThemeStore = { value: undefined, listeners: new Set() };
    window.addEventListener('storage', (event) => {
      // Another tab changed the key, removed it (`newValue` is `null`) or cleared everything
      // (`key` is `null`); the last two leave nothing to follow, which is the system's choice, as
      // `ThemeScript` reads it. Not the changes of `sessionStorage`, which has the same keys.
      if (event.key !== null && event.key !== key) return;
      if (event.storageArea && event.storageArea !== storage()) return;
      const next = isThemeValue(event.newValue) ? event.newValue : 'system';
      if (next === made.value) return;
      update(made, next);
    });
    store = made;
    stores.set(key, store);
  }
  return store;
}

/** Shows `value` to every consumer and puts it on `<html>`. It does not write: that is a choice. */
function update(store: ThemeStore, value: ThemeValue): void {
  store.value = value;
  applyTheme(value);
  for (const listener of store.listeners) listener();
}

/**
 * Reads what the page holds, when the first consumer of a key is there: what the user stored, else
 * what `<html>` says, else the default of that consumer. The result goes on `<html>`, so a page
 * without `ThemeScript` shows the stored theme from the first effect on (and flashes once). It is
 * read again when a consumer comes after all of them had gone: a write of this very page does not
 * send it a `storage` event.
 */
function load(store: ThemeStore, key: string, defaultValue: ThemeValue): void {
  store.value = readStored(key) ?? readAttribute() ?? defaultValue;
  applyTheme(store.value);
}

function attach(key: string, defaultValue: ThemeValue, listener: () => void): () => void {
  const store = storeFor(key);
  store.listeners.add(listener);
  if (store.listeners.size === 1) load(store, key, defaultValue);
  return () => {
    store.listeners.delete(listener);
  };
}

export interface ThemeValueOptions {
  /** The value of a parent that owns it; without it the value is the store's. */
  value: ThemeValue | undefined;
  /** What the server renders, and what is shown until the stored value is read. */
  defaultValue: ThemeValue;
  /** Called with the value that was chosen. */
  onValueChange: ((value: ThemeValue) => void) | undefined;
  storageKey: string;
}

/**
 * The theme, for a `ThemeSwitch` or a `ThemeMenuGroup`, and the function that sets it.
 *
 * Uncontrolled, it is the store of `storageKey`: on the server and while hydrating it is
 * `defaultValue`, so the markup agrees with the server's; the first effect reads `localStorage`
 * (once, for all the consumers of the key) and every later choice is written to it, put on `<html>`
 * and shown to all of them. Controlled, it is `value` and a choice is only reported: `localStorage`
 * and `<html>` belong to the parent then (next-themes, a store of the application).
 */
export function useThemeValue({
  value,
  defaultValue: defaultProp,
  onValueChange,
  storageKey,
}: ThemeValueOptions): [ThemeValue, (next: ThemeValue) => void] {
  const controlled = value !== undefined;
  // A default that is none of the three (from JavaScript, or through a cast) is System, the default
  // of the prop, as a controlled value outside the union is the default: the store would show it
  // with no name and write it to `localStorage`.
  const defaultValue = isThemeValue(defaultProp) ? defaultProp : 'system';
  // The default of the last commit, which a subscription made in a later effect reads.
  const latestDefault = useRef(defaultValue);
  useWriteOnCommit(() => {
    latestDefault.current = defaultValue;
  });

  const subscribe = useCallback(
    (listener: () => void) =>
      controlled ? noSubscription() : attach(storageKey, latestDefault.current, listener),
    [controlled, storageKey],
  );
  // A controlled value that is none of the three is the default, as for the other values of a prop.
  const getSnapshot = () =>
    controlled
      ? isThemeValue(value)
        ? value
        : defaultValue
      : (stores.get(storageKey)?.value ?? defaultValue);
  const current = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);

  const setValue = useCallback(
    (next: ThemeValue) => {
      if (controlled) {
        onValueChange?.(next);
        return;
      }
      const store = storeFor(storageKey);
      if ((store.value ?? defaultValue) === next) return;
      writeStored(storageKey, next);
      update(store, next);
      onValueChange?.(next);
    },
    [controlled, storageKey, defaultValue, onValueChange],
  );

  return [current, setValue];
}
