/**
 * The `subscribe` of a `useSyncExternalStore` whose value does not change once the page is there, or
 * that has nothing to listen to (a controlled theme): it listens to nothing. One function for every
 * such store, so the hooks that need one do not each write their own.
 */
export function noSubscription(): () => void {
  return () => {};
}
