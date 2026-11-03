import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
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
import { Combobox, ComboboxGroup, ComboboxItem, ComboboxSeparator } from './Combobox';

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  args: { children: null, onValueChange: fn(), onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { placeSelf: 'start', display: 'grid', gap: 12, width: 240 } as const;
const caption = {
  fontSize: 'var(--flg-text-xs)',
  color: 'var(--flg-text-muted)',
  marginBottom: 6,
} as const;

// The list of the approved mockup (C1): cities, typed "h".
const cities = (
  <>
    <ComboboxItem value="hn">Hà Nội</ComboboxItem>
    <ComboboxItem value="hp">Hải Phòng</ComboboxItem>
    <ComboboxItem value="hue">Huế</ComboboxItem>
    <ComboboxItem value="ha">Hội An</ComboboxItem>
    <ComboboxItem value="hcm">Hồ Chí Minh</ComboboxItem>
    <ComboboxItem value="ct">Cần Thơ</ComboboxItem>
    <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
    <ComboboxItem value="dl" disabled>
      Đà Lạt (soon)
    </ComboboxItem>
  </>
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The Combobox's listbox; the hidden native <select> has a listbox role of its own. */
const listboxIn = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-select-listbox')!;

/** The look of the mockup (C1): a Select's frame with the text typed in it, the chevron at the end. */
export const Look: Story = {
  render: () => (
    <div style={{ ...column, gap: 16 }}>
      <div>
        <div style={caption}>With a value</div>
        <Combobox aria-label="City, with a value" defaultValue="hn">
          {cities}
        </Combobox>
      </div>
      <div>
        <div style={caption}>Empty, with a placeholder</div>
        <Combobox aria-label="City, empty" placeholder="Search a city…">
          {cities}
        </Combobox>
      </div>
      <div>
        <div style={caption}>Small</div>
        <Combobox aria-label="City, small" size="sm" defaultValue="hn">
          {cities}
        </Combobox>
      </div>
      <div>
        <div style={caption}>Large</div>
        <Combobox aria-label="City, large" size="lg" defaultValue="hn">
          {cities}
        </Combobox>
      </div>
      <div>
        <div style={caption}>Disabled</div>
        <Combobox aria-label="City, disabled" defaultValue="hn" disabled>
          {cities}
        </Combobox>
      </div>
      <Field label="City" description="Where you live." error="Pick a city from the list." required>
        <Combobox name="city" placeholder="Search a city…">
          {cities}
        </Combobox>
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const sizes = ['City, small', 'City, with a value', 'City, large'].map((name) =>
      canvas.getByRole('combobox', { name }).parentElement!.getBoundingClientRect(),
    );
    // The heights of Input's three sizes.
    await expect(sizes.map((box) => Math.round(box.height))).toEqual([28, 34, 40]);
    const invalid = canvas.getByRole('combobox', { name: 'City' });
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByRole('combobox', { name: 'City, disabled' })).toBeDisabled();
  },
};

/** Open while filtering "ha": the match in bold, the rest muted, one option highlighted. */
export const Open: Story = {
  render: () => (
    <div style={column}>
      <Field label="City">
        <Combobox defaultOpen defaultInputValue="h">
          {cities}
        </Combobox>
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'City' });
    const listbox = canvas.getByRole('listbox', { name: 'City' });
    await settled(listbox);
    // Under the frame, 6px away, at least as wide.
    const frame = input.parentElement!.getBoundingClientRect();
    const box = listbox.getBoundingClientRect();
    await expect(Math.round(box.top - frame.bottom)).toBe(6);
    await expect(Math.round(box.left)).toBe(Math.round(frame.left));
    await expect(box.width).toBeGreaterThanOrEqual(frame.width - 0.5);
    // Typed "h": the matching text is bold.
    const options = within(listbox).getAllByRole('option');
    await expect(options.length).toBeGreaterThan(1);
    const match = options[0]!.querySelector('.flg-combobox-match');
    await expect(match).toHaveTextContent('H');
    await expect(getComputedStyle(match!).fontWeight).toBe('600');
    // One option is highlighted, by the keyboard; focus stays on the input.
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(listbox.querySelectorAll('[data-highlighted]')).toHaveLength(1);
    await expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
  },
};

