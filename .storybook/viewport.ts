// Runs a play function at a size of the window. Layout that depends on the width of the window (the
// breakpoints of the AppShell) is proven in the real engines, and the iframe that Vitest runs a story
// in has a size of its own, so the story sets the one it needs. Under `pnpm test:stories` the size is
// set through Vitest's `page.viewport`; in the Storybook UI there is no way to resize the preview from
// a story, so `withViewport` returns `undefined` there without running anything and the story skips
// its checks, as the stories that need trusted input do (real-input.ts).

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Two frames: the layout of the new size is done and the observers of the page have run. */
export async function afterLayout(): Promise<void> {
  await nextFrame();
  await nextFrame();
}

export interface ViewportControl {
  /** Sets the size of the window and waits until the page has laid itself out at it. */
  set: (width: number, height?: number) => Promise<void>;
}

/**
 * Hands `run` a way to change the size of the window, and puts the window back as it was when `run`
 * ends, whatever happens, so the stories that follow are not shot at a size they did not ask for.
 */
export async function withViewport<T>(
  run: (viewport: ViewportControl) => Promise<T>,
): Promise<T | undefined> {
  if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return undefined;
  const { page } = await import('vitest/browser');
  const original = { width: window.innerWidth, height: window.innerHeight };
  const viewport: ViewportControl = {
    set: async (width, height = original.height) => {
      await page.viewport(width, height);
      await afterLayout();
    },
  };
  try {
    return await run(viewport);
  } finally {
    await page.viewport(original.width, original.height);
    await afterLayout();
  }
}
