import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { renderToString } from 'react-dom/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { DatePicker } from './DatePicker';

// jsdom has no Popover API. This stand-in is enough for the popup to render, as for a Combobox.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => {
  Object.assign(HTMLElement.prototype, original);
});

const input = () => screen.getByRole<HTMLInputElement>('textbox');
const button = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Choose date' });
const hidden = () => document.querySelector<HTMLInputElement>('input[type="hidden"]')!;
const popup = () => document.querySelector<HTMLElement>('.flg-date-picker-popup')!;
const root = () => document.querySelector<HTMLElement>('.flg-date-picker')!;
const day = (iso: string) => document.querySelector<HTMLElement>(`button[data-date="${iso}"]`)!;
const title = () => document.querySelector('.flg-calendar-title')!.textContent;
// jsdom has no Popover API, and takes the popup for hidden: its buttons are found by name anyway.
const nextMonth = () => within(popup()).getByRole('button', { name: 'Next month', hidden: true });
const isOpen = () => button().getAttribute('aria-expanded') === 'true';
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const key = (name: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(input(), { key: name, ...init });
// The input has the focus before it is left, as in a browser; a blur of an input without it does nothing.
const leave = () =>
  act(() => {
    input().focus();
    input().blur();
  });
const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

/** A DatePicker on a fixed "today", so no test depends on the day it runs. */
function DP(props: Partial<ComponentProps<typeof DatePicker>>) {
  return <DatePicker aria-label="Check-in" today="2026-11-04" {...props} />;
}

describe('DatePicker', () => {
  beforeEach(() => {
    resetDevWarnings();
    // jsdom's document has no focus once the input is blurred, which would read as a window switch.
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  describe('markup and ARIA', () => {
    it('renders the text, the hidden value and a closed popup on the server', () => {
      const html = renderToString(<DP name="checkin" defaultValue="2026-11-14" />);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(doc.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe('11/14/2026');
      expect(doc.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('2026-11-14');
      expect(doc.querySelector('.flg-calendar')).toBeNull();
    });

    it('is a frame holding the text input and the calendar button, then the hidden input and popup', () => {
      render(<DP name="checkin" size="lg" />);
      expect(root().children).toHaveLength(3);
      const frame = root().querySelector('.flg-input')!;
      expect(frame).toHaveAttribute('data-size', 'lg');
      expect(root()).toHaveAttribute('data-size', 'lg');
      expect(Array.from(frame.children)).toEqual([input(), button()]);
      expect(input()).toHaveAttribute('type', 'text');
      expect(input()).toHaveAttribute('autocomplete', 'off');
      expect(hidden()).toHaveAttribute('name', 'checkin');
      expect(input()).not.toHaveAttribute('name');
      expect(root().children[1]).toBe(hidden());
      expect(root().children[2]).toBe(popup());
    });

    it('takes the pattern of the locale as its placeholder, unless one is given', () => {
      const { rerender } = render(<DP />);
      expect(input()).toHaveAttribute('placeholder', 'mm/dd/yyyy');
      rerender(<DP locale="vi-VN" />);
      expect(input()).toHaveAttribute('placeholder', 'dd/mm/yyyy');
      rerender(<DP locale="de-DE" />);
      expect(input()).toHaveAttribute('placeholder', 'dd.mm.yyyy');
      rerender(<DP placeholder="Pick a day" />);
      expect(input()).toHaveAttribute('placeholder', 'Pick a day');
    });

    it('sends ref, id, required, aria-* and the other HTML props to the text input', () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <DatePicker
          aria-label="Check-in"
          ref={ref}
          id="checkin"
          required
          aria-describedby="hint"
          title="When?"
          className="mine"
          style={{ width: 200 }}
        />,
      );
      expect(ref.current).toBe(input());
      expect(input()).toHaveAttribute('id', 'checkin');
      expect(input()).toBeRequired();
      expect(input()).toHaveAttribute('aria-describedby', 'hint');
      expect(input()).toHaveAttribute('title', 'When?');
      // className and style belong to the element around.
      expect(root()).toHaveClass('flg-date-picker', 'mine');
      expect(root()).toHaveStyle({ width: '200px' });
      expect(input()).not.toHaveClass('mine');
    });

    it('marks the frame invalid and disabled', () => {
      render(<DP invalid disabled />);
      expect(root()).toHaveAttribute('data-invalid');
      expect(root()).toHaveAttribute('data-disabled');
      expect(root().querySelector('.flg-input')).toHaveAttribute('data-invalid');
      expect(input()).toHaveAttribute('aria-invalid', 'true');
    });

    it('has a calendar button that follows the input in the Tab order and names the dialog', () => {
      render(<DP />);
      expect(button()).toHaveAttribute('type', 'button');
      expect(button()).not.toHaveAttribute('tabindex');
      expect(button()).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button()).toHaveAttribute('aria-expanded', 'false');
      expect(button()).toHaveAttribute('aria-controls', popup().id);
      expect(button()).toHaveClass('flg-date-picker-button');
      expect(button().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('has a popup that is a non-modal dialog with a Calendar in it only while open', () => {
      render(<DP />);
      expect(popup()).toHaveAttribute('popover', 'auto');
      expect(popup()).toHaveAttribute('role', 'dialog');
      expect(popup()).toHaveAttribute('aria-label', 'Choose date');
      expect(popup()).toHaveClass('flg-surface', 'flg-date-picker-popup');
      expect(popup()).not.toHaveAttribute('aria-modal');
      expect(popup().querySelector('.flg-calendar')).toBeNull();
      fireEvent.click(button());
      expect(popup().querySelector('.flg-calendar')).not.toBeNull();
    });

    it('takes every word from labels', () => {
      render(
        <DP
          labels={{
            openCalendar: 'Mở lịch',
            dialog: 'Chọn ngày',
            previousMonth: 'Tháng trước',
            nextMonth: 'Tháng sau',
          }}
        />,
      );
      const open = screen.getByRole('button', { name: 'Mở lịch' });
      expect(popup()).toHaveAttribute('aria-label', 'Chọn ngày');
      fireEvent.click(open);
      expect(
        within(popup()).getByRole('button', { name: 'Tháng trước', hidden: true }),
      ).toBeInTheDocument();
      expect(
        within(popup()).getByRole('button', { name: 'Tháng sau', hidden: true }),
      ).toBeInTheDocument();
    });
  });

  describe('the text and the value', () => {
    it('shows the date of defaultValue and of value in the locale', () => {
      render(<DP defaultValue="2026-11-14" />);
      expect(input()).toHaveValue('11/14/2026');
      cleanup();
      const { rerender } = render(
        <DP locale="vi-VN" value="2026-11-14" onValueChange={() => {}} />,
      );
      expect(input()).toHaveValue('14/11/2026');
      rerender(<DP locale="de-DE" value="2026-11-14" onValueChange={() => {}} />);
      expect(input()).toHaveValue('14.11.2026');
    });

    it('reads typed text when the input is left, and writes the date back in the format', () => {
      const onValueChange = vi.fn();
      render(<DP name="d" onValueChange={onValueChange} />);
      act(() => input().focus());
      type('1/2/26');
      expect(onValueChange).not.toHaveBeenCalled();
      leave();
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('2026-01-02');
      expect(input()).toHaveValue('01/02/2026');
      expect(hidden()).toHaveValue('2026-01-02');
    });

    it('reads in the order of the locale: vi-VN and de-DE, any separator, two-digit years', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<DP locale="vi-VN" onValueChange={onValueChange} />);
      type('14-11-2026');
      leave();
      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-14');
      expect(input()).toHaveValue('14/11/2026');
      rerender(<DP locale="de-DE" onValueChange={onValueChange} />);
      expect(input()).toHaveValue('14.11.2026');
      type('3 5 26');
      leave();
      expect(onValueChange).toHaveBeenLastCalledWith('2026-05-03');
      expect(input()).toHaveValue('03.05.2026');
    });

    it('turns empty text into null, and reports it when there was a date', () => {
      const onValueChange = vi.fn();
      render(<DP name="d" defaultValue="2026-11-14" onValueChange={onValueChange} />);
      type('   ');
      leave();
      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(input()).toHaveValue('');
      expect(hidden()).toHaveValue('');
      // Empty text over no date is no change.
      onValueChange.mockClear();
      leave();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps text it cannot read, and the value', () => {
      const onValueChange = vi.fn();
      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
      for (const text of ['abc', '2/30/2026', '11/14', '11/14/202']) {
        type(text);
        leave();
        expect(input()).toHaveValue(text);
      }
      expect(onValueChange).not.toHaveBeenCalled();
      expect(hidden()).toHaveValue('2026-11-14');
    });

    it('keeps a date that cannot be chosen (before min, after max, unavailable), and the value', () => {
      const onValueChange = vi.fn();
      render(
        <DP
          defaultValue="2026-11-14"
          min="2026-11-10"
          max="2026-11-20"
          isDateUnavailable={(date) => date === '2026-11-18'}
          onValueChange={onValueChange}
        />,
      );
      for (const text of ['11/09/2026', '11/21/2026', '11/18/2026']) {
        type(text);
        leave();
        expect(input()).toHaveValue(text);
      }
      expect(onValueChange).not.toHaveBeenCalled();
      expect(hidden()).toHaveValue('2026-11-14');
      type('11/19/2026');
      leave();
      expect(onValueChange).toHaveBeenCalledWith('2026-11-19');
    });

    it('does not read the text when focus goes to its own button or into the popup', () => {
      const onValueChange = vi.fn();
      render(<DP onValueChange={onValueChange} />);
      type('11/14/2026');
      fireEvent.blur(input(), { relatedTarget: button() });
      expect(onValueChange).not.toHaveBeenCalled();
      fireEvent.blur(input(), { relatedTarget: popup() });
      expect(onValueChange).not.toHaveBeenCalled();
      leave();
      expect(onValueChange).toHaveBeenCalledWith('2026-11-14');
    });

    it('reads the text once focus goes on past the calendar button', () => {
      const onValueChange = vi.fn();
      render(
        <>
          <DP onValueChange={onValueChange} />
          <button type="button">Next</button>
        </>,
      );
      act(() => input().focus());
      type('11/14/2026');
      act(() => button().focus());
      expect(onValueChange).not.toHaveBeenCalled();
      act(() => screen.getByRole('button', { name: 'Next' }).focus());
      expect(onValueChange).toHaveBeenCalledWith('2026-11-14');
      expect(input()).toHaveValue('11/14/2026');
    });

    it('does not read the text when another window takes the focus', () => {
      const onValueChange = vi.fn();
      render(<DP onValueChange={onValueChange} />);
      type('11/14/2026');
      vi.spyOn(document, 'hasFocus').mockReturnValue(false);
      leave();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('reads the text on Enter, and the form submits unless the text stays', () => {
      const onValueChange = vi.fn();
      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
      // A date that changes the value is read, and Enter is left to the browser: the form submits it.
      type('11/20/2026');
      expect(key('Enter')).toBe(true);
      expect(onValueChange).toHaveBeenCalledWith('2026-11-20');
      expect(input()).toHaveValue('11/20/2026');
      // Text that stays unread must not submit the form with the old date next to it.
      type('abc');
      expect(key('Enter')).toBe(false);
      expect(input()).toHaveValue('abc');
      type('11/30/2099');
      expect(key('Enter')).toBe(true);
      // A date that cannot be chosen is no more submitted than text that cannot be read.
      cleanup();
      render(<DP min="2026-11-10" />);
      type('11/09/2026');
      expect(key('Enter')).toBe(false);
      // The same date in another spelling is no change; it is written back in the format.
      cleanup();
      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
      onValueChange.mockClear();
      type('11/14/26');
      expect(key('Enter')).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(input()).toHaveValue('11/14/2026');
    });

    it('writes the hidden input on Enter, before a render, for the form that submits right after', async () => {
      // A parent that refuses the change never renders the new value: the hidden input shows what
      // Enter wrote until the task after the keydown, when the submit has read it.
      render(<DP name="d" value="2026-11-14" onValueChange={() => {}} />);
      type('11/20/2026');
      key('Enter');
      expect(hidden()).toHaveValue('2026-11-20');
      await aTaskLater();
      expect(hidden()).toHaveValue('2026-11-14');
    });

    it('leaves Enter and the text alone while read-only', () => {
      const onValueChange = vi.fn();
      render(<DP readOnly defaultValue="2026-11-14" onValueChange={onValueChange} />);
      expect(input()).toHaveAttribute('readonly');
      expect(key('Enter')).toBe(true);
      leave();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('follows a value that the parent changes, without reporting it', () => {
      const onValueChange = vi.fn();
      function Parent() {
        const [value, setValue] = useState<string | null>('2026-11-14');
        return (
          <>
            <button type="button" onClick={() => setValue('2026-12-25')}>
              Set
            </button>
            <button type="button" onClick={() => setValue(null)}>
              Clear
            </button>
            <DP
              value={value}
              onValueChange={(next) => {
                onValueChange(next);
                setValue(next);
              }}
            />
          </>
        );
      }
      render(<Parent />);
      fireEvent.click(screen.getByRole('button', { name: 'Set' }));
      expect(input()).toHaveValue('12/25/2026');
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(input()).toHaveValue('');
      expect(hidden()).toHaveValue('');
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('opening', () => {
    it('opens on the button, and puts focus on the day with the tab stop', () => {
      const onOpenChange = vi.fn();
      render(<DP defaultValue="2026-11-14" onOpenChange={onOpenChange} />);
      fireEvent.click(button());
      expect(isOpen()).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(day('2026-11-14')).toHaveFocus();
      expect(day('2026-11-14').closest('td')).toHaveAttribute('aria-selected', 'true');
    });

    it('opens on Alt+ArrowDown in the input, and on nothing else', () => {
      render(<DP />);
      expect(key('ArrowDown')).toBe(true);
      expect(isOpen()).toBe(false);
      expect(key('ArrowDown', { altKey: true, ctrlKey: true })).toBe(true);
      expect(isOpen()).toBe(false);
      // The key is the DatePicker's: the page must not scroll.
      expect(key('ArrowDown', { altKey: true })).toBe(false);
      expect(isOpen()).toBe(true);
      // Without a value or a month the focus lands on today.
      expect(day('2026-11-04')).toHaveFocus();
    });

    it('focuses today when it is read from the clock, after the first render', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2027, 2, 9, 12));
      render(<DatePicker aria-label="Check-in" />);
      fireEvent.click(button());
      expect(title()).toBe('March 2027');
      expect(day('2027-03-09')).toHaveFocus();
    });

    it('closes on the button when it is open', () => {
      render(<DP />);
      fireEvent.click(button());
      expect(isOpen()).toBe(true);
      fireEvent.click(button());
      expect(isOpen()).toBe(false);
    });

    it('opens on the month of the value', () => {
      render(<DP defaultValue="2027-02-03" />);
      fireEvent.click(button());
      expect(title()).toBe('February 2027');
    });

    it('opens on today when there is no value, and on a fresh month each time', () => {
      render(<DP />);
      fireEvent.click(button());
      expect(title()).toBe('November 2026');
      fireEvent.click(nextMonth());
      expect(title()).toBe('December 2026');
      fireEvent.click(button());
      fireEvent.click(button());
      expect(title()).toBe('November 2026');
    });

    it('reads the typed text first, and opens on its month', () => {
      const onValueChange = vi.fn();
      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
      type('03/05/2027');
      fireEvent.click(button());
      expect(onValueChange).toHaveBeenCalledWith('2027-03-05');
      expect(title()).toBe('March 2027');
      expect(day('2027-03-05')).toHaveFocus();
      expect(input()).toHaveValue('03/05/2027');
    });

    it('opens on the month of the value when the text cannot be read or chosen', () => {
      render(<DP defaultValue="2026-11-14" max="2026-12-31" />);
      type('garbage');
      fireEvent.click(button());
      expect(title()).toBe('November 2026');
      expect(input()).toHaveValue('garbage');
      fireEvent.click(button());
      type('03/05/2027');
      fireEvent.click(button());
      expect(title()).toBe('November 2026');
      expect(input()).toHaveValue('03/05/2027');
    });

    it('opens on the month of today when the text cannot be read and there is no value', () => {
      render(<DP today="2026-08-20" />);
      type('garbage');
      key('ArrowDown', { altKey: true });
      expect(title()).toBe('August 2026');
    });

    it('hands the Calendar its limits, locale and words', () => {
      render(
        <DP
          defaultValue="2026-11-14"
          locale="vi-VN"
          weekStartsOn={1}
          min="2026-11-10"
          max="2026-11-20"
          isDateUnavailable={(date) => date === '2026-11-18'}
        />,
      );
      fireEvent.click(button());
      expect(title()).toBe('tháng 11 năm 2026');
      expect(day('2026-11-09')).toHaveAttribute('aria-disabled', 'true');
      expect(day('2026-11-18')).toHaveAttribute('aria-disabled', 'true');
      expect(day('2026-11-21')).toHaveAttribute('aria-disabled', 'true');
      expect(day('2026-11-19')).not.toHaveAttribute('aria-disabled');
      // The week starts on Monday: the first column is Thứ Hai.
      expect(document.querySelector('.flg-calendar-weekday')).toHaveTextContent('Thứ Hai');
    });

    it('opens by defaultOpen, and asks a controlling parent instead of opening', () => {
      render(<DP defaultOpen />);
      expect(isOpen()).toBe(true);
      cleanup();
      const onOpenChange = vi.fn();
      render(<DP open={false} onOpenChange={onOpenChange} />);
      expect(isOpen()).toBe(false);
      fireEvent.click(button());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(isOpen()).toBe(false);
    });

    it('closes when it becomes disabled while open', () => {
      const { rerender } = render(<DP />);
      fireEvent.click(button());
      rerender(<DP disabled />);
      expect(isOpen()).toBe(false);
    });
  });

  describe('in the popup', () => {
    it('chooses a day: the value, the text, the popup closed, the focus on the input', () => {
      const onValueChange = vi.fn();
      const onOpenChange = vi.fn();
      render(<DP name="d" onValueChange={onValueChange} onOpenChange={onOpenChange} />);
      fireEvent.click(button());
      fireEvent.click(day('2026-11-18'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
      expect(input()).toHaveValue('11/18/2026');
      expect(hidden()).toHaveValue('2026-11-18');
      expect(isOpen()).toBe(false);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(popup().querySelector('.flg-calendar')).toBeNull();
      expect(input()).toHaveFocus();
    });

    it('closes on the day that is already chosen, with nothing reported, and writes the text again', () => {
      const onValueChange = vi.fn();
      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
      type('11/14/26');
      fireEvent.click(button());
      expect(input()).toHaveValue('11/14/2026');
      type('11/14/26');
      fireEvent.click(day('2026-11-14'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(isOpen()).toBe(false);
      expect(input()).toHaveValue('11/14/2026');
      expect(input()).toHaveFocus();
    });

    it('chooses with the keyboard: Enter on a day', () => {
      const onValueChange = vi.fn();
      render(<DP defaultValue="2026-11-14" onValueChange={onValueChange} />);
      fireEvent.click(button());
      fireEvent.keyDown(day('2026-11-14'), { key: 'ArrowRight' });
      expect(day('2026-11-15')).toHaveFocus();
      // The browser turns Enter on a button into a click.
      fireEvent.click(day('2026-11-15'));
      expect(onValueChange).toHaveBeenCalledWith('2026-11-15');
      expect(isOpen()).toBe(false);
    });

    it('does not choose a day that cannot be chosen, and stays open', () => {
      const onValueChange = vi.fn();
      render(<DP min="2026-11-10" onValueChange={onValueChange} />);
      fireEvent.click(button());
      fireEvent.click(day('2026-11-05'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(isOpen()).toBe(true);
    });

    it('does not choose when a month button is pressed, and keeps the popup open', () => {
      render(<DP />);
      fireEvent.click(button());
      fireEvent.click(nextMonth());
      expect(isOpen()).toBe(true);
      expect(title()).toBe('December 2026');
    });

    it('goes back to the input, with the value kept, when the browser closes it on Esc', () => {
      const onOpenChange = vi.fn();
      render(<DP defaultValue="2026-11-14" onOpenChange={onOpenChange} />);
      fireEvent.click(button());
      expect(day('2026-11-14')).toHaveFocus();
      // The browser closes a `popover="auto"` on Esc and says so with these two events.
      const closed = (type: string) => {
        const event = new Event(type);
        Object.assign(event, { newState: 'closed', oldState: 'open' });
        popup().dispatchEvent(event);
      };
      act(() => {
        closed('beforetoggle');
        closed('toggle');
      });
      expect(isOpen()).toBe(false);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(input()).toHaveFocus();
      expect(input()).toHaveValue('11/14/2026');
    });

    it('closes when focus leaves it for anything but the input or the button, and keeps no focus', async () => {
      render(
        <>
          <DP defaultValue="2026-11-14" />
          <button type="button">Elsewhere</button>
        </>,
      );
      fireEvent.click(button());
      expect(day('2026-11-14')).toHaveFocus();
      const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
      act(() => elsewhere.focus());
      // A task later, when the focus has arrived: it must not be sent back to the input.
      await aTaskLater();
      expect(isOpen()).toBe(false);
      expect(elsewhere).toHaveFocus();
    });

    it('stays open while focus moves inside, to nowhere, or to the calendar button', async () => {
      render(<DP defaultValue="2026-11-14" />);
      fireEvent.click(button());
      act(() => nextMonth().focus());
      expect(isOpen()).toBe(true);
      // A press on a day that takes no focus (Safari) or on a blank part leaves focus nowhere.
      fireEvent.blur(nextMonth(), { relatedTarget: null });
      expect(isOpen()).toBe(true);
      fireEvent.blur(nextMonth(), {
        relatedTarget: button(),
      });
      await aTaskLater();
      expect(isOpen()).toBe(true);
    });
  });

  describe('read-only and disabled', () => {
    it('shows the button as aria-disabled when read-only, and opens nothing', () => {
      render(<DP readOnly defaultValue="2026-11-14" />);
      expect(button()).toHaveAttribute('aria-disabled', 'true');
      expect(button()).not.toBeDisabled();
      fireEvent.click(button());
      expect(isOpen()).toBe(false);
      expect(key('ArrowDown', { altKey: true })).toBe(false);
      expect(isOpen()).toBe(false);
    });

    it('disables the text input, the button and the hidden input together', () => {
      const { container } = render(
        <form>
          <DP name="d" disabled defaultValue="2026-11-14" />
        </form>,
      );
      expect(input()).toBeDisabled();
      expect(button()).toBeDisabled();
      expect(hidden()).toBeDisabled();
      expect(new FormData(container.querySelector('form')!).get('d')).toBeNull();
      fireEvent.click(button());
      expect(isOpen()).toBe(false);
    });
  });

  describe('in a form', () => {
    function FormOf(props: Partial<ComponentProps<typeof DatePicker>> = {}) {
      return (
        <form>
          <DP name="checkin" {...props} />
        </form>
      );
    }
    const dataOf = (form: HTMLFormElement) => new FormData(form).get('checkin');

    it('submits the ISO date through the hidden input, and the empty string for no date', () => {
      const { container } = render(<FormOf defaultValue="2026-11-14" />);
      const form = container.querySelector('form')!;
      expect(dataOf(form)).toBe('2026-11-14');
      type('');
      leave();
      expect(dataOf(form)).toBe('');
      type('02/03/2027');
      leave();
      expect(dataOf(form)).toBe('2027-02-03');
    });

    it('follows a day chosen in the calendar', () => {
      const { container } = render(<FormOf />);
      fireEvent.click(button());
      fireEvent.click(day('2026-11-18'));
      expect(dataOf(container.querySelector('form')!)).toBe('2026-11-18');
    });

    it('stops the submit while required and empty, on the text input, not on the hidden one', () => {
      const { container } = render(<FormOf required />);
      const form = container.querySelector('form')!;
      expect(input()).toBeRequired();
      expect(hidden()).not.toHaveAttribute('required');
      expect(form.checkValidity()).toBe(false);
      type('11/14/2026');
      leave();
      expect(form.checkValidity()).toBe(true);
    });

    it('resets an uncontrolled value to defaultValue, and the text to that date', async () => {
      const { container } = render(<FormOf defaultValue="2026-11-14" />);
      const form = container.querySelector('form')!;
      type('12/25/2026');
      leave();
      expect(dataOf(form)).toBe('2026-12-25');
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('11/14/2026');
      expect(dataOf(form)).toBe('2026-11-14');
    });

    it('resets to nothing without a default, and drops text that was never read', async () => {
      const { container } = render(<FormOf />);
      const form = container.querySelector('form')!;
      type('abc');
      leave();
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('');
      expect(dataOf(form)).toBe('');
    });

    it('drops unread text on reset when the value is already the default', async () => {
      const { container } = render(<FormOf defaultValue="2026-11-14" />);
      type('garbage');
      leave();
      container.querySelector('form')!.reset();
      await aTaskLater();
      expect(input()).toHaveValue('11/14/2026');
    });

    it('keeps its value when the reset is cancelled', async () => {
      let allowReset = false;
      render(
        <form
          onReset={(event) => {
            if (!allowReset) event.preventDefault();
          }}
        >
          <DP name="checkin" defaultValue="2026-11-14" />
        </form>,
      );
      const form = input().closest('form')!;
      type('12/25/2026');
      leave();
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('12/25/2026');
      expect(dataOf(form)).toBe('2026-12-25');
      allowReset = true;
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('11/14/2026');
      expect(dataOf(form)).toBe('2026-11-14');
    });

    it('keeps a controlled value on reset, and puts its text back', async () => {
      const { container } = render(
        <FormOf value="2026-11-14" onValueChange={() => {}} defaultValue="2026-01-01" />,
      );
      const form = container.querySelector('form')!;
      type('garbage');
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('11/14/2026');
      expect(dataOf(form)).toBe('2026-11-14');
    });
  });

  describe('in a Field', () => {
    it('takes its id, description and invalid state from the Field, and has its label', () => {
      render(
        <Field label="Check-in" description="Write it mm/dd/yyyy." error="Pick a later date.">
          <DatePicker today="2026-11-04" />
        </Field>,
      );
      const field = screen.getByRole('textbox', { name: 'Check-in' });
      expect(field).toBe(input());
      expect(document.querySelector('label')).toHaveAttribute('for', input().id);
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      const described = input().getAttribute('aria-describedby')!.split(' ');
      expect(described).toHaveLength(2);
      expect(root()).toHaveAttribute('data-invalid');
      expect(screen.getByText('Write it mm/dd/yyyy.').id).toBe(described[0]);
      expect(screen.getByText('Pick a later date.').id).toBe(described[1]);
    });

    it('takes required and disabled from the Field', () => {
      render(
        <Field label="Check-in" required disabled>
          <DatePicker name="d" />
        </Field>,
      );
      expect(input()).toBeRequired();
      expect(input()).toBeDisabled();
      expect(button()).toBeDisabled();
      expect(hidden()).toBeDisabled();
    });
  });

  describe('dev warnings', () => {
    it('ignores a date that is no ISO date, and says which prop', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <DP
          defaultValue="14/11/2026"
          min="soon"
          max="2026-02-30"
          today="today"
          onValueChange={() => {}}
        />,
      );
      // The prefix, escaped for a regular expression.
      const prefix = WARN_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const name of ['defaultValue', 'min', 'max', 'today']) {
        expect(warn).toHaveBeenCalledWith(
          expect.stringMatching(
            new RegExp(`^${prefix} DatePicker: ${name} ".*" is not a date written`),
          ),
        );
      }
      expect(input()).toHaveValue('');
      // Ignored dates limit nothing, and today is read from the clock.
      type('01/01/2000');
      leave();
      expect(input()).toHaveValue('01/01/2000');
      expect(hidden()).toHaveValue('2000-01-01');
    });

    it('treats an invalid value as a controlled DatePicker with no date', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<DP value="2026-13-01" onValueChange={() => {}} />);
      expect(warn).toHaveBeenCalledWith(
        WARN_PREFIX +
          ' DatePicker: value "2026-13-01" is not a date written YYYY-MM-DD; it is ignored.',
      );
      expect(input()).toHaveValue('');
    });

    it('warns when min is after max, and ignores both', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<DP min="2026-12-01" max="2026-11-01" />);
      expect(warn).toHaveBeenCalledWith(
        WARN_PREFIX + ' DatePicker: min (2026-12-01) is after max (2026-11-01); both are ignored.',
      );
      type('11/14/2026');
      leave();
      expect(hidden()).toHaveValue('2026-11-14');
    });

    it('names the prop that switches between controlled and not', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(<DP defaultValue="2026-11-14" />);
      rerender(<DP value="2026-11-14" open={false} onValueChange={() => {}} />);
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/\] DatePicker value is changing from/),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/\] DatePicker open is changing from/),
      );
    });

    it('says nothing for dates that are fine', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<DP defaultValue="2026-11-14" min="2026-11-01" max="2026-11-30" />);
      expect(warn).not.toHaveBeenCalled();
    });
  });
});
