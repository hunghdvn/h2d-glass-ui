import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { withViewport } from '../../../.storybook/viewport';
import { Button } from '../button/Button';
import { Card } from '../card/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { Field } from '../field/Field';
import { Input } from '../input/Input';
import { MenuItem } from '../menu/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover';
import { Radio } from '../radio-group/Radio';
import { RadioGroup } from '../radio-group/RadioGroup';
import { Select, SelectItem } from '../select/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Your name is shown to everyone in the workspace.</DialogDescription>
    </DialogHeader>
    <Field label="Name">
      <Input defaultValue="Minh An" />
    </Field>
    <DialogFooter>
      <DialogClose variant="ghost">Cancel</DialogClose>
      <DialogClose>Save</DialogClose>
    </DialogFooter>
  </>
);

// The <dialog> sits in the top layer but stays inside the story in the DOM.
const dialogIn = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('dialog') as HTMLDialogElement;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Whether all of `el` shows inside the visible box of `box`. */
function isInside(el: Element, box: Element): boolean {
  const r = el.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  return r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5;
}

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Edit profile' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-controls');

    await userEvent.click(trigger);
    const dialog = canvas.getByRole('dialog', { name: 'Edit profile' }) as HTMLDialogElement;
    await expect(dialog).toHaveAccessibleDescription(
      'Your name is shown to everyone in the workspace.',
    );
    await expect(dialog.matches(':modal')).toBe(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    // Focus moves to the first focusable element; the page behind cannot scroll.
    await expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus();
    await expect(document.documentElement.style.overflow).toBe('hidden');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await expect(dialog.open).toBe(false);
    await expect(trigger).toHaveFocus();
    await expect(document.documentElement.style.overflow).toBe('');
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    const real = await realUserEvent();
    if (!real) return;
    // Esc, through the browser's own close request.
    await real.click(trigger);
    await expect(dialog.open).toBe(true);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(trigger).toHaveFocus();
    // A click on the frame, outside the panel.
    await real.click(trigger);
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(trigger).toHaveFocus();
  },
};

export const DragOutOfThePanel: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement);
    await expect(dialog.open).toBe(true);
    const real = await realUserEvent();
    if (!real) return;
    // Selecting text that starts in the panel and ends outside it is not an outside click.
    const description = within(dialog).getByText(/Your name is shown/);
    await real.dragAndDrop(description, dialog, { targetPosition: { x: 4, y: 4 } });
    await expect(dialog.open).toBe(true);
  },
};

export const DragIntoThePanel: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement);
    await expect(dialog.open).toBe(true);
    const real = await realUserEvent();
    if (!real) return;
    // A press on the frame that is released inside the panel is not an outside click either: the
    // browser sends that click to the <dialog>, the element that holds both.
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    await real.dragAndDrop(dialog, name, { sourcePosition: { x: 4, y: 4 } });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(dialog.open).toBe(true);
  },
};

export const Open: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  ),
};

export const Alert: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent alert size="sm">
        <DialogHeader>
          <DialogTitle>Delete this project?</DialogTitle>
          <DialogDescription>
            Its 14 files are deleted too. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose variant="ghost">Cancel</DialogClose>
          <DialogClose variant="danger">Delete project</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas }) => {
    const dialog = canvas.getByRole('alertdialog', {
      name: 'Delete this project?',
    }) as HTMLDialogElement;
    // The least destructive action comes first, so it takes the focus.
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    const real = await realUserEvent();
    if (!real) return;
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await expect(dialog.open).toBe(true);
  },
};

