import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../dialog/Dialog';
import { Field } from '../field/Field';
import { DatePicker } from './DatePicker';

// Every story passes `today`: without it the calendar reads the clock, and the images and the checks
// below would change with the day they run.
const TODAY = '2026-11-04';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: { today: TODAY, onValueChange: fn(), onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { placeSelf: 'start', display: 'grid', gap: 12, width: 260 } as const;
const caption = {
  fontSize: 'var(--flg-text-xs)',
  color: 'var(--flg-text-muted)',
  marginBottom: 6,
} as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The popup of the DatePicker in `root`, and whether the browser shows it. */
const popupIn = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-date-picker-popup')!;
const isShown = (root: HTMLElement) => popupIn(root).matches(':popover-open');
const dayIn = (root: HTMLElement, iso: string) =>
  root.querySelector<HTMLElement>(`button[data-date="${iso}"]`)!;
const titleIn = (root: HTMLElement) => root.querySelector('.flg-calendar-title')!;

/** The look of the mockup (D1): the frame of Input with the calendar button in it, three sizes. */
export const Look: Story = {
  render: () => (
    <div style={{ ...column, gap: 16 }}>
      <div>
        <div style={caption}>With a value</div>
        <DatePicker aria-label="Date, with a value" defaultValue="2026-11-14" today={TODAY} />
      </div>
      <div>
        <div style={caption}>Empty, with the placeholder of the locale</div>
        <DatePicker aria-label="Date, empty" today={TODAY} />
      </div>
      <div>
        <div style={caption}>Vietnamese</div>
        <DatePicker
          aria-label="Date, Vietnamese"
          defaultValue="2026-11-14"
          locale="vi-VN"
          weekStartsOn={1}
          today={TODAY}
        />
      </div>
      <div>
        <div style={caption}>Small</div>
        <DatePicker aria-label="Date, small" size="sm" defaultValue="2026-11-14" today={TODAY} />
      </div>
      <div>
        <div style={caption}>Large</div>
        <DatePicker aria-label="Date, large" size="lg" defaultValue="2026-11-14" today={TODAY} />
      </div>
      <div>
        <div style={caption}>Disabled</div>
        <DatePicker aria-label="Date, disabled" disabled defaultValue="2026-11-14" today={TODAY} />
      </div>
      <div>
        <div style={caption}>Invalid</div>
        <DatePicker aria-label="Date, invalid" invalid defaultValue="2026-11-14" today={TODAY} />
      </div>
      <Field
        label="Check-in"
        description="Write it as mm/dd/yyyy."
        error="Pick a date from today on."
        required
      >
        <DatePicker name="checkin" today={TODAY} />
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const frame = (name: string) =>
      canvas.getByRole('textbox', { name }).parentElement!.getBoundingClientRect();
    // The heights of Input's three sizes.
    await expect(
      ['Date, small', 'Date, with a value', 'Date, large'].map((name) =>
        Math.round(frame(name).height),
      ),
    ).toEqual([28, 34, 40]);
    // The button is 24px at every size, with a 16px icon, at the end of the frame.
    for (const name of ['Date, small', 'Date, with a value', 'Date, large']) {
      const input = canvas.getByRole('textbox', { name });
      const button = input.parentElement!.querySelector('button')!.getBoundingClientRect();
      await expect([Math.round(button.width), Math.round(button.height)]).toEqual([24, 24]);
      const icon = input.parentElement!.querySelector('svg')!.getBoundingClientRect();
      await expect([Math.round(icon.width), Math.round(icon.height)]).toEqual([16, 16]);
    }
    await expect(canvas.getByRole('textbox', { name: 'Date, with a value' })).toHaveValue(
      '11/14/2026',
    );
    await expect(canvas.getByRole('textbox', { name: 'Date, Vietnamese' })).toHaveValue(
      '14/11/2026',
    );
    await expect(canvas.getByRole('textbox', { name: 'Date, empty' })).toHaveAttribute(
      'placeholder',
      'mm/dd/yyyy',
    );
    await expect(canvas.getByRole('textbox', { name: 'Date, invalid' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(canvas.getByRole('textbox', { name: 'Check-in' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(canvas.getByRole('textbox', { name: 'Date, disabled' })).toBeDisabled();
  },
};

/** Open on November 2026, the 14th chosen, today the 4th: a glass popup 6px under the frame. */
export const Open: Story = {
  render: () => (
    <div style={column}>
      <Field label="Check-in" description="Write it as mm/dd/yyyy.">
        <DatePicker defaultOpen defaultValue="2026-11-14" today={TODAY} />
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    const popup = popupIn(canvasElement);
    await settled(popup);
    const frame = input.parentElement!;
    const box = popup.getBoundingClientRect();
    const frameBox = frame.getBoundingClientRect();
    // Under the frame, 6px away, lined up with its start; 252px of calendar and 12px of padding.
    await expect(Math.round(box.top - frameBox.bottom)).toBe(6);
    await expect(Math.round(box.left)).toBe(Math.round(frameBox.left));
    await expect(Math.round(box.width)).toBe(278);
    await expect(
      Math.round(canvasElement.querySelector('.flg-calendar')!.getBoundingClientRect().width),
    ).toBe(252);
    await expect(getComputedStyle(popup).paddingTop).toBe('12px');
    await expect(getComputedStyle(popup).borderTopLeftRadius).toBe(
      getComputedStyle(frame).borderTopLeftRadius,
    );
    // The frame is marked as an open Select is: an accent edge and a ring.
    await expect(getComputedStyle(frame).outlineStyle).toBe('solid');
    await expect(popup).toHaveAttribute('role', 'dialog');
    await expect(titleIn(popup)).toHaveTextContent('November 2026');
    await expect(dayIn(popup, '2026-11-14').closest('td')).toHaveAttribute('aria-selected', 'true');
    // The calendar took the focus when it showed; the picture is of the look, not of a ring.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Typing a date: it is read when the DatePicker is left, with the focus on its button or past it. */
export const Typing: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker aria-label="Check-in" {...args} />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvas, args }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    const hidden = input
      .closest('.flg-date-picker')!
      .querySelector<HTMLInputElement>('input[type="hidden"]')!;
    await user.click(input);
    await user.keyboard('1/2/26');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // The calendar button is part of the DatePicker: the text waits.
    await user.tab();
    await expect(canvas.getByRole('button', { name: 'Choose date' })).toHaveFocus();
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await user.tab();
    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-01-02');
    // The text goes back in the format of the locale.
    await expect(input).toHaveValue('01/02/2026');
    await expect(hidden).toHaveValue('2026-01-02');

    // Text that cannot be read stays, as typed, and the value stays.
    await user.clear(input);
    await user.keyboard('31/31/2026');
    await user.tab({ shift: true });
    await expect(input).toHaveValue('31/31/2026');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(hidden).toHaveValue('2026-01-02');

    // Empty text is no date.
    await user.clear(input);
    await user.tab();
    await user.tab();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(hidden).toHaveValue('');
  },
};

/** The order of day, month and year is the locale's; any separator, two-digit years. */
export const Locales: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <DatePicker aria-label="English" today={TODAY} />
      <DatePicker aria-label="Vietnamese" locale="vi-VN" weekStartsOn={1} today={TODAY} />
      <DatePicker aria-label="German" locale="de-DE" weekStartsOn={1} today={TODAY} />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvas }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const cases: Array<[string, string, string, string]> = [
      ['English', 'mm/dd/yyyy', '3-5-26', '03/05/2026'],
      ['Vietnamese', 'dd/mm/yyyy', '3.5.26', '03/05/2026'],
      ['German', 'dd.mm.yyyy', '3/5/2026', '03.05.2026'],
    ];
    for (const [name, placeholder, typed, shown] of cases) {
      const input = canvas.getByRole('textbox', { name });
      await expect(input).toHaveAttribute('placeholder', placeholder);
      await user.click(input);
      await user.keyboard(typed);
      await user.click(canvas.getByRole('button', { name: 'Next' }));
      await waitFor(() => expect(input).toHaveValue(shown));
    }
    // The same digits are the 5th of March for the first and the 3rd of May for the other two.
    const hiddenOf = (name: string) =>
      canvas
        .getByRole('textbox', { name })
        .closest('.flg-date-picker')!
        .querySelector<HTMLInputElement>('input[type="hidden"]')!;
    await expect(hiddenOf('English')).toHaveValue('2026-03-05');
    await expect(hiddenOf('Vietnamese')).toHaveValue('2026-05-03');
    await expect(hiddenOf('German')).toHaveValue('2026-05-03');
  },
};

/** The button and Alt+ArrowDown open the calendar, on the month of the date typed; Esc closes it. */
export const Opening: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    const button = canvas.getByRole('button', { name: 'Choose date' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    // The button opens it, and the focus goes to the day with the tab stop: the chosen one.
    await real.click(button);
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toHaveAttribute('aria-controls', popupIn(canvasElement).id);
    await waitFor(() => expect(dayIn(canvasElement, '2026-11-14')).toHaveFocus());
    // Esc is the browser's: it closes the popup and the focus goes back to the input.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(input).toHaveFocus());
    await expect(input).toHaveValue('11/14/2026');

    // Alt+ArrowDown opens it from the input. The text that waits is read first: the calendar opens
    // on its month, and the date is the value.
    await real.click(input);
    await real.clear(input);
    await real.keyboard('03/05/2027');
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await expect(titleIn(canvasElement)).toHaveTextContent('March 2027');
    await waitFor(() => expect(dayIn(canvasElement, '2027-03-05')).toHaveFocus());
    await expect(input).toHaveValue('03/05/2027');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));

    // Text that cannot be read opens the month of the value, and stays as typed.
    await real.clear(input);
    await real.keyboard('garbage');
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await expect(titleIn(canvasElement)).toHaveTextContent('March 2027');
    await expect(input).toHaveValue('garbage');
  },
};

/** Choosing with the keyboard: the keys of the grid, then Enter. The focus goes back to the input. */
export const Keys: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker aria-label="Check-in" {...args} />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    await real.click(input);
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    // No date yet: the focus is on today.
    await waitFor(() => expect(dayIn(canvasElement, TODAY)).toHaveFocus());
    await real.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    await expect(dayIn(canvasElement, '2026-11-13')).toHaveFocus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-13');
    await expect(input).toHaveValue('11/13/2026');
    await waitFor(() => expect(input).toHaveFocus());

    // Open again: the focus is on the chosen day; Space chooses it, with nothing to report.
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() => expect(dayIn(canvasElement, '2026-11-13')).toHaveFocus());
    await real.keyboard(' ');
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(input).toHaveFocus());
  },
};

