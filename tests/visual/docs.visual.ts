import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Every docs page fits the docs column of Storybook at a window of 1280px, where the preview frame
 * is 980px wide (the sidebar takes the rest): the page never scrolls sideways. A long `code` that did
 * not wrap, in a table or a list, once made four pages scroll (TagInput's to 2014px). What is wider
 * than the frame is named in the failure, the outermost element of each branch.
 */

interface IndexEntry {
  id: string;
  type: 'story' | 'docs';
}

const INDEX = 'storybook-static/index.json';
if (!existsSync(INDEX)) throw new Error(`${INDEX} is missing. Run "pnpm build-storybook" first.`);
const docs = Object.values(
  (JSON.parse(readFileSync(INDEX, 'utf8')) as { entries: Record<string, IndexEntry> }).entries,
).filter((entry) => entry.type === 'docs');

const FRAME = { width: 980, height: 800 };

for (const entry of docs) {
  test(`${entry.id} · fits a frame of ${FRAME.width}px`, async ({ page }) => {
    await page.setViewportSize(FRAME);
    await page.goto(`/iframe.html?viewMode=docs&id=${entry.id}`);
    await page.locator('.sbdocs-content').first().waitFor();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    const found = await page.evaluate(() => {
      const root = document.scrollingElement!;
      const edge = root.clientWidth;
      const name = (element: Element) =>
        `${element.tagName.toLowerCase()}${
          typeof element.className === 'string' && element.className.trim()
            ? `.${element.className.trim().split(/\s+/)[0]}`
            : ''
        } "${(element.textContent ?? '').trim().slice(0, 50)}"`;
      const out = Array.from(document.querySelectorAll('.sbdocs-content *'))
        .filter((element) => {
          const parent = element.parentElement;
          return (
            element.getBoundingClientRect().right > edge + 1 &&
            !(parent && parent.getBoundingClientRect().right > edge + 1)
          );
        })
        .map(
          (element) => `${name(element)} to ${Math.round(element.getBoundingClientRect().right)}px`,
        );
      return { width: root.scrollWidth, edge, out };
    });
    expect(found.width, `wider than the frame: ${found.out.join('; ')}`).toBeLessThanOrEqual(
      found.edge,
    );
  });
}