function ControlledDialog() {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(true);
  return (
    <Dialog open={open} onOpenChange={(next) => (next || !dirty) && setOpen(next)}>
      <DialogTrigger variant="secondary">Rename</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Rename file</DialogTitle>
        <Button variant="secondary" onClick={() => setDirty(false)}>
          Discard changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: () => <ControlledDialog />,
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(canvas.getByRole('button', { name: 'Rename' }));
    const dialog = dialogIn(canvasElement);
    await expect(dialog.open).toBe(true);
    // The parent refuses to close while there are changes: Esc does nothing.
    await real.keyboard('{Escape}');
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(dialog.open).toBe(true);
    await real.click(within(dialog).getByRole('button', { name: 'Discard changes' }));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};

export const DropdownMenuInADialog: Story = {
  name: 'DropdownMenu in a Dialog',
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Edit profile</DialogTitle>
        <Field label="Name">
          <Input defaultValue="Minh An" />
        </Field>
        <DropdownMenu>
          <DropdownMenuTrigger variant="secondary">Status</DropdownMenuTrigger>
          <DropdownMenuContent>
            <MenuItem>Available</MenuItem>
            <MenuItem>Busy</MenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogFooter>
          <DialogClose>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(canvas.getByRole('button', { name: 'Edit profile' }));
    const dialog = dialogIn(canvasElement);
    await expect(dialog.open).toBe(true);
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    await real.fill(name, 'Minh An Nguyen');
    const status = within(dialog).getByRole('button', { name: 'Status' });
    const menu = within(dialog).getByRole('menu', { hidden: true });
    const isOpen = () => menu.matches(':popover-open');
    args.onOpenChange?.mockClear();

    // Esc closes only the menu, the topmost layer; focus goes back to its trigger in the dialog.
    await real.click(status);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(status).toHaveFocus();
    await delay(50);
    await expect(dialog.open).toBe(true);

    // A click on the frame, outside the panel, light-dismisses only the menu.
    await real.click(status);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    await expect(name).toHaveValue('Minh An Nguyen');

    // Choosing an item closes the menu and returns focus to its trigger in the dialog.
    await real.click(status);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(within(menu).getByRole('menuitem', { name: 'Busy' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(status).toHaveFocus();
    await expect(dialog.open).toBe(true);
    await expect(args.onOpenChange).not.toHaveBeenCalled();

    // A press on the trigger of the open menu closes it, and focus stays on the trigger.
    await real.click(status);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(status);
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(isOpen()).toBe(false);
    await expect(status).toHaveFocus();
    await expect(dialog.open).toBe(true);

    // With no menu open, a click on the frame closes the dialog as before.
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

const sections = Array.from(
  { length: 40 },
  (_, i) => `Section ${i + 1}. The workspace owner can change these terms at any time.`,
);

export const LongContent: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent>
        <DialogTitle>Terms of service</DialogTitle>
        <ul aria-label="Recent changes" style={{ height: 300, overflowY: 'auto', margin: 0 }}>
          <li>Section 4 now covers shared links.</li>
          <li>Section 12 adds a retention period.</li>
        </ul>
        {sections.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <DialogFooter>
          <DialogClose>Accept</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement);
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    // The only focusable element is in the footer, at the far end of the content.
    const accept = within(dialog).getByRole('button', { name: 'Accept' });
    await expect(accept).toHaveFocus();
    // The panel scrolls, and a child with a fixed height keeps it instead of shrinking to fit.
    await expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
    await settled(panel);
    const list = within(dialog).getByRole('list', { name: 'Recent changes' });
    await expect(Math.round(list.getBoundingClientRect().height)).toBe(300);
    // The panel scrolls to the focused button, so it can be seen (WCAG 2.4.11).
    await expect(isInside(accept, panel)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(isInside(accept, panel)).toBe(true);
  },
};

const rows = Array.from({ length: 50 }, (_, i) => `Change ${i + 1}`);

// App code that shows the selected row as the dialog opens, from an effect.
function ChangeList() {
  const selected = useRef<HTMLLIElement>(null);
  useEffect(() => {
    selected.current?.scrollIntoView();
  }, []);
  return (
    <ul aria-label="Changes" style={{ margin: 0 }}>
      {rows.map((row, i) => (
        <li key={row} ref={i === 29 ? selected : undefined} style={{ minHeight: 40 }}>
          {row}
        </li>
      ))}
    </ul>
  );
}

export const ScrolledByItsContent: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent>
        <DialogTitle>Change history</DialogTitle>
        <ChangeList />
        <DialogFooter>
          <DialogClose>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement);
    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
    const row = within(dialog).getByText('Change 30');
    // The library leaves the content's own scrolling alone.
    await settled(panel);
    await expect(isInside(row, panel)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(isInside(row, panel)).toBe(true);
  },
};

function PublishDraft() {
  const [draft, setDraft] = useState(true);
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {draft ? <Input aria-label="Draft title" defaultValue="Q3 plan" /> : null}
      <Dialog>
        <DialogTrigger variant="secondary">Publish draft</DialogTrigger>
        <DialogContent size="sm">
          <DialogTitle>Publish the draft?</DialogTitle>
          <DialogFooter>
            <DialogClose variant="ghost">Cancel</DialogClose>
            <DialogClose onClick={() => setDraft(false)}>Publish</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const FocusFallsBackToTheTrigger: Story = {
  tags: ['no-visual'],
  render: () => <PublishDraft />,
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole('textbox', { name: 'Draft title' });
    const trigger = canvas.getByRole('button', { name: 'Publish draft' });
    // Safari does not focus a clicked button, so the field still has focus as the dialog opens.
    field.focus();
    trigger.click();
    const dialog = dialogIn(canvasElement);
    await waitFor(() => expect(dialog.open).toBe(true));
    // Publishing removes the field. Focus goes to the trigger instead of falling to <body>.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));
    await expect(dialog.open).toBe(false);
    await expect(field).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

export const FocusOnTheCheckedRadio: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent size="sm">
        <DialogTitle>Change plan</DialogTitle>
        <RadioGroup aria-label="Billing" defaultValue="yearly">
          <Radio value="monthly">Monthly</Radio>
          <Radio value="yearly">Yearly</Radio>
        </RadioGroup>
        <DialogFooter>
          <DialogClose>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement);
    // Tab reaches a radio group at its checked option, so that is where focus goes.
    await expect(within(dialog).getByRole('radio', { name: 'Yearly' })).toHaveFocus();
  },
};

export const SkipsADisabledFieldset: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent size="sm">
        <DialogTitle>Delivery</DialogTitle>
        <fieldset disabled style={{ border: 0, margin: 0, padding: 0 }}>
          <legend>Saved address</legend>
          <Field label="Street">
            <Input defaultValue="12 Hang Bai" />
          </Field>
        </fieldset>
        <Field label="Note for the courier">
          <Input />
        </Field>
        <DialogFooter>
          <DialogClose>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement);
    // The controls of a disabled fieldset are disabled too, and Tab skips them.
    await expect(
      within(dialog).getByRole('textbox', { name: 'Note for the courier' }),
    ).toHaveFocus();
  },
};