export const Empty: Story = {
  render: () => (
    <div style={column}>
      <Field label="City">
        <Combobox defaultOpen defaultInputValue="xyz">
          {cities}
        </Combobox>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'City' });
    const panel = listboxIn(canvasElement);
    await settled(panel);
    // A status row, no option, and nothing for the input to point at: with no option to hold, the
    // panel is no listbox.
    await expect(within(panel).queryAllByRole('option')).toHaveLength(0);
    await expect(within(panel).getByText('No results')).toBeInTheDocument();
    await expect(panel).not.toHaveAttribute('role');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).not.toHaveAttribute('aria-controls');
  },
};

/** The APG keys, with the keyboard events of Testing Library. */
export const Keys: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ placeSelf: 'start', display: 'flex', gap: 16, alignItems: 'end' }}>
      <div style={column}>
        <Field label="City">
          <Combobox
            name="city"
            placeholder="Search a city…"
            onValueChange={args.onValueChange}
            onOpenChange={args.onOpenChange}
          >
            {cities}
          </Combobox>
        </Field>
      </div>
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const input = canvas.getByRole('combobox', { name: 'City' });
    const listbox = listboxIn(canvasElement);
    const isOpen = () => listbox.matches(':popover-open');
    const highlighted = () => listbox.querySelector('[data-highlighted]')?.textContent;
    const shown = () =>
      within(listbox)
        .queryAllByRole('option')
        .map((option) => option.textContent);
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    // ↓ opens it on the first option; focus stays on the input, which names the highlight.
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(isOpen()).toBe(true);
    await expect(input).toHaveFocus();
    await expect(highlighted()).toBe('Hà Nội');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      within(listbox).getByRole('option', { name: 'Hà Nội' }).id,
    );
    // Arrows move it and skip the disabled option; they stop at the ends.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(highlighted()).toBe('Huế');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    await expect(highlighted()).toBe('Hà Nội');
    await userEvent.keyboard('{End}');
    // End and Home move the caret and drop the highlight.
    await expect(highlighted()).toBeUndefined();
    await userEvent.keyboard('{ArrowUp}');
    await expect(highlighted()).toBe('Đà Nẵng');

    // Typing filters, with no regard for case or diacritics, and points at nothing.
    await userEvent.keyboard('{Escape}{Escape}');
    await userEvent.clear(input);
    await userEvent.keyboard('ha noi');
    await expect(isOpen()).toBe(true);
    await expect(shown()).toEqual(['Hà Nội']);
    await expect(highlighted()).toBeUndefined();
    await userEvent.clear(input);
    await userEvent.keyboard('da nang');
    await expect(shown()).toEqual(['Đà Nẵng']);
    // Enter chooses the highlighted option, takes its text and closes.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(isOpen()).toBe(false);
    await expect(input).toHaveValue('Đà Nẵng');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('dn');

    // Opened again by a key, it shows every item and points at the chosen one.
    await userEvent.keyboard('{ArrowDown}');
    await expect(shown()).toHaveLength(8);
    await expect(highlighted()).toBe('Đà Nẵng');
    // Alt+↑ closes it and keeps the text; Alt+↓ opens it without a highlight.
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
    await expect(isOpen()).toBe(false);
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await expect(isOpen()).toBe(true);
    await expect(highlighted()).toBeUndefined();
    // Tab closes it and chooses nothing; focus moves on.
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await userEvent.tab();
    await expect(isOpen()).toBe(false);
    await expect(input).toHaveValue('Đà Nẵng');
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();

    // Text that matches nothing is put back on Esc, once the listbox is closed, and on leaving.
    input.focus();
    await userEvent.keyboard('xyz');
    await expect(within(listbox).getByText('No results')).toBeInTheDocument();
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveValue('Đà Nẵng');
    await userEvent.clear(input);
    await userEvent.keyboard('abc');
    await userEvent.tab();
    await expect(input).toHaveValue('Đà Nẵng');
    // Emptied and left, the value is cleared: the way to clear it.
    input.focus();
    await userEvent.clear(input);
    await userEvent.tab();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    await expect(input).toHaveValue('');
  },
};

