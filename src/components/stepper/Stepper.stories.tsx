import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import { FillFrames, checkFillFrames } from '../../../.storybook/fill-frames';
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
      <NarrowEdges />
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
    await checkNarrowEdges(canvasElement);
  },
};

const SHORT = ['Cart', 'Delivery', 'Payment', 'Confirm'];
const LONG = ['Shipping address', 'Delivery window', 'Payment method', 'Review and pay'];
/** Where the process is, and which step failed, for each edge case of the narrow form. */
const EDGE_CASES = [
  { name: 'first current', value: 0, failed: undefined },
  { name: 'last current', value: 3, failed: undefined },
  { name: 'first failed', value: 2, failed: 0 },
  { name: 'last failed', value: 0, failed: 3 },
] as const;

/**
 * The first and the last step of a narrow Stepper have no column beside them on one side, and the
 * words of the current or failed step run on one line. The Stepper is 320px wide and ends 16px from
 * the right edge of the page, as on a phone, so words that leave it widen the page.
 */
function NarrowEdges() {
  return (
    <div
      data-edges
      style={{ display: 'grid', gap: 12, width: 320, marginLeft: 'max(0px, calc(100vw - 336px))' }}
    >
      {(['circles', 'compact', 'bars'] as const).flatMap((variant) =>
        [SHORT, LONG].flatMap((names, length) =>
          EDGE_CASES.map(({ name, value, failed }) => (
            <Stepper
              key={`${variant}-${length}-${name}`}
              data-edge={`${variant} ${length ? 'long' : 'short'} ${name}`}
              variant={variant}
              value={value}
            >
              {names.map((title, index) => (
                <Step key={title} title={title} status={index === failed ? 'error' : undefined} />
              ))}
            </Stepper>
          )),
        ),
      )}
      {(['circles', 'compact', 'bars'] as const).flatMap((variant) =>
        [undefined, 'error' as const].map((status) => (
          <div key={`${variant}-${status}`} data-approved={`${variant} ${status ?? 'current'}`}>
            <Checkout variant={variant} status={status} />
          </div>
        )),
      )}
    </div>
  );
}

/** Where the words of an element are, also the part that runs past its box. */
function extent(element: HTMLElement) {
  const box = element.getBoundingClientRect();
  if (getComputedStyle(element).overflow !== 'visible') return box;
  const range = document.createRange();
  range.selectNodeContents(element);
  const words = range.getBoundingClientRect();
  return { left: Math.min(box.left, words.left), right: Math.max(box.right, words.right) };
}

async function checkNarrowEdges(canvasElement: HTMLElement) {
  const steppers = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-edge]'));
  await expect(steppers).toHaveLength(24);
  for (const stepper of steppers) {
    const label = stepper.dataset.edge;
    const box = stepper.getBoundingClientRect();
    for (const text of stepper.querySelectorAll<HTMLElement>('.flg-step-text')) {
      if (text.getBoundingClientRect().width <= 2) continue;
      for (const part of text.querySelectorAll<HTMLElement>(
        '.flg-step-title, .flg-step-description, .flg-step-caption',
      )) {
        const { left, right } = extent(part);
        await expect(left, `${label}: left edge of "${part.textContent}"`).toBeGreaterThanOrEqual(
          box.left - 0.5,
        );
        await expect(right, `${label}: right edge of "${part.textContent}"`).toBeLessThanOrEqual(
          box.right + 0.5,
        );
      }
    }
  }
  // In `compact` the words of the first and the last step stay level with their dot.
  for (const stepper of steppers.filter((el) => el.dataset.edge?.startsWith('compact'))) {
    const steps = stepper.querySelectorAll<HTMLElement>('.flg-step');
    for (const step of [steps[0]!, steps[steps.length - 1]!]) {
      if (!['current', 'error'].includes(step.dataset.state!)) continue;
      const middle = (el: Element) => {
        const { top, height } = el.getBoundingClientRect();
        return top + height / 2;
      };
      await expect(
        Math.abs(
          middle(step.querySelector('.flg-step-title')!) -
            middle(step.querySelector('.flg-step-indicator')!),
        ),
        `${stepper.dataset.edge}: title level with its dot`,
      ).toBeLessThanOrEqual(1);
    }
  }
  // The approved states: no visible title is cut.
  const approved = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-approved]'));
  await expect(approved).toHaveLength(6);
  for (const frame of approved) {
    for (const title of frame.querySelectorAll<HTMLElement>('.flg-step-title')) {
      if (title.getBoundingClientRect().width <= 2) continue;
      await expect(
        title.scrollWidth,
        `${frame.dataset.approved}: "${title.textContent}" is cut`,
      ).toBeLessThanOrEqual(title.clientWidth);
    }
  }
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
}

