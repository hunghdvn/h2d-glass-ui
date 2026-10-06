import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { useEffect, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { CloseIcon, GearIcon, SearchIcon } from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '../dialog/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { IconButton } from '../icon-button/IconButton';
import { MenuItem } from '../menu/Menu';
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
    // Keyboard focus shows it without the delay (a task later); Esc and blur hide it.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(true), { timeout: 100 });
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await settled(tip);
    const t = trigger.getBoundingClientRect();
    const p = tip.getBoundingClientRect();
    await expect(Math.round(t.top - p.bottom)).toBe(6);
    await userEvent.keyboard('{Escape}');
    await expect(tip.matches(':popover-open')).toBe(false);
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(true), { timeout: 100 });
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
    const tip = canvas.getByRole('tooltip', { hidden: true });
    // Esc closes the popover, and focus comes back to the trigger inside the browser's own hide.
    // That is no keyboard move onto the trigger: its tooltip stays closed, and the page survives.
    const closesWithEsc = async () => {
      await real.keyboard('{Escape}');
      await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
      await expect(trigger).toBeInTheDocument();
      await waitFor(() => expect(trigger).toHaveFocus());
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(tip.matches(':popover-open')).toBe(false);
    };
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await closesWithEsc();
    // Move the pointer off the trigger onto a real element: hovering the page itself can stall in
    // Linux WebKit, where Playwright keeps waiting for <body> to be stable.
    await real.hover(canvas.getByRole('button', { name: 'Sort' }));
    // The same with the keyboard only.
    canvas.getByRole('button', { name: 'Sort' }).focus();
    await real.keyboard('{Tab}');
    await expect(trigger).toHaveFocus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await closesWithEsc();
    // Tab back onto the trigger later shows it as usual.
    await real.keyboard('{Shift>}{Tab}{/Shift}');
    await real.keyboard('{Tab}');
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(true));
  },
};

const isOpen = (el: Element) => el.matches(':popover-open');

// Pressing swaps the icon under the pointer, which the browser reports as the pointer entering the
// trigger again, without it ever leaving.
function SearchToggle() {
  const [searching, setSearching] = useState(false);
  return (
    <Tooltip>
      <TooltipTrigger>
        <IconButton
          aria-label="Search"
          aria-pressed={searching}
          variant="secondary"
          onClick={() => setSearching((value) => !value)}
        >
          {searching ? (
            <CloseIcon key="close" width={16} height={16} />
          ) : (
            <SearchIcon key="search" width={16} height={16} />
          )}
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>
        Search <span style={shortcut}>Ctrl+K</span>
      </TooltipContent>
    </Tooltip>
  );
}

export const PressingTheTrigger: Story = {
  tags: ['no-visual'],
  render: () => <SearchToggle />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Search' });
    const tip = canvas.getByRole('tooltip', { hidden: true });
    await real.hover(trigger);
    await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
    // A press closes it, and the pointer resting on the trigger does not open it again.
    await real.click(trigger);
    await expect(isOpen(tip)).toBe(false);
    await real.hover(trigger, { position: { x: 6, y: 6 } });
    await new Promise((resolve) => setTimeout(resolve, 700));
    await expect(isOpen(tip)).toBe(false);
    // Once the pointer has left, hover opens it again.
    await real.unhover(trigger);
    await real.hover(trigger);
    await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
  },
};

export const OnADialogTrigger: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: () => (
    <Dialog>
      <Tooltip>
        <TooltipTrigger>
          <DialogTrigger variant="secondary">Share</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Share this project</TooltipContent>
      </Tooltip>
      <DialogContent size="sm">
        <DialogTitle>Share</DialogTitle>
        <DialogClose>Done</DialogClose>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Share' });
    const tip = canvas.getByRole('tooltip', { hidden: true });
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;
    await real.hover(trigger);
    await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
    // Safari does not focus a clicked button, so no blur closes the tooltip: the press does. The
    // first Esc then goes to the dialog.
    await real.click(trigger);
    await expect(dialog.open).toBe(true);
    await expect(isOpen(tip)).toBe(false);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};