/** Tab out of the calendar closes it and leaves the focus where Tab sent it. */
export const TabOut: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    const next = canvas.getByRole('button', { name: 'Next' });
    await real.click(input);
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() => expect(dayIn(canvasElement, '2026-11-14')).toHaveFocus());
    await real.tab();
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await expect(next).toHaveFocus();
    await expect(input).toHaveValue('11/14/2026');

    // Shift+Tab from the first control of the popup goes back to the calendar button, which is the
    // DatePicker's own: the popup stays.
    await real.click(input);
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    canvasElement.querySelector<HTMLElement>('.flg-calendar-header button')!.focus();
    await real.tab({ shift: true });
    await expect(canvas.getByRole('button', { name: 'Choose date' })).toHaveFocus();
    await delay(50);
    await expect(isShown(canvasElement)).toBe(true);
  },
};

/** A press outside closes the calendar; a press on the open input closes it too. A day is chosen by a press. */
export const Pointer: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <p>Elsewhere on the page</p>
      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    const button = canvas.getByRole('button', { name: 'Choose date' });
    // Light dismiss on a press elsewhere.
    await real.click(button);
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await real.click(canvas.getByText('Elsewhere on the page'));
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onValueChange).not.toHaveBeenCalled();

    // A press on the input closes it, and the focus is the input's.
    await real.click(button);
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await real.click(input);
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await waitFor(() => expect(input).toHaveFocus());

    // A press on the button while it is open closes it.
    await real.click(button);
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await real.click(button);
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));

    // A press on a day chooses it, closes the popup and puts the focus on the input.
    await real.click(button);
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await real.click(dayIn(canvasElement, '2026-11-18'));
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-18');
    await expect(input).toHaveValue('11/18/2026');
    await waitFor(() => expect(input).toHaveFocus());

    // The day that is already chosen closes it too, and reports nothing.
    await real.click(button);
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await real.click(dayIn(canvasElement, '2026-11-18'));
    await waitFor(() => expect(isShown(canvasElement)).toBe(false));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
  },
};

