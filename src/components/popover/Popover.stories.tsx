import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Checkbox } from '../checkbox/Checkbox';
import { Input } from '../input/Input';
import { Switch } from '../switch/Switch';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './Popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// The popover from the approved mockup: a filter panel with real controls.
const filters = (
  <PopoverContent aria-labelledby="filters-title" style={{ width: 210 }}>
    <div
      id="filters-title"
      style={{ fontSize: 'var(--flg-text-sm)', fontWeight: 'var(--flg-weight-semibold)' }}
    >
      Filter projects
    </div>
    <Checkbox defaultChecked>Active</Checkbox>
    <Checkbox>Archived</Checkbox>
    <Switch defaultChecked>Only mine</Switch>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 2 }}>
      <PopoverClose variant="ghost" size="sm">
        Reset
      </PopoverClose>
      <PopoverClose size="sm">Apply</PopoverClose>
    </div>
  </PopoverContent>
);

const corner = { placeSelf: 'start' } as const;

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <Popover {...args}>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    const panel = canvas.getByRole('dialog', { name: 'Filter projects' });
    await expect(panel.matches(':popover-open')).toBe(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', panel.id);
    await expect(within(panel).getByRole('checkbox', { name: 'Active' })).toHaveFocus();
    // Opens below the trigger, lined up with its start edge.
    await settled(panel);
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(Math.round(p.left)).toBe(Math.round(t.left));
    await expect(Math.round(p.top - t.bottom)).toBe(18);
    // Tab moves on through the panel, which sits right after the trigger in the DOM.
    await userEvent.tab();
    await expect(within(panel).getByRole('checkbox', { name: 'Archived' })).toHaveFocus();

    await userEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    await expect(panel.matches(':popover-open')).toBe(false);
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    const real = await realUserEvent();
    if (!real) return;
    // Esc and an outside press close it through the browser; focus comes back to the trigger.
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.click(document.body, { position: { x: 600, y: 400 } });
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    // A press on the trigger while open closes it, and does not open it again.
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.click(trigger);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(panel.matches(':popover-open')).toBe(false);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  },
};

export const Open: Story = {
  render: (args) => (
    <div style={corner}>
      <Popover {...args} defaultOpen>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
};

export const WithoutArrow: Story = {
  render: (args) => (
    <div style={corner}>
      <Popover {...args} defaultOpen>
        <PopoverTrigger variant="secondary">Share</PopoverTrigger>
        <PopoverContent aria-label="Share" arrow={false} side="right" align="center">
          <Button size="sm">Copy link</Button>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('dialog', { name: 'Share' });
    await expect(panel.querySelector('.flg-popover-arrow')).toBeNull();
    await expect(panel).toHaveAttribute('data-side', 'right');
  },
};

export const FlipsWhenThereIsNoRoom: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ position: 'fixed', bottom: 8, left: 8 }}>
      <Popover {...args} defaultOpen>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('dialog', { name: 'Filter projects' });
    await waitFor(() => expect(panel).toHaveAttribute('data-side', 'top'));
    const arrow = panel.querySelector('.flg-popover-arrow') as HTMLElement;
    await expect(getComputedStyle(arrow).bottom).toBe('-6px');
  },
};

export const PressDraggedOffTheTrigger: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <Popover {...args}>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    const panel = canvasElement.querySelector('.flg-popover') as HTMLElement;
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    // A press that ends off the trigger is no click: it only closes the popover, by light dismiss.
    await real.dragAndDrop(trigger, document.body, { targetPosition: { x: 600, y: 400 } });
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    // The keyboard then opens it as usual.
    trigger.focus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
  },
};

export const ContentBeforeTrigger: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <Popover {...args} defaultOpen>
        {filters}
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
      </Popover>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    const panel = canvasElement.querySelector('.flg-popover') as HTMLElement;
    // The panel comes first in the tree, so its effects run before the trigger's ref is set.
    const nextToTheTrigger = async () => {
      await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
      await settled(panel);
      const t = trigger.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      await expect(panel).toHaveAttribute('data-side', 'bottom');
      await expect(Math.abs(p.top - t.bottom)).toBeLessThanOrEqual(30);
      await expect(Math.abs(p.left - t.left)).toBeLessThanOrEqual(30);
    };
    await nextToTheTrigger();
    // Opening again re-renders the trigger as well.
    await userEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    await expect(panel.matches(':popover-open')).toBe(false);
    await userEvent.click(trigger);
    await nextToTheTrigger();
  },
};

export const PressAnotherControl: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ ...corner, display: 'flex', gap: 240 }}>
      <Popover {...args}>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
      <Button variant="secondary">Export</Button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    const panel = canvasElement.querySelector('.flg-popover') as HTMLElement;
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    // A press on another control closes it by light dismiss, and focus does not go back to the
    // trigger: Safari leaves it on <body>, the other engines on the pressed button.
    await real.click(canvas.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(trigger).not.toHaveFocus();
    // A press on the page around it, which takes no focus, still returns focus to the trigger.
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.click(document.body, { position: { x: 600, y: 400 } });
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ControlledStaysOpen: Story = {
  tags: ['no-visual'],
  // The parent ignores every change, so it stays open.
  render: (args) => (
    <div style={corner}>
      <Popover {...args} open>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    const panel = canvasElement.querySelector('.flg-popover') as HTMLElement;
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    // The press light-dismisses it and its click asks to close: the parent hears that once.
    await real.click(trigger);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(panel.matches(':popover-open')).toBe(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

export const ControlledLeavesOutsideFocus: Story = {
  tags: ['no-visual'],
  // The parent ignores every change, so a light dismiss shows it again at once.
  render: (args) => (
    <div style={{ ...corner, display: 'flex', gap: 240 }}>
      <Popover {...args} open>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
      <Input aria-label="Search" />
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const panel = canvasElement.querySelector('.flg-popover') as HTMLElement;
    const search = canvas.getByRole('textbox', { name: 'Search' });
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    // Showing it again keeps it in step with the parent; it does not take the focus back.
    await real.click(search);
    await real.keyboard('abc');
    await new Promise((resolve) => setTimeout(resolve, 50));
    // The press did close it, and the parent refused: it is open again, not open all along.
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(panel.matches(':popover-open')).toBe(true);
    await expect(search).toHaveFocus();
    await expect(search).toHaveValue('abc');
  },
};

export const PressDraggedBackIntoIt: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ ...corner, display: 'flex', gap: 240 }}>
      <Popover {...args}>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
      <Button variant="secondary">Export</Button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    const exportButton = canvas.getByRole('button', { name: 'Export' });
    const panel = canvasElement.querySelector('.flg-popover') as HTMLElement;
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    // A press on another control that ends inside the panel does not close it.
    await real.dragAndDrop(exportButton, within(panel).getByRole('button', { name: 'Apply' }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(panel.matches(':popover-open')).toBe(true);
    // So the Esc that closes it later returns focus as usual: to the trigger, unless the press
    // moved focus to that control (Safari does not focus a pressed button).
    const pressedTookFocus = document.activeElement === exportButton;
    await real.keyboard('{Escape}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    await waitFor(() => expect(pressedTookFocus ? exportButton : trigger).toHaveFocus());
  },
};
