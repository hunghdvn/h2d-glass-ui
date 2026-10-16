import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog/Dialog';
import { Field } from '../field/Field';
import { Input } from '../input/Input';
import { toast } from './toast';
import { Toaster } from './Toaster';

const meta = {
  title: 'Components/Toast',
  component: Toaster,
  parameters: { stage: 'viewport' },
  // One store holds the page's toasts: every story starts and ends without any.
  beforeEach: () => {
    toast.dismiss();
    return () => toast.dismiss();
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const onRetry = fn();

/** The toasts of the approved mockup (toast P3 + S2), with a warning added. Ids keep it to one each. */
function MockupToasts() {
  useEffect(() => {
    toast.success({ id: 'saved', title: 'Changes saved', duration: Infinity });
    toast.error({
      id: 'invoice',
      title: 'Could not send the invoice',
      description: 'Check the connection, then try again.',
      action: { label: 'Retry', onClick: onRetry },
    });
    toast.warning({
      id: 'storage',
      title: 'Storage almost full',
      description: '9.2 GB of 10 GB used.',
      duration: Infinity,
    });
    toast.info({ id: 'sync', title: 'Syncing 14 files…', duration: Infinity });
  }, []);
  return null;
}

export const Default: Story = {
  render: () => (
    <>
      <Toaster max={4} />
      <MockupToasts />
    </>
  ),
};

export const ActionAndClose: Story = {
  tags: ['no-visual'],
  beforeEach: () => {
    onRetry.mockClear();
  },
  render: () => (
    <>
      <Toaster />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={() => toast.success('Changes saved')}>
          Save
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.error({
              title: 'Could not send the invoice',
              action: { label: 'Retry', onClick: onRetry },
            })
          }
        >
          Send invoice
        </Button>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
    // A manual popover, shown at once: the toasts sit in the top layer, above the page.
    await expect(region.matches(':popover-open')).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const saved = await within(region).findByRole('listitem');
    await expect(within(saved).getByRole('img', { name: 'Success' })).toBeInTheDocument();
    await userEvent.click(within(saved).getByRole('button', { name: 'Dismiss notification' }));
    await waitFor(() => expect(within(region).queryByRole('listitem')).toBeNull());
    // The action runs, then the toast closes.
    await userEvent.click(canvas.getByRole('button', { name: 'Send invoice' }));
    await userEvent.click(await within(region).findByRole('button', { name: 'Retry' }));
    await expect(onRetry).toHaveBeenCalledOnce();
    await waitFor(() => expect(within(region).queryByRole('listitem')).toBeNull());
  },
};

export const PausesUnderThePointer: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <Toaster duration={2000} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={() => toast('Changes saved')}>
          Save
        </Button>
        <Button variant="secondary">Elsewhere</Button>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
    await real.click(canvas.getByRole('button', { name: 'Save' }));
    const saved = await within(region).findByRole('listitem');
    // Under the pointer the time stands still, past the toast's 2000 ms.
    await real.hover(saved);
    await delay(2500);
    await expect(saved).toBeInTheDocument();
    // Off it, the time runs on.
    await real.hover(canvas.getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(saved).not.toBeInTheDocument(), { timeout: 4000 });
  },
};

/** A click into a toast is not keyboard focus: it must not hold the time of the toasts that follow. */
export const ClickDoesNotHoldTheTime: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <Toaster duration={2000} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="secondary"
          onClick={() => {
            toast('Upload finished');
            toast('Changes saved');
          }}
        >
          Show two
        </Button>
        <Button variant="secondary">Elsewhere</Button>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
    await real.click(canvas.getByRole('button', { name: 'Show two' }));
    const [upload, saved] = await within(region).findAllByRole('listitem');
    if (!upload || !saved) throw new Error('two toasts');
    // A real click on the close button: focus moves on to the next toast when this one closes.
    await real.click(within(upload).getByRole('button', { name: 'Dismiss notification' }));
    await waitFor(() => expect(upload).not.toBeInTheDocument());
    // The pointer leaves the region for another element; the hover pause ends, and so the time
    // runs: the click's focus holds nothing.
    await real.hover(canvas.getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(saved).not.toBeInTheDocument(), { timeout: 5000 });
  },
};

