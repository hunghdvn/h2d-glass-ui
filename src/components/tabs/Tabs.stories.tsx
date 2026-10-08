import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Badge } from '../badge/Badge';
import { Card } from '../card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import type { TabsProps } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: { onValueChange: fn() },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// The panel text of the approved mockup (tabs T1–T3).
const panelText: CSSProperties = {
  fontSize: 'var(--flg-text-sm)',
  color: 'var(--flg-text-muted)',
  lineHeight: 1.5,
};
const strong: CSSProperties = {
  color: 'var(--flg-text)',
  fontWeight: 'var(--flg-weight-semibold)',
};

/** The tabs of the mockup: the first selected, "Billing" disabled, a count on "Members". */
function Project(props: Omit<TabsProps, 'children'>) {
  return (
    <Tabs defaultValue="overview" {...props}>
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">
          Members <Badge variant="neutral">12</Badge>
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" style={panelText}>
        <span style={strong}>Website 2026</span>
        <br />
        14 files · updated 2 hours ago · 3 open tasks.
      </TabsContent>
      <TabsContent value="members" style={panelText}>
        12 members, 3 of them admins.
      </TabsContent>
      <TabsContent value="settings" style={panelText}>
        Name, visibility and integrations.
      </TabsContent>
      <TabsContent value="billing" style={panelText}>
        Invoices and payment methods.
      </TabsContent>
    </Tabs>
  );
}

const column = { display: 'grid', gap: 16, width: 420 } as const;
const card = { gap: 12 } as const;

export const Variants: Story = {
  render: () => (
    <div style={column}>
      <Card style={card}>
        <Project />
      </Card>
      <Card style={card}>
        <Project variant="segmented" />
      </Card>
      <Card style={card}>
        <Project variant="pill" />
      </Card>
      <Card style={card}>
        <Project orientation="vertical" />
      </Card>
    </div>
  ),
};

export const Keyboard: Story = {
  tags: ['no-visual'],
  render: (args) => <Project onValueChange={args.onValueChange} />,
  play: async ({ canvas, args }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    // Only the selected tab is in the Tab order; Tab goes on to its panel.
    await userEvent.tab();
    await expect(tab('Overview')).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('tabpanel', { name: 'Overview' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    // The arrows move and select, wrap at the ends, and skip the disabled tab.
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Members')).toHaveFocus();
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel', { name: /^Members/ })).toBeVisible();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(tab('Overview')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tab('Settings')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(tab('Overview')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(tab('Settings')).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
    // A key held with Ctrl is the browser's.
    await userEvent.keyboard('{Control>}{ArrowRight}{/Control}');
    await expect(tab('Settings')).toHaveFocus();
  },
};

export const Manual: Story = {
  tags: ['no-visual'],
  render: (args) => <Project activationMode="manual" onValueChange={args.onValueChange} />,
  play: async ({ canvas, args }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    tab('Overview').focus();
    // The arrows move focus only; Enter or Space selects.
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Members')).toHaveFocus();
    await expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight} ');
    await expect(tab('Settings')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
  },
};

export const Vertical: Story = {
  tags: ['no-visual'],
  render: (args) => <Project orientation="vertical" onValueChange={args.onValueChange} />,
  play: async ({ canvas }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    await expect(canvas.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    tab('Overview').focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(tab('Members')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Members')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect(tab('Settings')).toHaveFocus();
  },
};

function ControlledTabs({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [value, setValue] = useState('overview');
  return (
    <div style={column}>
      <Project
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          if (next !== 'settings') setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue('settings')}>
        Open settings
      </button>
    </div>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: (args) => <ControlledTabs onValueChange={args.onValueChange as (v: string) => void} />,
  play: async ({ canvas, args }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    await userEvent.click(tab('Members'));
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    // A parent that refuses a value keeps its own; the request was still reported.
    await userEvent.click(tab('Settings'));
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    // The parent can select any tab itself.
    await userEvent.click(canvas.getByRole('button', { name: 'Open settings' }));
    await expect(tab('Settings')).toHaveAttribute('aria-selected', 'true');
    await expect(
      within(canvas.getByRole('tabpanel', { name: 'Settings' })).getByText(/Name/),
    ).toBeVisible();
  },
};
