import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Avatar } from '../avatar/Avatar';
import { Badge } from '../badge/Badge';
import { Button } from '../button/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { style: { width: 380 } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>Unlimited sync, priority support and a year of history.</CardDescription>
      </CardHeader>
      <CardContent>Your plan renews monthly. Cancel any time.</CardContent>
      <CardFooter>
        <Button variant="ghost">Not now</Button>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Upgrade to Pro' })).toBeVisible();
  },
};

/** The composition from the approved mockup: avatar, name, plan and an accent badge. */
export const Composition: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>Unlimited sync, priority support and a year of history.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar alt="Nguyễn Văn A" fallback="NA" />
          <div>
            <div style={{ fontWeight: 600 }}>Nguyễn Văn A</div>
            <div style={{ color: 'var(--flg-text-muted)', fontSize: 'var(--flg-text-xs)' }}>
              Current plan: Free
            </div>
          </div>
          <Badge variant="accent" style={{ marginLeft: 'auto' }}>
            Pro
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Not now</Button>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  ),
};

export const Semantic: Story = {
  render: (args) => (
    <Card {...args} asChild>
      <section aria-labelledby="billing-title">
        <CardHeader>
          <CardTitle asChild>
            <h2 id="billing-title">Billing</h2>
          </CardTitle>
          <CardDescription>Rendered as a section with an h2.</CardDescription>
        </CardHeader>
      </section>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Billing' })).toBeVisible();
  },
};