/** The limits: days outside `min` and `max` and unavailable ones cannot be chosen, typed or pressed. */
export const Limits: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker
        aria-label="Check-in"
        defaultValue="2026-11-14"
        min="2026-11-10"
        max="2026-11-20"
        isDateUnavailable={(date) => date === '2026-11-18'}
        {...args}
      />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    // Typed: they stay as typed, and the value stays.
    for (const text of ['11/09/2026', '11/21/2026', '11/18/2026']) {
      await user.click(input);
      await user.clear(input);
      await user.keyboard(text);
      await user.click(canvas.getByRole('button', { name: 'Next' }));
      await expect(input).toHaveValue(text);
    }
    await expect(args.onValueChange).not.toHaveBeenCalled();
    // Pressed: nothing happens, and the popup stays open.
    await user.click(input);
    await user.clear(input);
    await user.keyboard('11/14/2026');
    await userEvent.click(canvas.getByRole('button', { name: 'Choose date' }));
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await expect(dayIn(canvasElement, '2026-11-18')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(dayIn(canvasElement, '2026-11-18'));
    await userEvent.click(dayIn(canvasElement, '2026-11-09'));
    await expect(isShown(canvasElement)).toBe(true);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await userEvent.click(dayIn(canvasElement, '2026-11-19'));
    await expect(args.onValueChange).toHaveBeenCalledWith('2026-11-19');
  },
};

