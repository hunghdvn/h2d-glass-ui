import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { CloseIcon, GearIcon, MoreIcon, PlusIcon } from '../../../.storybook/icons';
import type { ButtonProps } from '../button/Button';
import { IconButton } from './IconButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } as const;

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Add item', children: <PlusIcon />, onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<ButtonProps & { 'aria-label': string }>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Add item' })).toBeVisible();
  },
};

export const Variants: Story = {
  render: () => (
    <div style={row}>
      <IconButton aria-label="Add" variant="primary">
        <PlusIcon />
      </IconButton>
      <IconButton aria-label="Settings" variant="secondary">
        <GearIcon />
      </IconButton>
      <IconButton aria-label="More options" variant="ghost">
        <MoreIcon />
      </IconButton>
      <IconButton aria-label="Delete" variant="danger">
        <CloseIcon />
      </IconButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={row}>
      <IconButton aria-label="Close small" variant="secondary" size="sm">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Close medium" variant="secondary" size="md">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Close large" variant="secondary" size="lg">
        <CloseIcon />
      </IconButton>
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Add item' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  },
};
