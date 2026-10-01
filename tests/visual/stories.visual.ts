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
] as const;

for (const story of stories) {
  for (const theme of THEMES) {
    for (const mode of MODES) {
      test(`${story.id} · ${theme} · ${mode.name}`, async ({ page }) => {
        if ('media' in mode) await page.emulateMedia(mode.media);
        await page.goto(
          `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};simulate:${mode.simulate}`,
        );
        const stage = page.getByTestId('flg-stage');
        await stage.waitFor();
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        await expect(stage).toHaveScreenshot(`${story.id}--${theme}--${mode.name}.png`);
      });
    }
  }
}
