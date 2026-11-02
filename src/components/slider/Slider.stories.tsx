import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Card } from '../card/Card';
import { Field } from '../field/Field';
import { Slider } from './Slider';

const meta = {
  title: 'Components/Slider',
  component: Slider,
  args: {
    'aria-label': 'Volume',
    defaultValue: 60,
    onValueChange: fn(),
    onValueCommit: fn(),
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: 'grid', gap: 16, width: 420 } as const;

/** The value at the right of the label row goes through `aside`; it is read from `aria-valuetext`. */
const value = (text: string) => <span aria-hidden="true">{text}</span>;

/** The sliders of the mockup (S3): a value in the label row, the bubble, the dots, a disabled one. */
export const Look: Story = {
  render: () => (
    <div style={column}>
      <Card style={{ gap: 14 }}>
        <Field label="Volume" aside={value('60%')}>
          <Slider defaultValue={60} getValueText={(v) => `${v}%`} />
        </Field>
        <Field label="Price range" aside={value('20 – 75 million')}>
          <Slider defaultValue={[20, 75]} />
        </Field>
        <Field label="Brightness" aside={value('3 / 5')}>
          <Slider min={1} max={5} defaultValue={3} getValueText={(v) => `${v} of 5`} />
        </Field>
        <Field label="Alert sound (off)" aside={value('40%')} disabled>
          <Slider defaultValue={40} getValueText={(v) => `${v}%`} />
        </Field>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const volume = canvas.getByRole('slider', { name: 'Volume' });
    const brightness = canvas.getByRole('slider', { name: 'Brightness' });
    const alert = canvas.getByRole('slider', { name: 'Alert sound (off)' });
    const control = volume.parentElement as HTMLElement;
    const box = (el: Element) => el.getBoundingClientRect();
    // The control is 20px tall, the track 4px, the thumb 16px, as in the mockup.
    await expect(box(control).height).toBe(20);
    await expect(box(control.querySelector('.flg-slider-track') as Element).height).toBe(4);
    await expect(box(volume).width).toBe(16);
    await expect(box(volume).height).toBe(16);
    // The centre of the thumb is at 60% of the track.
    const track = box(control);
    await expect(box(volume).left + 8 - track.left).toBeCloseTo(track.width * 0.6, 0);
    // The bubble is 24px tall and its bottom edge is 6px above the top of the thumb.
    const bubble = volume.querySelector('.flg-slider-bubble') as HTMLElement;
    await expect(box(bubble).height).toBe(24);
    await expect(box(volume).top - box(bubble).bottom).toBeCloseTo(6, 0);
    await expect(bubble).toHaveTextContent('60%');
    // The range slider: a group with two thumbs, and the fill runs from the one to the other.
    const price = canvas.getByRole('group', { name: 'Price range' });
    const [low, high] = within(price).getAllByRole('slider') as [HTMLElement, HTMLElement];
    await expect(low).toHaveAccessibleName('Minimum');
    await expect(high).toHaveAccessibleName('Maximum');
    const priceBox = box(price.querySelector('.flg-slider-control') as Element);
    const fill = box(price.querySelector('.flg-slider-fill') as Element);
    await expect(fill.left - priceBox.left).toBeCloseTo(priceBox.width * 0.2, 0);
    await expect(fill.width).toBeCloseTo(priceBox.width * 0.55, 0);
    await expect(box(low).left + 8 - priceBox.left).toBeCloseTo(priceBox.width * 0.2, 0);
    await expect(box(high).left + 8 - priceBox.left).toBeCloseTo(priceBox.width * 0.75, 0);
    await expect(low.querySelector('.flg-slider-bubble')).toHaveTextContent('20');
    await expect(high.querySelector('.flg-slider-bubble')).toHaveTextContent('75');
    // The 30px above the control are kept for the bubble, in the HTML itself.
    const root = control.parentElement as HTMLElement;
    await expect(box(control).top - box(root).top).toBe(30);
    // Five steps: five dots, 9px under the centre of the track, 4px across.
    const dots = brightness.parentElement?.querySelectorAll('.flg-slider-ticks > i') ?? [];
    await expect(dots.length).toBe(5);
    const brightnessTrack = box(brightness.parentElement as HTMLElement);
    const dot = box(dots[1] as Element);
    await expect(dot.width).toBe(4);
    await expect(dot.top - (brightnessTrack.top + brightnessTrack.height / 2)).toBeCloseTo(9, 0);
    // The volume slider has 100 steps and so no dots.
    await expect(control.querySelector('.flg-slider-ticks')).toBeNull();
    // A disabled slider has no bubble and keeps no room for one.
    await expect(alert.querySelector('.flg-slider-bubble')).toBeNull();
    await expect(alert).toHaveAttribute('aria-disabled', 'true');
    await expect(getComputedStyle(alert.closest('.flg-slider') as Element).paddingTop).toBe('0px');
  },
};

function ControlledVolume() {
  const [volume, setVolume] = useState(35);
  return (
    <Field label="Volume" aside={value(`${volume}%`)} description="Takes effect at once.">
      <Slider value={volume} onValueChange={setVolume} getValueText={(v) => `${v}%`} />
    </Field>
  );
}

export const InAField: Story = {
  render: () => (
    <div style={column}>
      <ControlledVolume />
    </div>
  ),
  play: async ({ canvas }) => {
    const slider = canvas.getByRole('slider', { name: 'Volume' });
    await expect(slider).toHaveAccessibleDescription('Takes effect at once.');
    // The value in the label row is not part of the name: it is hidden, and sits outside the label.
    await expect(slider).toHaveAttribute('aria-valuetext', '35%');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuetext', '36%'));
    await expect(canvas.getByText('36%', { selector: '.flg-field-aside *' })).toBeInTheDocument();
  },
};

export const Invalid: Story = {
  render: () => (
    <div style={column}>
      <Field label="Volume" error="Too loud for the night mode.">
        <Slider defaultValue={90} />
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('slider', { name: 'Volume' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

/** A mark on the page at a fraction of the track, to drop the thumb on. */
function markAt(control: HTMLElement, fraction: number) {
  const box = control.getBoundingClientRect();
  const mark = document.createElement('div');
  mark.style.cssText = `position:fixed;width:2px;height:2px;left:${box.left + box.width * fraction}px;top:${box.top + box.height / 2}px`;
  document.body.append(mark);
  return mark;
}

/**
 * A real pointer: the thumb is dragged, and a press on the track makes the thumb jump there and goes on
 * as a drag. The value changes at each move and is committed once, at the release.
 */
export const Dragging: Story = {
  tags: ['no-visual'],
  args: { defaultValue: 20, 'aria-label': 'Volume' },
  render: (args) => (
    <div style={{ width: 400, paddingTop: 20 }}>
      <Slider {...args} />
    </div>
  ),
  play: async ({ canvas, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const slider = canvas.getByRole('slider', { name: 'Volume' });
    const control = slider.parentElement as HTMLElement;
    const marks: HTMLElement[] = [];
    try {
      // Drag from 20 to about 90.
      const nine = markAt(control, 0.9);
      marks.push(nine);
      await real.dragAndDrop(slider, nine);
      await waitFor(() => expect(Number(slider.getAttribute('aria-valuenow'))).toBeGreaterThan(85));
      await expect(Number(slider.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(95);
      // One commit for the whole drag, with the value that the last change reported.
      await expect(args.onValueCommit).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(
        Number(slider.getAttribute('aria-valuenow')),
      );
      await expect(args.onValueCommit).toHaveBeenCalledWith(
        Number(slider.getAttribute('aria-valuenow')),
      );
      // The thumb has the focus, but the ring does not show: the press was not the keyboard.
      await expect(slider).toHaveFocus();
      await expect(getComputedStyle(slider).outlineStyle).toBe('none');
      // The drag selected no text.
      await expect(window.getSelection()?.toString()).toBe('');
      // A press on the track, away from the thumb, puts the thumb under the pointer: the middle.
      await real.click(control);
      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '50'));
      await expect(args.onValueCommit).toHaveBeenCalledTimes(2);
    } finally {
      for (const mark of marks) mark.remove();
    }
  },
};

function FormDemo() {
  const [sent, setSent] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(String(new FormData(event.currentTarget).get('volume')));
  };
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
      <Field label="Volume">
        <Slider name="volume" defaultValue={30} step={5} />
      </Field>
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
      <output>{sent ? `Sent: ${sent}` : 'Nothing sent'}</output>
    </form>
  );
}

/** Real keys and a real submit and reset: Tab reaches the thumb, the keys move it, the form gets the value. */
export const Keyboard: Story = {
  tags: ['no-visual'],
  render: () => <FormDemo />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    const slider = canvas.getByRole('slider', { name: 'Volume' });
    const output = canvas.getByRole('status');
    if (!real) return;
    await real.tab();
    await expect(slider).toHaveFocus();
    // Keyboard focus shows the ring: an outline and the ring shadow on the thumb.
    await expect(slider.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(slider).outlineStyle).toBe('solid');
    await real.keyboard('{ArrowRight}{ArrowRight}');
    await expect(slider).toHaveAttribute('aria-valuenow', '40');
    await real.keyboard('{PageUp}');
    await expect(slider).toHaveAttribute('aria-valuenow', '50');
    await real.keyboard('{End}');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
    await real.keyboard('{Home}{ArrowDown}');
    await expect(slider).toHaveAttribute('aria-valuenow', '0');
    await real.keyboard('{ArrowUp}');
    await expect(slider).toHaveAttribute('aria-valuenow', '5');
    await real.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(output).toHaveTextContent('Sent: 5'));
    await real.click(canvas.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '30'));
  },
};

/**
 * A real pointer on a range: each thumb is dragged, a thumb dragged past the other stops at its value,
 * and with both on one value the first move says which of them goes.
 */
export const RangeDragging: Story = {
  tags: ['no-visual'],
  args: { defaultValue: [10, 90], 'aria-label': 'Price' },
  render: (args) => (
    <div style={{ width: 400, paddingTop: 20 }}>
      <Slider {...args} />
    </div>
  ),
  play: async ({ canvas, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const group = canvas.getByRole('group', { name: 'Price' });
    const [low, high] = within(group).getAllByRole('slider') as [HTMLElement, HTMLElement];
    const control = low.parentElement as HTMLElement;
    const now = () => [low, high].map((thumb) => Number(thumb.getAttribute('aria-valuenow')));
    const marks: HTMLElement[] = [];
    const mark = (fraction: number) => {
      const el = markAt(control, fraction);
      marks.push(el);
      return el;
    };
    try {
      // The lower thumb from 10 to about 30; the upper one stays.
      await real.dragAndDrop(low, mark(0.3));
      await waitFor(() => expect(now()[0]).toBeGreaterThan(25));
      await expect(now()[0]).toBeLessThanOrEqual(35);
      await expect(now()[1]).toBe(90);
      await expect(args.onValueCommit).toHaveBeenCalledTimes(1);
      await expect(args.onValueCommit).toHaveBeenLastCalledWith(now());
      await expect(low).toHaveFocus();
      // The upper thumb to about 70.
      await real.dragAndDrop(high, mark(0.7));
      await waitFor(() => expect(now()[1]).toBeLessThan(75));
      await expect(now()[1]).toBeGreaterThanOrEqual(65);
      await expect(high).toHaveFocus();
      // The upper thumb dragged far to the left stops at the lower one: they do not cross.
      const lowAt = now()[0] as number;
      await real.dragAndDrop(high, mark(0.02));
      await waitFor(() => expect(now()).toEqual([lowAt, lowAt]));
      // Both on one value, the upper thumb on top: the first move, to the right, takes the upper thumb, and the lower stays.
      await real.dragAndDrop(high, mark(0.9));
      await waitFor(() => expect(now()[1]).toBeGreaterThan(85));
      await expect(now()[0]).toBe(lowAt);
    } finally {
      for (const el of marks) el.remove();
    }
  },
};

function TwoRanges() {
  return (
    <div style={{ width: 400, paddingTop: 20, display: 'grid', gap: 24 }}>
      <Slider aria-label="Near the upper thumb" defaultValue={[10, 55]} />
      <Slider aria-label="Near the lower thumb" defaultValue={[45, 90]} />
    </div>
  );
}

/** A press on the track moves the thumb nearest to it: the middle of the track is near one thumb of each slider. */
export const RangeTrack: Story = {
  tags: ['no-visual'],
  render: () => <TwoRanges />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const parts = (name: string) => {
      const group = canvas.getByRole('group', { name });
      return {
        control: group.firstElementChild as HTMLElement,
        thumbs: within(group).getAllByRole('slider') as [HTMLElement, HTMLElement],
      };
    };
    const upper = parts('Near the upper thumb');
    await real.click(upper.control);
    await waitFor(() => expect(upper.thumbs[1]).toHaveAttribute('aria-valuenow', '50'));
    await expect(upper.thumbs[0]).toHaveAttribute('aria-valuenow', '10');
    await expect(upper.thumbs[1]).toHaveFocus();
    const lower = parts('Near the lower thumb');
    await real.click(lower.control);
    await waitFor(() => expect(lower.thumbs[0]).toHaveAttribute('aria-valuenow', '50'));
    await expect(lower.thumbs[1]).toHaveAttribute('aria-valuenow', '90');
    await expect(lower.thumbs[0]).toHaveFocus();
  },
};

function RangeFormDemo() {
  const [sent, setSent] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(new FormData(event.currentTarget).getAll('price').join(','));
  };
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
      <Field label="Price range">
        <Slider name="price" defaultValue={[20, 70]} step={5} />
      </Field>
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
      <output>{sent ? `Sent: ${sent}` : 'Nothing sent'}</output>
    </form>
  );
}

