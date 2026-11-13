// The platform a story runs on. A key is drawn as ⌘K on Apple and as Ctrl K elsewhere, and the library
// asks the browser which it is (`internal/platform.ts`: `navigator.userAgentData.platform`, then
// `navigator.platform`). The baselines are shot on Linux, but a developer runs the stories on a Mac, so
// every story that is about a key says which platform it is, whichever machine it runs on.
/** What a Mac says, in the two places the library asks. */
const APPLE = { platform: 'MacIntel', userAgentData: { platform: 'macOS' } } as const;
/** What a Linux machine says; `userAgentData` is `undefined`, as in the engines that have none. */
const OTHER = { platform: 'Linux x86_64', userAgentData: undefined } as const;

/**
 * A `beforeEach` for a story: shadows `navigator.platform` and `navigator.userAgentData` on the
 * `navigator` instance, which a story cannot assign to (the properties are getters of the prototype),
 * and returns the cleanup that deletes both shadows, so the story that follows starts on the real
 * platform. Both are shadowed on both sides: an engine that has `userAgentData` would otherwise say
 * "Linux" through it to a story that asks for a Mac, and the other way round.
 *
 * ```ts
 * beforeEach: onPlatform('apple'),
 * ```
 */
export function onPlatform(kind: 'apple' | 'other'): () => () => void {
  const shadow = kind === 'apple' ? APPLE : OTHER;
  return () => {
    for (const [name, value] of Object.entries(shadow)) {
      Object.defineProperty(navigator, name, { configurable: true, value });
    }
    return () => {
      for (const name of Object.keys(shadow))
        delete (navigator as unknown as Record<string, unknown>)[name];
    };
  };
}
