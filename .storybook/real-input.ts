// Trusted keyboard and pointer input for play functions. A native <dialog> closes on Esc, and a
// popover closes on an outside press, only for input the browser trusts. Testing Library's userEvent
// dispatches synthetic events, which it ignores. Under `pnpm test:stories` the stories run in Vitest
// browser mode, whose userEvent drives Playwright, so its input is real. In the Storybook UI there is
// no such input, and this returns null: play functions skip the steps that need it.
import type { userEvent as vitestUserEvent } from 'vitest/browser';

export type RealUserEvent = typeof vitestUserEvent;

export async function realUserEvent(): Promise<RealUserEvent | null> {
  if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return null;
  const { userEvent } = await import('vitest/browser');
  return userEvent;
}

/** Waits for the element's enter animation, so measurements see where it really lands. */
export async function settled(el: Element): Promise<void> {
  await Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
