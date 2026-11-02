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

    it('ends the drag on pointercancel and on a lost capture', () => {
      const onValueCommit = vi.fn();
      const { container } = render(<Volume defaultValue={0} onValueCommit={onValueCommit} />);
      const control = layOut(container);
      press(control, 40);
      fireEvent.pointerCancel(control, { pointerId: 1 });
      expect(onValueCommit).toHaveBeenCalledWith(20);
      move(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '20');
      press(control, 60);
      fireEvent.lostPointerCapture(control, { pointerId: 1 });
      expect(onValueCommit).toHaveBeenLastCalledWith(30);
      move(control, 100);
      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
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
});
