import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
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

/** More tabs than a narrow column has room for. */
function Workspace(props: Omit<TabsProps, 'children'>) {
  return (
    <Tabs defaultValue="overview" {...props}>
      <TabsList aria-label="Workspace">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">
          Members <Badge variant="neutral">12</Badge>
        </TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      {['overview', 'members', 'activity', 'billing', 'settings'].map((value) => (
        <TabsContent key={value} value={value} style={panelText}>
          The {value} of Website 2026.
        </TabsContent>
      ))}
    </Tabs>
  );
}

// A grid item grows to fit its content unless its track lets it shrink (`minmax(0, 1fr)`).
const narrow = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16, width: 260 };

/**
 * Whether the tab, with the 4px its focus ring reaches out (an outline 2px wide, 2px away), lies
 * inside the list's padding box, where the list clips what it scrolls.
 */
function inView(tab: HTMLElement, list: HTMLElement) {
  const t = tab.getBoundingClientRect();
  const l = list.getBoundingClientRect();
  const left = l.left + list.clientLeft;
  const top = l.top + list.clientTop;
  return (
    t.left - 4 >= left &&
    t.right + 4 <= left + list.clientWidth &&
    t.top - 4 >= top &&
    t.bottom + 4 <= top + list.clientHeight
  );
}

export const Overflow: Story = {
  render: () => (
    <div style={narrow}>
      <Card style={card}>
        <Workspace />
      </Card>
      <Card style={card}>
        <Workspace variant="segmented" />
      </Card>
      <Card style={card}>
        <Workspace variant="pill" />
      </Card>
      <Card style={card}>
        <Workspace defaultValue="settings" />
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const [underline, segmented, pill, mountedAtEnd] = canvas.getAllByRole('tablist') as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    // At rest a row that does not fit is marked so, at its start; the fade shows at its end.
    for (const list of [underline, segmented, pill]) {
      await expect(list).toHaveAttribute('data-overflow');
      await expect(list).toHaveAttribute('data-at-start');
      await expect(list).not.toHaveAttribute('data-at-end');
    }
    // A row mounted with its last tab selected has scrolled to it.
    const settings = (list: HTMLElement) => within(list).getByRole('tab', { name: 'Settings' });
    await expect(settings(mountedAtEnd)).toHaveAttribute('aria-selected', 'true');
    await expect(mountedAtEnd).toHaveAttribute('data-at-end');
    await expect(inView(settings(mountedAtEnd), mountedAtEnd)).toBe(true);
    // The keys move focus with trusted input, which the Storybook UI cannot give.
    const real = await realUserEvent();
    if (!real) return;
    const { scrollX, scrollY } = window;
    for (const list of [underline, segmented, pill]) {
      within(list).getByRole('tab', { name: 'Overview' }).focus();
      await real.keyboard('{End}');
      await expect(settings(list)).toHaveFocus();
      // The browser scrolled the row to the focused tab, and its ring is not cut off.
      await waitFor(() => expect(list).toHaveAttribute('data-at-end'));
      await expect(list).not.toHaveAttribute('data-at-start');
      await expect(inView(settings(list), list)).toBe(true);
    }
    // The page did not move.
    await expect([window.scrollX, window.scrollY]).toEqual([scrollX, scrollY]);
  },
};

function ControlledOverflow() {
  const [value, setValue] = useState('overview');
  return (
    <div style={narrow}>
      <Card style={card}>
        <Workspace value={value} onValueChange={setValue} />
      </Card>
      <button type="button" onClick={() => setValue('settings')}>
        Open settings
      </button>
    </div>
  );
}

export const OverflowControlled: Story = {
  tags: ['no-visual'],
  render: () => <ControlledOverflow />,
  play: async ({ canvas }) => {
    const list = canvas.getByRole('tablist');
    const settings = canvas.getByRole('tab', { name: 'Settings' });
    await expect(list).toHaveAttribute('data-at-start');
    await expect(inView(settings, list)).toBe(false);
    const { scrollX, scrollY } = window;
    // The parent selects a tab out of view: the row scrolls to it, and the page stays.
    const real = await realUserEvent();
    await (real ?? userEvent).click(canvas.getByRole('button', { name: 'Open settings' }));
    await expect(settings).toHaveAttribute('aria-selected', 'true');
    await expect(inView(settings, list)).toBe(true);
    await expect(list).toHaveAttribute('data-at-end');
    await expect([window.scrollX, window.scrollY]).toEqual([scrollX, scrollY]);
  },
};

