import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

interface IndexEntry {
  id: string;
  type: 'story' | 'docs';
  tags?: string[];
}

const INDEX = 'storybook-static/index.json';
if (!existsSync(INDEX)) throw new Error(`${INDEX} is missing. Run "pnpm build-storybook" first.`);
const entries = (JSON.parse(readFileSync(INDEX, 'utf8')) as { entries: Record<string, IndexEntry> })
  .entries;
const stories = Object.values(entries).filter(
  (entry) => entry.type === 'story' && !entry.tags?.includes('no-visual'),
);

const THEMES = ['light', 'dark'] as const;
const MODES = [
  { name: 'normal', simulate: 'none' },
  { name: 'solid', simulate: 'solid' },
  { name: 'contrast-more', simulate: 'none', media: { contrast: 'more' } },
  { name: 'forced-colors', simulate: 'none', media: { forcedColors: 'active' } },
  // Only for the stories that move without end: the same look as `normal`, with the motion stopped by
  // hand (spec phase 4 §3.3). Playwright's `animations: 'disabled'` cancels a repeating animation back
  // to its start, so without this pass nothing would show what a reduced-motion user sees.
  {
    name: 'reduced-motion',
    simulate: 'none',
    media: { reducedMotion: 'reduce' },
    onlyTagged: 'reduced-motion',
  },
] as const;

/** The part of Storybook's preview that says where the render of the story is. */
interface StorybookWindow {
  __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
}

/**
 * Whether the render of the story has finished. Storybook 10 sets `currentRender.phase` of its
 * preview to `finished` after the play function, the wait for animations and the `afterEach`
 * hooks, also when the play function threw. Runs in the page.
 */
const renderFinished = () =>
  (window as StorybookWindow).__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished';

for (const story of stories) {
  for (const theme of THEMES) {
    for (const mode of MODES) {
      if ('onlyTagged' in mode && !story.tags?.includes(mode.onlyTagged)) continue;
      test(`${story.id} · ${theme} · ${mode.name}`, async ({ page }) => {
        if ('media' in mode) await page.emulateMedia(mode.media);
        await page.goto(
          `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};simulate:${mode.simulate}`,
        );
        const stage = page.getByTestId('flg-stage');
        await stage.waitFor();
        // Avatars swap fallback for image when it loads; wait until every image has settled.
        await page.waitForFunction(() =>
          Array.from(document.images).every((image) => image.complete),
        );
        await expect(page.locator('[data-status="loading"]')).toHaveCount(0);
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        // A story that must be shot while the pointer is over something marks it with
        // `data-visual-hover`. `:hover` cannot be turned on from a play function, since the pointer
        // events it sends are synthetic and the browser's hover state ignores them, so the harness
        // moves the real mouse here, once Storybook says the render of the story has finished: the
        // play function of such a story may still be moving the focus when the page has loaded, and
        // the shot must show where it ends. Only the first such element is hovered, and each test has
        // a page of its own, so the mouse does not carry over to the next story. A story without the
        // attribute is shot exactly as before.
        const hover = stage.locator('[data-visual-hover]').first();
        if ((await hover.count()) > 0) {
          await page.waitForFunction(renderFinished);
          await hover.hover();
        }
        await expect(stage).toHaveScreenshot(`${story.id}--${theme}--${mode.name}.png`);
      });
    }
  }
}