// ---------------------------------------------------------------------------------------------------
// A movable dialog (mockup D2, option d2 of phase-6-kbd-dialog.html). The looks are the rows of the
// mockup: at rest, with the pointer over the header, while it is dragged (the harness presses the
// header and moves the mouse, through `data-visual-drag`) and on a phone. Lay beside
// `.superpowers/mockups/shots/d2.png`. The text is the mockup's, in English; the page behind it is the
// orders table the mockup draws.

const ORDERS = [
  ['DH-1032', 'Lumen Studio', 'Shipped', '03/11/2026'],
  ['DH-1030', 'Hoa Binh Market', 'Shipped', '03/11/2026'],
  ['DH-1029', 'Misty Dawn Coffee', 'Cancelled', '02/11/2026'],
  ['DH-1028', 'Misty Dawn Coffee', 'Processing', '05/11/2026'],
  ['DH-1027', 'An Phat Bakery', 'New', '05/11/2026'],
  ['DH-1026', 'Lumen Studio', 'Shipped', '01/11/2026'],
] as const;

/** The page the dialog is over, which the scrim blurs. */
function OrdersPage() {
  return (
    <Card aria-hidden="true" style={{ padding: '14px 16px', gap: 8, width: 'min(100%, 880px)' }}>
      <strong>Orders</strong>
      <Table size="sm">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ORDERS.map(([id, customer, status, date]) => (
            <TableRow key={id}>
              <TableCell>{id}</TableCell>
              <TableCell>{customer}</TableCell>
              <TableCell>{status}</TableCell>
              <TableCell>{date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/**
 * The dialog of the mockup. `header` is what goes on its `DialogHeader`, such as an attribute for the
 * visual harness; `help` adds a button to the header, for the stories about what a press must leave
 * alone, and `tag` adds what it is given after the description.
 */
function OrderDialog({
  header,
  help = false,
  tag,
}: {
  header?: ComponentProps<typeof DialogHeader> & Record<`data-${string}`, string>;
  help?: boolean;
  tag?: ReactNode;
}) {
  // The mockup draws no focus ring, so the focus starts on the title, which draws none either.
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <>
      <OrdersPage />
      <Dialog defaultOpen>
        <DialogContent movable size="sm" initialFocus={title}>
          <DialogHeader {...header}>
            <DialogTitle ref={title} tabIndex={-1} style={{ outline: 'none' }}>
              Edit order DH-1028
            </DialogTitle>
            <DialogDescription>Placed on 05/11/2026 via the website.</DialogDescription>
            {tag}
            {help ? (
              <Button variant="ghost" size="sm" style={{ justifySelf: 'start' }}>
                Help
              </Button>
            ) : null}
          </DialogHeader>
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12 }}>
            <Field label="Customer">
              <Input defaultValue="Misty Dawn Coffee" />
            </Field>
            <Field label="Status">
              <Select defaultValue="processing">
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <DialogClose variant="ghost">Cancel</DialogClose>
            <DialogClose>Save</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** (a) At rest, in the middle, with the six-dot grip before the title. */
export const DialogMovable: Story = { render: () => <OrderDialog /> };

/** (b) The pointer over the header: the grip darkens, and the cursor is the open hand. */
export const DialogMovableHover: Story = {
  render: () => <OrderDialog header={{ 'data-visual-hover': '' }} />,
};

/** (c) Dragged up and left of the middle: lifted, 2% larger, a deeper shadow, the grip in the accent. */
export const DialogMovableDragging: Story = {
  render: () => <OrderDialog header={{ 'data-visual-drag': '-112,-34' }} />,
};

/** (d) On a phone nothing can be dragged: no grip, and the header of any other dialog. */
export const DialogMovablePhone: Story = {
  tags: ['viewport-390x844'],
  render: () => <OrderDialog />,
};

// Real pointers (layer 2): where the panel goes is layout, and only an engine has it. Under
// `pnpm test:stories` the press is the browser's own, through Playwright; in the Storybook UI there is
// none, and each story skips what needs it (real-input.ts). The window is set to 1280x720 first, since
// the size of the frame Vitest runs a story in is its own and a dialog is not movable below 640px.

const WIDE = { width: 1280, height: 720 };
const boxOf = (element: Element) => element.getBoundingClientRect();
const same = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

/** The panel of the dialog, once its enter animation and any lift have finished. */
async function panelOf(dialog: HTMLDialogElement) {
  const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
  await settled(panel);
  return panel;
}

const titleOf = (dialog: HTMLElement) =>
  within(dialog).getByRole('heading', { name: 'Edit order DH-1028' });

/** Drags `from` to the point (x, y) of the window: the frame of the dialog covers the window. */
async function dragTo(
  real: NonNullable<Awaited<ReturnType<typeof realUserEvent>>>,
  dialog: HTMLDialogElement,
  from: Element,
  x: number,
  y: number,
) {
  await real.dragAndDrop(from, dialog, { targetPosition: { x, y } });
}

export const MovableDragsByTheHeader: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const title = titleOf(dialog);
      const before = boxOf(panel);
      const grab = boxOf(title);
      // The attribute shows while the button is down; what is left once it is up is the position.
      let lifted = false;
      const watch = new MutationObserver(() => {
        lifted ||= dialog.hasAttribute('data-dragging');
      });
      watch.observe(dialog, { attributes: true, attributeFilter: ['data-dragging'] });
      try {
        await dragTo(
          real,
          dialog,
          title,
          grab.left + grab.width / 2 + 120,
          grab.top + grab.height / 2 + 60,
        );
      } finally {
        watch.disconnect();
      }
      await expect(lifted).toBe(true);
      await expect(dialog).not.toHaveAttribute('data-dragging');
      await settled(panel);
      same(boxOf(panel).left, before.left + 120);
      same(boxOf(panel).top, before.top + 60);
      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('120px');
      await expect(panel.style.getPropertyValue('--flg-dialog-y')).toBe('60px');
      await expect(dialog.open).toBe(true);
    });
  },
};

