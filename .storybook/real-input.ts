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

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Waits for the element's enter animation, and every other one inside it, so measurements see where
 * it really lands. A transition starts when the browser next resolves styles after the element shows,
 * which can come after this call: then there is nothing to wait for yet. Two frames on, styles have
 * been resolved and every transition has started, however slow the runner. Then it waits for the
 * running ones and looks again, since one may have started meanwhile (a submenu that opened) or been
 * cancelled. Endless ones, such as a spinner's, never finish and are left out.
 */
export async function settled(el: Element): Promise<void> {
  for (let round = 0; round < 10; round += 1) {
    await nextFrame();
    await nextFrame();
    const running = el
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation.playState === 'running' &&
          animation.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY,
      );
    if (running.length === 0) return;
    // A cancelled animation rejects; the next round looks at what runs instead.
    await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  }
}
