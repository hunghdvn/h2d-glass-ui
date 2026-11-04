import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Card } from '../card/Card';
import { Calendar } from './Calendar';
import type { CalendarProps } from './Calendar';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  // Every story passes `today`: without it the calendar reads the clock, and the images and the
  // checks below would change with the day they run.
  args: { today: '2026-11-04', onValueChange: fn(), onMonthChange: fn() },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The day button or the outside-day number of an ISO date. */
const dayOf = (root: HTMLElement, iso: string) =>
  root.querySelector(`[data-date="${iso}"]`) as HTMLElement;

const title = (root: HTMLElement) => root.querySelector('.flg-calendar-title') as HTMLElement;

/** The two days that the mockup (K1) draws as "fully booked". */
const booked = (date: string) => date === '2026-11-09' || date === '2026-11-10';

/**
 * The calendar of the mockup (K1): November 2026, today the 4th, the 14th chosen, two booked days,
 * and `min` greying the first days. Beside it the same month in vi-VN with the week from Monday.
 */
export const Look: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <Card style={{ padding: 16 }}>
        <Calendar
          {...args}
          defaultValue="2026-11-14"
          min="2026-11-03"
          isDateUnavailable={booked}
          aria-label="November 2026"
        />
      </Card>
      <Card style={{ padding: 16 }}>
        <Calendar
          {...args}
          locale="vi-VN"
          weekStartsOn={1}
          defaultValue="2026-11-14"
          min="2026-11-03"
          isDateUnavailable={booked}
          labels={{ previousMonth: 'Tháng trước', nextMonth: 'Tháng sau' }}
          aria-label="Tháng 11 năm 2026"
        />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [english, vietnamese] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.flg-calendar'),
    ) as [HTMLElement, HTMLElement];
    const box = (el: Element) => el.getBoundingClientRect();
    // 252px wide, a 34px header 4px above the grid, a 26px weekday row, 36px days.
    await expect(box(english).width).toBe(252);
    const header = english.querySelector('.flg-calendar-header') as HTMLElement;
    const grid = english.querySelector('.flg-calendar-grid') as HTMLElement;
    await expect(box(header).height).toBe(34);
    await expect(box(grid).top - box(header).bottom).toBe(4);
    await expect(box(english.querySelector('th') as Element).height).toBe(26);
    await expect(box(dayOf(english, '2026-11-14')).width).toBe(36);
    await expect(box(dayOf(english, '2026-11-14')).height).toBe(36);
    await expect(
      box(dayOf(english, '2026-11-14')).left - box(dayOf(english, '2026-11-13')).left,
    ).toBe(36);
    // The month buttons are 28px, 4px apart, with a 16px chevron.
    const [previous, next] = Array.from(header.querySelectorAll<HTMLElement>('button')) as [
      HTMLElement,
      HTMLElement,
    ];
    await expect(box(previous).width).toBe(28);
    await expect(box(next).left - box(previous).right).toBe(4);
    await expect(box(previous.querySelector('svg') as Element).width).toBe(16);
    await expect(title(english)).toHaveTextContent('November 2026');
    await expect(getComputedStyle(title(english)).fontWeight).toBe('600');
    // The chosen day wears the accent gradient and no edge; today has the accent edge.
    const chosen = getComputedStyle(dayOf(english, '2026-11-14'));
    await expect(chosen.backgroundImage).toContain('gradient');
    await expect(chosen.boxShadow).toBe('none');
    await expect(chosen.fontWeight).toBe('600');
    await expect(getComputedStyle(dayOf(english, '2026-11-04')).boxShadow).toContain('inset');
    await expect(dayOf(english, '2026-11-04')).toHaveAttribute('aria-current', 'date');
    // Booked and too early days are struck through at .45; the next month's days are numbers at .5.
    for (const date of ['2026-11-09', '2026-11-02']) {
      const style = getComputedStyle(dayOf(english, date));
      await expect(style.textDecorationLine).toBe('line-through');
      await expect(style.opacity).toBe('0.45');
      await expect(style.cursor).toBe('not-allowed');
    }
    await expect(getComputedStyle(dayOf(english, '2026-12-01')).opacity).toBe('0.5');
    // The Vietnamese calendar: the week starts on Monday and its words are Vietnamese.
    await expect(title(vietnamese)).toHaveTextContent(/11/);
    await expect(title(vietnamese).textContent).not.toBe('November 2026');
    await expect(vietnamese.querySelector('td > [data-date]')).toHaveAttribute(
      'data-date',
      '2026-10-26',
    );
    await expect(vietnamese.querySelector('button[aria-label="Tháng trước"]')).not.toBeNull();
  },
};

/** An uncontrolled calendar with the tab stop on the chosen day, as the keys below expect. */
const keyArgs = { defaultValue: '2026-11-11', 'aria-label': 'Date' } as const;

