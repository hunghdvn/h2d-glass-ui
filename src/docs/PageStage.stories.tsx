import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

// This proves the Storybook stage `page` (.storybook/stage.css) that the app-shell stories rely on:
// a sticky header inside it sticks to the document, so the stage must not be a scroll container. The
// story is `no-visual`, since it checks layout, which a screenshot cannot say.
const meta = {
  title: 'Examples/Page stage',
  tags: ['no-visual'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const StickyHeaderSticksToTheDocument: Story = {
  parameters: { stage: 'page' },
  render: () => (
    <div>
      <header
        data-testid="header"
        style={{
          position: 'sticky',
          top: 0,
          height: 56,
          background: 'Canvas',
          color: 'CanvasText',
        }}
      >
        Header
      </header>
      <main style={{ height: 3000 }}>A page much taller than the window.</main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const stage = canvasElement.querySelector<HTMLElement>('[data-testid="flg-stage"]');
    const header = canvasElement.querySelector<HTMLElement>('[data-testid="header"]');
    if (!stage || !header) throw new Error('The stage and the header must exist.');
    const style = getComputedStyle(stage);
    await expect(stage.getAttribute('data-stage')).toBe('page');
    await expect(style.paddingTop).toBe('0px');
    await expect(style.display).toBe('block');
    await expect(style.overflowX).toBe('clip');
    await expect(style.overflowY).toBe('clip');
    await expect(parseFloat(style.minHeight)).toBeGreaterThanOrEqual(window.innerHeight);
    await expect(header.getBoundingClientRect().top).toBe(0);
    window.scrollTo(0, 400);
    // The window scrolled, and the header is still at its top edge.
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    await expect(header.getBoundingClientRect().top).toBe(0);
    window.scrollTo(0, 0);
  },
};

/** A story that does not ask for a stage keeps the default one. */
export const OtherStoriesKeepTheirStage: Story = {
  render: () => <p data-testid="plain">A story with the default stage.</p>,
  play: async ({ canvasElement }) => {
    const stage = canvasElement.querySelector<HTMLElement>('[data-testid="flg-stage"]');
    await expect(stage?.hasAttribute('data-stage')).toBe(false);
    await expect(getComputedStyle(stage!).overflowY).toBe('hidden');
  },
};