export const MovableStopsAtEveryEdge: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const title = titleOf(dialog);
      // Each drag ends in a corner of the window that the panel cannot reach: 16px is left.
      await dragTo(real, dialog, title, 2, 2);
      await settled(panel);
      same(boxOf(panel).left, 16);
      same(boxOf(panel).top, 16);
      await dragTo(real, dialog, title, WIDE.width - 2, WIDE.height - 2);
      await settled(panel);
      same(boxOf(panel).right, WIDE.width - 16);
      same(boxOf(panel).bottom, WIDE.height - 16);
      await dragTo(real, dialog, title, WIDE.width - 2, 2);
      await settled(panel);
      same(boxOf(panel).right, WIDE.width - 16);
      same(boxOf(panel).top, 16);
      await dragTo(real, dialog, title, 2, WIDE.height - 2);
      await settled(panel);
      same(boxOf(panel).left, 16);
      same(boxOf(panel).bottom, WIDE.height - 16);
    });
  },
};

export const MovableStaysInsideASmallerWindow: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      await dragTo(real, dialog, titleOf(dialog), WIDE.width - 2, WIDE.height - 2);
      await settled(panel);
      same(boxOf(panel).right, WIDE.width - 16);
      // The window shrinks under it, and the panel is taken in with it.
      await viewport.set(900, 600);
      await settled(panel);
      same(boxOf(panel).right, 900 - 16);
      same(boxOf(panel).bottom, 600 - 16);
      await expect(boxOf(panel).left).toBeGreaterThanOrEqual(15);
      await expect(boxOf(panel).top).toBeGreaterThanOrEqual(15);
    });
  },
};