/** Read-only: the text cannot be changed and the button opens nothing. */
export const ReadOnly: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker aria-label="Check-in" readOnly defaultValue="2026-11-14" {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole('textbox', { name: 'Check-in' });
    const button = canvas.getByRole('button', { name: 'Choose date' });
    await expect(input).toHaveAttribute('readonly');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    // Playwright waits for an element that is `aria-disabled` to be enabled, so this press is
    // synthetic, which is all the DatePicker sees of it.
    await userEvent.click(button);
    await user.click(input);
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await delay(50);
    await expect(isShown(canvasElement)).toBe(false);
    await expect(input).toHaveValue('11/14/2026');
  },
};

/** In a Dialog: Esc closes only the calendar, and a day chosen leaves the Dialog open. */
export const InADialog: Story = {
  tags: ['no-visual'],
  render: () => (
    <Dialog>
      <DialogTrigger variant="secondary">Book a room</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Book a room</DialogTitle>
        <Field label="Check-in">
          <DatePicker defaultValue="2026-11-14" today={TODAY} />
        </Field>
        <DialogFooter>
          <DialogClose>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(canvas.getByRole('button', { name: 'Book a room' }));
    const dialog = canvasElement.querySelector('dialog')!;
    await expect(dialog.open).toBe(true);
    const input = within(dialog).getByRole('textbox', { name: 'Check-in' });
    const button = within(dialog).getByRole('button', { name: 'Choose date' });
    // Esc closes only the calendar, the topmost layer; the focus goes to the input.
    await real.click(button);
    await waitFor(() => expect(isShown(dialog)).toBe(true));
    await waitFor(() => expect(dayIn(dialog, '2026-11-14')).toHaveFocus());
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isShown(dialog)).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    await waitFor(() => expect(input).toHaveFocus());
    // Opened from the keyboard, the same.
    await real.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() => expect(isShown(dialog)).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isShown(dialog)).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    // A day chosen closes the calendar and keeps the Dialog.
    await real.click(button);
    await waitFor(() => expect(isShown(dialog)).toBe(true));
    await real.click(dayIn(dialog, '2026-11-18'));
    await waitFor(() => expect(isShown(dialog)).toBe(false));
    await expect(input).toHaveValue('11/18/2026');
    await expect(dialog.open).toBe(true);
    // A press on the frame of the Dialog, outside the panel, closes only the calendar.
    await real.click(button);
    await waitFor(() => expect(isShown(dialog)).toBe(true));
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(isShown(dialog)).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    // A second Esc has nothing left to do in the DatePicker, so the Dialog closes.
    await real.click(input);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};

