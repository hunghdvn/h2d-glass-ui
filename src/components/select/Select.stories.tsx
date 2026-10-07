import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
import { Select, SelectGroup, SelectItem, SelectSeparator } from './Select';

const meta = {
  title: 'Components/Select',
  component: Select,
  args: { children: null, onValueChange: fn(), onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { placeSelf: 'start', display: 'grid', gap: 12, width: 220 } as const;

// The list from the approved mockup (menus A): a labelled group, a disabled option.
const frequency = (
  <SelectGroup label="Frequency">
    <SelectItem value="daily">Daily</SelectItem>
    <SelectItem value="weekly">Weekly</SelectItem>
    <SelectItem value="monthly">Monthly</SelectItem>
    <SelectItem value="hourly" disabled>
      Hourly (Pro)
    </SelectItem>
  </SelectGroup>
);

// The list from the approved multi-select mockup (M1).
const departments = (
  <>
    <SelectItem value="design">Design</SelectItem>
    <SelectItem value="marketing">Marketing</SelectItem>
    <SelectItem value="engineering">Engineering</SelectItem>
    <SelectItem value="finance">Finance</SelectItem>
    <SelectItem value="people">People</SelectItem>
  </>
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The Select's listbox; the hidden native <select> has a listbox role of its own. */
const listboxIn = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-select-listbox')!;

export const Default: Story = {
  tags: ['no-visual'],
  render: (args) => (
    // "After" sits beside the Select: the open listbox covers what lies under it.
    <div style={{ placeSelf: 'start', display: 'flex', gap: 16, alignItems: 'end' }}>
      <div style={column}>
        <Field label="Frequency">
          <Select
            name="frequency"
            placeholder="Choose…"
            onValueChange={args.onValueChange as (value: string) => void}
            onOpenChange={args.onOpenChange}
          >
            {frequency}
          </Select>
        </Field>
      </div>
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    const listbox = listboxIn(canvasElement);
    const options = within(listbox);
    const isOpen = () => listbox.matches(':popover-open');
    const highlighted = () => listbox.querySelector('[data-highlighted]')?.textContent;
    await expect(trigger).toHaveTextContent('Choose…');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // ↓ opens it on the first option; focus stays on the trigger, which names the highlight.
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(isOpen()).toBe(true);
    await expect(trigger).toHaveFocus();
    await expect(highlighted()).toBe('Daily');
    await expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      options.getByRole('option', { name: 'Daily' }).id,
    );
    // Arrows move it and skip the disabled option; they stop at the ends.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect(highlighted()).toBe('Monthly');
    await userEvent.keyboard('{Home}');
    await expect(highlighted()).toBe('Daily');
    // Typing moves it too.
    await userEvent.keyboard('m');
    await expect(highlighted()).toBe('Monthly');
    // Enter chooses it and closes.
    await userEvent.keyboard('{Enter}');
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Monthly');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('monthly');
    await expect(options.getByRole('option', { name: 'Monthly', hidden: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Closed, typing changes the value at once without opening.
    await delay(600);
    await userEvent.keyboard('w');
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Weekly');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('weekly');

    // ↑ opens it on the chosen option.
    await userEvent.keyboard('{ArrowUp}');
    await expect(highlighted()).toBe('Weekly');
    // Tab takes the highlighted option, like Enter, and focus moves on.
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.tab();
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Daily');
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();

    // The pointer: a click opens it on the chosen option, a click on an option chooses it.
    await userEvent.click(trigger);
    await expect(isOpen()).toBe(true);
    await expect(highlighted()).toBe('Daily');
    await userEvent.click(options.getByRole('option', { name: 'Weekly' }));
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Weekly');
    await expect(trigger).toHaveFocus();
    // A disabled option cannot be chosen.
    await userEvent.click(trigger);
    await userEvent.click(options.getByRole('option', { name: 'Hourly (Pro)' }));
    await expect(isOpen()).toBe(true);
    await expect(trigger).toHaveTextContent('Weekly');

    const real = await realUserEvent();
    if (!real) return;
    // Esc closes it without changing the value.
    await real.keyboard('{ArrowDown}');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Weekly');
    await expect(trigger).toHaveFocus();
    // A click on the open trigger closes it, once.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    args.onOpenChange?.mockClear();
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(isOpen()).toBe(false);
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(trigger).toHaveFocus();
    // Opened by a real click, it takes the keyboard: Safari does not focus a clicked button.
    trigger.blur();
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await expect(trigger).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(highlighted()).toBe('Monthly');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Monthly');
    // A click outside closes it without changing the value.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(canvas.getByRole('button', { name: 'After' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Monthly');
  },
};

export const Open: Story = {
  render: () => (
    <div style={column}>
      <Field label="Frequency">
        <Select defaultValue="weekly" defaultOpen>
          {frequency}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    const listbox = canvas.getByRole('listbox', { name: 'Frequency' });
    await settled(listbox);
    // Under the trigger, 6px away, at least as wide.
    const t = trigger.getBoundingClientRect();
    const l = listbox.getBoundingClientRect();
    await expect(Math.round(l.top - t.bottom)).toBe(6);
    await expect(Math.round(l.left)).toBe(Math.round(t.left));
    await expect(l.width).toBeGreaterThanOrEqual(t.width - 0.5);
    await expect(within(listbox).getByRole('group', { name: 'Frequency' })).toBeInTheDocument();
  },
};

export const Multiple: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <Field label="Departments">
        <Select
          multiple
          name="departments"
          placeholder="None"
          onValueChange={args.onValueChange as (value: string[]) => void}
        >
          {departments}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Departments' });
    const listbox = listboxIn(canvasElement);
    const isOpen = () => listbox.matches(':popover-open');
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    // Enter and Space toggle the highlighted option; the listbox stays open.
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{ArrowDown} ');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(isOpen()).toBe(true);
    await expect(args.onValueChange).toHaveBeenLastCalledWith([
      'design',
      'marketing',
      'engineering',
    ]);
    await userEvent.keyboard('{ArrowUp} ');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['design', 'engineering']);
    // A press toggles too, and keeps it open: focus stays on the trigger, whose blur would close it.
    const real = await realUserEvent();
    await (real ?? userEvent).click(within(listbox).getByRole('option', { name: 'Marketing' }));
    await expect(isOpen()).toBe(true);
    await expect(trigger).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith([
      'design',
      'marketing',
      'engineering',
    ]);
    // Tab closes it.
    await userEvent.tab();
    await expect(isOpen()).toBe(false);
    // The chips are for the eye; the trigger also carries the full list as text.
    await expect(trigger).toHaveTextContent('Design, Marketing, Engineering');
    const chips = trigger.querySelector('.flg-select-chips');
    await expect(chips).toHaveAttribute('aria-hidden', 'true');
  },
};

export const MultipleOpen: Story = {
  render: () => (
    <div style={column}>
      <Field label="Departments">
        <Select multiple defaultValue={['design', 'marketing', 'engineering']} defaultOpen>
          {departments}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Departments' });
    // Three chosen, two chips fit: the third goes into "+1".
    const plus = () =>
      trigger.querySelector('.flg-select-chips > .flg-badge[data-variant="accent"]');
    await waitFor(() => expect(plus()).toHaveTextContent('+1'));
  },
};

export const Separators: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Select aria-label="Sort" defaultValue="name">
        <SelectItem value="name">Name</SelectItem>
        <SelectItem value="date">Date modified</SelectItem>
        <SelectSeparator />
        <SelectItem value="size">Size</SelectItem>
      </Select>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Sort' });
    await userEvent.click(trigger);
    const listbox = canvas.getByRole('listbox', { name: 'Sort' });
    await expect(within(listbox).getAllByRole('option')).toHaveLength(3);
  },
};

