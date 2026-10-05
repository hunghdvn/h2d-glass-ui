import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Field } from '../field/Field';
import { Input } from '../input/Input';
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