export const MovableCentresBelow640AndStaysThere: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const title = titleOf(dialog);
      const middle = boxOf(panel);
      await dragTo(real, dialog, title, 2, 2);
      await settled(panel);
      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
      // Under 640px it is in the middle at once, with nothing left on its style, and it cannot be moved.
      await viewport.set(600, WIDE.height);
      await settled(panel);
      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
      same(boxOf(panel).left + boxOf(panel).width / 2, 300);
      await dragTo(real, dialog, title, 2, 2);
      await settled(panel);
      same(boxOf(panel).left + boxOf(panel).width / 2, 300);
      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
      // Wide again: still in the middle, and it moves once more.
      await viewport.set(WIDE.width, WIDE.height);
      await settled(panel);
      same(boxOf(panel).left + boxOf(panel).width / 2, WIDE.width / 2);
      await dragTo(real, dialog, title, 2, 2);
      await settled(panel);
      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
    });
  },
};

export const MovableLetGoOutsideStaysOpen: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      // The press starts in the panel, and the pointer is let go on the frame, 4px from its corner,
      // which the panel does not reach: that is not an outside click.
      await dragTo(real, dialog, titleOf(dialog), 4, 4);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(dialog.open).toBe(true);
      await settled(panel);
      same(boxOf(panel).left, 16);
    });
  },
};

export const MovableEndsWhenAHandlerStopsTheRelease: Story = {
  tags: ['no-visual'],
  // A caller's handler that stops the release on its way up: React stops the native event at its
  // root, which is below the document.
  render: () => <OrderDialog header={{ onPointerUp: (event) => event.stopPropagation() }} />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const title = titleOf(dialog);
      const field = within(dialog).getByRole('textbox', { name: 'Customer' });
      const middle = boxOf(panel);
      // A click on the header: the press never became a drag, and its release was stopped. The
      // pointer then moves away with no button down, far past the threshold, and the panel stays.
      await real.click(title);
      await real.hover(field);
      await settled(panel);
      await expect(dialog).not.toHaveAttribute('data-dragging');
      same(boxOf(panel).left, middle.left);
      same(boxOf(panel).top, middle.top);
      // A drag hears its release all the same: it is over, and the panel stays where it was let go.
      const grab = boxOf(title);
      await dragTo(real, dialog, title, grab.left + 80, grab.top + 40);
      await expect(dialog).not.toHaveAttribute('data-dragging');
      await settled(panel);
      const dropped = boxOf(panel);
      await real.hover(field);
      await settled(panel);
      same(boxOf(panel).left, dropped.left);
      same(boxOf(panel).top, dropped.top);
      await expect(dialog).not.toHaveAttribute('data-dragging');
    });
  },
};

