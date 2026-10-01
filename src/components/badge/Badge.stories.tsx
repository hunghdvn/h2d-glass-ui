import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Draft' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Draft')).toHaveAttribute('data-variant', 'neutral');
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="accent">Pro</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Expiring soon</Badge>
      <Badge variant="danger">Failed</Badge>
    </div>
  ),
};
