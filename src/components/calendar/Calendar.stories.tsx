import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Card } from '../card/Card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../dialog/Dialog';
import { Calendar } from './Calendar';
import type { CalendarProps } from './Calendar';

/** The props of a calendar that chooses one date; the other kind is written with `mode="range"`. */
type SingleProps = Extract<CalendarProps, { mode?: 'single' }>;

/** Story args are the union of both kinds; these stories pick one date. */
const single = (args: CalendarProps) => args as SingleProps;

/** Story args of a calendar that chooses a range. */
const ranged = (args: CalendarProps) => args as Extract<CalendarProps, { mode: 'range' }>;

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
          {...single(args)}
          defaultValue="2026-11-14"
          min="2026-11-03"
          isDateUnavailable={booked}
          aria-label="November 2026"
        />
      </Card>
      <Card style={{ padding: 16 }}>
        <Calendar
          {...single(args)}
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

function ControlledDemo({ args }: { args: SingleProps }) {
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
  render: (args) => <ControlledDemo args={single(args)} />,
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

/** The cell (`td`) of a day, which carries the band, the range place and `aria-selected`. */
const cellOf = (root: HTMLElement, iso: string) => dayOf(root, iso).closest('td') as HTMLElement;

/** The ISO dates whose cell matches `selector`, in grid order. */
const datesWhere = (root: HTMLElement, selector: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(`td${selector}`)).map(
    (td) => td.querySelector<HTMLElement>('[data-date]')!.dataset.date,
  );

const days = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `2026-11-${String(from + i).padStart(2, '0')}`);

const transparent = 'rgba(0, 0, 0, 0)';
/** The band of a cell is painted on its `::before`: a colour in the dark theme, a gradient in the light. */
const bandOf = (cell: Element) => getComputedStyle(cell, '::before');
const hasBand = (cell: Element) => {
  const band = bandOf(cell);
  return (
    band.content !== 'none' &&
    (band.backgroundImage !== 'none' || band.backgroundColor !== transparent)
  );
};

/**
 * A range across a week break (the mockup, K1): on the left the week starts on Sunday and the band
 * breaks after Saturday the 14th; on the right it starts on Monday, the range starts on a Sunday that
 * ends its row, and the two booked days inside it are struck through but inside the band.
 */