const pressed = fn();

export const PressOnPartlyHiddenTab: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={narrow}>
      <Card style={card}>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Workspace">
            {['Overview', 'Members', 'Activity', 'Reports', 'Settings'].map((name) => (
              <TabsTrigger key={name} value={name.toLowerCase()} onClick={() => pressed(name)}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
          {['overview', 'members', 'activity', 'reports', 'settings'].map((value) => (
            <TabsContent key={value} value={value} style={panelText}>
              The {value} of Website 2026.
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    // A press is trusted input, which the Storybook UI cannot give.
    const real = await realUserEvent();
    if (!real) return;
    pressed.mockClear();
    const list = canvas.getByRole('tablist');
    const lane = list.getBoundingClientRect();
    // The pointer goes into the strip at the row's end that the fade covers (the row's
    // `scroll-padding`), on the first tab that runs into it: the strip is part of the row, so a
    // press there is a real press, yet revealing the tab moves the tab out from under the pointer.
    const x = lane.left + list.clientLeft + list.clientWidth - 12;
    const target = canvas
      .getAllByRole('tab')
      .find((tab) => tab.getBoundingClientRect().left < x && !inView(tab, list));
    if (!target) throw new Error('no tab is partly hidden');
    const box = target.getBoundingClientRect();
    const y = box.top + box.height / 2;
    // `userEvent.click` of Playwright scrolls its target into view first, which would hide the very
    // thing under test. Chromium lets a test press with the protocol, wherever the pointer is.
    const { cdp, server } = await import('vitest/browser');
    if (server.browser === 'chromium') {
      const frame = window.frameElement?.getBoundingClientRect();
      const scale = frame ? frame.width / window.innerWidth : 1;
      const at = { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
      const press = { ...at, button: 'left', clickCount: 1 } as const;
      const session = cdp();
      await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...at });
      await session.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        buttons: 1,
        ...press,
      });
      await session.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...press });
    } else {
      await real.click(target, { position: { x: x - box.left, y: box.height / 2 } });
    }
    // Revealing the tab waits for the press to end, so the click reaches the tab it pressed.
    await waitFor(() => expect(target).toHaveAttribute('aria-selected', 'true'));
    await expect(pressed).toHaveBeenCalledOnce();
    await expect(pressed).toHaveBeenCalledWith(target.textContent);
    await waitFor(() => expect(inView(target, list)).toBe(true));
  },
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
    // A parent that refuses a value keeps its own; the request was still reported, once.
    await userEvent.click(tab('Settings'));
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    // The parent can select any tab itself.
    await userEvent.click(canvas.getByRole('button', { name: 'Open settings' }));
    await expect(tab('Settings')).toHaveAttribute('aria-selected', 'true');
    await expect(
      within(canvas.getByRole('tabpanel', { name: 'Settings' })).getByText(/Name/),
    ).toBeVisible();
  },
};

/** A parent that commits the tab later, as a router does after a navigation. */
function LateTabs({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [value, setValue] = useState('overview');
  return (
    <Project
      value={value}
      onValueChange={(next) => {
        onValueChange(next);
        setTimeout(() => setValue(next), 100);
      }}
    />
  );
}

export const LateParent: Story = {
  tags: ['no-visual'],
  render: (args) => <LateTabs onValueChange={args.onValueChange as (v: string) => void} />,
  play: async ({ canvas, args }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    const real = await realUserEvent();
    const click = (el: HTMLElement) => (real ? real.click(el) : userEvent.click(el));
    // A press focuses the tab, then clicks it, both before the parent commits: reported once.
    await click(tab('Members'));
    await waitFor(() => expect(tab('Members')).toHaveAttribute('aria-selected', 'true'));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('members');
    await click(tab('Settings'));
    await waitFor(() => expect(tab('Settings')).toHaveAttribute('aria-selected', 'true'));
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
    // An arrow focuses and selects a tab; Enter right after it does not select it again.
    const keyboard = (keys: string) => (real ? real.keyboard(keys) : userEvent.keyboard(keys));
    await keyboard('{ArrowLeft}');
    await keyboard('{Enter}');
    await waitFor(() => expect(tab('Members')).toHaveAttribute('aria-selected', 'true'));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(args.onValueChange).toHaveBeenCalledTimes(3);
    await expect(args.onValueChange).toHaveBeenLastCalledWith('members');
  },
};
