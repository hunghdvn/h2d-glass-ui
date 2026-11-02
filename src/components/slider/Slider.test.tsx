import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { Slider } from './Slider';
import type { SliderProps } from './Slider';

const thumb = () => screen.getByRole('slider');
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));

function Volume(props: SliderProps) {
  return <Slider aria-label="Volume" {...props} />;
}

/** The control is 200px wide and starts at x = 0, so a fraction of the track is 2px per percent. */
function layOut(container: HTMLElement, thumbAt?: number) {
  const control = container.querySelector('.flg-slider-control') as HTMLElement;
  control.getBoundingClientRect = () =>
    ({ left: 0, right: 200, width: 200, top: 0, bottom: 20, height: 20, x: 0, y: 0 }) as DOMRect;
  if (thumbAt !== undefined) {
    thumb().getBoundingClientRect = () =>
      ({ left: thumbAt - 8, right: thumbAt + 8, width: 16, height: 16 }) as DOMRect;
  }
  return control;
}

const press = (el: Element, clientX: number, init: PointerEventInit = {}) =>
  fireEvent.pointerDown(el, { clientX, pointerId: 1, button: 0, isPrimary: true, ...init });
const move = (el: Element, clientX: number) =>
  fireEvent.pointerMove(el, { clientX, pointerId: 1, isPrimary: true });
const release = (el: Element, clientX: number) =>
  fireEvent.pointerUp(el, { clientX, pointerId: 1, isPrimary: true });

