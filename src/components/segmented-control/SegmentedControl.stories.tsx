import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Card } from '../card/Card';
import { Field } from '../field/Field';
import { SegmentedControl } from './SegmentedControl';
import { SegmentedControlItem } from './SegmentedControlItem';

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  subcomponents: { SegmentedControlItem },
  args: {
    'aria-label': 'View',
    defaultValue: 'grid',
    onValueChange: fn(),
    children: (
      <>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
        <SegmentedControlItem value="table">Table</SegmentedControlItem>
      </>
    ),
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: 'grid', gap: 16, width: 420 } as const;
const caption = {
  fontSize: 'var(--flg-text-xs)',
  color: 'var(--flg-text-muted)',
  marginBottom: 6,
} as const;

/** The control of the mockup (G1): medium, small, and one with a disabled segment. */
export const Look: Story = {
  render: () => (
    <div style={column}>
      <Card style={{ gap: 12 }}>
        <div>
          <div style={caption}>Medium</div>
          <SegmentedControl aria-label="View" defaultValue="grid">
            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
            <SegmentedControlItem value="list">List</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        </div>
        <div>
          <div style={caption}>Small</div>
          <SegmentedControl aria-label="View, small" size="sm" defaultValue="grid">
            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
            <SegmentedControlItem value="list">List</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        </div>
        <div>
          <div style={caption}>One segment disabled</div>
          <SegmentedControl aria-label="View, one disabled" defaultValue="grid">
            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
            <SegmentedControlItem value="list">List</SegmentedControlItem>
            <SegmentedControlItem value="table" disabled>
              Table
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
        <div>
          <div style={caption}>Full width</div>
          <SegmentedControl aria-label="View, full width" defaultValue="list" fullWidth>
            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
            <SegmentedControlItem value="list">List</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const [medium, small] = canvas.getAllByRole('radiogroup');
    // The track is 34px (`--flg-control-h-md`) and 28px tall, as in the mockup.
    await expect(medium?.getBoundingClientRect().height).toBe(34);
    await expect(small?.getBoundingClientRect().height).toBe(28);
    // The native radio lies over its segment: a click anywhere on it lands on the real input.
    const list = canvas.getAllByRole('radio', { name: 'List' })[0] as HTMLElement;
    const box = list.getBoundingClientRect();
    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
      list,
    );
    // The selected segment is raised: it has the control background and a shadow.
    const selected = canvas.getAllByRole('radio', { name: 'Grid' })[0]
      ?.parentElement as HTMLElement;
    await expect(getComputedStyle(selected).boxShadow).not.toBe('none');
    await expect(getComputedStyle(list.parentElement as HTMLElement).boxShadow).toBe('none');
  },
};

function ControlledView() {
  const [view, setView] = useState('list');
  return (
    <Field label="View" description={`Showing: ${view}`}>
      <SegmentedControl value={view} onValueChange={setView}>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
        <SegmentedControlItem value="table">Table</SegmentedControlItem>
      </SegmentedControl>
    </Field>
  );
}

export const InAField: Story = {
  render: () => <ControlledView />,
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'View' });
    await expect(group).toHaveAccessibleDescription('Showing: list');
    await userEvent.click(canvas.getByRole('radio', { name: 'Table' }));
    await expect(group).toHaveAccessibleDescription('Showing: table');
  },
};

export const Invalid: Story = {
  render: () => (
    <Field label="View" error="Choose a view." required>
      <SegmentedControl>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
      </SegmentedControl>
    </Field>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'View' });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toBeRequired();
    // Owner decision 2B: a 1px inset edge of --flg-danger around the track.
    const edge = getComputedStyle(group).boxShadow;
    const probe = document.createElement('span');
    probe.style.color = 'var(--flg-danger)';
    group.append(probe);
    const danger = getComputedStyle(probe).color;
    probe.remove();
    await expect(edge).toContain('inset');
    await expect(edge).toContain('1px');
    await expect(edge).toContain(danger);
  },
};

function FormDemo() {
  const [sent, setSent] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(String(new FormData(event.currentTarget).get('view')));
  };
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
      <Field label="View" required>
        <SegmentedControl name="view">
          <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
          <SegmentedControlItem value="table" disabled>
            Table
          </SegmentedControlItem>
          <SegmentedControlItem value="list">List</SegmentedControlItem>
        </SegmentedControl>
      </Field>
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
      <output>{sent ? `Sent: ${sent}` : 'Nothing sent'}</output>
    </form>
  );
}

/** Real keys and a real submit, so Tab, the arrows and `required` are the browser's own. */
export const Keyboard: Story = {
  tags: ['no-visual'],
  render: () => <FormDemo />,
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    const grid = canvas.getByRole<HTMLInputElement>('radio', { name: 'Grid' });
    const list = canvas.getByRole('radio', { name: 'List' });
    const table = canvas.getByRole('radio', { name: 'Table' });
    const output = canvas.getByRole('status');
    // Nothing is selected, so `required` makes the segments invalid: the form would not submit.
    await expect(grid.validity.valueMissing).toBe(true);
    if (!real) return;
    // Tab enters the group, the arrows select, and they step over the disabled segment.
    await real.tab();
    await expect(grid).toHaveFocus();
    await expect(grid.matches(':focus-visible')).toBe(true);
    await real.keyboard('{ArrowRight}');
    await expect(list).toHaveFocus();
    await expect(list).toBeChecked();
    await expect(table).not.toBeChecked();
    await real.keyboard('{ArrowLeft}');
    await expect(grid).toBeChecked();
    await real.keyboard('{ArrowRight}');
    await expect(list).toBeChecked();
    await real.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(output).toHaveTextContent('Sent: list'));
    // Reset puts it back to nothing selected, and required again.
    await real.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(list).not.toBeChecked();
    await expect(grid.validity.valueMissing).toBe(true);
  },
};
