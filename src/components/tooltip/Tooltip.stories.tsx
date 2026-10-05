import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { GearIcon } from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Dialog, DialogContent, DialogTitle } from '../dialog/Dialog';
import { IconButton } from '../icon-button/IconButton';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: { onOpenChange: fn() },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const shortcut = { opacity: 0.7, marginLeft: 6, fontWeight: 'var(--flg-weight-regular)' } as const;

const settings = (
  <>
    <TooltipTrigger>
      <IconButton aria-label="Settings" variant="secondary">
        <GearIcon width={16} height={16} />
      </IconButton>
    </TooltipTrigger>
    <TooltipContent>
      Settings <span style={shortcut}>Ctrl+,</span>
    </TooltipContent>
  </>
);

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => <Tooltip {...args}>{settings}</Tooltip>,
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Settings' });
    const tip = canvas.getByRole('tooltip', { hidden: true });
    await expect(trigger).toHaveAccessibleDescription('Settings Ctrl+,');
    await expect(tip.matches(':popover-open')).toBe(false);
    // Keyboard focus shows it at once; Esc and blur hide it.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(tip.matches(':popover-open')).toBe(true);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await settled(tip);
    const t = trigger.getBoundingClientRect();
    const p = tip.getBoundingClientRect();
    await expect(Math.round(t.top - p.bottom)).toBe(6);
    await userEvent.keyboard('{Escape}');
    await expect(tip.matches(':popover-open')).toBe(false);
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(tip.matches(':popover-open')).toBe(true);
    await userEvent.tab();
    await expect(tip.matches(':popover-open')).toBe(false);

    const real = await realUserEvent();
    if (!real) return;
    // Hover waits for the delay (once the 300ms skip window has passed), and the pointer can move
    // onto the tooltip without closing it.
    await new Promise((resolve) => setTimeout(resolve, 350));
    await real.hover(trigger);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(tip.matches(':popover-open')).toBe(false);
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(true), { timeout: 1000 });
    await real.hover(tip);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(tip.matches(':popover-open')).toBe(true);
    await real.unhover(tip);
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(false));
  },
};

export const Open: Story = {
  render: (args) => (
    <Tooltip {...args} defaultOpen>
      {settings}
    </Tooltip>
  ),
};

export const KeepsTheTriggersDescription: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
      <Tooltip {...args}>
        <TooltipTrigger>
          <Button variant="secondary" aria-describedby="export-hint">
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>CSV, up to 10,000 rows</TooltipContent>
      </Tooltip>
      <p id="export-hint">Exports run in the background.</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const tip = canvas.getByRole('tooltip', { hidden: true });
    await expect(canvas.getByRole('button', { name: 'Export' })).toHaveAttribute(
      'aria-describedby',
      `export-hint ${tip.id}`,
    );
  },
};

export const SkipDelay: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Tooltip>
        <TooltipTrigger>
          <Button variant="secondary">Bold</Button>
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button variant="secondary">Italic</Button>
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const [bold, italic] = canvas.getAllByRole('tooltip', { hidden: true });
    await real.hover(canvas.getByRole('button', { name: 'Bold' }));
    await waitFor(() => expect(bold?.matches(':popover-open')).toBe(true), { timeout: 1000 });
    // Moving straight to the next trigger shows its tooltip without the delay.
    await real.hover(canvas.getByRole('button', { name: 'Italic' }));
    await waitFor(() => expect(italic?.matches(':popover-open')).toBe(true), { timeout: 250 });
    // Only one shows at a time.
    await waitFor(() => expect(bold?.matches(':popover-open')).toBe(false), { timeout: 50 });
  },
};

export const InsideADialog: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: () => (
    <Dialog defaultOpen>
      <DialogContent size="sm">
        <DialogTitle>Toolbar</DialogTitle>
        <Tooltip>{settings}</Tooltip>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const dialog = canvas.getByRole('dialog', { name: 'Toolbar' }) as HTMLDialogElement;
    const tip = canvas.getByRole('tooltip', { hidden: true });
    // The trigger is the dialog's first focusable element, and focus there came from code, not the
    // keyboard. Tab away and back to show the tooltip.
    await real.keyboard('{Tab}');
    await real.keyboard('{Shift>}{Tab}{/Shift}');
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(true));
    // The first Esc closes only the tooltip; the dialog stays open.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(false));
    await expect(dialog.open).toBe(true);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};

export const OnAPopoverTrigger: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="secondary">Sort</Button>
      <Popover>
        <Tooltip>
          <TooltipTrigger>
            <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Filter the list</TooltipContent>
        </Tooltip>
        <PopoverContent aria-label="Filters">
          <Button size="sm">Apply</Button>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    const panel = canvasElement.querySelector('.flg-popover') as HTMLElement;
    // Closing the popover returns focus to the trigger inside the browser's own hide, which opens
    // the tooltip in the middle of it. The page must survive that.
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    await expect(trigger).toBeInTheDocument();
    await real.unhover(trigger);
    // The same with the keyboard only.
    canvas.getByRole('button', { name: 'Sort' }).focus();
    await real.keyboard('{Tab}');
    await expect(trigger).toHaveFocus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    await expect(trigger).toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};