/**
 * A horizontal Stepper fills the row it is in, also as an item of a flex row beside a box: as a
 * container its content does not size it, so without a width that fills the row it would be 0px
 * wide. Only a real layout can show it.
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

/**
 * The margin, padding and border of a horizontal Stepper come out of its width: with `margin: 0 16px`
 * or `padding: 8px`, in a 400px block and in a flex row beside a box, it stays inside its parent and
 * still fills what the parent leaves it.
 */
export const MarginAndPadding: Story = {
  tags: ['no-visual'],
  render: () => <FillFrames name="stepper" render={(style) => <Checkout style={style} />} />,
  play: async ({ canvasElement }) => checkFillFrames(canvasElement, 'stepper'),
};

/** The owner's case: one long name among short ones. */
const MIXED = ['Cart', 'Delivery', 'A very long payment step name here', 'Confirm'];

/**
 * `compact` with names too long for the width. The room is shared out as a grid shares it: a name
 * that fits keeps its whole width, and only a name that still lacks room is cut short with an
 * ellipsis, so that no two steps overlap, every line between two steps keeps its 12px, and nothing
 * passes the right edge of the Stepper. The full name is still the accessible text. Above the narrow
 * breakpoint every name is long (520px) or one is (480px, the owner's names); in the narrow form
 * (320px) the long name of the current step, a middle one, is cut the same way.
 */
export const LongNames: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div data-frame="all long" style={{ width: 520 }}>
        <Stepper value={1} variant="compact">
          <Step title="Shopping cart" />
          <Step title="Delivery address" description="Where it goes" />
          <Step title="Payment method" />
          <Step title="Review and confirm" />
        </Stepper>
      </div>
      <div data-frame="one long" style={{ width: 480 }}>
        <Stepper value={1} variant="compact">
          {MIXED.map((title) => (
            <Step key={title} title={title} />
          ))}
        </Stepper>
      </div>
      <div data-frame="narrow" style={{ width: 320 }}>
        <Stepper value={1} variant="compact">
          <Step title="Cart" />
          <Step title="A very long delivery step name" />
          <Step title="Payment" />
          <Step title="Confirm" />
        </Stepper>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = (name: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-frame="${name}"] .flg-stepper`)!;
    const titles = (name: string) =>
      Array.from(frame(name).querySelectorAll<HTMLElement>('.flg-step-title'));
    const cut = (title: HTMLElement) => title.scrollWidth > title.clientWidth;
    // One long name: only that one is cut; the short names keep their whole width.
    await expect(titles('one long').map(cut), 'the names that are cut').toEqual([
      false,
      false,
      true,
      false,
    ]);
    await expect(frame('one long').textContent).toContain(MIXED[2]);
    // Every name long: some are cut, and the whole name stays in the accessible text.
    await expect(titles('all long').filter(cut).length).toBeGreaterThan(0);
    await expect(frame('all long').textContent).toContain('Review and confirm');
    // Narrow: the long name of the current step is cut, and its words stay inside the Stepper.
    const current = titles('narrow')[1]!;
    await expect(cut(current), 'the long current name is cut').toBe(true);
    const words = current.getBoundingClientRect();
    const box = frame('narrow').getBoundingClientRect();
    await expect(words.left).toBeGreaterThanOrEqual(box.left - 0.5);
    await expect(words.right).toBeLessThanOrEqual(box.right + 0.5);
    // In each, no step overlaps the next, every line keeps its 12px, and nothing passes the edge.
    for (const name of ['all long', 'one long', 'narrow']) {
      const stepper = frame(name);
      const steps = Array.from(stepper.querySelectorAll<HTMLElement>('.flg-step'));
      for (const [index, step] of steps.entries()) {
        const label = `${name}: step ${index + 1}`;
        const box = step.getBoundingClientRect();
        await expect(inner(step).right, `${label} stays in its column`).toBeLessThanOrEqual(
          box.right + 0.5,
        );
        const next = steps[index + 1];
        if (next) {
          await expect(box.right, `${label} ends before the next`).toBeLessThanOrEqual(
            next.getBoundingClientRect().left + 0.5,
          );
          const line = parseFloat(getComputedStyle(step, '::after').width);
          await expect(line, `${label}: the line after it`).toBeGreaterThanOrEqual(12);
        }
      }
      await expect(inner(steps.at(-1)!).right, name).toBeLessThanOrEqual(
        stepper.getBoundingClientRect().right + 0.5,
      );
      await expect(stepper.scrollWidth, name).toBeLessThanOrEqual(stepper.clientWidth);
    }
  },
};

function inner(step: HTMLElement) {
  return step.querySelector<HTMLElement>('.flg-step-inner')!.getBoundingClientRect();
}