export const Range: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <Card style={{ padding: 16 }}>
        <Calendar
          {...ranged(args)}
          mode="range"
          defaultValue={['2026-11-12', '2026-11-16']}
          aria-label="November 2026, from Sunday"
        />
      </Card>
      <Card style={{ padding: 16 }}>
        <Calendar
          {...ranged(args)}
          mode="range"
          weekStartsOn={1}
          defaultValue={['2026-11-08', '2026-11-12']}
          isDateUnavailable={booked}
          aria-label="November 2026, from Monday"
        />
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [sunday, monday] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.flg-calendar'),
    ) as [HTMLElement, HTMLElement];
    const style = (el: Element) => getComputedStyle(el);
    await expect(sunday).toHaveAttribute('data-mode', 'range');
    // Every day of the range is selected, and nothing else is.
    await expect(datesWhere(sunday, '[aria-selected="true"]')).toEqual(days(12, 16));
    await expect(cellOf(sunday, '2026-11-12')).toHaveAttribute('data-range', 'start');
    await expect(cellOf(sunday, '2026-11-16')).toHaveAttribute('data-range', 'end');
    // A middle day has the accent wash over its whole 36px cell, with the accent text; the day itself
    // has no gradient of its own.
    const middle = cellOf(sunday, '2026-11-13');
    await expect(middle.getBoundingClientRect().width).toBe(36);
    await expect(middle.getBoundingClientRect().height).toBe(36);
    await expect(hasBand(middle)).toBe(true);
    await expect(bandOf(middle).width).toBe('36px');
    await expect(bandOf(middle).backgroundImage).toBe(
      bandOf(cellOf(sunday, '2026-11-15')).backgroundImage,
    );
    await expect(bandOf(middle).backgroundColor).toBe(
      bandOf(cellOf(sunday, '2026-11-15')).backgroundColor,
    );
    await expect(style(dayOf(sunday, '2026-11-13')).color).not.toBe(
      style(dayOf(sunday, '2026-11-20')).color,
    );
    await expect(style(dayOf(sunday, '2026-11-13')).backgroundImage).toBe('none');
    // The ends keep the round day, with half a band behind it: the start's on its right, the end's
    // on its left.
    for (const date of ['2026-11-12', '2026-11-16']) {
      await expect(style(dayOf(sunday, date)).backgroundImage).toContain('gradient');
      await expect(hasBand(cellOf(sunday, date))).toBe(true);
      await expect(bandOf(cellOf(sunday, date)).width).toBe('18px');
    }
    await expect(bandOf(cellOf(sunday, '2026-11-12')).left).toBe('18px');
    await expect(bandOf(cellOf(sunday, '2026-11-16')).left).toBe('0px');
    // The band breaks at the end of the week: Saturday is round on the right, Sunday on the left.
    const saturday = bandOf(cellOf(sunday, '2026-11-14'));
    const nextSunday = bandOf(cellOf(sunday, '2026-11-15'));
    await expect(parseFloat(saturday.borderTopRightRadius)).toBeGreaterThan(0);
    await expect(parseFloat(saturday.borderTopLeftRadius)).toBe(0);
    await expect(parseFloat(nextSunday.borderTopLeftRadius)).toBeGreaterThan(0);
    await expect(parseFloat(nextSunday.borderTopRightRadius)).toBe(0);
    // The Monday calendar: the range starts on the last day of its row, so the start is round on
    // the right too; the booked days inside stay struck through and in the band.
    await expect(datesWhere(monday, '[aria-selected="true"]')).toEqual(days(8, 12));
    await expect(
      parseFloat(bandOf(cellOf(monday, '2026-11-08')).borderTopRightRadius),
    ).toBeGreaterThan(0);
    await expect(
      parseFloat(bandOf(cellOf(monday, '2026-11-09')).borderTopLeftRadius),
    ).toBeGreaterThan(0);
    for (const date of ['2026-11-09', '2026-11-10']) {
      await expect(cellOf(monday, date)).toHaveAttribute('data-range', 'middle');
      await expect(hasBand(cellOf(monday, date))).toBe(true);
      await expect(style(dayOf(monday, date)).textDecorationLine).toBe('line-through');
    }
    // The months around are still plain numbers, with no band.
    await expect(cellOf(sunday, '2026-12-01')).not.toHaveAttribute('data-range');
  },
};

/**
 * A start is picked and the pointer is over the 18th: the band runs from the 12th to it, in the
 * look of a range, and nothing is announced as selected except the start.
 */
export const Preview: Story = {
  render: (args) => (
    <Card style={{ padding: 16, width: 'fit-content' }}>
      <Calendar {...ranged(args)} mode="range" aria-label="Dates" />
    </Card>
  ),
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    // A real pointer where the browser can drive one: a pointer left over a day from an earlier story
    // would otherwise move the preview when the layout changes (Firefox sends it a mouse move).
    const pointer = (await realUserEvent()) ?? userEvent;
    await pointer.click(dayOf(root, '2026-11-12'));
    await pointer.hover(dayOf(root, '2026-11-18'));
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(datesWhere(root, '[data-preview]')).toEqual(days(12, 18));
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-12']);
    // The band is drawn as a committed range is: the wash on the middle, the round day on both ends.
    await expect(hasBand(cellOf(root, '2026-11-15'))).toBe(true);
    await expect(getComputedStyle(dayOf(root, '2026-11-12')).backgroundImage).toContain('gradient');
    await expect(getComputedStyle(dayOf(root, '2026-11-18')).backgroundImage).toContain('gradient');
    await expect(
      parseFloat(bandOf(cellOf(root, '2026-11-15')).borderTopLeftRadius),
    ).toBeGreaterThan(0);
  },
};

