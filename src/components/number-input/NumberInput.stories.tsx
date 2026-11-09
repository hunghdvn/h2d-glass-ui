import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Card } from '../card/Card';
import { Field } from '../field/Field';
import { NumberInput } from './NumberInput';

const meta = {
  title: 'Components/NumberInput',
  component: NumberInput,
  args: { 'aria-label': 'Quantity', defaultValue: 3, onValueChange: fn() },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: 'grid', gap: 16, width: 320 } as const;
const caption = {
  fontSize: 'var(--flg-text-xs)',
  color: 'var(--flg-text-muted)',
  marginBottom: 6,
} as const;

const frameOf = (input: HTMLElement) => input.parentElement as HTMLElement;
const buttonsOf = (input: HTMLElement) =>
  Array.from(frameOf(input).querySelectorAll<HTMLElement>(':scope > button'));

/** The input of the mockup (N2): − at the left end, + at the right end, the number between them. */
export const Look: Story = {
  render: () => (
    <div style={column}>
      <Card style={{ gap: 12 }}>
        <div>
          <div style={caption}>Medium</div>
          <NumberInput aria-label="Quantity, medium" defaultValue={3} min={1} max={10} />
        </div>
        <div>
          <div style={caption}>Small</div>
          <NumberInput aria-label="Quantity, small" size="sm" defaultValue={3} min={1} max={10} />
        </div>
        <div>
          <div style={caption}>Large</div>
          <NumberInput aria-label="Quantity, large" size="lg" defaultValue={3} min={1} max={10} />
        </div>
        <div>
          <div style={caption}>At the lower limit</div>
          <NumberInput aria-label="Quantity, at minimum" defaultValue={1} min={1} max={10} />
        </div>
        <div>
          <div style={caption}>Disabled</div>
          <NumberInput aria-label="Quantity, disabled" defaultValue={3} disabled />
        </div>
        <Field label="Quantity" description="From 1 to 10" error="Choose at least 2." required>
          <NumberInput name="quantity" defaultValue={1} min={1} max={10} />
        </Field>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const medium = canvas.getByRole('spinbutton', { name: 'Quantity, medium' });
    const small = canvas.getByRole('spinbutton', { name: 'Quantity, small' });
    const large = canvas.getByRole('spinbutton', { name: 'Quantity, large' });
    // The frame is the one of Input: 34, 28 and 40px tall.
    await expect(frameOf(medium).getBoundingClientRect().height).toBe(34);
    await expect(frameOf(small).getBoundingClientRect().height).toBe(28);
    await expect(frameOf(large).getBoundingClientRect().height).toBe(40);
    // The buttons are 32px wide at every size, as tall as the frame inside its border, with a 16px icon.
    for (const input of [medium, small, large]) {
      const [minus, plus] = buttonsOf(input) as [HTMLElement, HTMLElement];
      for (const button of [minus, plus]) {
        const box = button.getBoundingClientRect();
        await expect(box.width).toBe(32);
        await expect(box.height).toBe(frameOf(input).getBoundingClientRect().height - 2);
        const icon = button.querySelector('svg') as SVGElement;
        await expect(icon.getBoundingClientRect().width).toBe(16);
      }
      // A 1px line sits between each button and the text.
      await expect(getComputedStyle(minus).borderRightWidth).toBe('1px');
      await expect(getComputedStyle(plus).borderLeftWidth).toBe('1px');
    }
    // The number is centred and set in tabular figures.
    await expect(getComputedStyle(medium).textAlign).toBe('center');
    await expect(getComputedStyle(medium).fontVariantNumeric).toContain('tabular');
    // A button at its limit is dimmed to 0.4; the other is not.
    const atMinimum = canvas.getByRole('spinbutton', { name: 'Quantity, at minimum' });
    const [less, more] = buttonsOf(atMinimum) as [HTMLElement, HTMLElement];
    await expect(getComputedStyle(less).opacity).toBe('0.4');
    await expect(getComputedStyle(more).opacity).toBe('1');
    // A disabled control is dimmed once, as a whole, as Input is.
    const disabled = canvas.getByRole('spinbutton', { name: 'Quantity, disabled' });
    await expect(getComputedStyle(frameOf(disabled)).opacity).toBe('0.5');
    await expect(getComputedStyle(buttonsOf(disabled)[0] as HTMLElement).opacity).toBe('1');
  },
};

function ControlledQuantity() {
  const [value, setValue] = useState<number | null>(2);
  return (
    <Field label="Quantity" description={`Value: ${value === null ? 'none' : value}`}>
      <NumberInput value={value} onValueChange={setValue} min={0} max={20} />
    </Field>
  );
}

export const InAField: Story = {
  render: () => <ControlledQuantity />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('spinbutton', { name: 'Quantity' });
    await expect(input).toHaveAccessibleDescription('Value: 2');
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await expect(input).toHaveAccessibleDescription('Value: 3');
  },
};

