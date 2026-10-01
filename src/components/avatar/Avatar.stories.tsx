import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Avatar } from './Avatar';

const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6b37f"/><stop offset="1" stop-color="#c9576b"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fde3cf"/><path d="M12 64c2-14 10-20 20-20s18 6 20 20z" fill="#3b2a4d"/></svg>',
)}`;

const row = { display: 'flex', gap: 12, alignItems: 'center' } as const;

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  args: { src: PORTRAIT, alt: 'Nguyễn Văn A', fallback: 'NA' },
  play: async ({ canvas }) => {
    await waitFor(() =>
      expect(canvas.getByRole('img', { name: 'Nguyễn Văn A' }).tagName).toBe('IMG'),
    );
  },
};

export const Initials: Story = {
  args: { alt: 'Trần Thị B', fallback: 'TB' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Trần Thị B' })).toHaveTextContent('TB');
  },
};

export const DecorativeInitials: Story = {
  args: { alt: '', fallback: 'NA' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).toBeNull();
  },
};

export const DefaultIcon: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={row}>
      <Avatar size="sm" alt="Small" fallback="S" />
      <Avatar size="md" alt="Medium" fallback="M" />
      <Avatar size="lg" alt="Large" fallback="L" />
    </div>
  ),
};

export const BrokenImage: Story = {
  args: { src: 'data:image/png;base64,AAAA', alt: 'Lê Văn C', fallback: 'LC' },
  play: async ({ canvas }) => {
    await waitFor(() =>
      expect(canvas.getByRole('img', { name: 'Lê Văn C' })).toHaveAttribute('data-status', 'error'),
    );
  },
};
