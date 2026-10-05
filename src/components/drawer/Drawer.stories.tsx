import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { CloseIcon } from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { IconButton } from '../icon-button/IconButton';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './Drawer';
import type { DrawerContentProps } from './Drawer';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '6px 12px',
  color: 'var(--flg-text-muted)',
  fontSize: 'var(--flg-text-sm)',
} as const;
const amount = { color: 'var(--flg-text)', fontWeight: 'var(--flg-weight-medium)' } as const;

// The drawer from the approved mockup: a title row with a close button, totals, actions at the end.
function InvoiceDrawer(props: DrawerContentProps) {
  return (
    <DrawerContent {...props}>
      <DrawerHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <DrawerTitle>Invoice details</DrawerTitle>
          <DrawerClose asChild>
            <IconButton aria-label="Close drawer" variant="ghost" size="sm">
              <CloseIcon width={15} height={15} />
            </IconButton>
          </DrawerClose>
        </div>
        <DrawerDescription>INV-2026-0142 · Minh An JSC</DrawerDescription>
      </DrawerHeader>
      <div style={rows}>
        <span>Subtotal</span>
        <b style={amount}>$12,400</b>
        <span>VAT 8%</span>
        <b style={amount}>$992</b>
        <span>Total</span>
        <b style={amount}>$13,392</b>
      </div>
      <DrawerFooter>
        <DrawerClose variant="ghost">Close</DrawerClose>
        <DrawerClose>Send invoice</DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
}

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger variant="secondary">Invoice details</DrawerTrigger>
      <InvoiceDrawer />
    </Drawer>
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Invoice details' });
    await userEvent.click(trigger);
    const drawer = canvas.getByRole('dialog', { name: 'Invoice details' });
    await expect(drawer).toHaveAttribute('data-side', 'right');
    await expect(drawer).toHaveAccessibleDescription('INV-2026-0142 · Minh An JSC');
    // The first focusable element is the close button in the title row.
    await expect(within(drawer).getByRole('button', { name: 'Close drawer' })).toHaveFocus();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close drawer' }));
    await expect(drawer).toHaveProperty('open', false);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    const real = await realUserEvent();
    if (!real) return;
    await real.click(trigger);
    // The frame left of the panel is outside it.
    await real.click(drawer, { position: { x: 4, y: 200 } });
    await waitFor(() => expect(drawer).toHaveProperty('open', false));
    await expect(trigger).toHaveFocus();
  },
};

export const Flush: Story = {
  render: (args) => (
    <Drawer {...args} defaultOpen>
      <InvoiceDrawer />
    </Drawer>
  ),
};

export const Floating: Story = {
  render: (args) => (
    <Drawer {...args} defaultOpen>
      <InvoiceDrawer variant="floating" />
    </Drawer>
  ),
};

export const Bottom: Story = {
  render: (args) => (
    <Drawer {...args} defaultOpen>
      <InvoiceDrawer side="bottom" />
    </Drawer>
  ),
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('dialog').querySelector('.flg-drawer-panel') as HTMLElement;
    await settled(panel);
    const box = panel.getBoundingClientRect();
    // Full width at the bottom edge, no taller than 85% of the viewport.
    await expect(Math.round(box.bottom)).toBe(window.innerHeight);
    await expect(box.height).toBeLessThanOrEqual(window.innerHeight * 0.85 + 1);
  },
};
