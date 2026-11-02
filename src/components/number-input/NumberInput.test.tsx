import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { NumberInput } from './NumberInput';
import type { NumberInputProps } from './NumberInput';

const spin = () => screen.getByRole('spinbutton');
const decrease = () => screen.getByRole('button', { name: 'Decrease' });
const increase = () => screen.getByRole('button', { name: 'Increase' });
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));

function Quantity(props: NumberInputProps) {
  return <NumberInput aria-label="Quantity" {...props} />;
}

describe('NumberInput', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('structure', () => {
    it('renders a frame with a minus button, a spinbutton, a plus button and a hidden input', () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <NumberInput
          ref={ref}
          aria-label="Quantity"
          name="qty"
          defaultValue={3}
          className="mine"
          size="lg"
        />,
      );
      const frame = container.firstElementChild as HTMLElement;
      expect(frame).toHaveClass('flg-input', 'flg-number-input', 'mine');
      expect(frame).toHaveAttribute('data-size', 'lg');
      expect(Array.from(frame.children).map((child) => child.tagName)).toEqual([
        'BUTTON',
        'INPUT',
        'BUTTON',
        'INPUT',
      ]);
      expect(ref.current).toBe(spin());
      expect(spin()).toHaveAttribute('type', 'text');
      expect(spin()).not.toHaveAttribute('name');
      expect(spin()).toHaveAttribute('autocomplete', 'off');
      for (const button of [decrease(), increase()]) {
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('tabindex', '-1');
      }
      const hidden = frame.lastElementChild as HTMLInputElement;
      expect(hidden).toHaveAttribute('type', 'hidden');
      expect(hidden).toHaveAttribute('name', 'qty');
      expect(hidden.value).toBe('3');
    });

    it('takes the labels of the buttons from `labels`', () => {
      render(<Quantity labels={{ increment: 'More', decrement: 'Fewer' }} />);
      expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Fewer' })).toBeInTheDocument();
    });

    it('puts the other props, such as placeholder and id, on the spinbutton', () => {
      render(<Quantity id="q" placeholder="Qty" />);
      expect(spin()).toHaveAttribute('id', 'q');
      expect(spin()).toHaveAttribute('placeholder', 'Qty');
    });
  });

  describe('value, format and ARIA', () => {
    it('shows the default value formatted for the locale', () => {
      render(<Quantity defaultValue={1234.5} />);
      expect(spin()).toHaveValue('1,234.5');
    });

    it('formats with the locale and the format options', () => {
      const { unmount } = render(<Quantity defaultValue={1234.5} locale="vi-VN" />);
      expect(spin()).toHaveValue('1.234,5');
      unmount();
      render(
        <Quantity defaultValue={1234.5} formatOptions={{ style: 'currency', currency: 'USD' }} />,
      );
      expect(spin()).toHaveValue('$1,234.50');
    });

    it('shows up to three decimals, or those of the step when it has more', () => {
      const { rerender } = render(<Quantity value={1.23456} />);
      expect(spin()).toHaveValue('1.235');
      rerender(<Quantity value={1.23456} step={0.0001} />);
      expect(spin()).toHaveValue('1.2346');
    });

    it('is empty and has no aria-valuenow for null', () => {
      render(<Quantity value={null} />);
      expect(spin()).toHaveValue('');
      expect(spin()).not.toHaveAttribute('aria-valuenow');
    });

    it('sets aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext', () => {
      render(<Quantity value={1234} min={0} max={5000} />);
      expect(spin()).toHaveAttribute('aria-valuenow', '1234');
      expect(spin()).toHaveAttribute('aria-valuemin', '0');
      expect(spin()).toHaveAttribute('aria-valuemax', '5000');
      expect(spin()).toHaveAttribute('aria-valuetext', '1,234');
    });

    it('omits aria-valuemin and aria-valuemax without min and max', () => {
      render(<Quantity value={1} />);
      expect(spin()).not.toHaveAttribute('aria-valuemin');
      expect(spin()).not.toHaveAttribute('aria-valuemax');
    });

    it('uses the decimal keyboard when min is not negative, and the text one otherwise', () => {
      const { rerender } = render(<Quantity min={0} />);
      expect(spin()).toHaveAttribute('inputmode', 'decimal');
      rerender(<Quantity />);
      expect(spin()).toHaveAttribute('inputmode', 'text');
      rerender(<Quantity min={-5} />);
      expect(spin()).toHaveAttribute('inputmode', 'text');
      rerender(<Quantity min={-5} inputMode="numeric" />);
      expect(spin()).toHaveAttribute('inputmode', 'numeric');
    });

    it('shows a controlled value outside the range clamped, warns, and does not report it', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const onValueChange = vi.fn();
      render(<Quantity value={99} min={0} max={10} onValueChange={onValueChange} />);
      expect(spin()).toHaveValue('10');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('NumberInput'));
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('typing', () => {
    it('lets the user type anything, and reports each key to onChange but not to onValueChange', async () => {
      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity onChange={onChange} onValueChange={onValueChange} />);
      await user.type(spin(), 'ab1');
      expect(spin()).toHaveValue('ab1');
      expect(onChange).toHaveBeenCalledTimes(3);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('commits on blur: reads, clamps, snaps to the step grid and formats', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <>
          <Quantity min={0} max={100} step={5} onValueChange={onValueChange} />
          <button>other</button>
        </>,
      );
      await user.type(spin(), '1,237');
      await user.click(screen.getByText('other'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(100);
      expect(spin()).toHaveValue('100');
      await user.clear(spin());
      await user.type(spin(), '42');
      await user.tab();
      expect(spin()).toHaveValue('40');
      expect(onValueChange).toHaveBeenLastCalledWith(40);
    });

    it('rounds a decimal onto the grid without float noise', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity step={0.1} onValueChange={onValueChange} />);
      await user.type(spin(), '0.30000000000000004');
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith(0.3);
    });

    it('reads the typed text in the locale of the input', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity locale="vi-VN" step={0.1} onValueChange={onValueChange} />);
      await user.type(spin(), '1.234,5');
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith(1234.5);
      expect(spin()).toHaveValue('1.234,5');
    });

    it('makes the value null when the field is emptied', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
      await user.clear(spin());
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(spin()).not.toHaveAttribute('aria-valuenow');
    });

    it('puts back the old text, and reports nothing, when the text cannot be read', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
      await user.clear(spin());
      await user.type(spin(), 'abc');
      await user.tab();
      expect(spin()).toHaveValue('5');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does not report a commit that leaves the value as it was', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
      await user.click(spin());
      await user.tab();
      await user.click(spin());
      await user.type(spin(), '{Backspace}5');
      await user.tab();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('commits on Enter and leaves the Enter to the form', async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <Quantity name="qty" onValueChange={onValueChange} />
          <button type="submit">Save</button>
        </form>,
      );
      await user.type(spin(), '12{Enter}');
      expect(onValueChange).toHaveBeenCalledWith(12);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      const form = spin().closest('form') as HTMLFormElement;
      expect(new FormData(form).get('qty')).toBe('12');
    });

    it('ignores the Enter that confirms an IME composition', () => {
      const onValueChange = vi.fn();
      render(<Quantity name="qty" onValueChange={onValueChange} />);
      fireEvent.change(spin(), { target: { value: '12' } });
      fireEvent.keyDown(spin(), { key: 'Enter', isComposing: true });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(spin()).toHaveValue('12');
      fireEvent.keyDown(spin(), { key: 'Enter' });
      expect(onValueChange).toHaveBeenCalledWith(12);
    });

    it('ignores the Enter of keyCode 229 that Safari sends after the composition has ended', () => {
      const onValueChange = vi.fn();
      render(<Quantity name="qty" onValueChange={onValueChange} />);
      fireEvent.change(spin(), { target: { value: '12' } });
      fireEvent.keyDown(spin(), { key: 'Enter', keyCode: 229 });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(spin()).toHaveValue('12');
    });

    it('runs the onKeyDown of the user first, and a preventDefault there stops the library', async () => {
      const user = userEvent.setup();
      render(
        <Quantity
          defaultValue={5}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') event.preventDefault();
          }}
        />,
      );
      await user.click(spin());
      await user.keyboard('{ArrowUp}');
      expect(spin()).toHaveValue('5');
      await user.keyboard('{ArrowDown}');
      expect(spin()).toHaveValue('4');
    });

    it('runs the onBlur of the user and still commits', async () => {
      const onBlur = vi.fn();
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity onBlur={onBlur} onValueChange={onValueChange} />);
      await user.type(spin(), '7');
      await user.tab();
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(7);
    });
  });

  describe('keys', () => {
    it('steps up and down along the grid', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity defaultValue={7} step={5} onValueChange={onValueChange} />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}');
      expect(spin()).toHaveValue('10');
      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(spin()).toHaveValue('0');
      expect(onValueChange).toHaveBeenCalledTimes(3);
    });

    it('stops at min and max', async () => {
      const user = userEvent.setup();
      render(<Quantity defaultValue={1} min={0} max={2} />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
      expect(spin()).toHaveValue('2');
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(spin()).toHaveValue('0');
    });

    it('moves a largeStep with PageUp and PageDown, ten steps by default', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Quantity defaultValue={50} step={2} />);
      await user.click(spin());
      await user.keyboard('{PageUp}');
      expect(spin()).toHaveValue('70');
      await user.keyboard('{PageDown}{PageDown}');
      expect(spin()).toHaveValue('30');
      unmount();
      render(<Quantity defaultValue={30} step={2} largeStep={4} />);
      await user.click(spin());
      await user.keyboard('{PageUp}');
      expect(spin()).toHaveValue('34');
    });

    it('goes to min on Home and max on End when they exist', async () => {
      const user = userEvent.setup();
      render(<Quantity defaultValue={5} min={1} max={9} />);
      await user.click(spin());
      await user.keyboard('{Home}');
      expect(spin()).toHaveValue('1');
      await user.keyboard('{End}');
      expect(spin()).toHaveValue('9');
    });

    it('reaches the same last value by End, typing and the arrows when max is off the grid', async () => {
      const user = userEvent.setup();
      render(<Quantity defaultValue={3} min={0} max={10} step={3} />);
      await user.click(spin());
      await user.keyboard('{End}');
      expect(spin()).toHaveValue('9');
      await user.clear(spin());
      await user.type(spin(), '10');
      await user.tab();
      expect(spin()).toHaveValue('9');
      spin().focus();
      await user.keyboard('{ArrowUp}');
      expect(spin()).toHaveValue('9');
      expect(increase()).toBeDisabled();
      await user.click(increase());
      expect(spin()).toHaveValue('9');
    });

    it('shows 0, not -0, when a step down lands on zero through float error', async () => {
      const user = userEvent.setup();
      render(<Quantity defaultValue={0.3} min={-0.9} step={0.3} />);
      await user.click(spin());
      await user.keyboard('{ArrowDown}');
      expect(spin()).toHaveValue('0');
      expect(spin()).toHaveAttribute('aria-valuetext', '0');
    });

    it('leaves Home and End to the caret when there is no min or max', () => {
      const onValueChange = vi.fn();
      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
      // `fireEvent` returns false when the default was prevented.
      expect(fireEvent.keyDown(spin(), { key: 'Home' })).toBe(true);
      expect(fireEvent.keyDown(spin(), { key: 'End' })).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('starts from min going up and from max going down when the value is null', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Quantity min={3} max={8} />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}');
      expect(spin()).toHaveValue('3');
      unmount();
      render(<Quantity min={3} max={8} />);
      await user.click(spin());
      await user.keyboard('{ArrowDown}');
      expect(spin()).toHaveValue('8');
    });

    it('starts from 0 when the value is null and there is no min or max', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Quantity />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}');
      expect(spin()).toHaveValue('0');
      unmount();
      render(<Quantity />);
      await user.click(spin());
      await user.keyboard('{ArrowDown}');
      expect(spin()).toHaveValue('0');
    });

    it('commits the text being typed before it steps', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity defaultValue={1} onValueChange={onValueChange} />);
      await user.click(spin());
      await user.clear(spin());
      await user.type(spin(), '20{ArrowUp}');
      expect(spin()).toHaveValue('21');
      expect(onValueChange).toHaveBeenNthCalledWith(1, 20);
      expect(onValueChange).toHaveBeenNthCalledWith(2, 21);
    });

    it('leaves a key with Alt, Ctrl or Meta to the browser', () => {
      const onValueChange = vi.fn();
      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
      for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
        expect(fireEvent.keyDown(spin(), { key: 'ArrowUp', [modifier]: true })).toBe(true);
      }
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('prevents the default of the arrow keys, so the caret does not jump', () => {
      render(<Quantity defaultValue={5} />);
      expect(fireEvent.keyDown(spin(), { key: 'ArrowUp' })).toBe(false);
    });
  });

  describe('decimal grids', () => {
    it('steps up from 0.3 with step 0.1 to 0.4, by key and by button', async () => {
      const user = userEvent.setup();
      render(<Quantity defaultValue={0.3} step={0.1} />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}');
      expect(spin()).toHaveValue('0.4');
      fireEvent.click(decrease());
      fireEvent.click(decrease());
      expect(spin()).toHaveValue('0.2');
      fireEvent.click(increase());
      fireEvent.click(increase());
      expect(spin()).toHaveValue('0.4');
    });
  });

  describe('buttons', () => {
    it('steps by a click that comes from assistive technology or the keyboard', () => {
      const onValueChange = vi.fn();
      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
      // `fireEvent.click` has `detail` 0, as a click made by a screen reader has.
      fireEvent.click(increase());
      expect(spin()).toHaveValue('6');
      fireEvent.click(decrease());
      fireEvent.click(decrease());
      expect(spin()).toHaveValue('4');
      expect(onValueChange).toHaveBeenCalledTimes(3);
    });

    it('steps once for a press, and takes no focus', () => {
      render(
        <>
          <input aria-label="Other" />
          <Quantity defaultValue={5} />
        </>,
      );
      screen.getByLabelText('Other').focus();
      // `fireEvent` returns false when the default was prevented: the press does not take focus.
      expect(fireEvent.pointerDown(increase(), { button: 0, isPrimary: true })).toBe(false);
      fireEvent.pointerUp(increase());
      expect(spin()).toHaveValue('6');
      expect(screen.getByLabelText('Other')).toHaveFocus();
    });

    it('does not step again for the click that ends a press', () => {
      render(<Quantity defaultValue={5} />);
      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
      fireEvent.pointerUp(increase());
      fireEvent.click(increase(), { detail: 1 });
      expect(spin()).toHaveValue('6');
    });

    it('repeats while pressed: after 400ms, then every 60ms, and stops on release', () => {
      vi.useFakeTimers();
      render(<Quantity defaultValue={0} />);
      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
      expect(spin()).toHaveValue('1');
      act(() => void vi.advanceTimersByTime(399));
      expect(spin()).toHaveValue('1');
      act(() => void vi.advanceTimersByTime(1));
      expect(spin()).toHaveValue('2');
      act(() => void vi.advanceTimersByTime(60 * 3));
      expect(spin()).toHaveValue('5');
      fireEvent.pointerUp(increase());
      act(() => void vi.advanceTimersByTime(1000));
      expect(spin()).toHaveValue('5');
    });

    it('stops repeating at the limit, when the pointer leaves, and when it is cancelled', () => {
      vi.useFakeTimers();
      render(<Quantity defaultValue={0} max={3} />);
      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
      act(() => void vi.advanceTimersByTime(400 + 60 * 10));
      expect(spin()).toHaveValue('3');
      expect(increase()).toBeDisabled();
      fireEvent.pointerUp(increase());

      fireEvent.pointerDown(decrease(), { button: 0, isPrimary: true });
      fireEvent.pointerLeave(decrease());
      act(() => void vi.advanceTimersByTime(1000));
      expect(spin()).toHaveValue('2');

      fireEvent.pointerDown(decrease(), { button: 0, isPrimary: true });
      fireEvent.pointerCancel(decrease());
      act(() => void vi.advanceTimersByTime(1000));
      expect(spin()).toHaveValue('1');
    });

    it('stops repeating when the window loses focus', () => {
      vi.useFakeTimers();
      render(<Quantity defaultValue={0} />);
      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
      act(() => void vi.advanceTimersByTime(400 + 60));
      expect(spin()).toHaveValue('3');
      fireEvent.blur(window);
      act(() => void vi.advanceTimersByTime(1000));
      expect(spin()).toHaveValue('3');
    });

    it('stops repeating when the page is hidden, and only then', () => {
      vi.useFakeTimers();
      const state = vi.spyOn(document, 'visibilityState', 'get');
      render(<Quantity defaultValue={0} />);
      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
      state.mockReturnValue('visible');
      fireEvent(document, new Event('visibilitychange'));
      act(() => void vi.advanceTimersByTime(400 + 60));
      expect(spin()).toHaveValue('3');
      state.mockReturnValue('hidden');
      fireEvent(document, new Event('visibilitychange'));
      act(() => void vi.advanceTimersByTime(1000));
      expect(spin()).toHaveValue('3');
    });

    it('stops listening to the window once the repeat has stopped', () => {
      vi.useFakeTimers();
      const remove = vi.spyOn(window, 'removeEventListener');
      render(<Quantity defaultValue={0} />);
      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
      fireEvent.pointerUp(increase());
      expect(remove).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('stops repeating when the component goes away', () => {
      vi.useFakeTimers();
      const onValueChange = vi.fn();
      const { unmount } = render(<Quantity defaultValue={0} onValueChange={onValueChange} />);
      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
      unmount();
      act(() => void vi.advanceTimersByTime(1000));
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('ignores a press that is not the primary button', () => {
      render(<Quantity defaultValue={5} />);
      fireEvent.pointerDown(increase(), { button: 2, isPrimary: true });
      expect(spin()).toHaveValue('5');
    });

    it('disables the button at its limit, and both when the control is disabled or read only', () => {
      const { rerender } = render(<Quantity value={0} min={0} max={5} />);
      expect(decrease()).toBeDisabled();
      expect(increase()).toBeEnabled();
      rerender(<Quantity value={5} min={0} max={5} />);
      expect(increase()).toBeDisabled();
      expect(decrease()).toBeEnabled();
      rerender(<Quantity value={2} disabled />);
      expect(decrease()).toBeDisabled();
      expect(increase()).toBeDisabled();
      rerender(<Quantity value={2} readOnly />);
      expect(decrease()).toBeDisabled();
      expect(increase()).toBeDisabled();
    });

    it('leaves both buttons on when there is no value, even at a limit of 0', () => {
      render(<Quantity value={null} min={0} max={0} />);
      expect(decrease()).toBeEnabled();
      expect(increase()).toBeEnabled();
    });
  });

  describe('read only and disabled', () => {
    it('blocks the step keys and the wheel when read only, and still shows the value', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity defaultValue={5} readOnly allowWheel onValueChange={onValueChange} />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}{PageUp}');
      fireEvent.wheel(spin(), { deltaY: -100 });
      expect(spin()).toHaveValue('5');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('sets data-disabled on the frame and disables the hidden input', () => {
      const { container } = render(<Quantity name="qty" defaultValue={5} disabled />);
      expect(container.firstElementChild).toHaveAttribute('data-disabled');
      expect(spin()).toBeDisabled();
      const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
      expect(hidden).toBeDisabled();
    });
  });

  describe('wheel', () => {
    it('does nothing by default', async () => {
      const user = userEvent.setup();
      render(<Quantity defaultValue={5} />);
      await user.click(spin());
      fireEvent.wheel(spin(), { deltaY: -100 });
      expect(spin()).toHaveValue('5');
    });

    it('steps on the wheel when allowed and focused, and stops the page scrolling', async () => {
      const user = userEvent.setup();
      render(<Quantity defaultValue={5} allowWheel />);
      // Not focused: the page scrolls as usual.
      expect(fireEvent.wheel(spin(), { deltaY: -100 })).toBe(true);
      expect(spin()).toHaveValue('5');
      await user.click(spin());
      expect(fireEvent.wheel(spin(), { deltaY: -100 })).toBe(false);
      expect(spin()).toHaveValue('6');
      fireEvent.wheel(spin(), { deltaY: 100 });
      fireEvent.wheel(spin(), { deltaY: 100 });
      expect(spin()).toHaveValue('4');
    });
  });

  describe('controlled', () => {
    it('shows the value it is given, and asks the parent for a change', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Quantity value={5} onValueChange={onValueChange} />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}');
      expect(onValueChange).toHaveBeenCalledWith(6);
      // The parent did not accept it.
      expect(spin()).toHaveValue('5');
    });

    it('follows the parent, and does not report a change the parent made', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<Quantity value={5} onValueChange={onValueChange} />);
      rerender(<Quantity value={8} onValueChange={onValueChange} />);
      expect(spin()).toHaveValue('8');
      rerender(<Quantity value={null} onValueChange={onValueChange} />);
      expect(spin()).toHaveValue('');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('works with state in the parent', async () => {
      function Parent() {
        const [value, setValue] = useState<number | null>(1);
        return <Quantity value={value} onValueChange={setValue} />;
      }
      const user = userEvent.setup();
      render(<Parent />);
      await user.click(spin());
      await user.keyboard('{ArrowUp}{ArrowUp}');
      expect(spin()).toHaveValue('3');
      await user.clear(spin());
      await user.tab();
      expect(spin()).toHaveValue('');
    });

    it('warns when it changes between uncontrolled and controlled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { rerender } = render(<Quantity defaultValue={1} />);
      rerender(<Quantity value={1} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('NumberInput'));
    });
  });

  describe('forms', () => {
    it('submits the raw number in the hidden input, and an empty string for null', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <Quantity name="qty" defaultValue={1234.5} />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).get('qty')).toBe('1234.5');
      await user.clear(spin());
      await user.tab();
      expect(new FormData(form).get('qty')).toBe('');
    });

    it('sends nothing without a name, and nothing when disabled', () => {
      const { container, rerender } = render(
        <form>
          <Quantity defaultValue={5} />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(Array.from(new FormData(form).keys())).toEqual([]);
      rerender(
        <form>
          <Quantity name="qty" defaultValue={5} disabled />
        </form>,
      );
      expect(Array.from(new FormData(form).keys())).toEqual([]);
    });

    it('puts required on the visible input, which takes part in validation', () => {
      const { container } = render(
        <form>
          <Quantity name="qty" required />
        </form>,
      );
      expect(spin()).toBeRequired();
      const form = container.querySelector('form') as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
    });

    it('puts an uncontrolled value, and its text, back to the default on reset', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <Quantity name="qty" defaultValue={5} onValueChange={onValueChange} />
          <button type="reset">Reset</button>
        </form>,
      );
      await user.type(spin(), '9');
      await user.tab();
      expect(spin()).toHaveValue('59');
      await user.click(screen.getByText('Reset'));
      await settle();
      expect(spin()).toHaveValue('5');
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).get('qty')).toBe('5');
      // A reset is not a change the user made: only the commit of the 9 was reported.
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('puts a value back to the default on reset when there is no name', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Quantity defaultValue={5} />
          <button type="reset">Reset</button>
        </form>,
      );
      await user.type(spin(), '9');
      await user.tab();
      expect(spin()).toHaveValue('59');
      await user.click(screen.getByText('Reset'));
      await settle();
      expect(spin()).toHaveValue('5');
    });

    it('drops text that was typed but not committed on reset', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Quantity defaultValue={5} />
          <button type="reset">Reset</button>
        </form>,
      );
      await user.type(spin(), '99');
      await user.click(screen.getByText('Reset'));
      await settle();
      expect(spin()).toHaveValue('5');
    });

    it('keeps a controlled value on reset', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Quantity name="qty" value={7} />
          <button type="reset">Reset</button>
        </form>,
      );
      await user.click(screen.getByText('Reset'));
      await settle();
      expect(spin()).toHaveValue('7');
    });

    it('does nothing when the reset is cancelled', async () => {
      const user = userEvent.setup();
      render(
        <form onReset={(event) => event.preventDefault()}>
          <Quantity defaultValue={5} />
          <button type="reset">Reset</button>
        </form>,
      );
      await user.type(spin(), '9');
      await user.tab();
      await user.click(screen.getByText('Reset'));
      await settle();
      expect(spin()).toHaveValue('59');
    });
  });

  describe('Field', () => {
    it('is labelled by the Field, takes its description and error, and its required', () => {
      render(
        <Field label="Quantity" description="Between 1 and 10" error="Too many" required>
          <NumberInput name="qty" />
        </Field>,
      );
      const input = screen.getByRole('spinbutton', { name: /Quantity/ });
      expect(input).toBeRequired();
      expect(input).toHaveAccessibleDescription('Between 1 and 10 Too many');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input.closest('.flg-number-input')).toHaveAttribute('data-invalid');
    });

    it('takes disabled from the Field', () => {
      render(
        <Field label="Quantity" disabled>
          <NumberInput name="qty" />
        </Field>,
      );
      expect(spin()).toBeDisabled();
      expect(increase()).toBeDisabled();
    });

    it('marks itself invalid without a Field', () => {
      const { container } = render(<Quantity invalid />);
      expect(container.firstElementChild).toHaveAttribute('data-invalid');
      expect(spin()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('development warnings', () => {
    it('warns when min is greater than max', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Quantity min={5} max={1} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('min'));
    });

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
      'warns about a step of %s, and uses 1',
      async (step) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const user = userEvent.setup();
        render(<Quantity defaultValue={5} step={step} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('step'));
        await user.click(spin());
        await user.keyboard('{ArrowUp}');
        expect(spin()).toHaveValue('6');
      },
    );
  });

  describe('focus', () => {
    it('keeps the focus in the field when a button is pressed with the mouse', () => {
      render(<Quantity defaultValue={5} />);
      expect(fireEvent.mouseDown(increase())).toBe(false);
      expect(fireEvent.mouseDown(decrease())).toBe(false);
    });
  });

  describe('forced colors', () => {
    it('greys a button that is disabled at a limit or by read only', () => {
      const preferences = readFileSync('src/styles/preferences.css', 'utf8');
      const block =
        /@media \(forced-colors: active\)[\s\S]*?\.flg-number-input > button:disabled \{\s*color: GrayText;/;
      expect(preferences).toMatch(block);
    });
  });
});
