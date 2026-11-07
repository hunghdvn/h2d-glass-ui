import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import { Card, CardHeader, CardTitle } from '../card/Card';
import { Step, Stepper } from './Stepper';
import type { StepperProps } from './Stepper';

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  // The stories hand each Stepper its steps, so the controls have nothing to drive.
  args: { value: 0, children: null },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const caption = {
  marginBottom: 6,
  color: 'var(--flg-text-muted)',
  fontSize: 'var(--flg-text-xs)',
} as const;

/** The dashed frame the mockup draws around the 320px form. */
const narrowFrame = {
  width: 320,
  boxSizing: 'border-box',
  outline: '1px dashed color-mix(in srgb, var(--flg-text-muted) 50%, transparent)',
  outlineOffset: 6,
  margin: '6px 0 4px',
} as const;

type Look = Pick<StepperProps, 'variant'>;

function Checkout({ value = 2, status, ...rest }: Partial<StepperProps> & { status?: 'error' }) {
  return (
    <Stepper value={value} {...rest}>
      <Step title="Cart" />
      <Step title="Delivery" />
      <Step title="Payment" status={status} description={status ? 'Card declined' : undefined} />
      <Step title="Confirm" />
    </Stepper>
  );
}

/**
 * The states of the approved mockup (stepper St1-St3), in a card as there: two steps done, one
 * current and one ahead; the current step failed; keyboard focus on a step that is done, which can be
 * pressed to go back; vertical with a description under each name; and the narrow form in a 320px
 * frame. The steps of the focus block are the only ones that can be pressed, so Tab reaches them
 * first.
 */
function Order({ variant }: Look) {
  return (
    <Card style={{ gap: 14, width: 600 }}>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
      </CardHeader>
      <div>
        <div style={caption}>Horizontal · 2 steps done, 1 current, 1 ahead</div>
        <Checkout variant={variant} />
      </div>
      <div>
        <div style={caption}>The current step failed</div>
        <Checkout variant={variant} status="error" />
      </div>
      <div>
        <div style={caption}>Keyboard focus on a step that is done (it can be pressed)</div>
        <Checkout variant={variant} onValueChange={() => {}} />
      </div>
      <div>
        <div style={caption}>Vertical, with descriptions</div>
        <Stepper value={2} variant={variant} orientation="vertical">
          <Step title="Cart" description="3 items" />
          <Step title="Delivery" description="Home delivery, 2–3 days" />
          <Step title="Payment" description="Card or bank transfer" />
          <Step title="Confirm" description="Review and place the order" />
        </Stepper>
      </div>
      <div>
        <div style={caption}>Narrow · 320px frame</div>
        <div style={narrowFrame}>
          <Checkout variant={variant} />
        </div>
      </div>
    </Card>
  );
}

// Tab twice: the first stop is the first step, the mockup draws the focus on the second one.
const focusSecondStep: Story['play'] = async ({ canvas }) => {
  await userEvent.tab();
  await userEvent.tab();
  const focused = canvas.getAllByRole('button', { name: /Delivery/ })[0]!;
  await expect(focused).toHaveFocus();
  await expect(focused.matches(':focus-visible')).toBe(true);
};

export const Circles: Story = { render: () => <Order variant="circles" />, play: focusSecondStep };
export const Compact: Story = { render: () => <Order variant="compact" />, play: focusSecondStep };
export const Bars: Story = { render: () => <Order variant="bars" />, play: focusSecondStep };

/** A Stepper the user walks back through: the content of each step is the page's, driven by `value`. */
function Wizard({ variant, width }: Look & { width?: number }) {
  const [value, setValue] = useState(2);
  return (
    <div style={{ width }} data-wizard={variant}>
      <Checkout variant={variant} value={value} onValueChange={setValue} />
    </div>
  );
}

/**
 * Narrow, in a 320px frame, in each look: the words of the steps other than the current one are out
 * of sight, and are still in the accessibility tree. Tab reaches each step that can be pressed, Enter
 * and Space press it, and the focus stays on the step that was pressed when it becomes the current one.
 */
export const Narrow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Wizard variant="circles" width={320} />
      <Wizard variant="compact" width={320} />
      <Wizard variant="bars" width={320} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const seen = (element: Element) => {
      const { width, height } = element.getBoundingClientRect();
      return width > 2 && height > 2;
    };
    for (const variant of ['circles', 'compact', 'bars']) {
      const frame = canvasElement.querySelector<HTMLElement>(`[data-wizard="${variant}"]`)!;
      const [cart, delivery, payment] = Array.from(frame.querySelectorAll('.flg-step-text'));
      // Out of sight, but a screen reader still gets the whole phrase.
      await expect(seen(cart!)).toBe(false);
      await expect(seen(delivery!)).toBe(false);
      await expect(seen(payment!)).toBe(true);
      await expect(cart!.textContent).toContain('Step 1 of 4: ');
      const accessible = frame.querySelector('button');
      await expect(accessible).toHaveAccessibleName(/^Step 1 of 4:\s*Cart.*Completed$/);
    }
    const circles = canvasElement.querySelector<HTMLElement>('[data-wizard="circles"]')!;
    const stepButton = (title: string) =>
      Array.from(circles.querySelectorAll('button')).find((button) =>
        button.textContent?.includes(title),
      )!;
    const current = () => circles.querySelector('[aria-current="step"]');
    await expect(current()).toBe(stepButton('Payment'));
    await userEvent.tab();
    await expect(stepButton('Cart')).toHaveFocus();
    await userEvent.tab();
    await expect(stepButton('Delivery')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(current()).toBe(stepButton('Delivery'));
    // Pressed, it is the current step, and it is still the focused button.
    await expect(stepButton('Delivery')).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(stepButton('Cart')).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(current()).toBe(stepButton('Cart'));
    await expect(stepButton('Cart')).toHaveFocus();
    // Back at the first step, the steps ahead are out of reach: only the current one is a button.
    await expect(circles.querySelectorAll('button')).toHaveLength(1);
  },
};

/**
 * A horizontal Stepper fills the row it is in, also as an item of a flex row beside a box: as a
 * container its content does not size it, so without `width: 100%` it would be 0px wide. Only a real
 * layout can show it.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div data-row style={{ display: 'flex', alignItems: 'center', gap: 12, width: 480 }}>
      <span data-box style={{ flex: 'none', width: 40, height: 40 }} />
      <Checkout />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>('[data-row]')!;
    const stepper = canvasElement.querySelector<HTMLElement>('.flg-stepper')!;
    // The rest of the row: the row less the box and the 12px gap.
    const rest = row.getBoundingClientRect().width - 40 - 12;
    await expect(Math.abs(stepper.getBoundingClientRect().width - rest)).toBeLessThanOrEqual(1);
  },
};