/**
 * Tabs from the page to the day with the tab stop, past the two month buttons. The number of presses
 * is not fixed: Firefox spends one on its way in, so it stops where the focus is on the day.
 */
async function tabToGrid(real: NonNullable<Awaited<ReturnType<typeof realUserEvent>>>) {
  for (let presses = 0; presses < 6; presses += 1) {
    await real.tab();
    if (document.activeElement?.matches('button[data-date]')) return;
  }
}

/** Every key of the grid on a real keyboard, on one month. */
export const Keys: Story = {
  tags: ['no-visual'],
  args: keyArgs,
  render: (args) => <Calendar {...args} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    await tabToGrid(real);
    await expect(dayOf(root, '2026-11-11')).toHaveFocus();
    // The ring shows for the keyboard.
    await expect(getComputedStyle(dayOf(root, '2026-11-11')).outlineStyle).toBe('solid');
    const steps: Array<[string, string]> = [
      ['{ArrowRight}', '2026-11-12'],
      ['{ArrowLeft}', '2026-11-11'],
      ['{ArrowDown}', '2026-11-18'],
      ['{ArrowUp}', '2026-11-11'],
      ['{Home}', '2026-11-08'],
      ['{End}', '2026-11-14'],
    ];
    for (const [key, date] of steps) {
      await real.keyboard(key);
      await expect(dayOf(root, date)).toHaveFocus();
    }
    // One tab stop follows the focus.
    await expect(root.querySelectorAll('button[data-date][tabindex="0"]')).toHaveLength(1);
    await expect(dayOf(root, '2026-11-14')).toHaveAttribute('tabindex', '0');
    // Enter and Space choose the focused day.
    await real.keyboard('{Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-11-14');
    await expect(dayOf(root, '2026-11-14').closest('td')).toHaveAttribute('aria-selected', 'true');
    await real.keyboard('{ArrowLeft} ');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-11-13');
    // No key moved the month.
    await expect(args.onMonthChange).not.toHaveBeenCalled();
    // Alt+→ is the browser's, not the calendar's.
    await real.keyboard('{Alt>}{ArrowRight}{/Alt}');
    await expect(dayOf(root, '2026-11-13')).toHaveFocus();
  },
};

/** The keys that cross the edge of the month and the year, and stop at `min` and `max`. */
export const MonthEdges: Story = {
  tags: ['no-visual'],
  args: { defaultValue: '2026-11-30', 'aria-label': 'Date' },
  render: (args) => <Calendar {...args} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    await tabToGrid(real);
    await expect(dayOf(root, '2026-11-30')).toHaveFocus();
    // → past the end of November: December, and the focus follows to the 1st.
    await real.keyboard('{ArrowRight}');
    await expect(title(root)).toHaveTextContent('December 2026');
    await expect(dayOf(root, '2026-12-01')).toHaveFocus();
    await expect(args.onMonthChange).toHaveBeenLastCalledWith('2026-12');
    await real.keyboard('{ArrowLeft}');
    await expect(title(root)).toHaveTextContent('November 2026');
    await expect(dayOf(root, '2026-11-30')).toHaveFocus();
    // PageDown keeps the day or takes the last one of a shorter month.
    await real.keyboard('{PageDown}{PageDown}{PageDown}');
    await expect(title(root)).toHaveTextContent('February 2027');
    await expect(dayOf(root, '2027-02-28')).toHaveFocus();
    // Shift+PageUp is a year back, across the new year.
    await real.keyboard('{Shift>}{PageUp}{/Shift}');
    await expect(title(root)).toHaveTextContent('February 2026');
    await expect(dayOf(root, '2026-02-28')).toHaveFocus();
    await real.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    await expect(title(root)).toHaveTextContent('January 2026');
    await expect(dayOf(root, '2026-01-31')).toHaveFocus();
  },
};

/** The focus never leaves `[min, max]`: a key stops at the edge, and the buttons say so. */
export const MinMax: Story = {
  tags: ['no-visual'],
  args: {
    defaultValue: '2026-11-06',
    min: '2026-11-05',
    max: '2026-12-04',
    'aria-label': 'Date',
  },
  render: (args) => <Calendar {...args} />,
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    const buttons = Array.from(root.querySelectorAll<HTMLElement>('.flg-calendar-header button'));
    const [previous, next] = buttons as [HTMLElement, HTMLElement];
    // November holds days inside the range, and so does December: only October is out.
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(next).not.toHaveAttribute('aria-disabled');
    await tabToGrid(real);
    await real.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    await expect(dayOf(root, '2026-11-05')).toHaveFocus();
    await real.keyboard('{PageUp}');
    await expect(dayOf(root, '2026-11-05')).toHaveFocus();
    await expect(title(root)).toHaveTextContent('November 2026');
    // PageDown reaches December 5, past max, so it stops on the 4th.
    await real.keyboard('{PageDown}');
    await expect(title(root)).toHaveTextContent('December 2026');
    await expect(dayOf(root, '2026-12-04')).toHaveFocus();
    await real.keyboard('{ArrowRight}{ArrowDown}{End}');
    await expect(dayOf(root, '2026-12-04')).toHaveFocus();
    // The 5th is shown, and it cannot be chosen.
    await expect(dayOf(root, '2026-12-05')).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).not.toHaveAttribute('aria-disabled');
  },
};