function BookingForm({ onSubmit }: { onSubmit: (data: Array<FormDataEntryValue | null>) => void }) {
  return (
    <form
      aria-label="Booking"
      style={column}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit([data.get('checkin'), data.get('checkout')]);
      }}
    >
      <Field label="Check-in" description="Write it as mm/dd/yyyy." required>
        <DatePicker name="checkin" defaultValue="2026-11-14" today={TODAY} />
      </Field>
      <Field label="Check-out" required>
        <DatePicker name="checkout" today={TODAY} />
      </Field>
      <button type="submit">Book</button>
    </form>
  );
}

/** FormData through the hidden input, `required` on the text input, Enter and reset. */
export const InAForm: Story = {
  tags: ['no-visual'],
  render: () => <BookingForm onSubmit={fn()} />,
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const checkin = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
    const checkout = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-out' });
    const user = (await realUserEvent()) ?? userEvent;
    const sent: Array<Array<FormDataEntryValue | null>> = [];
    form.addEventListener('submit', (event) => {
      const data = new FormData(event.currentTarget as HTMLFormElement);
      sent.push([data.get('checkin'), data.get('checkout')]);
    });
    const data = () => {
      const all = new FormData(form);
      return [all.get('checkin'), all.get('checkout')];
    };

    // The text input is the one that is required: a submit with it empty is stopped there, and the
    // browser shows its bubble on it and focuses it.
    await expect(checkout).toBeRequired();
    await expect(data()).toEqual(['2026-11-14', '']);
    form.requestSubmit();
    await waitFor(() => expect(checkout).toHaveFocus());
    await expect(checkout.validationMessage).not.toBe('');
    await expect(sent).toHaveLength(0);

    // Text that cannot be read: Enter leaves it and does not submit.
    await user.keyboard('abc{Enter}');
    await delay(50);
    await expect(sent).toHaveLength(0);
    await expect(checkout).toHaveValue('abc');

    // Spaces are no date: Enter does not submit them as a value that satisfies `required`, which is
    // what the browser would say of "   " if the text were still in the input when it checks.
    await user.clear(checkout);
    await user.keyboard('   {Enter}');
    await delay(50);
    await expect(sent).toHaveLength(0);
    await expect(data()).toEqual(['2026-11-14', '']);

    // Enter reads a date and the form submits that date, not the one from before the keystroke.
    await user.clear(checkout);
    await user.keyboard('11/20/2026{Enter}');
    await waitFor(() => expect(sent).toHaveLength(1));
    await expect(sent[0]).toEqual(['2026-11-14', '2026-11-20']);
    await expect(checkout).toHaveValue('11/20/2026');

    // A date typed and left is in FormData.
    await user.clear(checkin);
    await user.keyboard('12/25/2026');
    await user.click(checkout);
    await expect(data()).toEqual(['2026-12-25', '2026-11-20']);

    // A day chosen in the calendar too.
    const checkoutRoot = checkout.closest<HTMLElement>('.flg-date-picker')!;
    await user.click(within(checkoutRoot).getByRole('button', { name: 'Choose date' }));
    await waitFor(() => expect(isShown(checkoutRoot)).toBe(true));
    await user.click(dayIn(checkoutRoot, '2026-11-22'));
    await expect(data()).toEqual(['2026-12-25', '2026-11-22']);

    // Reset: the one with a default goes back to it, the other to nothing.
    form.reset();
    await waitFor(() => expect(checkin).toHaveValue('11/14/2026'));
    await waitFor(() => {
      expect(checkout).toHaveValue('');
      expect(data()).toEqual(['2026-11-14', '']);
    });
  },
};