/** The pointer, with the trusted input of the browser where there is one. */
export const Pointer: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ placeSelf: 'start', display: 'flex', gap: 16, alignItems: 'end' }}>
      <div style={column}>
        <Field label="City">
          <Combobox
            defaultValue="hn"
            onValueChange={args.onValueChange}
            onOpenChange={args.onOpenChange}
          >
            {cities}
          </Combobox>
        </Field>
      </div>
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const real = await realUserEvent();
    if (!real) return;
    const input = canvas.getByRole('combobox', { name: 'City' });
    const chevron = canvasElement.querySelector<HTMLElement>('.flg-combobox-chevron')!;
    const listbox = listboxIn(canvasElement);
    const isOpen = () => listbox.matches(':popover-open');
    const highlighted = () => listbox.querySelector('[data-highlighted]')?.textContent;
    const option = (name: string) => within(listbox).getByRole('option', { name });

    // A click opens it on the chosen option, with every item shown.
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(true));
    await expect(input).toHaveFocus();
    await expect(highlighted()).toBe('Hà Nội');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(8);
    // The pointer highlights what it is over, without taking focus.
    await real.hover(option('Huế'));
    await waitFor(() => expect(highlighted()).toBe('Huế'));
    await expect(input).toHaveFocus();
    // A click on the open input closes it, as on a native <datalist>; typing opens it again.
    args.onOpenChange?.mockClear();
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(input).toHaveFocus();
    await real.keyboard('x');
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.keyboard('{Backspace}');
    // The chevron toggles it too, and the input keeps focus.
    await real.click(chevron);
    await waitFor(() => expect(isOpen()).toBe(false));
    await real.click(chevron);
    await waitFor(() => expect(isOpen()).toBe(true));
    await expect(input).toHaveFocus();
    // A click on an option chooses it and closes the listbox.
    await real.click(option('Hải Phòng'));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(input).toHaveValue('Hải Phòng');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('hp');
    await expect(input).toHaveFocus();
    // A disabled option cannot be chosen.
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(true));
    // Playwright will not click a disabled element, so this click is Testing Library's.
    await userEvent.click(option('Đà Lạt (soon)'));
    await expect(isOpen()).toBe(true);
    await expect(input).toHaveValue('Hải Phòng');
    // Esc closes it and changes nothing.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(input).toHaveValue('Hải Phòng');
    // A click outside closes it, and the text that was typed goes back.
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.keyboard('x');
    await real.click(canvas.getByRole('button', { name: 'After' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(input).toHaveValue('Hải Phòng');
  },
};

export const Separators: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Combobox aria-label="Fruit">
        <ComboboxItem value="apple">Apple</ComboboxItem>
        <ComboboxSeparator />
        <ComboboxGroup label="Berries">
          <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
          <ComboboxItem value="cranberry">Cranberry</ComboboxItem>
        </ComboboxGroup>
        <ComboboxSeparator />
        <ComboboxItem value="date">Date</ComboboxItem>
      </Combobox>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Fruit' });
    const listbox = listboxIn(canvasElement);
    await userEvent.click(input);
    await expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    await expect(within(listbox).getByRole('group', { name: 'Berries' })).toBeInTheDocument();
    // A group with no match goes, and the separators around it with it.
    await userEvent.keyboard('dat');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(1);
    await expect(within(listbox).queryByRole('group')).toBeNull();
    await expect(listbox.querySelectorAll('.flg-menu-separator')).toHaveLength(0);
  },
};