/**
 * The month buttons: a real press changes the month, and at an end the button does nothing but keeps
 * the focus. WebKit does not focus a button that is pressed, so the focus is put there as a keyboard
 * user has it, and the end is reached with Enter.
 */
export const MonthButtons: Story = {
  tags: ['no-visual'],
  args: { defaultValue: '2026-11-14', max: '2026-12-31', 'aria-label': 'Date' },
  render: (args) => <Calendar {...args} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    const [previous, next] = Array.from(
      root.querySelectorAll<HTMLElement>('.flg-calendar-header button'),
    ) as [HTMLElement, HTMLElement];
    await real.click(next);
    await expect(title(root)).toHaveTextContent('December 2026');
    await expect(args.onMonthChange).toHaveBeenLastCalledWith('2026-12');
    // The tab stop is the first day of the new month, as nothing there is chosen or today.
    await expect(dayOf(root, '2026-12-01')).toHaveAttribute('tabindex', '0');
    // December is the last month: the button says so, keeps the focus, and does nothing.
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    next.focus();
    await real.keyboard('{Enter}{Enter}');
    await expect(title(root)).toHaveTextContent('December 2026');
    await expect(args.onMonthChange).toHaveBeenCalledTimes(1);
    await expect(next).toHaveFocus();
    // Back: the tab stop returns to the chosen day.
    await real.click(previous);
    await expect(title(root)).toHaveTextContent('November 2026');
    await expect(dayOf(root, '2026-11-14')).toHaveAttribute('tabindex', '0');
    previous.focus();
    await real.keyboard(' ');
    await expect(title(root)).toHaveTextContent('October 2026');
    await expect(previous).toHaveFocus();
  },
};

/** The pointer: a day is chosen by a press; a booked day, an early day and another month's day are not. */
export const Pointer: Story = {
  tags: ['no-visual'],
  args: { isDateUnavailable: booked, min: '2026-11-03', 'aria-label': 'Date' },
  render: (args) => <Calendar {...args} />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    const day = dayOf(root, '2026-11-18');
    const transparent = 'rgba(0, 0, 0, 0)';
    await real.hover(day);
    await waitFor(() => expect(getComputedStyle(day).backgroundColor).not.toBe(transparent));
    await real.click(day);
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-18');
    await expect(day.closest('td')).toHaveAttribute('aria-selected', 'true');
    // A booked day, a day before min, and a number from December do nothing. The browser's own
    // click would wait for an enabled element; these are `aria-disabled`, so a plain click is sent.
    await userEvent.click(dayOf(root, '2026-11-09'));
    await userEvent.click(dayOf(root, '2026-11-02'));
    await userEvent.click(dayOf(root, '2026-12-01'));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(title(root)).toHaveTextContent('November 2026');
    await expect(day.closest('td')).toHaveAttribute('aria-selected', 'true');
    // The same day again is not a change, and a booked day shows no hover.
    await real.click(day);
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await real.hover(dayOf(root, '2026-11-09'));
    await expect(getComputedStyle(dayOf(root, '2026-11-09')).backgroundColor).toBe(transparent);
  },
};

function ControlledDemo({ args }: { args: CalendarProps }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Button variant="secondary" onClick={() => setValue('2026-11-04')}>
        Today
      </Button>
      <Card style={{ padding: 16 }}>
        <Calendar
          {...args}
          value={value}
          onValueChange={(next) => {
            args.onValueChange?.(next);
            setValue(next);
          }}
        />
      </Card>
      <output>{value ?? 'No date'}</output>
    </div>
  );
}

/**
 * A controlled calendar whose value is also set from outside: the button chooses today in November,
 * and the calendar, showing December, goes to that month. The parent's change is not reported.
 */
export const Controlled: Story = {
  tags: ['no-visual'],
  args: { defaultMonth: '2026-12', 'aria-label': 'Date' },
  render: (args) => <ControlledDemo args={args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    await expect(title(root)).toHaveTextContent('December 2026');
    await expect(canvas.getByRole('status')).toHaveTextContent('No date');
    canvas.getByRole('button', { name: 'Today' }).click();
    await waitFor(() => expect(title(root)).toHaveTextContent('November 2026'));
    await expect(dayOf(root, '2026-11-04').closest('td')).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('2026-11-04');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(args.onMonthChange).not.toHaveBeenCalled();
    // A press on a day goes through the parent, which holds the value.
    dayOf(root, '2026-11-20').click();
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('2026-11-20'));
    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-20');
  },
};