export const MovableLeavesHeaderButtonsAlone: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog help />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const help = within(dialog).getByRole('button', { name: 'Help' });
      const before = boxOf(panel);
      await dragTo(real, dialog, help, 2, 2);
      await settled(panel);
      same(boxOf(panel).left, before.left);
      same(boxOf(panel).top, before.top);
      await expect(dialog).not.toHaveAttribute('data-dragging');
      // A click on it is a click: the press that starts a drag does not take it.
      let clicks = 0;
      help.addEventListener('click', () => (clicks += 1));
      await real.click(help);
      // (Safari does not focus a button that is clicked, so its focus is not asked about.)
      await expect(clicks).toBe(1);
    });
  },
};

const onHighPriority = fn();

export const MovableLeavesPopupsInTheHeaderAlone: Story = {
  tags: ['no-visual'],
  render: () => (
    <OrderDialog
      tag={
        // A menu and a popover in the header: each renders in place, inside the header.
        <div style={{ display: 'flex', gap: 8, justifySelf: 'start' }}>
          <DropdownMenu>
            <DropdownMenuTrigger variant="ghost" size="sm">
              Priority
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <MenuItem onSelect={onHighPriority}>High</MenuItem>
              <MenuItem>Low</MenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger variant="ghost" size="sm">
              Notes
            </PopoverTrigger>
            <PopoverContent aria-label="Notes">
              <p style={{ margin: 0 }}>Call the shop before delivery.</p>
            </PopoverContent>
          </Popover>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    onHighPriority.mockClear();
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const middle = boxOf(panel);
      const stays = async () => {
        await settled(panel);
        await expect(dialog).not.toHaveAttribute('data-dragging');
        await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
        same(boxOf(panel).left, middle.left);
        same(boxOf(panel).top, middle.top);
      };
      // A press on an item that moves 3px, the drag threshold, before the release chooses the item.
      await real.click(within(dialog).getByRole('button', { name: 'Priority' }));
      const menu = within(dialog).getByRole('menu', { hidden: true });
      await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
      const high = within(menu).getByRole('menuitem', { name: 'High' });
      await real.dragAndDrop(high, high, {
        sourcePosition: { x: 12, y: 8 },
        targetPosition: { x: 15, y: 8 },
      });
      await waitFor(() => expect(onHighPriority).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
      await stays();
      // The text of a popover in the header can be selected, as anywhere else.
      await real.click(within(dialog).getByRole('button', { name: 'Notes' }));
      const note = within(dialog).getByText('Call the shop before delivery.');
      await waitFor(() => expect(note.checkVisibility()).toBe(true));
      const line = boxOf(note);
      await real.dragAndDrop(note, note, {
        sourcePosition: { x: 1, y: line.height / 2 },
        targetPosition: { x: line.width - 1, y: line.height / 2 },
      });
      await expect(window.getSelection()?.toString()).toContain('shop before');
      await stays();
    });
  },
};

// A tag in the header that is not a control but has a click of its own, and a click on the header.
const onTagClick = fn();
const onHeaderClick = fn();

export const MovableKeepsAClickAndMakesNoneFromADrag: Story = {
  tags: ['no-visual'],
  render: () => (
    <OrderDialog
      header={{ onClick: onHeaderClick }}
      tag={
        // A plain element with a click, which is what is tested: the press must not take it.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <span onClick={onTagClick} style={{ justifySelf: 'start' }}>
          Priority
        </span>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    onTagClick.mockClear();
    onHeaderClick.mockClear();
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const tag = within(dialog).getByText('Priority');
      // A press that does not move is a click on what was pressed, and the header hears it after.
      await real.click(tag);
      await expect(onTagClick).toHaveBeenCalledTimes(1);
      await expect(onHeaderClick).toHaveBeenCalledTimes(1);
      // A drag from the same place moves the dialog and is no click, for the tag or the header.
      await dragTo(real, dialog, tag, 2, 2);
      await settled(panel);
      await expect(panel.style.getPropertyValue('--flg-dialog-x')).not.toBe('');
      await delay(50);
      await expect(onTagClick).toHaveBeenCalledTimes(1);
      await expect(onHeaderClick).toHaveBeenCalledTimes(1);
      // A plain click right after the drop makes a double click with the drag's: it is a click, and
      // the pair is no double click, so the dialog stays where it was let go. The drag and its click
      // are the browser's; the second press is dispatched, since a real press can only be given the
      // click count 1 from here (Playwright counts the clicks of a press itself).
      const moved = panel.style.getPropertyValue('--flg-dialog-x');
      const at = boxOf(tag);
      const point = { clientX: at.left + 4, clientY: at.top + 4, bubbles: true, cancelable: true };
      const pointer = { ...point, pointerId: 23, isPrimary: true, pointerType: 'mouse' };
      tag.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, buttons: 1 }));
      tag.dispatchEvent(new MouseEvent('mousedown', { ...point, buttons: 1, detail: 2 }));
      tag.dispatchEvent(new PointerEvent('pointerup', pointer));
      tag.dispatchEvent(new MouseEvent('mouseup', { ...point, detail: 2 }));
      tag.dispatchEvent(new MouseEvent('click', { ...point, detail: 2 }));
      tag.dispatchEvent(new MouseEvent('dblclick', { ...point, detail: 2 }));
      await expect(onTagClick).toHaveBeenCalledTimes(2);
      await expect(onHeaderClick).toHaveBeenCalledTimes(2);
      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe(moved);
      // The click after it is a click again.
      await delay(50);
      await real.click(tag);
      await expect(onTagClick).toHaveBeenCalledTimes(3);
      await expect(onHeaderClick).toHaveBeenCalledTimes(3);
    });
  },
};