const server = ['Ha Long', 'Hanoi', 'Hue'];

/** A list the app filters itself: `filter={false}` shows what it is given. */
export const OwnFilter: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Combobox aria-label="Place" filter={false}>
        {server.map((name) => (
          <ComboboxItem key={name} value={name}>
            {name}
          </ComboboxItem>
        ))}
      </Combobox>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Place' });
    const listbox = listboxIn(canvasElement);
    await userEvent.type(input, 'zzz');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(3);
    await expect(listbox.querySelector('.flg-combobox-match')).toBeNull();
  },
};

/** The look of an error, and a Field that names it, describes it and marks it required. */
export const InAField: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Field label="City" description="Where you live." error="Pick one." required>
        <Combobox placeholder="Search a city…">{cities}</Combobox>
      </Field>
      <Field label="Plan" disabled>
        <Combobox defaultValue="hn">{cities}</Combobox>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'City' });
    await expect(input).toHaveAccessibleDescription('Where you live. Pick one.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-required', 'true');
    await expect(input.closest('.flg-combobox')).toHaveAttribute('data-invalid');
    // A click on the label is a click on the input: it takes focus.
    await userEvent.click(canvas.getByText('City', { selector: 'label' }));
    await expect(input).toHaveFocus();
    // The listbox has the name of the input.
    await expect(listboxIn(canvasElement)).toHaveAccessibleName('City');
    await expect(canvas.getByRole('combobox', { name: 'Plan' })).toBeDisabled();
  },
};

/** Esc closes only the listbox; a second Esc closes the Dialog. */
export const InADialog: Story = {
  tags: ['no-visual'],
  render: () => (
    <Dialog>
      <DialogTrigger variant="secondary">Edit address</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Edit address</DialogTitle>
        <Field label="City">
          <Combobox defaultValue="hn">{cities}</Combobox>
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
    await real.click(canvas.getByRole('button', { name: 'Edit address' }));
    const dialog = canvasElement.querySelector('dialog')!;
    await expect(dialog.open).toBe(true);
    let input = within(dialog).getByRole('combobox', { name: 'City' });
    let listbox = listboxIn(dialog);
    const isOpen = () => listbox.matches(':popover-open');
    // Esc closes only the listbox, the topmost layer; focus stays on the input.
    input.focus();
    await real.keyboard('{ArrowDown}');
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    await expect(input).toHaveFocus();
    // A second Esc has nothing left to do in the Combobox, so the Dialog closes.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
    // Open again, a press on the open input closes only the listbox.
    await real.click(canvas.getByRole('button', { name: 'Edit address' }));
    await waitFor(() => expect(dialog.open).toBe(true));
    // The Dialog's content is made anew.
    input = within(dialog).getByRole('combobox', { name: 'City' });
    listbox = listboxIn(dialog);
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(input).toHaveFocus();
    // A click on the frame of the Dialog, outside the panel, closes only the listbox.
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    // Choosing an option closes the listbox and keeps the Dialog.
    await real.click(input);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(within(listbox).getByRole('option', { name: 'Huế' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(input).toHaveValue('Huế');
    await expect(dialog.open).toBe(true);
  },
};

function CityForm({ onSubmit }: { onSubmit: (city: FormDataEntryValue | null) => void }) {
  return (
    <form
      aria-label="Address"
      style={column}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget).get('city'));
      }}
    >
      <Field label="City" required>
        <Combobox name="city" placeholder="Search a city…" defaultValue="hn">
          {cities}
        </Combobox>
      </Field>
      <Field label="Other city" required>
        <Combobox name="other" placeholder="Search a city…">
          {cities}
        </Combobox>
      </Field>
      <button type="submit">Save</button>
    </form>
  );
}