const teams = (
  <>
    <SelectItem value="design">Design</SelectItem>
    <SelectItem value="sales">Sales</SelectItem>
    <SelectItem value="support">Support</SelectItem>
  </>
);

function ProfileForm() {
  const [team, setTeam] = useState<string | null>('design');
  return (
    <form aria-label="Profile" style={column} onSubmit={(event) => event.preventDefault()}>
      <Field label="Frequency" required>
        <Select name="frequency" placeholder="Choose…">
          {frequency}
        </Select>
      </Field>
      <Field label="Departments">
        <Select multiple name="departments" defaultValue={['design']}>
          {departments}
        </Select>
      </Field>
      <Field label="Team">
        <Select name="team" value={team} onValueChange={setTeam}>
          {teams}
        </Select>
      </Field>
    </form>
  );
}

export const InAForm: Story = {
  tags: ['no-visual'],
  render: () => <ProfileForm />,
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const frequency = canvas.getByRole('combobox', { name: 'Frequency' });
    const departmentsTrigger = canvas.getByRole('combobox', { name: 'Departments' });
    const team = canvas.getByRole('combobox', { name: 'Team' });
    await expect(frequency).toHaveAttribute('aria-required', 'true');

    // Required and empty: the submit is stopped, and focus lands on the trigger, not on the hidden
    // native <select> the browser focused to show its message.
    form.requestSubmit();
    await waitFor(() => expect(frequency).toHaveFocus());

    // The values are in FormData, through the hidden native <select>s.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(frequency).toHaveTextContent('Weekly');
    let data = new FormData(form);
    await expect(data.get('frequency')).toBe('weekly');
    await expect(data.getAll('departments')).toEqual(['design']);
    await expect(data.get('team')).toBe('design');

    // Change all three, then reset the form: the uncontrolled ones go back to their defaults, the
    // controlled one keeps its value, as a controlled React input does.
    departmentsTrigger.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown} {Escape}');
    team.focus();
    await userEvent.keyboard('s');
    await expect(team).toHaveTextContent('Sales');
    data = new FormData(form);
    await expect(data.getAll('departments')).toEqual(['design', 'marketing']);
    form.reset();
    await waitFor(() => expect(frequency).toHaveTextContent('Choose…'));
    await expect(departmentsTrigger).toHaveTextContent(/^Design/);
    await expect(team).toHaveTextContent('Sales');
    await waitFor(() => {
      data = new FormData(form);
      expect(data.get('frequency')).toBe('');
      expect(data.getAll('departments')).toEqual(['design']);
      expect(data.get('team')).toBe('sales');
    });

    // Autofill: the browser sets the native <select> and fires `change`; the Select follows.
    const native = form.querySelector<HTMLSelectElement>('select[name="frequency"]')!;
    native.value = 'daily';
    native.dispatchEvent(new Event('change', { bubbles: true }));
    await expect(frequency).toHaveTextContent('Daily');
  },
};