describe('Slider', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  describe('structure', () => {
    it('renders a root with a control that holds the track, the fill and one thumb, and a hidden input', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <Slider ref={ref} aria-label="Volume" name="volume" defaultValue={60} className="mine" />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(ref.current).toBe(root);
      expect(root).toHaveClass('flg-slider', 'mine');
      const control = root.firstElementChild as HTMLElement;
      expect(control).toHaveClass('flg-slider-control');
      expect(control.style.getPropertyValue('--flg-slider-start')).toBe('0%');
      expect(control.style.getPropertyValue('--flg-slider-end')).toBe('60%');
      expect(Array.from(control.children).map((child) => child.className.split(' ')[0])).toEqual([
        'flg-slider-track',
        'flg-slider-fill',
        'flg-slider-thumb',
      ]);
      expect(thumb().style.getPropertyValue('--flg-slider-pos')).toBe('60%');
      const hidden = root.lastElementChild as HTMLInputElement;
      expect(hidden).toHaveAttribute('type', 'hidden');
      expect(hidden).toHaveAttribute('name', 'volume');
      expect(hidden.value).toBe('60');
    });

    it('draws the bubble as a glass span inside the thumb, hidden from assistive technology', () => {
      render(<Volume defaultValue={60} />);
      const bubble = thumb().firstElementChild as HTMLElement;
      expect(bubble.tagName).toBe('SPAN');
      expect(bubble).toHaveClass('flg-surface', 'flg-slider-bubble');
      expect(bubble).toHaveAttribute('aria-hidden', 'true');
      expect(bubble).toHaveTextContent('60');
    });

    it('puts the root props on the root and the id and the name on the thumb', () => {
      const { container } = render(
        <Volume id="vol" data-testid="root" style={{ width: 300 }} defaultValue={10} />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveAttribute('data-testid', 'root');
      expect(root.style.width).toBe('300px');
      expect(root).not.toHaveAttribute('id');
      expect(thumb()).toHaveAttribute('id', 'vol');
      expect(thumb()).toHaveAttribute('aria-label', 'Volume');
    });

    it('sends no hidden input without a name', () => {
      const { container } = render(<Volume defaultValue={10} />);
      expect(container.querySelector('input')).toBeNull();
    });
  });

  describe('ARIA', () => {
    it('gives the thumb the slider role with its limits, value and orientation', () => {
      render(<Volume defaultValue={60} min={10} max={90} />);
      expect(thumb()).toHaveAttribute('tabindex', '0');
      expect(thumb()).toHaveAttribute('aria-valuemin', '10');
      expect(thumb()).toHaveAttribute('aria-valuemax', '90');
      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
      expect(thumb()).toHaveAttribute('aria-orientation', 'horizontal');
      expect(thumb()).not.toHaveAttribute('aria-valuetext');
    });

    it('sets aria-valuetext from getValueText, and shows the same words in the bubble', () => {
      render(<Volume defaultValue={60} getValueText={(v) => `${v}%`} />);
      expect(thumb()).toHaveAttribute('aria-valuetext', '60%');
      expect(thumb()).toHaveTextContent('60%');
    });

    it('is not focusable and says aria-disabled when disabled, and has no bubble', () => {
      render(<Volume defaultValue={60} disabled name="v" />);
      expect(thumb()).not.toHaveAttribute('tabindex');
      expect(thumb()).toHaveAttribute('aria-disabled', 'true');
      expect(thumb()).toBeEmptyDOMElement();
      expect(document.querySelector('input')).toBeDisabled();
    });

    it('sets aria-invalid on the thumb', () => {
      render(<Volume defaultValue={60} invalid />);
      expect(thumb()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('keys', () => {
    it('moves one step with the arrow keys', async () => {
      const onValueChange = vi.fn();
      render(<Volume defaultValue={50} onValueChange={onValueChange} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{ArrowRight}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '51');
      await user.keyboard('{ArrowUp}{ArrowUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '53');
      await user.keyboard('{ArrowLeft}{ArrowDown}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '51');
      expect(onValueChange).toHaveBeenCalledTimes(5);
      expect(onValueChange).toHaveBeenLastCalledWith(51);
    });

    it('stops at the last grid value when max is off the grid', async () => {
      render(<Volume defaultValue={6} min={0} max={10} step={3} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{End}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '9');
      await user.keyboard('{ArrowUp}{PageUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '9');
    });

    it('moves a large step with PageUp and PageDown, by default a tenth of the range', async () => {
      render(<Volume defaultValue={50} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{PageUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
      await user.keyboard('{PageDown}{PageDown}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
    });

    it('takes a large step that is a multiple of step, and never less than one step', async () => {
      render(<Volume defaultValue={0} min={0} max={25} step={5} />);
      thumb().focus();
      const user = userEvent.setup();
      // A tenth of 25 is 2.5, which is half a step: the large step is one step.
      await user.keyboard('{PageUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '5');
    });

    it('takes the largeStep it is given', async () => {
      render(<Volume defaultValue={0} largeStep={25} />);
      thumb().focus();
      await userEvent.setup().keyboard('{PageUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '25');
    });

    it('goes to the ends with Home and End, and stays inside them', async () => {
      render(<Volume defaultValue={50} min={10} max={90} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{Home}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
      await user.keyboard('{ArrowLeft}{PageDown}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
      await user.keyboard('{End}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '90');
      await user.keyboard('{ArrowRight}{PageUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '90');
    });

    it('keeps the value on the grid that starts at min, also with decimals', async () => {
      render(<Volume defaultValue={0.1} min={0} max={1} step={0.1} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '0.3');
    });

    it('steps from a value off the grid to the next grid value, as a number input does', async () => {
      render(<Volume defaultValue={7} min={0} max={20} step={5} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{ArrowRight}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('ends on the last grid value when max is not on the grid', async () => {
      render(<Volume defaultValue={0} min={0} max={10} step={4} />);
      thumb().focus();
      await userEvent.setup().keyboard('{End}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '8');
    });

    it('calls onValueCommit once for each key that changes the value, and not for one that does not', async () => {
      const onValueCommit = vi.fn();
      render(<Volume defaultValue={99} onValueCommit={onValueCommit} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{ArrowRight}');
      expect(onValueCommit).toHaveBeenLastCalledWith(100);
      await user.keyboard('{ArrowRight}{End}');
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      await user.keyboard('{Home}');
      expect(onValueCommit).toHaveBeenCalledTimes(2);
      expect(onValueCommit).toHaveBeenLastCalledWith(0);
    });

    it('leaves a key with Alt, Ctrl or Meta to the browser', async () => {
      render(<Volume defaultValue={50} />);
      thumb().focus();
      const user = userEvent.setup();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}{Control>}{Home}{/Control}{Meta>}{End}{/Meta}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
    });

    it('prevents the page from scrolling on the keys it handles, and on no other', () => {
      render(<Volume defaultValue={50} />);
      expect(fireEvent.keyDown(thumb(), { key: 'ArrowRight' })).toBe(false);
      expect(fireEvent.keyDown(thumb(), { key: 'a' })).toBe(true);
    });

    it('does not move a disabled slider', () => {
      render(<Volume defaultValue={50} disabled />);
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('value', () => {
    it('starts at min without a value, and at the default value', () => {
      const { unmount } = render(<Volume min={20} />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '20');
      unmount();
      render(<Volume defaultValue={30} />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
    });

    it('follows a controlled value and only reports what the user asks', async () => {
      const onValueChange = vi.fn();
      render(<Volume value={40} onValueChange={onValueChange} />);
      thumb().focus();
      await userEvent.setup().keyboard('{ArrowRight}');
      expect(onValueChange).toHaveBeenCalledWith(41);
      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
    });

    it('works as a controlled slider in a parent', async () => {
      function Parent() {
        const [value, setValue] = useState(10);
        return <Volume value={value} onValueChange={setValue} />;
      }
      render(<Parent />);
      thumb().focus();
      await userEvent.setup().keyboard('{ArrowRight}{ArrowRight}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '12');
    });

    it('shows the nearest position for a value outside the range or not a number', () => {
      const { rerender } = render(<Volume value={500} />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
      rerender(<Volume value={Number.NaN} />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
    });

    it('sends the value in the hidden input as a plain number', () => {
      const { container } = render(<Volume name="v" defaultValue={0.3} step={0.1} max={1} />);
      expect((container.querySelector('input') as HTMLInputElement).value).toBe('0.3');
    });

    it('does not throw, and warns, for min that is not less than max', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Volume min={10} max={10} defaultValue={5} ticks />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('min (10) must be less than max'));
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('uses 1 for a step that is not a positive finite number, and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Volume step={0} defaultValue={5} />);
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(thumb()).toHaveAttribute('aria-valuenow', '6');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('step must be a positive'));
    });
  });

  describe('pointer', () => {
    it('jumps the thumb to a press on the track, and focuses it', () => {
      const onValueChange = vi.fn();
      const { container } = render(<Volume defaultValue={10} onValueChange={onValueChange} />);
      const control = layOut(container);
      press(control.querySelector('.flg-slider-track') as Element, 150);
      expect(thumb()).toHaveAttribute('aria-valuenow', '75');
      expect(onValueChange).toHaveBeenCalledWith(75);
      expect(thumb()).toHaveFocus();
    });

    it('marks the root while the thumb has the focus from a press, until a key or a blur', () => {
      const { container } = render(<Volume defaultValue={10} />);
      const root = container.firstElementChild as HTMLElement;
      const control = layOut(container);
      press(control, 100);
      release(control, 100);
      expect(root).toHaveAttribute('data-pointer-focus');
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(root).not.toHaveAttribute('data-pointer-focus');
      press(control, 100);
      release(control, 100);
      expect(root).toHaveAttribute('data-pointer-focus');
      fireEvent.focusOut(thumb());
      expect(root).not.toHaveAttribute('data-pointer-focus');
    });

    it('rounds the pointer position onto the grid', () => {
      const { container } = render(<Volume defaultValue={0} step={10} />);
      const control = layOut(container);
      press(control, 52);
      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
      move(control, 71);
      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
    });

    it('follows the pointer while it is down, and stays inside the ends', () => {
      const { container } = render(<Volume defaultValue={0} />);
      const control = layOut(container);
      press(control, 20);
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
      move(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
      move(control, 900);
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
      move(control, -300);
      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
    });

    it('stops following when the pointer is released', () => {
      const { container } = render(<Volume defaultValue={0} />);
      const control = layOut(container);
      press(control, 20);
      release(control, 20);
      move(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('ignores another pointer while one is down', () => {
      const { container } = render(<Volume defaultValue={0} />);
      const control = layOut(container);
      press(control, 20);
      fireEvent.pointerMove(control, { clientX: 100, pointerId: 2 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('keeps the distance between the pointer and the centre of the thumb when the press is on the thumb', () => {
      const { container } = render(<Volume defaultValue={50} />);
      const control = layOut(container, 100);
      // 5px right of the centre of the thumb: the value does not jump to 52.5 or 53.
      press(thumb(), 105);
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
      move(control, 125);
      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
    });

    it('commits once, at the release, when the drag changed the value', () => {
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const { container } = render(
        <Volume defaultValue={0} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
      );
      const control = layOut(container);
      press(control, 20);
      move(control, 60);
      move(control, 100);
      expect(onValueChange).toHaveBeenCalledTimes(3);
      expect(onValueCommit).not.toHaveBeenCalled();
      release(control, 100);
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenCalledWith(50);
      // The browser fires this after the release; it must not commit again.
      fireEvent.lostPointerCapture(control, { pointerId: 1 });
      expect(onValueCommit).toHaveBeenCalledTimes(1);
    });

    it('does not commit when the drag ended where it began', () => {
      const onValueCommit = vi.fn();
      const { container } = render(<Volume defaultValue={50} onValueCommit={onValueCommit} />);
      const control = layOut(container, 100);
      press(thumb(), 100);
      move(control, 140);
      move(control, 100);
      release(control, 100);
      expect(onValueCommit).not.toHaveBeenCalled();
    });

    it('puts the value back and commits nothing when the browser cancels the press', () => {
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const { container } = render(
        <Volume defaultValue={10} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
      );
      const control = layOut(container);
      // A touch that starts on the track and turns into a scroll: the jump is undone.
      press(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
      fireEvent.pointerCancel(control, { pointerId: 1 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
      expect(onValueChange).toHaveBeenLastCalledWith(10);
      expect(onValueCommit).not.toHaveBeenCalled();
      move(control, 150);
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('puts the value back and commits nothing when the capture is lost without a release', () => {
      const onValueCommit = vi.fn();
      const { container } = render(<Volume defaultValue={10} onValueCommit={onValueCommit} />);
      const control = layOut(container);
      press(control, 100);
      move(control, 160);
      fireEvent.lostPointerCapture(control, { pointerId: 1 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
      expect(onValueCommit).not.toHaveBeenCalled();
    });

    it('asks a controlled parent to go back to the value before a cancelled press', () => {
      const onValueChange = vi.fn();
      function Parent() {
        const [value, setValue] = useState(10);
        return (
          <Volume
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
              setValue(next);
            }}
          />
        );
      }
      const { container } = render(<Parent />);
      const control = layOut(container);
      press(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
      fireEvent.pointerCancel(control, { pointerId: 1 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('asks a controlled parent that has not rendered the move yet to go back after a cancel', () => {
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const { container } = render(
        <Volume value={10} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
      );
      const control = layOut(container, 20);
      press(control, 20);
      move(control, 110);
      expect(onValueChange).toHaveBeenLastCalledWith(55);
      onValueChange.mockClear();
      fireEvent.pointerCancel(control, { pointerId: 1 });
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(10);
      expect(onValueCommit).not.toHaveBeenCalled();
    });

    it('lets a new press of the primary pointer start when the end of the last drag never came', () => {
      const { container } = render(<Volume defaultValue={0} />);
      const control = layOut(container);
      press(control, 40);
      // No pointerup, pointercancel or lostpointercapture ever arrives.
      press(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
      move(control, 160);
      expect(thumb()).toHaveAttribute('aria-valuenow', '80');
    });

    it('draws a focus outline in the colours of forced-colors mode', () => {
      // The thumb opts out of colour adjustment, and the outline colour is transparent in the
      // theme, so without a colour named in preferences.css a keyboard user would see nothing.
      const block =
        /@media \(forced-colors: active\)[\s\S]*?\.flg-slider-thumb:focus-visible \{\s*outline-color: Highlight;/;
      const preferences = readFileSync('src/styles/preferences.css', 'utf8');
      expect(preferences).toMatch(block);
    });

    it('commits what the user asked for even when a controlled parent keeps the old value', () => {
      const onValueCommit = vi.fn();
      const { container } = render(<Volume value={0} onValueCommit={onValueCommit} />);
      const control = layOut(container);
      press(control, 100);
      release(control, 100);
      expect(onValueCommit).toHaveBeenCalledWith(50);
    });

    it('ignores the secondary button, and a disabled slider', () => {
      const { container, rerender } = render(<Volume defaultValue={0} />);
      const control = layOut(container);
      press(control, 100, { button: 2 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
      rerender(<Volume defaultValue={0} disabled />);
      press(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
    });

    it('prevents the default of a mouse press, so no text is selected and the thumb keeps its focus', () => {
      const { container } = render(<Volume defaultValue={0} />);
      const control = layOut(container);
      expect(fireEvent.mouseDown(control)).toBe(false);
    });

    it('does not throw where the pointer cannot be captured', () => {
      const { container } = render(<Volume defaultValue={0} />);
      const control = layOut(container);
      control.setPointerCapture = () => {
        throw new DOMException('no such pointer', 'NotFoundError');
      };
      expect(() => press(control, 100)).not.toThrow();
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('ticks', () => {
    const dots = (container: HTMLElement) =>
      Array.from(container.querySelectorAll<HTMLElement>('.flg-slider-ticks > i'));

    it('shows a dot at each step, the ends included, when the range has at most ten steps', () => {
      const { container } = render(<Volume min={1} max={5} defaultValue={3} />);
      expect(dots(container).map((dot) => dot.style.left)).toEqual([
        '0%',
        '25%',
        '50%',
        '75%',
        '100%',
      ]);
      expect(container.firstElementChild).toHaveAttribute('data-ticks');
      expect(container.querySelector('.flg-slider-ticks')).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows the dots for exactly ten steps, and not for eleven', () => {
      const { container, rerender } = render(<Volume min={0} max={10} />);
      expect(dots(container)).toHaveLength(11);
      rerender(<Volume min={0} max={11} />);
      expect(dots(container)).toHaveLength(0);
      expect(container.firstElementChild).not.toHaveAttribute('data-ticks');
    });

    it('counts the steps of a decimal grid without float noise', () => {
      const { container } = render(<Volume min={0} max={1} step={0.1} />);
      expect(dots(container)).toHaveLength(11);
    });

    it('shows none by default for the default range of 100 steps', () => {
      const { container } = render(<Volume />);
      expect(dots(container)).toHaveLength(0);
    });

    it('is forced on with ticks, and off with ticks={false}', () => {
      const { container, rerender } = render(<Volume min={0} max={20} step={5} ticks />);
      expect(dots(container)).toHaveLength(5);
      rerender(<Volume min={0} max={5} ticks={false} />);
      expect(dots(container)).toHaveLength(0);
      expect(container.firstElementChild).not.toHaveAttribute('data-ticks');
    });

    it('draws only the steps that exist when max is not on the grid', () => {
      const { container } = render(<Volume min={0} max={10} step={4} ticks />);
      expect(dots(container).map((dot) => dot.style.left)).toEqual(['0%', '40%', '80%']);
    });
  });

  describe('Field', () => {
    it('is named by the label of the Field, on the thumb, and its aside is not part of the name', () => {
      render(
        <Field label="Volume" aside={<span aria-hidden="true">60%</span>}>
          <Slider defaultValue={60} />
        </Field>,
      );
      expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
      expect(document.querySelector('.flg-field-label')?.tagName).toBe('SPAN');
    });

    it('gets the description and the error through aria-describedby, and invalid from the error', () => {
      render(
        <Field label="Volume" description="Between 0 and 100" error="Too loud">
          <Slider defaultValue={60} />
        </Field>,
      );
      expect(thumb()).toHaveAccessibleDescription('Between 0 and 100 Too loud');
      expect(thumb()).toHaveAttribute('aria-invalid', 'true');
    });

    it('is disabled by the Field', () => {
      render(
        <Field label="Volume" disabled>
          <Slider defaultValue={60} />
        </Field>,
      );
      expect(thumb()).toHaveAttribute('aria-disabled', 'true');
    });

    it('takes the id of the thumb as the control id of the Field', () => {
      render(
        <Field label="Volume">
          <Slider defaultValue={60} id="vol" />
        </Field>,
      );
      expect(thumb()).toHaveAttribute('id', 'vol');
      expect(screen.getByRole('slider', { name: 'Volume' })).toBe(thumb());
    });

    it('keeps its own aria-label over the label of the Field', () => {
      render(
        <Field label="Volume">
          <Slider aria-label="Master volume" defaultValue={60} />
        </Field>,
      );
      expect(thumb()).not.toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('slider', { name: 'Master volume' })).toBe(thumb());
    });

    it('keeps its own aria-label on a range group over the label of the Field', () => {
      render(
        <Field label="Price">
          <Slider aria-label="Price range" defaultValue={[20, 60]} />
        </Field>,
      );
      const group = screen.getByRole('group');
      expect(group).not.toHaveAttribute('aria-labelledby');
      expect(group).toHaveAccessibleName('Price range');
    });

    it('prefers its own aria-labelledby over the label of the Field', () => {
      render(
        <Field label="Volume">
          <span id="mine">Mine</span>
          <Slider aria-labelledby="mine" defaultValue={60} />
        </Field>,
      );
      expect(thumb()).toHaveAttribute('aria-labelledby', 'mine');
    });

    it('warns when it is not the direct child of the Field', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(
        <Field label="Volume">
          <div>
            <Slider aria-label="Volume" defaultValue={60} />
          </div>
        </Field>,
      );
      // The Field here has a label element that points at nothing: the warning is the one that says why.
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not its direct child'));
    });
  });

  describe('name', () => {
    it('warns without a name, and not with aria-label, aria-labelledby or a Field label', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { unmount } = render(<Slider defaultValue={1} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Slider> needs a name'));
      unmount();
      warn.mockClear();
      resetDevWarnings();
      render(
        <>
          <span id="l">Level</span>
          <Slider aria-labelledby="l" />
          <Slider aria-label="Level" />
          <Field label="Level">
            <Slider />
          </Field>
        </>,
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('form', () => {
    it('submits the value under the name', () => {
      render(
        <form data-testid="form">
          <Volume name="volume" defaultValue={35} />
        </form>,
      );
      const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
      expect(data.get('volume')).toBe('35');
    });

    it('sends nothing when disabled', () => {
      render(
        <form data-testid="form">
          <Volume name="volume" defaultValue={35} disabled />
        </form>,
      );
      expect(new FormData(screen.getByTestId('form') as HTMLFormElement).has('volume')).toBe(false);
    });

    it('puts an uncontrolled slider back to its default value when the form is reset', async () => {
      render(
        <form data-testid="form">
          <Volume name="volume" defaultValue={35} />
        </form>,
      );
      thumb().focus();
      await userEvent.setup().keyboard('{End}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
      await settle();
      expect(thumb()).toHaveAttribute('aria-valuenow', '35');
    });

    it('puts a slider with no name back to its default when the form is reset', async () => {
      render(
        <form data-testid="form">
          <Volume defaultValue={35} />
        </form>,
      );
      thumb().focus();
      await userEvent.setup().keyboard('{End}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
      await settle();
      expect(thumb()).toHaveAttribute('aria-valuenow', '35');
    });

    it('does not reset a slider whose form reset was cancelled', async () => {
      render(
        <form data-testid="form" onReset={(event) => event.preventDefault()}>
          <Volume name="volume" defaultValue={35} />
        </form>,
      );
      thumb().focus();
      await userEvent.setup().keyboard('{End}');
      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
      await settle();
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
    });

    it('keeps the value of a controlled slider when the form is reset', async () => {
      render(
        <form data-testid="form">
          <Volume name="volume" value={70} defaultValue={35} />
        </form>,
      );
      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
      await settle();
      expect(thumb()).toHaveAttribute('aria-valuenow', '70');
    });
  });

  describe('range', () => {
    const thumbs = () => screen.getAllByRole('slider');
    const values = () => thumbs().map((t) => t.getAttribute('aria-valuenow'));
    const Price = (props: SliderProps<[number, number]>) => (
      <Slider aria-label="Price" defaultValue={[20, 75]} {...props} />
    );
    /** The control is 200px wide: 2px per percent. A thumb is 16px, centred on its value. */
    function layOutRange(container: HTMLElement) {
      const control = layOut(container);
      thumbs().forEach((t) => {
        const centre = Number(t.getAttribute('aria-valuenow')) * 2;
        t.getBoundingClientRect = () =>
          ({ left: centre - 8, right: centre + 8, width: 16, height: 16 }) as DOMRect;
      });
      return control;
    }

    it('renders a group with two thumbs, the fill between them and one hidden input for each', () => {
      const { container } = render(<Price name="price" />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveAttribute('role', 'group');
      expect(root).toHaveAttribute('data-range');
      expect(root).toHaveAttribute('aria-label', 'Price');
      const control = root.firstElementChild as HTMLElement;
      expect(control.style.getPropertyValue('--flg-slider-start')).toBe('20%');
      expect(control.style.getPropertyValue('--flg-slider-end')).toBe('75%');
      expect(thumbs()).toHaveLength(2);
      expect(thumbs().map((t) => t.style.getPropertyValue('--flg-slider-pos'))).toEqual([
        '20%',
        '75%',
      ]);
      expect(thumbs().map((t) => t.textContent)).toEqual(['20', '75']);
      const inputs = Array.from(root.querySelectorAll('input'));
      expect(inputs.map((i) => [i.type, i.name, i.value])).toEqual([
        ['hidden', 'price', '20'],
        ['hidden', 'price', '75'],
      ]);
    });

    it('is not a group, and has no data-range, with one thumb', () => {
      const { container } = render(<Volume defaultValue={5} />);
      expect(container.firstElementChild).not.toHaveAttribute('role');
      expect(container.firstElementChild).not.toHaveAttribute('data-range');
    });

    it('names the group, and the thumbs Minimum and Maximum, or the words of labels', () => {
      const { unmount } = render(<Price />);
      expect(screen.getByRole('group', { name: 'Price' })).toBeInTheDocument();
      expect(thumbs().map((t) => t.getAttribute('aria-label'))).toEqual(['Minimum', 'Maximum']);
      unmount();
      render(<Price labels={{ minimum: 'Từ', maximum: 'Đến' }} />);
      expect(thumbs().map((t) => t.getAttribute('aria-label'))).toEqual(['Từ', 'Đến']);
    });

    it('keeps the default word for a label that labels leaves out', () => {
      render(<Price labels={{ maximum: 'Up to' }} />);
      expect(thumbs().map((t) => t.getAttribute('aria-label'))).toEqual(['Minimum', 'Up to']);
    });

    it('takes the name of the group from aria-labelledby, and puts the id on the group', () => {
      render(
        <>
          <span id="l">Price range</span>
          <Slider aria-labelledby="l" defaultValue={[1, 2]} id="price" />
        </>,
      );
      const group = screen.getByRole('group', { name: 'Price range' });
      expect(group).toHaveAttribute('id', 'price');
      for (const t of thumbs()) {
        expect(t).not.toHaveAttribute('id');
        expect(t).not.toHaveAttribute('aria-labelledby');
      }
    });

    it('limits each thumb by the other in aria-valuemin and aria-valuemax', () => {
      render(<Price min={10} max={90} />);
      const limits = thumbs().map((t) => [
        t.getAttribute('aria-valuemin'),
        t.getAttribute('aria-valuemax'),
      ]);
      expect(limits).toEqual([
        ['10', '75'],
        ['20', '90'],
      ]);
    });

    it('gives each thumb its own aria-valuetext and bubble text from getValueText', () => {
      render(<Price getValueText={(v) => `${v} triệu`} />);
      expect(thumbs().map((t) => t.getAttribute('aria-valuetext'))).toEqual([
        '20 triệu',
        '75 triệu',
      ]);
      expect(thumbs().map((t) => t.textContent)).toEqual(['20 triệu', '75 triệu']);
    });

    it('disables both thumbs and both inputs, and draws no bubble', () => {
      const { container } = render(<Price disabled name="p" />);
      for (const t of thumbs()) {
        expect(t).toHaveAttribute('aria-disabled', 'true');
        expect(t).not.toHaveAttribute('tabindex');
        expect(t).toBeEmptyDOMElement();
      }
      for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
    });

    it('sets aria-invalid, and aria-describedby from the Field, on both thumbs', () => {
      render(
        <Field label="Price" description="In millions" error="Too wide">
          <Slider defaultValue={[20, 75]} />
        </Field>,
      );
      for (const t of thumbs()) {
        expect(t).toHaveAttribute('aria-invalid', 'true');
        expect(t).toHaveAccessibleDescription('In millions Too wide');
      }
    });

    it('is named by the label of the Field on the group', () => {
      render(
        <Field label="Price">
          <Slider defaultValue={[20, 75]} id="price" />
        </Field>,
      );
      const group = screen.getByRole('group', { name: 'Price' });
      expect(group).toHaveAttribute('id', 'price');
    });

    it('moves each thumb with the keys, and reports a pair', async () => {
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      render(<Price onValueChange={onValueChange} onValueCommit={onValueCommit} />);
      const user = userEvent.setup();
      thumbs()[0]!.focus();
      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(values()).toEqual(['22', '75']);
      expect(onValueChange).toHaveBeenLastCalledWith([22, 75]);
      thumbs()[1]!.focus();
      await user.keyboard('{ArrowDown}{PageUp}');
      expect(values()).toEqual(['22', '84']);
      expect(onValueCommit).toHaveBeenCalledTimes(4);
      expect(onValueCommit).toHaveBeenLastCalledWith([22, 84]);
    });

    it('stops a thumb at the value of the other with the keys, and lets them be equal', async () => {
      render(<Price defaultValue={[20, 23]} />);
      const user = userEvent.setup();
      thumbs()[0]!.focus();
      await user.keyboard('{PageUp}');
      expect(values()).toEqual(['23', '23']);
      await user.keyboard('{ArrowRight}');
      expect(values()).toEqual(['23', '23']);
      thumbs()[1]!.focus();
      await user.keyboard('{PageDown}');
      expect(values()).toEqual(['23', '23']);
    });

    it('sends Home and End to the limits of that thumb: the other thumb, or the end', async () => {
      render(<Price min={10} max={90} />);
      const user = userEvent.setup();
      thumbs()[0]!.focus();
      await user.keyboard('{End}');
      expect(values()).toEqual(['75', '75']);
      await user.keyboard('{Home}');
      expect(values()).toEqual(['10', '75']);
      thumbs()[1]!.focus();
      await user.keyboard('{Home}');
      expect(values()).toEqual(['10', '10']);
      await user.keyboard('{End}');
      expect(values()).toEqual(['10', '90']);
    });

    it('does not commit for a key that changes nothing', async () => {
      const onValueCommit = vi.fn();
      render(<Price defaultValue={[0, 100]} onValueCommit={onValueCommit} />);
      thumbs()[0]!.focus();
      await userEvent.setup().keyboard('{ArrowLeft}{Home}');
      expect(onValueCommit).not.toHaveBeenCalled();
    });

    it('follows a controlled pair and reports what the user asks', async () => {
      const onValueChange = vi.fn();
      render(<Slider aria-label="Price" value={[20, 75]} onValueChange={onValueChange} />);
      thumbs()[1]!.focus();
      await userEvent.setup().keyboard('{ArrowRight}');
      expect(onValueChange).toHaveBeenCalledWith([20, 76]);
      expect(values()).toEqual(['20', '75']);
    });

    it('works as a controlled slider in a parent', async () => {
      function Parent() {
        const [value, setValue] = useState<[number, number]>([10, 30]);
        return <Slider aria-label="Price" value={value} onValueChange={setValue} />;
      }
      render(<Parent />);
      const user = userEvent.setup();
      thumbs()[0]!.focus();
      await user.keyboard('{ArrowRight}');
      thumbs()[1]!.focus();
      await user.keyboard('{ArrowLeft}');
      expect(values()).toEqual(['11', '29']);
    });

    it('does not report a change when the parent builds a new array with the same numbers', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Slider aria-label="Price" value={[20, 75]} onValueChange={onValueChange} />,
      );
      rerender(<Slider aria-label="Price" value={[20, 75]} onValueChange={onValueChange} />);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(values()).toEqual(['20', '75']);
    });

    it('puts a pair that is out of order the right way round, and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Slider aria-label="Price" value={[75, 20]} />);
      expect(values()).toEqual(['20', '75']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('lower first'));
    });

    it('shows the nearest positions for a pair outside the range', () => {
      render(<Slider aria-label="Price" value={[-5, 500]} />);
      expect(values()).toEqual(['0', '100']);
    });

    it('warns, and does not throw, for a value that is not a pair of numbers', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Slider aria-label="Price" value={[Number.NaN, 40]} />);
      expect(values()).toEqual(['0', '40']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('pair of two numbers'));
    });

    it('warns when the value changes between a number and a pair', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { rerender } = render(<Slider aria-label="X" value={10} />);
      expect(warn).not.toHaveBeenCalled();
      rerender(<Slider aria-label="X" value={[10, 20]} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('between a number and a pair'));
      expect(values()).toEqual(['10', '20']);
    });

    it('moves the thumb nearest to a press on the track, and focuses it', () => {
      const onValueChange = vi.fn();
      const { container } = render(<Price onValueChange={onValueChange} />);
      const control = layOutRange(container);
      press(control, 60);
      expect(values()).toEqual(['30', '75']);
      expect(thumbs()[0]!).toHaveFocus();
      expect(onValueChange).toHaveBeenLastCalledWith([30, 75]);
      release(control, 60);
      layOutRange(container);
      press(control, 180);
      expect(values()).toEqual(['30', '90']);
      expect(thumbs()[1]!).toHaveFocus();
      expect(container.firstElementChild).toHaveAttribute('data-pointer-focus');
    });

    it('picks the nearer thumb for a press between them', () => {
      const { container } = render(<Price />);
      const control = layOutRange(container);
      // 45 is 25 from the lower thumb and 30 from the upper one.
      press(control, 90);
      expect(values()).toEqual(['45', '75']);
      release(control, 90);
      layOutRange(container);
      // 65 is 20 from the lower thumb and 10 from the upper one.
      press(control, 130);
      expect(values()).toEqual(['45', '65']);
    });

    it('goes on as a drag of the thumb that the press moved', () => {
      const { container } = render(<Price />);
      const control = layOutRange(container);
      press(control, 180);
      move(control, 140);
      expect(values()).toEqual(['20', '70']);
    });

    it('keeps the grip on a thumb that is pressed, and drags only that thumb', () => {
      const { container } = render(<Price />);
      const control = layOutRange(container);
      press(thumbs()[1]!, 155);
      expect(values()).toEqual(['20', '75']);
      move(control, 175);
      expect(values()).toEqual(['20', '85']);
    });

    it('does not let a dragged thumb pass the other: it stops at its value', () => {
      const { container } = render(<Price />);
      const control = layOutRange(container);
      press(thumbs()[0]!, 40);
      move(control, 190);
      expect(values()).toEqual(['75', '75']);
      move(control, 20);
      expect(values()).toEqual(['10', '75']);
      release(control, 20);
      layOutRange(container);
      press(thumbs()[1]!, 150);
      move(control, 2);
      expect(values()).toEqual(['10', '10']);
    });

    it('lets the thumbs be equal, and picks the thumb to drag by the first move', () => {
      const first = render(<Price defaultValue={[50, 50]} />);
      let control = layOutRange(first.container);
      press(thumbs()[1]!, 100);
      expect(values()).toEqual(['50', '50']);
      move(control, 120);
      expect(values()).toEqual(['50', '60']);
      expect(thumbs()[1]!).toHaveFocus();
      release(control, 120);
      first.unmount();
      const second = render(<Price defaultValue={[50, 50]} />);
      control = layOutRange(second.container);
      press(thumbs()[1]!, 100);
      move(control, 80);
      expect(values()).toEqual(['40', '50']);
      expect(thumbs()[0]!).toHaveFocus();
    });

    it('waits for a move that leaves the shared value before it picks a thumb', () => {
      const { container } = render(<Price defaultValue={[50, 50]} step={10} />);
      const control = layOutRange(container);
      press(control, 100);
      // 3px is less than half a step of 10 (10px): the value is still 50.
      move(control, 103);
      expect(values()).toEqual(['50', '50']);
      move(control, 60);
      expect(values()).toEqual(['30', '50']);
    });

    it('commits the pair once at the release, and not when the drag ended where it began', () => {
      const onValueCommit = vi.fn();
      const { container } = render(<Price onValueCommit={onValueCommit} />);
      const control = layOutRange(container);
      press(thumbs()[0]!, 40);
      move(control, 60);
      move(control, 80);
      expect(onValueCommit).not.toHaveBeenCalled();
      release(control, 80);
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenCalledWith([40, 75]);
      layOutRange(container);
      press(thumbs()[1]!, 150);
      move(control, 170);
      move(control, 150);
      release(control, 150);
      expect(onValueCommit).toHaveBeenCalledTimes(1);
    });

    it('rounds the pointer onto the grid and keeps each thumb inside [min, max]', () => {
      const { container } = render(<Price defaultValue={[20, 80]} step={10} />);
      const control = layOutRange(container);
      press(control, 18);
      expect(values()).toEqual(['10', '80']);
      move(control, -50);
      expect(values()).toEqual(['0', '80']);
    });

    it('ignores a press on a disabled range slider', () => {
      const { container } = render(<Price disabled />);
      const control = layOutRange(container);
      press(control, 100);
      expect(values()).toEqual(['20', '75']);
    });

    it('draws the dots of a range with few steps', () => {
      const { container } = render(<Price min={0} max={5} defaultValue={[1, 4]} />);
      expect(container.querySelectorAll('.flg-slider-ticks > i')).toHaveLength(6);
    });

    it('submits both values under one name, the lower first, and sends none when disabled', () => {
      const { rerender } = render(
        <form data-testid="form">
          <Price name="price" />
        </form>,
      );
      const form = () => screen.getByTestId('form') as HTMLFormElement;
      expect(new FormData(form()).getAll('price')).toEqual(['20', '75']);
      rerender(
        <form data-testid="form">
          <Price name="price" disabled />
        </form>,
      );
      expect(new FormData(form()).has('price')).toBe(false);
    });

    it('puts an uncontrolled range back to its default when the form is reset, and not a controlled one', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { rerender } = render(
        <form data-testid="form">
          <Price name="price" />
        </form>,
      );
      const form = () => screen.getByTestId('form') as HTMLFormElement;
      thumbs()[1]!.focus();
      await userEvent.setup().keyboard('{End}');
      expect(values()).toEqual(['20', '100']);
      act(() => form().reset());
      await settle();
      expect(values()).toEqual(['20', '75']);
      expect(new FormData(form()).getAll('price')).toEqual(['20', '75']);
      rerender(
        <form data-testid="form">
          <Slider aria-label="Price" name="price" value={[30, 40]} />
        </form>,
      );
      act(() => form().reset());
      await settle();
      expect(values()).toEqual(['30', '40']);
    });
  });
});