export const InAForm: Story = {
  tags: ['no-visual'],
  args: { onValueChange: fn() },
  render: () => <CityForm onSubmit={fn()} />,
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const city = canvas.getByRole('combobox', { name: 'City' });
    const other = canvas.getByRole('combobox', { name: 'Other city' });
    const user = (await realUserEvent()) ?? userEvent;
    let submitted = 0;
    form.addEventListener('submit', () => (submitted += 1));

    // Required and empty: the submit is stopped, and focus lands on the input, not on the hidden
    // native <select> the browser focused to show its message.
    form.requestSubmit();
    await waitFor(() => expect(other).toHaveFocus());
    await expect(submitted).toBe(0);
    // Stray text is not a value.
    await user.keyboard('xyz');
    form.requestSubmit();
    await expect(submitted).toBe(0);

    // The value reaches FormData through the hidden native <select>.
    await user.keyboard('{Backspace}{Backspace}{Backspace}{ArrowDown}');
    await user.keyboard('{ArrowDown}{Enter}');
    await expect(other).toHaveValue('Hải Phòng');
    await expect(new FormData(form).get('city')).toBe('hn');
    await expect(new FormData(form).get('other')).toBe('hp');

    // Enter in an open listbox chooses and does not submit; on a closed one it submits.
    city.focus();
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}h');
    await user.keyboard('{ArrowDown}{Enter}');
    await expect(submitted).toBe(0);
    await expect(city).toHaveValue('Hà Nội');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(submitted).toBe(1));

    // Reset: the Combobox with a default goes back to it, the other one to nothing.
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(new FormData(form).get('city')).toBe('hp');
    form.reset();
    await waitFor(() => expect(city).toHaveValue('Hà Nội'));
    await waitFor(() => {
      expect(other).toHaveValue('');
      const data = new FormData(form);
      expect(data.get('city')).toBe('hn');
      expect(data.get('other')).toBe('');
    });
  },
};

const liveRegionIn = (root: HTMLElement) => root.querySelector<HTMLElement>('[aria-live]')!;

/** `allowCustomValue`: Enter commits the text, leaving commits it, Esc on a closed list clears it. */
export const CustomValue: Story = {
  tags: ['no-visual'],
  render: () => (
    <form aria-label="Address" style={column} onSubmit={(event) => event.preventDefault()}>
      <Field label="City">
        <Combobox name="city" allowCustomValue placeholder="Search or type a city…">
          {cities}
        </Combobox>
      </Field>
      <button type="submit">Save</button>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const input = canvas.getByRole('combobox', { name: 'City' });
    const user = (await realUserEvent()) ?? userEvent;
    const city = () => new FormData(form).get('city');

    // Enter commits what was typed, in a form that does not submit while the list is open.
    let submitted = 0;
    form.addEventListener('submit', () => (submitted += 1));
    await user.click(input);
    await user.keyboard('Quận 1{Enter}');
    await expect(input).toHaveValue('Quận 1');
    await waitFor(() => expect(city()).toBe('Quận 1'));
    await expect(submitted).toBe(0);

    // Leaving commits it too, and text that folds to an item becomes that item.
    await user.clear(input);
    await user.keyboard('ha noi{Tab}');
    await waitFor(() => expect(city()).toBe('hn'));
    await expect(input).toHaveValue('Hà Nội');
    await user.click(input);
    await user.keyboard('{Control>}a{/Control}Biên Hòa{Tab}');
    await waitFor(() => expect(city()).toBe('Biên Hòa'));

    // Esc on a closed list clears the text and the value.
    input.focus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveValue(''));
    await expect(city()).toBe('');
  },
};

const places = ['Ha Long', 'Hanoi', 'Hue', 'Da Nang', 'Hoi An'];

