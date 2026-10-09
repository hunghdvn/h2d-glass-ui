import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { HomeIcon } from '../../../.storybook/icons';
import { Card } from '../card/Card';
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './Breadcrumb';
import type { BreadcrumbProps } from './Breadcrumb';

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

// The card the mockup puts the path in (mockups B1 and B2).
const card = { padding: '10px 14px' } as const;

function Path({ home = false, ...props }: BreadcrumbProps & { home?: boolean }) {
  return (
    <Breadcrumb {...props}>
      <BreadcrumbLink href="#">
        {home ? <HomeIcon /> : null}
        Home
      </BreadcrumbLink>
      <BreadcrumbLink href="#">Projects</BreadcrumbLink>
      <BreadcrumbLink href="#">Website 2026</BreadcrumbLink>
      <BreadcrumbPage>Attachments</BreadcrumbPage>
    </Breadcrumb>
  );
}

export const Separators: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, width: 420 }}>
      {/* Several on one page: each needs its own name (axe: landmark-unique). */}
      <Card style={card}>
        <Path home aria-label="Breadcrumb, chevrons" />
      </Card>
      <Card style={card}>
        <Path separator="slash" aria-label="Breadcrumb, slashes" />
      </Card>
      {/* Too narrow for the whole path: it wraps. */}
      <Card style={{ ...card, width: 220 }}>
        <Path home aria-label="Breadcrumb, wrapped" />
      </Card>
    </div>
  ),
};

export const Keyboard: Story = {
  tags: ['no-visual'],
  render: () => <Path home />,
  play: async ({ canvas }) => {
    // Tab goes through the links; the current page is not one.
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Website 2026' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByText('Attachments')).not.toHaveFocus();
    await expect(canvas.getByText('Attachments')).toHaveAttribute('aria-current', 'page');
  },
};