/** Real keys on both thumbs: each stops at the other, and the form gets both values, the lower first. */
export const RangeKeyboard: Story = {
  tags: ['no-visual'],
  render: () => <RangeFormDemo />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    const [low, high] = canvas.getAllByRole('slider') as [HTMLElement, HTMLElement];
    const output = canvas.getByRole('status');
    if (!real) return;
    await real.tab();
    await expect(low).toHaveFocus();
    await expect(low.matches(':focus-visible')).toBe(true);
    await real.keyboard('{ArrowRight}{ArrowRight}');
    await expect(low).toHaveAttribute('aria-valuenow', '30');
    // The lower thumb stops at the upper one.
    await real.keyboard('{End}');
    await expect(low).toHaveAttribute('aria-valuenow', '70');
    await expect(high).toHaveAttribute('aria-valuemin', '70');
    await real.tab();
    await expect(high).toHaveFocus();
    await real.keyboard('{ArrowUp}{PageUp}');
    await expect(high).toHaveAttribute('aria-valuenow', '85');
    await real.keyboard('{Home}');
    await expect(high).toHaveAttribute('aria-valuenow', '70');
    await real.keyboard('{End}');
    await expect(high).toHaveAttribute('aria-valuenow', '100');
    await real.keyboard('{ArrowDown}');
    await expect(high).toHaveAttribute('aria-valuenow', '95');
    await real.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(output).toHaveTextContent('Sent: 70,95'));
    await real.click(canvas.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(high).toHaveAttribute('aria-valuenow', '70'));
    await expect(low).toHaveAttribute('aria-valuenow', '20');
  },
};