/** Server filtering: `filter={false}`, `loading` while a fake request resolves. */
function ServerSearch() {
  const [found, setFound] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  return (
    <div style={column}>
      <Field label="Place">
        <Combobox
          filter={false}
          loading={loading}
          placeholder="Search a place…"
          onInputValueChange={(text) => {
            const mine = (request.current += 1);
            setLoading(true);
            setTimeout(() => {
              // An older answer must not replace a newer one.
              if (mine !== request.current) return;
              setFound(places.filter((name) => name.toLowerCase().includes(text.toLowerCase())));
              setLoading(false);
            }, 150);
          }}
        >
          {found.map((name) => (
            <ComboboxItem key={name} value={name}>
              {name}
            </ComboboxItem>
          ))}
        </Combobox>
      </Field>
    </div>
  );
}

export const ServerFiltering: Story = {
  tags: ['no-visual'],
  render: () => <ServerSearch />,
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Place' });
    const listbox = listboxIn(canvasElement);
    const live = liveRegionIn(canvasElement);
    const user = (await realUserEvent()) ?? userEvent;
    await user.click(input);
    await user.keyboard('h');
    // The request is out: the status row says so, and the region says it once.
    await waitFor(() => expect(listbox).toHaveTextContent('Loading…'));
    await waitFor(() => expect(live).toHaveTextContent('Loading…'));
    // It resolves: the options come, the loading row goes, and the count is said after the typing.
    await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(4));
    await expect(listbox).not.toHaveTextContent('Loading…');
    await waitFor(() => expect(live).toHaveTextContent('4 results'), { timeout: 3000 });
    // No match: the answer is empty and says so.
    await user.keyboard('zz');
    await waitFor(() => expect(listbox).toHaveTextContent('No results'));
    await waitFor(() => expect(live).toHaveTextContent('No results'), { timeout: 3000 });
  },
};

/** What the live region says while the user types. */
export const Announcements: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Field label="City">
        <Combobox placeholder="Search a city…">{cities}</Combobox>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'City' });
    const listbox = listboxIn(canvasElement);
    const live = liveRegionIn(canvasElement);
    const user = (await realUserEvent()) ?? userEvent;
    // Present and empty before anything happens.
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toBeEmptyDOMElement();
    await user.click(input);
    await user.keyboard('h');
    await waitFor(
      () =>
        expect(live).toHaveTextContent(`${within(listbox).getAllByRole('option').length} results`),
      { timeout: 3000 },
    );
    await user.keyboard('ue');
    await waitFor(() => expect(live).toHaveTextContent('1 result'), { timeout: 3000 });
    await user.keyboard('zzz');
    await waitFor(() => expect(live).toHaveTextContent('No results'), { timeout: 3000 });
  },
};

function SubmitForm({ onSubmit }: { onSubmit: (city: FormDataEntryValue | null) => void }) {
  return (
    <form
      aria-label="Address"
      style={column}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget).get('city'));
      }}
    >
      <Field label="City">
        <Combobox name="city" allowCustomValue placeholder="Search or type a city…">
          {cities}
        </Combobox>
      </Field>
    </form>
  );
}

/** Enter on a closed list submits the value the Enter itself settled, not the one before it. */
export const CustomValueSubmit: Story = {
  tags: ['no-visual'],
  render: () => <SubmitForm onSubmit={fn()} />,
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const input = canvas.getByRole('combobox', { name: 'City' });
    const user = (await realUserEvent()) ?? userEvent;
    const sent: Array<FormDataEntryValue | null> = [];
    form.addEventListener('submit', (event) => {
      sent.push(new FormData(event.currentTarget as HTMLFormElement).get('city'));
    });

    // Free text, the list closed with Alt+ArrowUp (which keeps the text), then Enter.
    await user.click(input);
    await user.keyboard('Quận 1{Alt>}{ArrowUp}{/Alt}');
    await expect(listboxIn(canvasElement).matches(':popover-open')).toBe(false);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(sent).toEqual(['Quận 1']));

    // An item picked, then Enter on the closed list submits that item's value.
    await user.clear(input);
    await user.keyboard('h{ArrowDown}{Enter}');
    await expect(input).toHaveValue('Hà Nội');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(sent).toEqual(['Quận 1', 'hn']));
  },
};