/** Picking a range with a real pointer: the preview follows it, the end calls back, the ends swap. */
export const RangePointer: Story = {
  tags: ['no-visual'],
  args: { 'aria-label': 'Dates' },
  render: (args) => <Calendar {...ranged(args)} mode="range" />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    // A real press can return before the page has handled its click (Firefox on a loaded CI runner),
    // so what the click changes is waited for, not read at once.
    await real.click(dayOf(root, '2026-11-12'));
    await waitFor(() => expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-12']));
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // The band follows the pointer, forwards and backwards.
    await real.hover(dayOf(root, '2026-11-17'));
    await waitFor(() => expect(datesWhere(root, '[data-preview]')).toEqual(days(12, 17)));
    await real.hover(dayOf(root, '2026-11-10'));
    await waitFor(() => expect(datesWhere(root, '[data-preview]')).toEqual(days(10, 12)));
    // The pointer leaves the days: only the start is left.
    await real.hover(root.querySelector('.flg-calendar-title') as HTMLElement);
    await waitFor(() => expect(datesWhere(root, '[data-preview]')).toEqual(['2026-11-12']));
    await real.click(dayOf(root, '2026-11-17'));
    await waitFor(() => expect(args.onValueChange).toHaveBeenCalledTimes(1));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-12', '2026-11-17']);
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(12, 17));
    await expect(datesWhere(root, '[data-preview]')).toEqual([]);
    // A later end first: the two days change places.
    await real.click(dayOf(root, '2026-11-24'));
    await waitFor(() => expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-24']));
    await real.click(dayOf(root, '2026-11-19'));
    await waitFor(() =>
      expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-19', '2026-11-24']),
    );
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(19, 24));
    // The same day twice is a range of one day, with no band.
    await real.click(dayOf(root, '2026-11-27'));
    await waitFor(() => expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-27']));
    await real.click(dayOf(root, '2026-11-27'));
    await waitFor(() =>
      expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-27', '2026-11-27']),
    );
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-27']);
    await expect(cellOf(root, '2026-11-27')).toHaveAttribute('data-range', 'single');
    await expect(args.onValueChange).toHaveBeenCalledTimes(3);
  },
};

/** The keys pick a range too: Enter and Space pick, and the arrows move the preview. */
export const RangeKeys: Story = {
  tags: ['no-visual'],
  args: { 'aria-label': 'Dates' },
  render: (args) => <Calendar {...ranged(args)} mode="range" />,
  play: async ({ canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const root = canvasElement.querySelector('.flg-calendar') as HTMLElement;
    // The real pointer is parked off the days: a story before may have left it over one, and a
    // pointer over a day moves the preview too (WebKit in CI drew the band to the 27th).
    await real.hover(root.querySelector('.flg-calendar-title') as HTMLElement);
    await tabToGrid(real);
    // With nothing chosen the tab stop is today, the 4th.
    await expect(dayOf(root, '2026-11-04')).toHaveFocus();
    await real.keyboard('{Enter}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await real.keyboard('{ArrowDown}{ArrowRight}');
    await expect(dayOf(root, '2026-11-12')).toHaveFocus();
    await expect(datesWhere(root, '[data-preview]')).toEqual(days(4, 12));
    await real.keyboard(' ');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-04', '2026-11-12']);
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(4, 12));
    // A start, and then an end before it: the swap, by keys.
    await real.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(dayOf(root, '2026-11-26')).toHaveFocus();
    await real.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['2026-11-05', '2026-11-26']);
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(days(5, 26));
  },
};

/** Esc drops the start without touching what is around the calendar; a second one is the Dialog's. */
export const RangeInADialog: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog>
      <DialogTrigger variant="secondary">Pick dates</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Pick dates</DialogTitle>
        <Calendar {...ranged(args)} mode="range" aria-label="Dates" />
        <DialogFooter>
          <DialogClose>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(canvas.getByRole('button', { name: 'Pick dates' }));
    const dialog = canvasElement.querySelector('dialog')!;
    await waitFor(() => expect(dialog.open).toBe(true));
    const root = dialog.querySelector('.flg-calendar') as HTMLElement;
    const start = dayOf(root, '2026-11-04');
    start.focus();
    await real.keyboard('{Enter}');
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual(['2026-11-04']);
    // The first Esc is the calendar's: the start goes, the Dialog stays, the focus stays.
    await real.keyboard('{Escape}');
    await expect(datesWhere(root, '[aria-selected="true"]')).toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(dialog.open).toBe(true);
    await expect(start).toHaveFocus();
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // Nothing is pending now, so the second one closes the Dialog.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};