/** Keyboard focus holds the time: it depends on each browser's `:focus-visible` rule for scripted focus. */
export const KeyboardFocusHoldsTheTime: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <Toaster duration={1500} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="secondary"
          onClick={() => {
            toast('Upload finished');
            toast('Changes saved');
          }}
        >
          Show two
        </Button>
        <Button variant="secondary">Elsewhere</Button>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
    canvas.getByRole('button', { name: 'Show two' }).focus();
    await real.keyboard('{Enter}');
    const [upload, saved] = await within(region).findAllByRole('listitem');
    if (!upload || !saved) throw new Error('two toasts');
    // F8, then Tab into the first toast's button, with real keys: this is keyboard focus.
    await real.keyboard('{F8}');
    await real.keyboard('{Tab}');
    await expect(
      within(upload).getByRole('button', { name: 'Dismiss notification' }),
    ).toHaveFocus();
    // Past the 1500 ms of both toasts, they are still there.
    await delay(2500);
    await expect(upload).toBeInTheDocument();
    await expect(saved).toBeInTheDocument();
    // Focus out of the region: the time runs on.
    await real.click(canvas.getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(upload).not.toBeInTheDocument(), { timeout: 4000 });
    await waitFor(() => expect(saved).not.toBeInTheDocument(), { timeout: 4000 });
  },
};

export const Keyboard: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <Toaster />
      <Button
        variant="secondary"
        onClick={() => {
          toast({ title: 'Upload finished', duration: Infinity });
          toast({ title: 'Changes saved', duration: Infinity });
        }}
      >
        Show two
      </Button>
    </>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
    const showTwo = canvas.getByRole('button', { name: 'Show two' });
    showTwo.focus();
    await real.keyboard('{Enter}');
    const [upload, saved] = await within(region).findAllByRole('listitem');
    if (!upload || !saved) throw new Error('two toasts');
    // F8 moves focus to the region; Tab goes on to the first toast's buttons.
    await real.keyboard('{F8}');
    await expect(region).toHaveFocus();
    await real.keyboard('{Tab}');
    await expect(
      within(upload).getByRole('button', { name: 'Dismiss notification' }),
    ).toHaveFocus();
    // Esc closes the toast that holds focus; focus goes to the toast that takes its place.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(upload).not.toBeInTheDocument());
    await expect(saved).toHaveFocus();
    // With none left, focus goes back to where it was before F8.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(saved).not.toBeInTheDocument());
    await expect(showTwo).toHaveFocus();
  },
};

const onUndo = fn();

export const InADialog: Story = {
  tags: ['no-visual'],
  beforeEach: () => {
    onUndo.mockClear();
  },
  render: () => (
    <>
      <Toaster />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="secondary"
          onClick={() => toast({ id: 'draft', title: 'Draft kept', duration: Infinity })}
        >
          Keep draft
        </Button>
        <Dialog>
          <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
            </DialogHeader>
            <Field label="Name">
              <Input />
            </Field>
            <DialogFooter>
              <Button
                onClick={() =>
                  toast.success({
                    title: 'Profile saved',
                    action: { label: 'Undo', onClick: onUndo },
                  })
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(canvas.getByRole('button', { name: 'Keep draft' }));
    await real.click(canvas.getByRole('button', { name: 'Edit profile' }));
    const dialog = (await canvas.findByRole('dialog', {
      name: 'Edit profile',
    })) as HTMLDialogElement;
    // The region moved into the dialog, with the toast that shows.
    const region = within(dialog).getByRole('region', { name: 'Notifications (F8)' });
    await expect(within(region).getByText('Draft kept')).toBeInTheDocument();
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    await real.type(name, 'Ada');
    // A toast shown from the dialog can be seen and clicked; what was typed stays.
    await real.click(within(dialog).getByRole('button', { name: 'Save' }));
    await real.click(await within(region).findByRole('button', { name: 'Undo' }));
    await expect(onUndo).toHaveBeenCalledOnce();
    await waitFor(() => expect(within(region).queryByText('Profile saved')).toBeNull());
    await expect(dialog.open).toBe(true);
    await expect(name).toHaveValue('Ada');
    // Esc on a toast closes the toast, not the dialog.
    within(region).getByRole('button', { name: 'Dismiss notification' }).focus();
    await real.keyboard('{Escape}');
    await waitFor(() => expect(within(region).queryByText('Draft kept')).toBeNull());
    await expect(dialog.open).toBe(true);
    // Once the dialog closes, the region is back on the page, in the top layer again.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
    const back = canvas.getByRole('region', { name: 'Notifications (F8)' });
    await expect(dialog.contains(back)).toBe(false);
    await expect(back.matches(':popover-open')).toBe(true);
  },
};
