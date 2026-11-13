import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_VIEWPORT, viewportFromTags } from '../../scripts/lib/viewport-tag';

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
        // A story tagged `viewport-<width>x<height>` is shot at that size (a phone, say); the others at
        // the 1280x720 of the config. Set before the page loads, so the first layout is already right.
        const viewport = viewportFromTags(story.tags);
        await page.setViewportSize(viewport);
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
        const hovered = (await hover.count()) > 0;
        // A story that must be shot while something is being dragged marks the thing to press with
        // `data-visual-drag="dx,dy"`. A drag cannot be left half done from a play function either: the
        // pointer events it sends are synthetic, and a synthetic press cannot capture the pointer. So
        // the harness presses the real mouse on the middle of the element, moves it `dx`, `dy` pixels
        // in five steps, lets two frames pass for what the drag changes to settle, and shoots with the
        // button still down. It does the same wait for the render to finish as the hover does, and a
        // story uses one of the two attributes, never both: the mouse is only in one place.
        const dragMark = stage.locator('[data-visual-drag]').first();
        const dragged = (await dragMark.count()) > 0;
        if (hovered && dragged) {
          throw new Error(`${story.id} has both data-visual-hover and data-visual-drag.`);
        }
        // A story shot at a size of its own (`viewportFromTags` hands back the default itself when
        // there is no tag) may reach its look in the play function, as a sheet that the play function
        // opens does, so its shot waits for the render to finish too. The tag came with the stories of
        // the AppShell, so no older baseline is shot any later than before.
        if (hovered || dragged || viewport !== DEFAULT_VIEWPORT) {
          await page.waitForFunction(renderFinished);
        }
        if (hovered) await hover.hover();
        if (dragged) {
          const [dx, dy] = ((await dragMark.getAttribute('data-visual-drag')) ?? '')
            .split(',')
            .map(Number);
          if (
            dx === undefined ||
            dy === undefined ||
            !Number.isFinite(dx) ||
            !Number.isFinite(dy)
          ) {
            throw new Error(`${story.id}: data-visual-drag must be "dx,dy", two numbers.`);
          }
          const box = await dragMark.boundingBox();
          if (!box) throw new Error(`${story.id}: the element of data-visual-drag has no box.`);
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          await page.mouse.move(x, y);
          await page.mouse.down();
          await page.mouse.move(x + dx, y + dy, { steps: 5 });
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
              ),
          );
        }
        // `data-visual-hover="tooltip"` says that what is hovered has a tooltip, which opens after its
        // delay (500ms): two shots taken before it opens would be the same, and would pass. So the shot
        // waits for a tooltip that is open (spec phase 5 §7).
        if (hovered && (await hover.getAttribute('data-visual-hover')) === 'tooltip') {
          await page.locator("[role='tooltip']:popover-open").waitFor();
        }
        await expect(stage).toHaveScreenshot(`${story.id}--${theme}--${mode.name}.png`);
      });
    }
  }
}