function Island({ label, onHydrated }: { label: string; onHydrated?: () => void }) {
  useEffect(() => onHydrated?.(), [onHydrated]);
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="secondary">{label}</Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export const SeparateRoots: Story = {
  tags: ['no-visual'],
  render: () => <div data-testid="islands" style={{ display: 'flex', gap: 8 }} />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    // Two server-rendered islands, each hydrated as a React root of its own, as an islands
    // framework does. useId numbers by position in the tree, so both get the same ids.
    const host = canvas.getByTestId('islands');
    const islands = await Promise.all(
      ['Bold', 'Italic'].map(async (label) => {
        const container = document.createElement('div');
        container.innerHTML = renderToString(<Island label={label} />);
        host.append(container);
        let root: Root | undefined;
        await new Promise<void>((resolve) => {
          root = hydrateRoot(container, <Island label={label} onHydrated={resolve} />);
        });
        return { container, root };
      }),
    );
    try {
      const [bold, italic] = canvas.getAllByRole('tooltip', { hidden: true });
      await real.hover(canvas.getByRole('button', { name: 'Bold' }));
      await waitFor(() => expect(bold?.matches(':popover-open')).toBe(true), { timeout: 1000 });
      // Moving to the other root's trigger skips the delay, and closes the first in the same step.
      await real.hover(canvas.getByRole('button', { name: 'Italic' }));
      await waitFor(() => expect(italic?.matches(':popover-open')).toBe(true), { timeout: 250 });
      await expect(bold?.matches(':popover-open')).toBe(false);
    } finally {
      for (const { container, root } of islands) {
        root?.unmount();
        container.remove();
      }
    }
  },
};

// A keyboard shortcut opens a dialog while the pointer rests on a tooltip's trigger.
function ShortcutOpensADialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n') setOpen(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <>
      <Tooltip>{settings}</Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogTitle>New project</DialogTitle>
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const UnderAModal: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: () => <ShortcutOpensADialog />,
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Settings' });
    const tip = canvas.getByRole('tooltip', { hidden: true });
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;
    await real.hover(trigger);
    await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
    // A modal that does not hold the trigger covers it: the tooltip closes, without the pointer
    // moving, and the first Esc goes to the dialog.
    await real.keyboard('n');
    await waitFor(() => expect(dialog.open).toBe(true));
    await waitFor(() => expect(isOpen(tip)).toBe(false), { timeout: 50 });
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};

export const WhileAMenuHasFocus: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Tooltip {...args}>{settings}</Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger variant="secondary">Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem>Rename</MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const tip = canvas.getByRole('tooltip', { hidden: true });
    await real.hover(canvas.getByRole('button', { name: 'Settings' }));
    await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
    // The pointer rests on the trigger while the keyboard works in a menu: Esc closes the menu.
    canvas.getByRole('button', { name: 'Actions' }).focus();
    await real.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'Actions' });
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(isOpen(tip)).toBe(true);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(tip)).toBe(false));
  },
};

// Overlays that Esc does not close: a dialog opened with `show()` (here rendered with `open`) and a
// manual popover. Focus in one of them leaves Esc to the tooltip.
export const WhileANonModalOverlayHasFocus: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: (args) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
      <Tooltip {...args}>{settings}</Tooltip>
      <dialog open aria-label="Notes" style={{ position: 'static', margin: 0 }}>
        <Button size="sm">Save note</Button>
      </dialog>
      <div
        popover="manual"
        data-testid="panel"
        style={{ inset: 'auto', right: 16, bottom: 16, margin: 0 }}
      >
        <Button size="sm">Pin</Button>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const trigger = canvas.getByRole('button', { name: 'Settings' });
    const tip = canvas.getByRole('tooltip', { hidden: true });
    const dialog = canvas.getByRole('dialog', { name: 'Notes' }) as HTMLDialogElement;
    await real.hover(trigger);
    await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
    canvas.getByRole('button', { name: 'Save note' }).focus();
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen(tip)).toBe(false));
    await expect(dialog.open).toBe(true);
    // The same with focus in a manual popover. The pointer leaves the trigger and comes back first.
    const panel = canvas.getByTestId('panel');
    panel.showPopover();
    try {
      await real.hover(canvas.getByRole('button', { name: 'Save note' }));
      await real.hover(trigger);
      await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
      canvas.getByRole('button', { name: 'Pin' }).focus();
      await real.keyboard('{Escape}');
      await waitFor(() => expect(isOpen(tip)).toBe(false));
      await expect(isOpen(panel)).toBe(true);
    } finally {
      panel.hidePopover();
    }
  },
};