export const Invalid: Story = {
  render: () => (
    <Field label="Quantity" error="Choose at least 2.">
      <NumberInput defaultValue={1} min={1} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('spinbutton', { name: 'Quantity' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Choose at least 2.');
  },
};

function FormDemo() {
  const [sent, setSent] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(String(new FormData(event.currentTarget).get('amount')));
  };
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
      <Field label="Amount" required>
        <NumberInput name="amount" min={0} max={100} step={5} defaultValue={10} />
      </Field>
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
      <output>{sent === '' ? 'Nothing sent' : `Sent: ${sent}`}</output>
    </form>
  );
}

/** Real typing and a real submit: the text is read when the field is left, or on Enter. */
export const Typing: Story = {
  tags: ['no-visual'],
  render: () => <FormDemo />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const input = canvas.getByRole<HTMLInputElement>('spinbutton', { name: /Amount/ });
    const output = canvas.getByRole('status');
    // Typing is free: letters stay until the text is read.
    await real.click(input);
    await real.clear(input);
    await real.keyboard('abc');
    await expect(input).toHaveValue('abc');
    // Text that cannot be read goes back to the old value (10) when the field is left.
    await real.tab();
    await expect(input).toHaveValue('10');
    // A number off the grid is rounded onto it and clamped; Enter settles it, and the form
    // submits that value.
    await real.click(input);
    await real.clear(input);
    await real.keyboard('1,237{Enter}');
    await waitFor(() => expect(output).toHaveTextContent('Sent: 100'));
    await expect(input).toHaveValue('100');
    // Emptying the field is no value, and `required` stops the submit.
    await real.clear(input);
    await real.tab();
    await expect(input.validity.valueMissing).toBe(true);
    // Reset puts back the default.
    await real.click(canvas.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(input).toHaveValue('10'));
  },
};

/** Real keys: the arrows step along the grid, the Page keys ten times as far, Home and End go to the ends. */
export const Keys: Story = {
  tags: ['no-visual'],
  args: { min: 0, max: 50, step: 5, defaultValue: 7 },
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const input = canvas.getByRole('spinbutton');
    await real.tab();
    await expect(input).toHaveFocus();
    await real.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('10');
    await real.keyboard('{ArrowDown}{ArrowDown}');
    await expect(input).toHaveValue('0');
    await real.keyboard('{PageUp}');
    await expect(input).toHaveValue('50');
    await real.keyboard('{Home}');
    await expect(input).toHaveValue('0');
    await real.keyboard('{End}');
    await expect(input).toHaveValue('50');
    await expect(input).toHaveAttribute('aria-valuenow', '50');
  },
};

const pointer = (type: string) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, isPrimary: true });

/**
 * Press and hold on the + button, on the browser's own clock: one step at once, more after 400ms, and
 * none after the release. The pointer events are dispatched, because Vitest's user events have no
 * press that stays down, but they are real `PointerEvent`s.
 */
export const PressAndHold: Story = {
  tags: ['no-visual'],
  args: { min: 0, max: 1000, defaultValue: 0 },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('spinbutton');
    const plus = canvas.getByRole('button', { name: 'Increase' });
    // The repeat stops when the window loses focus or the page is hidden. The story runner opens
    // several pages at once, so another page can take the focus during the hold: note it.
    let lostFocus = false;
    const noteLoss = () => {
      lostFocus = true;
    };
    window.addEventListener('blur', noteLoss);
    document.addEventListener('visibilitychange', noteLoss);
    plus.dispatchEvent(pointer('pointerdown'));
    // One step on the press itself, and the focus did not move to the button.
    await waitFor(() => expect(input).toHaveValue('1'));
    await expect(plus).not.toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 900));
    plus.dispatchEvent(pointer('pointerup'));
    // A step that was already due when the button was released may still be rendering.
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.removeEventListener('blur', noteLoss);
    document.removeEventListener('visibilitychange', noteLoss);
    const held = Number(input.getAttribute('aria-valuenow'));
    // 400ms to start, then a step every 60ms: about 8 more in the next 500ms on an idle machine. A
    // busy CI runner slows the timers of the page and of this story alike (WebKit gave 3 in all), so
    // the check is that the hold repeated at all: a step after the one on the press. A hold that lost
    // the window's focus stopped early, which is what the repeat does then; it still has its first
    // step.
    await expect(held).toBeGreaterThan(lostFocus ? 0 : 1);
    await expect(held).toBeLessThan(20);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(input).toHaveAttribute('aria-valuenow', String(held));
  },
};

/** The wheel steps only when `allowWheel` is set and the field has focus. */
export const Wheel: Story = {
  tags: ['no-visual'],
  args: { allowWheel: true, defaultValue: 5 },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('spinbutton');
    const wheel = (deltaY: number) =>
      input.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }));
    wheel(-100);
    await expect(input).toHaveValue('5');
    input.focus();
    wheel(-100);
    await waitFor(() => expect(input).toHaveValue('6'));
    wheel(100);
    await waitFor(() => expect(input).toHaveValue('5'));
    wheel(100);
    await waitFor(() => expect(input).toHaveValue('4'));
  },
};