/** The message under the frame, outside a Field, and as the error of a Field, with the red frame. */
export const Invalid: Story = {
  render: () => (
    <div style={{ ...column, gap: 20 }}>
      <div>
        <div style={caption}>Outside a Field: the message is under the frame</div>
        <DatePicker aria-label="Date, unreadable" defaultValue="2026-11-14" today={TODAY} />
      </div>
      <div>
        <div style={caption}>Outside a Field: a date that is not available</div>
        <DatePicker aria-label="Date, unavailable" min="2026-11-10" today={TODAY} />
      </div>
      <Field label="Check-in" description="Write it as mm/dd/yyyy.">
        <DatePicker name="checkin" today={TODAY} />
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const typeAndLeave = async (name: string, text: string) => {
      const input = canvas.getByRole('textbox', { name });
      await user.click(input);
      await user.clear(input);
      await user.keyboard(text);
      await user.tab();
      await user.tab();
      return input;
    };
    const unreadable = await typeAndLeave('Date, unreadable', '31/31/2026');
    const unavailable = await typeAndLeave('Date, unavailable', '11/09/2026');
    const inField = await typeAndLeave('Check-in', 'abc');
    // A Field shows the message a render after the DatePicker has it.
    await waitFor(() =>
      expect(
        Array.from(canvasElement.querySelectorAll('.flg-field-error')).map(
          (one) => one.textContent,
        ),
      ).toEqual(['Invalid date', 'This date is not available', 'Invalid date']),
    );
    for (const input of [unreadable, unavailable, inField]) {
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input.closest('.flg-date-picker')).toHaveAttribute('data-invalid');
    }
    // Outside a Field the message is in the root, under the frame; inside, it is the Field's.
    const own = unreadable.closest('.flg-date-picker')!.querySelector('.flg-field-error')!;
    await expect(unreadable.getAttribute('aria-describedby')).toBe(own.id);
    await expect(inField.closest('.flg-date-picker')!.querySelector('.flg-field-error')).toBeNull();
    // Its own message sits 5px under the frame, the Field's gap (a Field's has the gap itself).
    const frame = unreadable.closest('.flg-input')!;
    await expect(own.getBoundingClientRect().top - frame.getBoundingClientRect().bottom).toBe(5);
    // The image shows the messages, not a focus ring.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** An unreadable date: said, kept as typed, and gone once it is fixed, in a real browser. */
export const Fixing: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker aria-label="Check-in" defaultValue="2026-11-14" {...args} />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
    const message = () => canvasElement.querySelector('.flg-field-error');
    const live = () => canvasElement.querySelector('[aria-live]')!.textContent;
    const leave = async () => {
      await user.tab();
      await user.tab();
    };
    await user.click(input);
    await user.clear(input);
    await user.keyboard('2/30/2026');
    await leave();
    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus();
    await expect(message()).toHaveTextContent('Invalid date');
    await expect(input).toHaveValue('2/30/2026');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input.validity.customError).toBe(true);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await waitFor(() => expect(live()).toBe('Invalid date'));
    // Leaving with the same text again says nothing new: the region is not cleared and set again.
    await user.click(input);
    await leave();
    await expect(live()).toBe('Invalid date');
    // Fixed, and left: the message goes, and the date is the value.
    await user.click(input);
    await user.clear(input);
    await user.keyboard('2/28/2026');
    await leave();
    await expect(message()).toBeNull();
    await expect(input).not.toHaveAttribute('aria-invalid');
    await expect(input.validity.customError).toBe(false);
    await expect(input).toHaveValue('02/28/2026');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-02-28');
    // Emptied: no date, and no message.
    await user.click(input);
    await user.clear(input);
    await user.keyboard('x');
    await leave();
    await expect(message()).not.toBeNull();
    await user.click(input);
    await user.clear(input);
    await leave();
    await expect(message()).toBeNull();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
  },
};

