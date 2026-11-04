import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatMonthYear } from '../../internal/date';
import { resetDevWarnings } from '../../internal/warn';
import { Calendar } from './Calendar';
import type { CalendarProps } from './Calendar';

const day = (iso: string) => document.querySelector(`[data-date="${iso}"]`) as HTMLElement;
const dayButtons = () => Array.from(document.querySelectorAll<HTMLElement>('button[data-date]'));
const title = () => document.querySelector('.flg-calendar-title') as HTMLElement;
const previous = () => screen.getByRole('button', { name: 'Previous month' });
const next = () => screen.getByRole('button', { name: 'Next month' });
const tabStop = () => dayButtons().filter((button) => button.tabIndex === 0);

/** A Calendar on a fixed "today", so no test depends on the day it runs. */
function Cal(props: CalendarProps) {
  return <Calendar today="2026-11-04" {...props} />;
}

function Controlled(props: { onValueChange?: (value: string) => void }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => setValue('2027-02-03')}>
        Pick
      </button>
      <Cal
        value={value}
        onValueChange={(next) => {
          props.onValueChange?.(next);
          setValue(next);
        }}
      />
    </>
  );
}

describe('Calendar', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('the month it shows', () => {
    it('takes month before everything else', () => {
      render(<Cal month="2027-03" defaultMonth="2026-05" value="2026-08-10" />);
      expect(title()).toHaveTextContent('March 2027');
    });

    it('takes defaultMonth before the month of the value', () => {
      render(<Cal defaultMonth="2026-05" value="2026-08-10" />);
      expect(title()).toHaveTextContent('May 2026');
    });

    it('takes the month of value before the month of today', () => {
      render(<Cal value="2026-08-10" />);
      expect(title()).toHaveTextContent('August 2026');
    });

    it('takes the month of defaultValue too', () => {
      render(<Cal defaultValue="2026-09-30" />);
      expect(title()).toHaveTextContent('September 2026');
    });

    it('takes the month of today when it has nothing else', () => {
      render(<Cal />);
      expect(title()).toHaveTextContent('November 2026');
    });

    it("takes the machine's month after mount when it has no today either", () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 11, 10, 12));
      render(<Calendar />);
      expect(title()).toHaveTextContent('December 2026');
      expect(day('2026-12-10')).toHaveAttribute('aria-current', 'date');
    });

    it('renders on the server with an empty title, no weekday names and no day buttons', () => {
      const doc = new DOMParser().parseFromString(renderToString(<Calendar />), 'text/html');
      expect(doc.querySelector('.flg-calendar-title')?.textContent).toBe('');
      expect(doc.querySelectorAll('th')).toHaveLength(0);
      expect(doc.querySelectorAll('button[data-date]')).toHaveLength(0);
      expect(doc.querySelectorAll('td')).toHaveLength(0);
      // The live region is there from the first byte, so a later month is read out.
      expect(doc.querySelector('.flg-calendar-title')?.getAttribute('aria-live')).toBe('polite');
    });

    it('renders the month on the server when it is told which', () => {
      const doc = new DOMParser().parseFromString(
        renderToString(<Calendar month="2026-11" />),
        'text/html',
      );
      expect(doc.querySelector('.flg-calendar-title')?.textContent).toBe('November 2026');
      expect(doc.querySelectorAll('button[data-date]')).toHaveLength(30);
      expect(doc.querySelector('[aria-current]')).toBeNull();
    });

    it('follows a controlled value that moves to another month while month is uncontrolled', () => {
      render(<Controlled />);
      expect(title()).toHaveTextContent('November 2026');
      // Once the user has moved the month it is held in state, and the value must still win.
      fireEvent.click(next());
      expect(title()).toHaveTextContent('December 2026');
      fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
      expect(title()).toHaveTextContent('February 2027');
      expect(day('2027-02-03')).toHaveAttribute('tabindex', '0');
    });

    it('does not report the month that followed the value', () => {
      const onMonthChange = vi.fn();
      const { rerender } = render(<Cal value="2026-11-10" onMonthChange={onMonthChange} />);
      rerender(<Cal value="2027-02-03" onMonthChange={onMonthChange} />);
      expect(title()).toHaveTextContent('February 2027');
      expect(onMonthChange).not.toHaveBeenCalled();
    });

    it('does not pull the month back to the value once the user has moved away', () => {
      const { rerender } = render(<Cal value="2026-11-10" />);
      fireEvent.click(next());
      rerender(<Cal value="2026-11-10" />);
      expect(title()).toHaveTextContent('December 2026');
    });

    it('keeps a controlled month where the parent put it', () => {
      const onMonthChange = vi.fn();
      const { rerender } = render(<Cal month="2026-11" onMonthChange={onMonthChange} />);
      fireEvent.click(next());
      expect(onMonthChange).toHaveBeenCalledWith('2026-12');
      expect(title()).toHaveTextContent('November 2026');
      rerender(<Cal month="2027-06" onMonthChange={onMonthChange} />);
      expect(title()).toHaveTextContent('June 2027');
      // A controlled month does not follow the value: the parent owns both.
      rerender(<Cal month="2027-06" value="2026-01-01" onMonthChange={onMonthChange} />);
      expect(title()).toHaveTextContent('June 2027');
    });
  });

  describe('today', () => {
    it('marks today with aria-current once it is known, and no other day', () => {
      render(<Cal />);
      const marked = document.querySelectorAll('[aria-current]');
      expect(marked).toHaveLength(1);
      expect(marked[0]).toBe(day('2026-11-04'));
      expect(marked[0]).toHaveAttribute('aria-current', 'date');
    });

    it('marks nothing when today is not in the month shown', () => {
      render(<Cal defaultMonth="2026-12" />);
      expect(document.querySelector('[aria-current]')).toBeNull();
    });

    it('lets the today prop win over the clock', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 20, 12));
      render(<Cal today="2026-11-04" />);
      expect(day('2026-11-04')).toHaveAttribute('aria-current', 'date');
      expect(day('2026-11-20')).not.toHaveAttribute('aria-current');
    });

    it('reads the clock after mount without a today prop', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 20, 12));
      render(<Calendar />);
      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
    });

    it('reads the clock again when the page becomes visible', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 20, 23, 59));
      render(<Calendar />);
      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
      vi.setSystemTime(new Date(2026, 10, 21, 0, 1));
      const visibility = vi.spyOn(document, 'visibilityState', 'get');
      visibility.mockReturnValue('hidden');
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
      visibility.mockReturnValue('visible');
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(day('2026-11-21')).toHaveAttribute('aria-current', 'date');
      expect(day('2026-11-20')).not.toHaveAttribute('aria-current');
    });

    it('reads the clock again when focus enters the calendar', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 20, 23, 59));
      render(<Calendar />);
      vi.setSystemTime(new Date(2026, 10, 21, 0, 1));
      fireEvent.focusIn(day('2026-11-05'));
      expect(day('2026-11-21')).toHaveAttribute('aria-current', 'date');
    });

    it('does not read the clock when it has a today prop', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 20, 12));
      render(<Cal today="2026-11-04" />);
      vi.setSystemTime(new Date(2026, 10, 21, 12));
      fireEvent.focusIn(day('2026-11-05'));
      expect(day('2026-11-04')).toHaveAttribute('aria-current', 'date');
    });

    it('stops listening to the page when it unmounts', () => {
      const remove = vi.spyOn(document, 'removeEventListener');
      const { unmount } = render(<Calendar />);
      unmount();
      expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  describe('structure and ARIA', () => {
    it('renders a root div with the mode, the class, the ref and the rest props', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <Calendar
          ref={ref}
          today="2026-11-04"
          className="mine"
          data-testid="cal"
          id="c"
          aria-label="Pick a date"
        />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(ref.current).toBe(root);
      expect(root.tagName).toBe('DIV');
      expect(root).toHaveClass('flg-calendar', 'mine');
      expect(root).toHaveAttribute('data-mode', 'single');
      expect(root).toHaveAttribute('data-testid', 'cal');
      expect(root).toHaveAttribute('id', 'c');
      expect(root).toHaveAttribute('aria-label', 'Pick a date');
    });

    it('names the grid by the title, which is a polite live region and not a heading', () => {
      render(<Cal />);
      const grid = screen.getByRole('grid', { name: 'November 2026' });
      expect(grid.tagName).toBe('TABLE');
      expect(grid).toHaveAttribute('aria-labelledby', title().id);
      expect(title().tagName).toBe('DIV');
      expect(title()).toHaveAttribute('aria-live', 'polite');
      expect(screen.queryByRole('heading')).toBeNull();
    });

    it('shows short weekday names and reads the long ones', () => {
      render(<Cal />);
      const headers = screen.getAllByRole('columnheader', { hidden: true });
      expect(headers).toHaveLength(7);
      const first = headers[0] as HTMLElement;
      expect(first).toHaveAttribute('scope', 'col');
      expect(first.querySelector('[aria-hidden="true"]')).toHaveTextContent('Sun');
      expect(first.querySelector('.flg-visually-hidden')).toHaveTextContent('Sunday');
      expect(screen.getByRole('columnheader', { name: 'Saturday' })).toBeInTheDocument();
    });

    it('lays out six rows of seven cells', () => {
      render(<Cal />);
      expect(document.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(document.querySelectorAll('tbody td[role="gridcell"]')).toHaveLength(42);
      expect(dayButtons()).toHaveLength(30);
    });

    it('names each day with its full date in the locale', () => {
      render(<Cal />);
      expect(day('2026-11-14')).toHaveAccessibleName('Saturday, November 14, 2026');
      expect(day('2026-11-14')).toHaveTextContent('14');
      expect(day('2026-11-14')).toHaveAttribute('type', 'button');
    });

    it('names each day in vi-VN and de-DE', () => {
      const long = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as const;
      const { rerender } = render(<Cal locale="vi-VN" />);
      expect(day('2026-11-14')).toHaveAccessibleName(formatDate('2026-11-14', 'vi-VN', long));
      expect(day('2026-11-14').getAttribute('aria-label')).toMatch(/Thứ Bảy/);
      rerender(<Cal locale="de-DE" />);
      expect(day('2026-11-14')).toHaveAccessibleName(formatDate('2026-11-14', 'de-DE', long));
      expect(day('2026-11-14').getAttribute('aria-label')).toMatch(/Samstag/);
    });

    it('sets aria-selected on the gridcell of the chosen day, and no aria-pressed anywhere', () => {
      render(<Cal defaultValue="2026-11-14" />);
      const cell = day('2026-11-14').closest('td') as HTMLElement;
      expect(cell).toHaveAttribute('aria-selected', 'true');
      expect(document.querySelectorAll('[aria-selected]')).toHaveLength(1);
      expect(document.querySelector('[aria-pressed]')).toBeNull();
      expect(day('2026-11-14')).not.toHaveAttribute('aria-selected');
    });

    it('does not select a day of another month that shows in the grid', () => {
      render(<Cal value="2026-10-31" />);
      expect(title()).toHaveTextContent('October 2026');
      fireEvent.click(next());
      expect(document.querySelector('[aria-selected]')).toBeNull();
    });

    it('puts the days of the months around as hidden numbers, not buttons', () => {
      render(<Cal />);
      // 1 November 2026 is a Sunday, so the grid starts on it and ends on 12 December.
      const outside = document.querySelectorAll('td > span[data-date]');
      expect(outside).toHaveLength(12);
      for (const cell of outside) {
        expect(cell).toHaveAttribute('aria-hidden', 'true');
        expect(cell).toHaveAttribute('data-outside');
        expect(cell.closest('td')).toHaveAttribute('role', 'gridcell');
        expect((cell as HTMLElement).tabIndex).toBe(-1);
      }
      expect(outside[0]).toHaveAttribute('data-date', '2026-12-01');
      expect(outside[0]).toHaveTextContent('1');
    });

    it('ignores a press on a day of another month', () => {
      const onValueChange = vi.fn();
      const onMonthChange = vi.fn();
      render(<Cal weekStartsOn={1} onValueChange={onValueChange} onMonthChange={onMonthChange} />);
      const outside = document.querySelector('span[data-date="2026-10-31"]') as HTMLElement;
      fireEvent.click(outside);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(onMonthChange).not.toHaveBeenCalled();
      expect(title()).toHaveTextContent('November 2026');
    });

    it('labels the month buttons, and lets the labels be translated', () => {
      const { rerender } = render(<Cal />);
      expect(previous()).toHaveClass('flg-button');
      expect(previous().querySelector('svg')).toBeInTheDocument();
      rerender(<Cal labels={{ previousMonth: 'Tháng trước', nextMonth: 'Tháng sau' }} />);
      expect(screen.getByRole('button', { name: 'Tháng trước' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tháng sau' })).toBeInTheDocument();
      rerender(<Cal labels={{ nextMonth: 'Suivant' }} />);
      expect(previous()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
    });
  });

  describe('the focused day (roving tabindex)', () => {
    it('is the chosen day when it is in the month shown', () => {
      render(<Cal defaultValue="2026-11-14" />);
      expect(tabStop()).toEqual([day('2026-11-14')]);
    });

    it('is today when nothing is chosen in the month shown', () => {
      render(<Cal defaultValue="2026-10-14" month="2026-11" />);
      expect(tabStop()).toEqual([day('2026-11-04')]);
    });

    it('is the first day that can be chosen when neither is in the month', () => {
      render(
        <Cal
          month="2026-12"
          isDateUnavailable={(date) => date === '2026-12-01' || date === '2026-12-02'}
        />,
      );
      expect(tabStop()).toEqual([day('2026-12-03')]);
    });

    it('is the first day of the month when none can be chosen', () => {
      render(<Cal month="2026-12" isDateUnavailable={() => true} />);
      expect(tabStop()).toEqual([day('2026-12-01')]);
    });

    it('skips the days before min', () => {
      render(<Cal month="2026-12" min="2026-12-09" />);
      expect(tabStop()).toEqual([day('2026-12-09')]);
    });

    it('has exactly one tab stop, and the days of other months are not in the tab order', () => {
      render(<Cal defaultValue="2026-11-14" />);
      expect(tabStop()).toHaveLength(1);
      expect(dayButtons().filter((button) => button.tabIndex === -1)).toHaveLength(29);
    });

    it('moves with the focus', () => {
      render(<Cal defaultValue="2026-11-14" />);
      act(() => day('2026-11-20').focus());
      expect(tabStop()).toEqual([day('2026-11-20')]);
    });

    it('is chosen again by the rule when a month button is pressed, and focus stays on the button', () => {
      render(<Cal defaultValue="2026-11-14" />);
      act(() => day('2026-11-20').focus());
      fireEvent.click(next());
      expect(tabStop()).toEqual([day('2026-12-01')]);
      fireEvent.click(previous());
      expect(tabStop()).toEqual([day('2026-11-14')]);
    });
  });

  describe('keys', () => {
    const start = '2026-11-11'; // a Wednesday

    function setup(props: Partial<Extract<CalendarProps, { mode?: 'single' }>> = {}) {
      const onMonthChange = vi.fn();
      render(<Cal defaultValue={start} onMonthChange={onMonthChange} {...props} />);
      const origin = day((props.defaultValue as string | undefined) ?? start);
      act(() => origin.focus());
      return { onMonthChange, origin };
    }

    it.each([
      ['ArrowLeft', '2026-11-10'],
      ['ArrowRight', '2026-11-12'],
      ['ArrowUp', '2026-11-04'],
      ['ArrowDown', '2026-11-18'],
      ['Home', '2026-11-08'],
      ['End', '2026-11-14'],
    ])('%s moves the focus to %s', (key, target) => {
      setup();
      fireEvent.keyDown(document.activeElement as Element, { key });
      expect(day(target)).toHaveFocus();
      expect(tabStop()).toEqual([day(target)]);
    });

    it('moves Home and End by weekStartsOn', () => {
      setup({ weekStartsOn: 1 });
      fireEvent.keyDown(document.activeElement as Element, { key: 'Home' });
      expect(day('2026-11-09')).toHaveFocus();
      fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
      expect(day('2026-11-15')).toHaveFocus();
    });

    it('moves PageUp and PageDown by a month, and keeps the day when it exists', () => {
      const { onMonthChange } = setup();
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown' });
      expect(title()).toHaveTextContent('December 2026');
      expect(day('2026-12-11')).toHaveFocus();
      expect(onMonthChange).toHaveBeenLastCalledWith('2026-12');
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
      expect(title()).toHaveTextContent('October 2026');
      expect(day('2026-10-11')).toHaveFocus();
      expect(onMonthChange).toHaveBeenLastCalledWith('2026-10');
    });

    it('clamps the day to the end of a shorter month', () => {
      setup({ defaultValue: '2027-01-31' });
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown' });
      expect(title()).toHaveTextContent('February 2027');
      expect(day('2027-02-28')).toHaveFocus();
    });

    it('moves Shift+PageUp and Shift+PageDown by a year', () => {
      const { onMonthChange } = setup();
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown', shiftKey: true });
      expect(title()).toHaveTextContent('November 2027');
      expect(day('2027-11-11')).toHaveFocus();
      expect(onMonthChange).toHaveBeenLastCalledWith('2027-11');
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp', shiftKey: true });
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp', shiftKey: true });
      expect(title()).toHaveTextContent('November 2025');
      expect(day('2025-11-11')).toHaveFocus();
    });

    it('changes the month when a key crosses its edge, and the focus follows', () => {
      const { onMonthChange } = setup({ defaultValue: '2026-11-30' });
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
      expect(title()).toHaveTextContent('December 2026');
      expect(day('2026-12-01')).toHaveFocus();
      expect(onMonthChange).toHaveBeenCalledTimes(1);
      expect(onMonthChange).toHaveBeenCalledWith('2026-12');
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' });
      expect(title()).toHaveTextContent('November 2026');
      expect(day('2026-11-30')).toHaveFocus();
    });

    it('crosses the edge by weeks, and across a year', () => {
      setup({ defaultValue: '2026-12-29' });
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
      expect(title()).toHaveTextContent('January 2027');
      expect(day('2027-01-05')).toHaveFocus();
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowUp' });
      expect(title()).toHaveTextContent('December 2026');
      expect(day('2026-12-29')).toHaveFocus();
    });

    it('does not report the month when the key stays inside it', () => {
      const { onMonthChange } = setup();
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
      expect(onMonthChange).not.toHaveBeenCalled();
    });

    it('stops at min and at max, and never leaves them', () => {
      const { onMonthChange } = setup({
        defaultValue: '2026-11-06',
        min: '2026-11-05',
        max: '2026-11-20',
      });
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' });
      expect(day('2026-11-05')).toHaveFocus();
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' });
      expect(day('2026-11-05')).toHaveFocus();
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowUp' });
      expect(day('2026-11-05')).toHaveFocus();
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown' });
      expect(day('2026-11-20')).toHaveFocus();
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageDown', shiftKey: true });
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
      fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
      expect(day('2026-11-20')).toHaveFocus();
      expect(title()).toHaveTextContent('November 2026');
      expect(onMonthChange).not.toHaveBeenCalled();
    });

    it('crosses into the month of min but not past it', () => {
      setup({ defaultValue: '2026-11-03', min: '2026-10-30' });
      fireEvent.keyDown(document.activeElement as Element, { key: 'PageUp' });
      expect(title()).toHaveTextContent('October 2026');
      expect(day('2026-10-30')).toHaveFocus();
    });

    it('prevents the default of every key it handles', () => {
      setup();
      for (const key of [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
        'PageUp',
        'PageDown',
      ]) {
        // fireEvent returns false when the handler called preventDefault.
        expect(fireEvent.keyDown(document.activeElement as Element, { key })).toBe(false);
      }
      expect(fireEvent.keyDown(document.activeElement as Element, { key: 'a' })).toBe(true);
      expect(fireEvent.keyDown(document.activeElement as Element, { key: 'Tab' })).toBe(true);
    });

    it('leaves a key with Alt, Ctrl or Meta to the browser', () => {
      const { origin } = setup();
      for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
        for (const key of ['ArrowRight', 'Home', 'PageDown']) {
          expect(fireEvent.keyDown(origin, { key, [modifier]: true })).toBe(true);
        }
      }
      expect(origin).toHaveFocus();
      expect(title()).toHaveTextContent('November 2026');
    });

    it('chooses with Enter and with Space', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      setup({ onValueChange });
      await user.keyboard('{ArrowRight}{Enter}');
      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-12');
      await user.keyboard('{ArrowRight} ');
      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-13');
      expect(day('2026-11-13').closest('td')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('days that cannot be chosen', () => {
    const unavailable = (date: string) => date === '2026-11-10';

    it('are aria-disabled but stay buttons that take focus', () => {
      render(<Cal isDateUnavailable={unavailable} min="2026-11-03" max="2026-11-26" />);
      for (const date of ['2026-11-10', '2026-11-02', '2026-11-27']) {
        expect(day(date)).toHaveAttribute('aria-disabled', 'true');
        expect(day(date)).not.toBeDisabled();
        act(() => day(date).focus());
        expect(day(date)).toHaveFocus();
      }
      expect(day('2026-11-11')).not.toHaveAttribute('aria-disabled');
    });

    it('are passed over by the keys, which can land on them, and cannot be chosen', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Cal
          defaultValue="2026-11-09"
          isDateUnavailable={unavailable}
          onValueChange={onValueChange}
        />,
      );
      act(() => day('2026-11-09').focus());
      await user.keyboard('{ArrowRight}');
      expect(day('2026-11-10')).toHaveFocus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      await user.click(day('2026-11-10'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(day('2026-11-09').closest('td')).toHaveAttribute('aria-selected', 'true');
      await user.keyboard('{ArrowRight}');
      expect(day('2026-11-11')).toHaveFocus();
    });

    it('include every day outside min and max', () => {
      const onValueChange = vi.fn();
      render(<Cal min="2026-11-10" onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-09'));
      expect(onValueChange).not.toHaveBeenCalled();
      fireEvent.click(day('2026-11-10'));
      expect(onValueChange).toHaveBeenCalledWith('2026-11-10');
    });
  });

  describe('the month buttons', () => {
    it('change the month, report it, and keep the focus on the button', async () => {
      const onMonthChange = vi.fn();
      const user = userEvent.setup();
      render(<Cal onMonthChange={onMonthChange} />);
      await user.click(next());
      expect(title()).toHaveTextContent('December 2026');
      expect(onMonthChange).toHaveBeenLastCalledWith('2026-12');
      expect(next()).toHaveFocus();
      await user.click(previous());
      await user.click(previous());
      expect(title()).toHaveTextContent('October 2026');
      expect(onMonthChange).toHaveBeenLastCalledWith('2026-10');
      expect(previous()).toHaveFocus();
    });

    it('cross a year', async () => {
      const user = userEvent.setup();
      render(<Cal defaultMonth="2026-12" />);
      await user.click(next());
      expect(title()).toHaveTextContent('January 2027');
      await user.click(previous());
      await user.click(previous());
      expect(title()).toHaveTextContent('November 2026');
    });

    it('get aria-disabled when the whole month they lead to is outside min and max', () => {
      render(<Cal min="2026-11-05" max="2026-11-25" />);
      expect(previous()).toHaveAttribute('aria-disabled', 'true');
      expect(next()).toHaveAttribute('aria-disabled', 'true');
      expect(previous()).not.toBeDisabled();
    });

    it('stay enabled while any day of the month they lead to is inside the range', () => {
      render(<Cal min="2026-10-31" max="2026-12-01" />);
      expect(previous()).not.toHaveAttribute('aria-disabled');
      expect(next()).not.toHaveAttribute('aria-disabled');
    });

    it('do nothing at an end, and keep their place in the tab order and their focus', async () => {
      const onMonthChange = vi.fn();
      const user = userEvent.setup();
      render(<Cal max="2026-12-15" onMonthChange={onMonthChange} />);
      await user.click(next());
      expect(title()).toHaveTextContent('December 2026');
      expect(next()).toHaveAttribute('aria-disabled', 'true');
      expect(next()).toHaveFocus();
      await user.click(next());
      await user.keyboard('{Enter}');
      expect(title()).toHaveTextContent('December 2026');
      expect(onMonthChange).toHaveBeenCalledTimes(1);
      expect(next()).toHaveFocus();
      expect(next().tabIndex).toBe(0);
    });
  });

  describe('choosing a day', () => {
    it('calls onValueChange with the ISO date and selects it when uncontrolled', () => {
      const onValueChange = vi.fn();
      render(<Cal onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-18'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
      expect(day('2026-11-18').closest('td')).toHaveAttribute('aria-selected', 'true');
      fireEvent.click(day('2026-11-19'));
      expect(day('2026-11-18').closest('td')).not.toHaveAttribute('aria-selected');
      expect(day('2026-11-19').closest('td')).toHaveAttribute('aria-selected', 'true');
    });

    it('does not select by itself when controlled, and shows what the parent gives', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<Cal value={null} onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-18'));
      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
      expect(document.querySelector('[aria-selected]')).toBeNull();
      rerender(<Cal value="2026-11-18" onValueChange={onValueChange} />);
      expect(day('2026-11-18').closest('td')).toHaveAttribute('aria-selected', 'true');
    });

    it('does not call onValueChange when the parent changes the value', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<Cal value="2026-11-18" onValueChange={onValueChange} />);
      rerender(<Cal value="2026-11-20" onValueChange={onValueChange} />);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does nothing when the day is already the value, and cannot be unchosen', () => {
      const onValueChange = vi.fn();
      render(<Cal defaultValue="2026-11-18" onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-18'));
      fireEvent.click(day('2026-11-18'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(day('2026-11-18').closest('td')).toHaveAttribute('aria-selected', 'true');
    });

    it('works inside a form without submitting it', () => {
      const onSubmit = vi.fn((event) => event.preventDefault());
      const { container } = render(
        <form onSubmit={onSubmit}>
          <Cal />
        </form>,
      );
      fireEvent.click(day('2026-11-18'));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(container.querySelector('input')).toBeNull();
    });

    it('is reachable through user-event with the pointer', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Cal onValueChange={onValueChange} />);
      await user.click(day('2026-11-18'));
      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
      expect(day('2026-11-18')).toHaveFocus();
    });
  });

  describe('the week and the locale', () => {
    it.each([
      [0, 'Sun', '2026-11-01'],
      [1, 'Mon', '2026-10-26'],
      [6, 'Sat', '2026-10-31'],
    ] as const)('weekStartsOn %i starts the week on %s', (weekStartsOn, name, firstCell) => {
      render(<Cal weekStartsOn={weekStartsOn} />);
      const headers = screen.getAllByRole('columnheader', { hidden: true });
      expect(headers[0]?.querySelector('[aria-hidden]')).toHaveTextContent(name);
      expect((document.querySelector('tbody td') as HTMLElement).firstElementChild).toBe(
        document.querySelector(`[data-date="${firstCell}"]`),
      );
    });

    it('writes the title and the weekdays in the locale', () => {
      const { rerender } = render(<Cal locale="vi-VN" month="2026-11" />);
      expect(title()).toHaveTextContent(formatMonthYear('2026-11', 'vi-VN'));
      expect(title().textContent).not.toBe('November 2026');
      expect(
        screen.getAllByRole('columnheader', { hidden: true })[0]?.querySelector('[aria-hidden]'),
      ).toHaveTextContent('CN');
      rerender(<Cal locale="de-DE" month="2026-12" />);
      expect(title()).toHaveTextContent('Dezember 2026');
    });
  });

  describe('dev warnings', () => {
    it.each([
      ['value', { value: '2026-02-30' }, 'value "2026-02-30"'],
      ['defaultValue', { defaultValue: 'tomorrow' }, 'defaultValue "tomorrow"'],
      ['min', { min: '2026-13-01' }, 'min "2026-13-01"'],
      ['max', { max: '11/20/2026' }, 'max "11/20/2026"'],
      ['month', { month: '2026-13' }, 'month "2026-13"'],
      ['defaultMonth', { defaultMonth: '2026-11-01' }, 'defaultMonth "2026-11-01"'],
      ['today', { today: 'now' }, 'today "now"'],
    ] as const)(
      'names %s when it is not an ISO date or month, and ignores it',
      (_, props, text) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(<Calendar today="2026-11-04" {...(props as object)} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`Calendar: ${text}`));
        // Whatever is ignored, the calendar still renders a month.
        expect(title().textContent).not.toBe('');
        expect(document.querySelector('[aria-selected]')).toBeNull();
      },
    );

    it('falls back to the clock when today is invalid', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 20, 12));
      render(<Calendar today="nope" />);
      expect(day('2026-11-20')).toHaveAttribute('aria-current', 'date');
    });

    it('warns when min is after max, and ignores both', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Cal min="2026-11-20" max="2026-11-10" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('min (2026-11-20) is after max'));
      expect(day('2026-11-05')).not.toHaveAttribute('aria-disabled');
      expect(day('2026-11-25')).not.toHaveAttribute('aria-disabled');
    });

    it('does not warn for good props', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(
        <Cal
          value="2026-11-10"
          min="2026-01-01"
          max="2026-12-31"
          month="2026-11"
          today="2026-11-04"
        />,
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns when value switches between controlled and uncontrolled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { rerender } = render(<Cal defaultValue="2026-11-10" />);
      rerender(<Cal value="2026-11-10" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar value is changing'));
    });

    it('warns when month switches between controlled and uncontrolled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { rerender } = render(<Cal />);
      rerender(<Cal month="2026-12" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar month is changing'));
    });

    it('never throws for bad props', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      expect(() =>
        render(
          <Calendar
            value="x"
            defaultValue="y"
            min="z"
            max="w"
            month="m"
            defaultMonth="n"
            today="t"
          />,
        ),
      ).not.toThrow();
    });
  });

  describe('range mode', () => {
    const cell = (iso: string) => day(iso).closest('td') as HTMLElement;
    /** The dates whose cell says it is selected, in grid order. */
    const selectedDates = () =>
      Array.from(document.querySelectorAll<HTMLElement>('td[aria-selected="true"]')).map(
        (td) => td.querySelector<HTMLElement>('[data-date]')?.dataset.date,
      );
    /** The dates of the cells that wear the preview band. */
    const previewDates = () =>
      Array.from(document.querySelectorAll<HTMLElement>('td[data-preview]')).map(
        (td) => td.querySelector<HTMLElement>('[data-date]')?.dataset.date,
      );
    const range = (from: number, to: number) =>
      Array.from(
        { length: to - from + 1 },
        (_, i) => `2026-11-${String(from + i).padStart(2, '0')}`,
      );
    /** Presses Esc on a day and says whether the calendar called `preventDefault`. */
    const pressEscape = (iso: string) => {
      const event = createEvent.keyDown(day(iso), { key: 'Escape' });
      fireEvent(day(iso), event);
      return event.defaultPrevented;
    };

    function ControlledRange(props: { onValueChange?: (value: [string, string]) => void }) {
      const [value, setValue] = useState<[string, string] | null>(null);
      return (
        <Calendar
          mode="range"
          today="2026-11-04"
          value={value}
          onValueChange={(next) => {
            props.onValueChange?.(next);
            setValue(next);
          }}
        />
      );
    }

    it('says its mode, and single is the default', () => {
      const { rerender } = render(<Cal mode="range" />);
      expect(document.querySelector('.flg-calendar')).toHaveAttribute('data-mode', 'range');
      rerender(<Cal />);
      expect(document.querySelector('.flg-calendar')).toHaveAttribute('data-mode', 'single');
      rerender(<Cal mode="single" />);
      expect(document.querySelector('.flg-calendar')).toHaveAttribute('data-mode', 'single');
    });

    it('sets a pending start on the first pick and does not call back', () => {
      const onValueChange = vi.fn();
      render(<Cal mode="range" onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-12'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(selectedDates()).toEqual(['2026-11-12']);
      expect(cell('2026-11-12')).toHaveAttribute('data-range', 'single');
    });

    it('sets the end on the second pick and calls back once with [start, end]', () => {
      const onValueChange = vi.fn();
      render(<Cal mode="range" onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-12'));
      fireEvent.click(day('2026-11-16'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-16']);
      // An uncontrolled calendar keeps the range, and every cell inside it is selected.
      expect(selectedDates()).toEqual(range(12, 16));
      expect(cell('2026-11-12')).toHaveAttribute('data-range', 'start');
      expect(cell('2026-11-14')).toHaveAttribute('data-range', 'middle');
      expect(cell('2026-11-16')).toHaveAttribute('data-range', 'end');
      expect(cell('2026-11-17')).not.toHaveAttribute('data-range');
    });

    it('swaps the two days when the end is earlier than the start', () => {
      const onValueChange = vi.fn();
      render(<Cal mode="range" onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-20'));
      fireEvent.click(day('2026-11-15'));
      expect(onValueChange).toHaveBeenCalledWith(['2026-11-15', '2026-11-20']);
      expect(selectedDates()).toEqual(range(15, 20));
    });

    it('makes a one-day range of the same day twice, with no band', () => {
      const onValueChange = vi.fn();
      render(<Cal mode="range" onValueChange={onValueChange} />);
      fireEvent.click(day('2026-11-12'));
      fireEvent.click(day('2026-11-12'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-12']);
      expect(selectedDates()).toEqual(['2026-11-12']);
      expect(cell('2026-11-12')).toHaveAttribute('data-range', 'single');
    });

    it('starts a new range on the pick after a finished one', () => {
      const onValueChange = vi.fn();
      render(
        <Cal
          mode="range"
          defaultValue={['2026-11-12', '2026-11-16']}
          onValueChange={onValueChange}
        />,
      );
      fireEvent.click(day('2026-11-20'));
      expect(onValueChange).not.toHaveBeenCalled();
      // Only the pending start is drawn and selected; the range it replaces is not.
      expect(selectedDates()).toEqual(['2026-11-20']);
      fireEvent.click(day('2026-11-22'));
      expect(onValueChange).toHaveBeenCalledWith(['2026-11-20', '2026-11-22']);
    });

    it('picks with Enter and Space on the keyboard', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Cal
          mode="range"
          defaultValue={['2026-11-11', '2026-11-11']}
          onValueChange={onValueChange}
        />,
      );
      act(() => day('2026-11-11').focus());
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(selectedDates()).toEqual(['2026-11-18']);
      await user.keyboard('{ArrowRight}{ArrowRight} ');
      expect(onValueChange).toHaveBeenCalledWith(['2026-11-18', '2026-11-20']);
      expect(selectedDates()).toEqual(range(18, 20));
    });

    it('does not take a pick on a date that cannot be chosen, as start or as end', () => {
      const onValueChange = vi.fn();
      render(
        <Cal
          mode="range"
          isDateUnavailable={(date) => date === '2026-11-09'}
          onValueChange={onValueChange}
        />,
      );
      fireEvent.click(day('2026-11-09'));
      expect(selectedDates()).toEqual([]);
      fireEvent.click(day('2026-11-12'));
      fireEvent.click(day('2026-11-09'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(selectedDates()).toEqual(['2026-11-12']);
    });

    it('allows an unavailable date inside the range, and selects it', () => {
      const onValueChange = vi.fn();
      render(
        <Cal
          mode="range"
          isDateUnavailable={(date) => date === '2026-11-09' || date === '2026-11-10'}
          onValueChange={onValueChange}
        />,
      );
      fireEvent.click(day('2026-11-08'));
      fireEvent.click(day('2026-11-12'));
      expect(onValueChange).toHaveBeenCalledWith(['2026-11-08', '2026-11-12']);
      expect(selectedDates()).toEqual(range(8, 12));
      expect(day('2026-11-09')).toHaveAttribute('aria-disabled', 'true');
      expect(cell('2026-11-09')).toHaveAttribute('data-range', 'middle');
    });

    it('does not take a pick on a day of another month', () => {
      render(<Cal mode="range" />);
      fireEvent.click(day('2026-12-01'));
      expect(selectedDates()).toEqual([]);
    });

    describe('the preview band', () => {
      it('shows the days from the start to the one under the pointer, and follows it', async () => {
        const user = userEvent.setup();
        render(<Cal mode="range" />);
        await user.click(day('2026-11-12'));
        expect(previewDates()).toEqual(['2026-11-12']);
        await user.hover(day('2026-11-16'));
        expect(previewDates()).toEqual(range(12, 16));
        expect(cell('2026-11-12')).toHaveAttribute('data-range', 'start');
        expect(cell('2026-11-14')).toHaveAttribute('data-range', 'middle');
        expect(cell('2026-11-16')).toHaveAttribute('data-range', 'end');
        // Before the start, the band runs the other way, with the start at its end.
        await user.hover(day('2026-11-10'));
        expect(previewDates()).toEqual(range(10, 12));
        expect(cell('2026-11-12')).toHaveAttribute('data-range', 'end');
        // A preview is not a selection: only the start is announced as selected.
        expect(selectedDates()).toEqual(['2026-11-12']);
        await user.unhover(day('2026-11-10'));
        expect(previewDates()).toEqual(['2026-11-12']);
      });

      it('shows nothing before a start is picked, nor for a committed range', async () => {
        const user = userEvent.setup();
        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
        await user.hover(day('2026-11-20'));
        expect(previewDates()).toEqual([]);
        expect(selectedDates()).toEqual(range(12, 16));
      });

      it('follows the focus of the keys too', async () => {
        const user = userEvent.setup();
        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-12']} />);
        act(() => day('2026-11-12').focus());
        await user.keyboard('{Enter}');
        await user.keyboard('{ArrowRight}{ArrowRight}');
        expect(previewDates()).toEqual(range(12, 14));
        await user.keyboard('{ArrowDown}');
        expect(previewDates()).toEqual(range(12, 21));
      });

      it('does not preview up to a date that cannot be chosen', async () => {
        const user = userEvent.setup();
        render(<Cal mode="range" isDateUnavailable={(date) => date === '2026-11-16'} />);
        await user.click(day('2026-11-12'));
        await user.hover(day('2026-11-16'));
        expect(previewDates()).toEqual(['2026-11-12']);
      });

      it('goes when the range is finished', async () => {
        const user = userEvent.setup();
        render(<Cal mode="range" />);
        await user.click(day('2026-11-12'));
        await user.click(day('2026-11-16'));
        expect(previewDates()).toEqual([]);
        await user.hover(day('2026-11-20'));
        expect(previewDates()).toEqual([]);
      });
    });

    describe('Esc', () => {
      it('drops a pending start and is prevented, so a Dialog around it stays open', () => {
        const onValueChange = vi.fn();
        render(<Cal mode="range" onValueChange={onValueChange} />);
        fireEvent.click(day('2026-11-12'));
        expect(pressEscape('2026-11-12')).toBe(true);
        expect(selectedDates()).toEqual([]);
        expect(onValueChange).not.toHaveBeenCalled();
        // The next pick starts again.
        fireEvent.click(day('2026-11-20'));
        expect(onValueChange).not.toHaveBeenCalled();
        expect(selectedDates()).toEqual(['2026-11-20']);
      });

      it('keeps the committed range that a dropped start had replaced', () => {
        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
        fireEvent.click(day('2026-11-20'));
        pressEscape('2026-11-20');
        expect(selectedDates()).toEqual(range(12, 16));
      });

      it('is left alone when nothing is pending', () => {
        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
        expect(pressEscape('2026-11-12')).toBe(false);
        fireEvent.click(day('2026-11-20'));
        fireEvent.click(day('2026-11-22'));
        expect(pressEscape('2026-11-22')).toBe(false);
      });

      it('is left alone in single mode', () => {
        render(<Cal />);
        fireEvent.click(day('2026-11-12'));
        expect(pressEscape('2026-11-12')).toBe(false);
        expect(selectedDates()).toEqual(['2026-11-12']);
      });

      it('works from the month buttons too, and runs the handler of the parent first', () => {
        const onKeyDown = vi.fn();
        render(<Cal mode="range" onKeyDown={onKeyDown} />);
        fireEvent.click(day('2026-11-12'));
        const event = createEvent.keyDown(next(), { key: 'Escape' });
        fireEvent(next(), event);
        expect(event.defaultPrevented).toBe(true);
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(selectedDates()).toEqual([]);
      });
    });

    describe('the pending start', () => {
      it('is not dropped when the focus leaves the calendar', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
          <>
            <button type="button">Outside</button>
            <Cal mode="range" onValueChange={onValueChange} />
          </>,
        );
        await user.click(day('2026-11-12'));
        await user.click(screen.getByRole('button', { name: 'Outside' }));
        expect(selectedDates()).toEqual(['2026-11-12']);
        await user.click(day('2026-11-15'));
        expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-15']);
      });

      it('stays while the month changes, so a range can cross months', () => {
        const onValueChange = vi.fn();
        render(<Cal mode="range" onValueChange={onValueChange} />);
        fireEvent.click(day('2026-11-25'));
        fireEvent.click(next());
        expect(selectedDates()).toEqual([]);
        fireEvent.click(day('2026-12-03'));
        expect(onValueChange).toHaveBeenCalledWith(['2026-11-25', '2026-12-03']);
      });
    });

    describe('a controlled range', () => {
      it('shows what the parent gives, and the pick goes through the parent', () => {
        const onValueChange = vi.fn();
        const { rerender } = render(
          <Cal mode="range" value={null} onValueChange={onValueChange} />,
        );
        fireEvent.click(day('2026-11-12'));
        fireEvent.click(day('2026-11-16'));
        expect(onValueChange).toHaveBeenCalledWith(['2026-11-12', '2026-11-16']);
        expect(selectedDates()).toEqual([]);
        rerender(
          <Cal mode="range" value={['2026-11-12', '2026-11-16']} onValueChange={onValueChange} />,
        );
        expect(selectedDates()).toEqual(range(12, 16));
      });

      it('does not call back when the parent changes the range', () => {
        const onValueChange = vi.fn();
        const { rerender } = render(
          <Cal mode="range" value={['2026-11-12', '2026-11-16']} onValueChange={onValueChange} />,
        );
        rerender(
          <Cal mode="range" value={['2026-11-20', '2026-11-22']} onValueChange={onValueChange} />,
        );
        expect(onValueChange).not.toHaveBeenCalled();
        expect(selectedDates()).toEqual(range(20, 22));
      });

      it('works with state in the parent', () => {
        const onValueChange = vi.fn();
        render(<ControlledRange onValueChange={onValueChange} />);
        fireEvent.click(day('2026-11-18'));
        fireEvent.click(day('2026-11-14'));
        expect(onValueChange).toHaveBeenCalledWith(['2026-11-14', '2026-11-18']);
        expect(selectedDates()).toEqual(range(14, 18));
      });

      it('does not call back for the range that is already chosen', () => {
        const onValueChange = vi.fn();
        render(
          <Cal
            mode="range"
            defaultValue={['2026-11-12', '2026-11-16']}
            onValueChange={onValueChange}
          />,
        );
        fireEvent.click(day('2026-11-12'));
        fireEvent.click(day('2026-11-16'));
        expect(onValueChange).not.toHaveBeenCalled();
        expect(selectedDates()).toEqual(range(12, 16));
      });

      it('follows the month of the start when the parent moves the range, not on a new array', () => {
        const { rerender } = render(<Cal mode="range" value={['2026-11-12', '2026-11-16']} />);
        fireEvent.click(next());
        expect(title()).toHaveTextContent('December 2026');
        // The same dates in a new array are not a change: the user is not pulled back.
        rerender(<Cal mode="range" value={['2026-11-12', '2026-11-16']} />);
        expect(title()).toHaveTextContent('December 2026');
        rerender(<Cal mode="range" value={['2027-02-03', '2027-02-05']} />);
        expect(title()).toHaveTextContent('February 2027');
      });
    });

    describe('the month and the tab stop', () => {
      it('shows the month of the start, and the tab stop is on it', () => {
        render(<Cal mode="range" defaultValue={['2026-09-30', '2026-11-10']} />);
        expect(title()).toHaveTextContent('September 2026');
        expect(tabStop().map((button) => button.dataset.date)).toEqual(['2026-09-30']);
      });

      it('puts the tab stop on the start of the range when it is in the month shown', () => {
        render(<Cal mode="range" defaultValue={['2026-11-12', '2026-11-16']} />);
        expect(tabStop().map((button) => button.dataset.date)).toEqual(['2026-11-12']);
      });

      it('falls back to today when the start is not in the month shown', () => {
        render(<Cal mode="range" month="2026-11" value={['2026-10-28', '2026-11-10']} />);
        expect(tabStop().map((button) => button.dataset.date)).toEqual(['2026-11-04']);
        // The days of the range that are in the month are still drawn.
        expect(selectedDates()).toEqual(range(1, 10));
      });
    });

    describe('an end picked in another month', () => {
      it('stays on the month of the end after a pointer pick', () => {
        render(<Cal mode="range" />);
        fireEvent.click(day('2026-11-20'));
        fireEvent.click(next());
        expect(title()).toHaveTextContent('December 2026');
        fireEvent.click(day('2026-12-05'));
        expect(title()).toHaveTextContent('December 2026');
        expect(selectedDates()).toContain('2026-12-05');
      });

      it('keeps the focus on the end after keys', async () => {
        const user = userEvent.setup();
        render(<Cal mode="range" />);
        act(() => day('2026-11-20').focus());
        await user.keyboard('{Enter}');
        await user.keyboard('{PageDown}');
        expect(document.activeElement).toBe(day('2026-12-20'));
        await user.keyboard('{Enter}');
        expect(title()).toHaveTextContent('December 2026');
        expect(document.activeElement).toBe(day('2026-12-20'));
      });
    });

    describe('a range that cannot be used', () => {
      it('swaps a start that is after its end, and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(<Cal mode="range" value={['2026-11-16', '2026-11-12']} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: value'));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('is after'));
        expect(selectedDates()).toEqual(range(12, 16));
      });

      it('swaps a defaultValue too', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(<Cal mode="range" defaultValue={['2026-11-16', '2026-11-12']} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: defaultValue'));
        expect(selectedDates()).toEqual(range(12, 16));
      });

      it.each([
        ['one item', ['2026-11-12']],
        ['three items', ['2026-11-12', '2026-11-13', '2026-11-14']],
        ['a bad date', ['2026-11-12', '2026-02-30']],
        ['a non-string', ['2026-11-12', 5]],
        ['a single date', '2026-11-12'],
        ['an object', { start: '2026-11-12', end: '2026-11-14' }],
      ])('ignores %s, and warns', (_, value) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(<Cal mode="range" value={value as never} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: value'));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('range'));
        expect(selectedDates()).toEqual([]);
        // The calendar still renders a month, and is still controlled (nothing chosen).
        expect(title().textContent).not.toBe('');
      });

      it('ignores a malformed defaultValue, and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(<Cal mode="range" defaultValue={['2026-11-12', 'x'] as never} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calendar: defaultValue'));
        expect(selectedDates()).toEqual([]);
      });

      it('does not warn for a good range, and never throws', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(<Cal mode="range" value={['2026-11-12', '2026-11-16']} />);
        expect(warn).not.toHaveBeenCalled();
        expect(() =>
          render(<Cal mode="range" value={[1, 2] as never} defaultValue={{} as never} />),
        ).not.toThrow();
      });
    });
  });
});
