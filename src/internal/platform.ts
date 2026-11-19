import { useSyncExternalStore } from 'react';
import { noSubscription } from './no-subscription';

/** What `navigator.userAgentData` has, in the browsers that have it; not in the DOM typings yet. */
interface NavigatorWithUserAgentData {
  userAgentData?: { platform?: string };
}

/**
 * Whether the page runs on an Apple system, where the shortcut key is ⌘ and not Ctrl. It reads the
 * browser, which the server cannot, so a component calls it after it has mounted and shows the
 * server's text until then (spec phase 5 §3.5). The match ignores case: `userAgentData` says "macOS",
 * `navigator.platform` says "MacIntel".
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform =
    (navigator as NavigatorWithUserAgentData).userAgentData?.platform || navigator.platform || '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * Whether the page runs on an Apple system, or `undefined` while that is not known: on the server and
 * in the render that hydrates the HTML from it. The browser says it after that, so a text that
 * depends on it is the same on both and does not break the hydration (spec phase 5 §3.5).
 */
export function useApplePlatform(): boolean | undefined {
  return useSyncExternalStore(noSubscription, isApplePlatform, () => undefined);
}
