import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Surface } from './Surface';

const meta = {
  title: 'Foundation/Surface',
  component: Surface,
  args: { children: 'Glass surface', style: { padding: 18, width: 320 } },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsSection: Story = {
  args: { asChild: true, children: <section aria-label="Profile">Rendered as a section</section> },
};

/** Review Focus 1: a dark subtree inside a light page derives its own glass filter. */
export const NestedTheme: Story = {
  globals: { theme: 'light' },
  render: (args) => (
    <Surface {...args}>
      Outer light surface
      <div data-flg-theme="dark" data-testid="nested" style={{ marginTop: 13 }}>
        <Surface style={{ padding: 18 }}>Inner dark surface</Surface>
      </div>
    </Surface>
  ),
  play: async ({ canvas }) => {
    const nested = getComputedStyle(canvas.getByTestId('nested'));
    await expect(nested.getPropertyValue('--flg-glass-blur').trim()).toBe('24px');
    await expect(nested.getPropertyValue('--flg-glass-filter').replace(/\s+/g, ' ').trim()).toBe(
      'blur(24px) saturate(130%)',
    );
  },
};

/** Review Focus 3: the solid fallback also reaches a nested theme subtree. */
export const SolidFallback: Story = {
  globals: { theme: 'light', simulate: 'solid' },
  render: (args) => (
    <Surface {...args}>
      Solid fallback
      <div data-flg-theme="dark" data-testid="nested" style={{ marginTop: 13 }}>
        <Surface style={{ padding: 18 }}>Nested dark, also solid</Surface>
      </div>
    </Surface>
  ),
  play: async ({ canvas }) => {
    const nested = getComputedStyle(canvas.getByTestId('nested'));
    await expect(nested.getPropertyValue('--flg-glass-filter').trim()).toBe('none');
    await expect(nested.getPropertyValue('--flg-glass-tint').replace(/\s/g, '')).toBe(
      'rgba(22,26,44,.94)',
    );
  },
};
