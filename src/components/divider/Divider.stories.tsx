import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from '../button/Button';
import { Divider } from './Divider';

const meta = {
  title: 'Components/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <span>Account</span>
      <Divider {...args} />
      <span>Billing</span>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('separator')).toBeVisible();
  },
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button variant="ghost" size="sm">
        Edit
      </Button>
      <Divider orientation="vertical" />
      <Button variant="ghost" size="sm">
        Share
      </Button>
      <Divider orientation="vertical" />
      <Button variant="ghost" size="sm">
        Export
      </Button>
    </div>
  ),
};

export const Decorative: Story = {
  args: { decorative: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <span>Above</span>
      <Divider {...args} />
      <span>Below</span>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('separator')).toBeNull();
  },
};
