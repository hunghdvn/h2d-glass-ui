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