export const MovableCentresOnADoubleClick: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog help />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const title = titleOf(dialog);
      const middle = boxOf(panel);
      await dragTo(real, dialog, title, 2, 2);
      await settled(panel);
      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
      // On a control of the header it does nothing.
      await real.dblClick(within(dialog).getByRole('button', { name: 'Help' }));
      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
      // On the header it puts the panel back at once, with no animation to wait for.
      await real.dblClick(title);
      same(boxOf(panel).left, middle.left);
      same(boxOf(panel).top, middle.top);
      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
    });
  },
};

export const MovableKeepsTheFocus: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const input = within(dialog).getByRole('textbox', { name: 'Customer' });
      const title = titleOf(dialog);
      input.focus();
      await expect(input).toHaveFocus();
      // A press on the header, and a drag by it, do not pull the focus out of the field that has it.
      await real.click(title);
      await expect(input).toHaveFocus();
      await dragTo(real, dialog, title, 2, 2);
      await settled(panel);
      await expect(input).toHaveFocus();
      // Nor does the press select the text of the header.
      await expect(window.getSelection()?.toString()).toBe('');
    });
  },
};

export const MovableEscClosesInTheMiddleOfADrag: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const title = titleOf(dialog);
      await panelOf(dialog);
      const at = boxOf(title);
      // A held button cannot be left down from here, so the press is dispatched: a pointer the browser
      // does not know, which the listeners of the page follow all the same. The key is the browser's.
      // The button is down until the release, as it is for a real one.
      const send = (target: EventTarget, type: string, dx: number) =>
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 21,
            isPrimary: true,
            pointerType: 'mouse',
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
            clientX: at.left + 10 + dx,
            clientY: at.top + 5,
          }),
        );
      send(title, 'pointerdown', 0);
      send(document, 'pointermove', 80);
      await expect(dialog).toHaveAttribute('data-dragging');
      await real.keyboard('{Escape}');
      await waitFor(() => expect(dialog.open).toBe(false));
      send(document, 'pointerup', 80);
      await expect(dialog).not.toHaveAttribute('data-dragging');
    });
  },
};

export const MovableFollowsATouch: Story = {
  tags: ['no-visual'],
  render: () => <OrderDialog />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      await viewport.set(WIDE.width, WIDE.height);
      const dialog = dialogIn(canvasElement);
      const panel = await panelOf(dialog);
      const title = titleOf(dialog);
      const before = boxOf(panel);
      const at = boxOf(title);
      // An emulated finger: pointer events of type `touch`, which the browser did not send. A finger
      // on the screen has `buttons` 1, as a pressed mouse does.
      const send = (target: EventTarget, type: string, dx: number, dy: number) =>
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 22,
            isPrimary: true,
            pointerType: 'touch',
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
            clientX: at.left + 10 + dx,
            clientY: at.top + 5 + dy,
          }),
        );
      send(title, 'pointerdown', 0, 0);
      send(document, 'pointermove', 70, 40);
      send(document, 'pointerup', 70, 40);
      await settled(panel);
      same(boxOf(panel).left, before.left + 70);
      same(boxOf(panel).top, before.top + 40);
    });
  },
};
