import { act, fireEvent, render, screen } from '@testing-library/react';
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

    function setup(props: Partial<CalendarProps> = {}) {
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
});