function ControlledSelect({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [value, setValue] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  return (
    <div style={column}>
      <Field label="Frequency">
        <Select
          value={value}
          placeholder="Choose…"
          onValueChange={(next) => {
            onValueChange(next);
            if (!locked) setValue(next);
          }}
        >
          {frequency}
        </Select>
      </Field>
      <label>
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />{' '}
        Locked
      </label>
      <button type="button" onClick={() => setValue('monthly')}>
        Set monthly
      </button>
      <button type="button" onClick={() => setValue(null)}>
        Clear
      </button>
    </div>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <ControlledSelect onValueChange={args.onValueChange as (value: string) => void} />
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await userEvent.click(canvas.getByRole('button', { name: 'Set monthly' }));
    await expect(trigger).toHaveTextContent('Monthly');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(trigger).toHaveTextContent('Choose…');
    // A parent that refuses the change keeps the value; the request was still reported.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Locked' }));
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('daily');
    await expect(trigger).toHaveTextContent('Choose…');
  },
};

// Items retired after they were chosen: the triggers show them, so the form submits them too.
export const DisabledChoice: Story = {
  tags: ['no-visual'],
  render: () => (
    <form style={column}>
      <Field label="Plan" required>
        <Select name="plan" defaultValue="legacy">
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="legacy" disabled>
            Legacy
          </SelectItem>
        </Select>
      </Field>
      <Field label="Teams">
        <Select name="teams" multiple defaultValue={['old', 'web']}>
          <SelectItem value="web">Web</SelectItem>
          <SelectItem value="old" disabled>
            Old
          </SelectItem>
          <SelectItem value="gone" disabled>
            Gone
          </SelectItem>
        </Select>
      </Field>
    </form>
  ),
  play: async ({ canvasElement }) => {
    // The browser leaves a disabled <option> out of FormData, though `required` counts it.
    const form = canvasElement.querySelector('form')!;
    const data = new FormData(form);
    await expect(data.get('plan')).toBe('legacy');
    await expect(data.getAll('teams')).toEqual(['web', 'old']);
    await expect(form.checkValidity()).toBe(true);
    // A disabled item nobody chose stays disabled in the native <select> too.
    await expect(form.querySelector('option[value="gone"]')).toHaveProperty('disabled', true);
  },
};

export const InADialog: Story = {
  tags: ['no-visual'],
  render: () => (
    <Dialog>
      <DialogTrigger variant="secondary">Edit schedule</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Edit schedule</DialogTitle>
        <Field label="Frequency">
          <Select defaultValue="weekly">{frequency}</Select>
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
    await real.click(canvas.getByRole('button', { name: 'Edit schedule' }));
    const dialog = canvasElement.querySelector('dialog')!;
    await expect(dialog.open).toBe(true);
    const trigger = within(dialog).getByRole('combobox', { name: 'Frequency' });
    const listbox = listboxIn(dialog);
    const isOpen = () => listbox.matches(':popover-open');
    // Esc closes only the listbox, the topmost layer.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveFocus();
    await delay(50);
    await expect(dialog.open).toBe(true);
    // A press on the open trigger closes it, and focus stays on the trigger (WebKit moves it to the
    // dialog's panel on the press).
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveFocus();
    // A click on the frame, outside the panel, closes only the listbox.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    // Choosing an option closes the listbox and keeps the dialog.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(within(listbox).getByRole('option', { name: 'Monthly' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Monthly');
    await expect(trigger).toHaveFocus();
    await expect(dialog.open).toBe(true);
  },
};

const MANY = Array.from({ length: 60 }, (_, index) => `Option ${index + 1}`);

export const LongList: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Field label="Option">
        <Select defaultValue="Option 55">
          {MANY.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Option' });
    const listbox = listboxIn(canvasElement);
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const chosen = within(listbox).getByRole('option', { name: 'Option 55' });
    // At most 320px tall; it opens scrolled to the chosen option.
    await waitFor(() => {
      const box = listbox.getBoundingClientRect();
      const item = chosen.getBoundingClientRect();
      expect(box.height).toBeLessThanOrEqual(320);
      expect(item.top).toBeGreaterThanOrEqual(box.top - 1);
      expect(item.bottom).toBeLessThanOrEqual(box.bottom + 1);
    });
    // Moving the highlight keeps it in view.
    await userEvent.keyboard('{End}');
    const last = within(listbox).getByRole('option', { name: 'Option 60' });
    await waitFor(() => {
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        listbox.getBoundingClientRect().bottom + 1,
      );
    });
  },
};

export const InAField: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Field
        label="Frequency"
        description="How often we send the digest."
        error="Pick one."
        required
      >
        <Select placeholder="Choose…">{frequency}</Select>
      </Field>
      <Field label="Plan" disabled>
        <Select defaultValue="weekly">{frequency}</Select>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toHaveAccessibleDescription('How often we send the digest. Pick one.');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAttribute('aria-required', 'true');
    await expect(trigger.closest('.flg-select')).toHaveAttribute('data-invalid');
    // A click on the label is a click on the trigger: it opens the listbox.
    await userEvent.click(canvas.getByText('Frequency', { selector: 'label' }));
    const listbox = listboxIn(canvasElement);
    await expect(listbox.matches(':popover-open')).toBe(true);
    await userEvent.keyboard('{Escape}');
    // Disabled: it does not open.
    const plan = canvas.getByRole('combobox', { name: 'Plan' });
    await expect(plan).toBeDisabled();
  },
};