/** A date outside min and max, or marked unavailable: its own message; a day in the calendar clears it. */
export const Unavailable: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <DatePicker
        aria-label="Check-in"
        defaultValue="2026-11-14"
        min="2026-11-10"
        max="2026-11-20"
        isDateUnavailable={(date) => date === '2026-11-18'}
        {...args}
      />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
    const message = () => canvasElement.querySelector('.flg-field-error');
    for (const text of ['11/09/2026', '11/21/2026', '11/18/2026']) {
      await user.click(input);
      await user.clear(input);
      await user.keyboard(text);
      await user.tab();
      await user.tab();
      await expect(message()).toHaveTextContent('This date is not available');
      await expect(input).toHaveValue(text);
      await expect(input.validationMessage).toBe('This date is not available');
    }
    await waitFor(() =>
      expect(canvasElement.querySelector('[aria-live]')).toHaveTextContent(
        'This date is not available',
      ),
    );
    // A day chosen in the calendar replaces the text and clears the message.
    await user.click(canvas.getByRole('button', { name: 'Choose date' }));
    await waitFor(() => expect(isShown(canvasElement)).toBe(true));
    await user.click(dayIn(canvasElement, '2026-11-19'));
    await waitFor(() => expect(input).toHaveValue('11/19/2026'));
    await expect(message()).toBeNull();
    await expect(input.validity.customError).toBe(false);
  },
};

/** Text that stays stops the submit, on the input, with its message; Enter does not submit it either. */
export const BlockedSubmit: Story = {
  tags: ['no-visual'],
  render: () => (
    <form aria-label="Booking" style={column} onSubmit={(event) => event.preventDefault()}>
      <Field label="Check-in" description="Write it as mm/dd/yyyy.">
        <DatePicker name="checkin" defaultValue="2026-11-14" today={TODAY} />
      </Field>
      <button type="submit">Book</button>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const user = (await realUserEvent()) ?? userEvent;
    const sent: Array<FormDataEntryValue | null> = [];
    form.addEventListener('submit', (event) => {
      sent.push(new FormData(event.currentTarget as HTMLFormElement).get('checkin'));
    });
    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Check-in' });
    await user.click(input);
    await user.clear(input);
    await user.keyboard('abc');
    const dbg: string[] = [];
    const t0 = performance.now();
    const rec = (s: string) => dbg.push(`${Math.round(performance.now() - t0)} ${s}`);
    const state = () => `active=${document.activeElement?.tagName}${document.activeElement === input ? '(input)' : ''} hasFocus=${document.hasFocus()} custom=${input.validity.customError} msg=${JSON.stringify(input.validationMessage)} text=${JSON.stringify(input.value)} sent=${JSON.stringify(sent)}`;
    const book = canvas.getByRole('button', { name: 'Book' });
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'focusin', 'focusout', 'invalid', 'submit']) {
      document.addEventListener(type, (event) => {
        const el = event.target as HTMLElement | null;
        const rel = (event as FocusEvent).relatedTarget as HTMLElement | null | undefined;
        rec(`${type} on=${el === input ? 'input' : el === book ? 'book' : (el?.tagName ?? String(el))} rel=${rel === undefined ? '-' : rel === null ? 'null' : rel === book ? 'book' : rel.tagName} ${state()}`);
      }, true);
    }
    rec(`before click ${state()}`);
    // Pressing Submit leaves the input, which says why; the browser then stops the submit there.
    await user.click(book);
    rec(`after click ${state()}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    rec(`300ms later ${state()}`);
    if (document.activeElement !== input) throw new Error(`DEBUG BlockedSubmit\n${dbg.join('\n')}`);
    await waitFor(() => expect(input).toHaveFocus());
    await expect(input.validationMessage).toBe('Invalid date');
    await expect(sent).toEqual([]);
    // Enter on it does not submit either.
    await user.keyboard('{Enter}');
    await delay(50);
    await expect(sent).toEqual([]);
    // Firefox hides its message bubble only on an `input` event or when focus leaves the input, and a
    // press elsewhere while it is up only closes it. The text is fixed by typing, then the input is
    // left first, as a user would, before Submit is pressed.
    await user.clear(input);
    await user.keyboard('11/21/2026');
    await user.tab();
    await user.tab();
    await expect(input.validity.valid).toBe(true);
    await user.click(canvas.getByRole('button', { name: 'Book' }));
    await waitFor(() => expect(sent).toEqual(['2026-11-21']));
    // Enter reads the date, and it is the date that is sent.
    await user.click(input);
    await user.clear(input);
    await user.keyboard('x{Enter}');
    await user.clear(input);
    await user.keyboard('12/01/2026{Enter}');
    await waitFor(() => expect(sent).toEqual(['2026-11-21', '2026-12-01']));
  },
};
