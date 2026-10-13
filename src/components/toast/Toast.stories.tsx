import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
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
