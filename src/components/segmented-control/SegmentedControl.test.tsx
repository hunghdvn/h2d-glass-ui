import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { SegmentedControl } from './SegmentedControl';
import type { SegmentedControlProps } from './SegmentedControl';
import { SegmentedControlItem } from './SegmentedControlItem';

function Views(props: SegmentedControlProps) {
  return (
    <SegmentedControl aria-label="View" {...props}>
      <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
      <SegmentedControlItem value="list">List</SegmentedControlItem>
      <SegmentedControlItem value="table">Table</SegmentedControlItem>
    </SegmentedControl>
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('SegmentedControl', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders a radiogroup of native radios, each inside a label, that share a generated name', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <SegmentedControl ref={ref} aria-label="View" className="mine">
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
      </SegmentedControl>,
    );
    const group = screen.getByRole('radiogroup', { name: 'View' });
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('flg-segmented', 'mine');
    expect(group).toHaveAttribute('data-size', 'md');
    expect(group).not.toHaveAttribute('data-full-width');
    const inputs = screen.getAllByRole('radio');
    expect(new Set(inputs.map((input) => input.getAttribute('name'))).size).toBe(1);
    expect(inputs[0]?.getAttribute('name')).toBeTruthy();
    const label = container.querySelector('label.flg-segmented-item');
    expect(label?.querySelector(':scope > input.flg-segmented-input')).toBe(inputs[0]);
    expect(label?.querySelector(':scope > .flg-segmented-label')).toHaveTextContent('Grid');
  });

  it('uses the name, size and fullWidth passed in', () => {
    render(<Views name="view" size="sm" fullWidth />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-size', 'sm');
    expect(group).toHaveAttribute('data-full-width');
    expect(radio('Grid')).toHaveAttribute('name', 'view');
  });

  it('starts at defaultValue and reports the value the user picks', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Views defaultValue="list" onValueChange={onValueChange} />);
    expect(radio('List')).toBeChecked();
    await user.click(radio('Table'));
    expect(onValueChange).toHaveBeenCalledWith('table');
    expect(radio('Table')).toBeChecked();
  });

  it('follows value when controlled, and selects nothing for null', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Views value="list" onValueChange={onValueChange} />);
    await user.click(radio('Grid'));
    expect(onValueChange).toHaveBeenCalledWith('grid');
    expect(radio('List')).toBeChecked();
    rerender(<Views value="grid" onValueChange={onValueChange} />);
    expect(radio('Grid')).toBeChecked();
    rerender(<Views value={null} onValueChange={onValueChange} />);
    expect(screen.getAllByRole('radio').some((input) => (input as HTMLInputElement).checked)).toBe(
      false,
    );
  });

  it('moves the selection with the arrow keys and skips a disabled item', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl aria-label="View" defaultValue="grid" onValueChange={onValueChange}>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="list" disabled>
          List
        </SegmentedControlItem>
        <SegmentedControlItem value="table">Table</SegmentedControlItem>
      </SegmentedControl>,
    );
    await user.tab();
    expect(radio('Grid')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(radio('Table')).toHaveFocus();
    expect(radio('Table')).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith('table');
  });

  it('puts required and disabled on every radio, and an item can override disabled', () => {
    render(
      <SegmentedControl aria-label="View" required disabled>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="list" disabled={false}>
          List
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    expect(radio('Grid')).toBeRequired();
    expect(radio('Grid')).toBeDisabled();
    expect(radio('List')).toBeEnabled();
  });

  it('marks the group invalid', () => {
    render(<Views invalid />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('data-invalid');
  });

  it('calls an item onChange before onValueChange', async () => {
    const calls: string[] = [];
    const user = userEvent.setup();
    render(
      <SegmentedControl aria-label="View" onValueChange={(value) => calls.push(`value:${value}`)}>
        <SegmentedControlItem value="grid" onChange={() => calls.push('change')}>
          Grid
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    await user.click(radio('Grid'));
    expect(calls).toEqual(['change', 'value:grid']);
  });

  it('does not detach a callback ref on a re-render', () => {
    const ref = vi.fn();
    const Group = ({ size }: { size: 'sm' | 'md' }) => (
      <SegmentedControl ref={ref} aria-label="View" size={size}>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
      </SegmentedControl>
    );
    const { rerender } = render(<Group size="md" />);
    expect(ref).toHaveBeenCalledTimes(1);
    rerender(<Group size="sm" />);
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref).not.toHaveBeenCalledWith(null);
  });

  it('forwards an item ref, and puts className and style on its label', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <SegmentedControl aria-label="View">
        <SegmentedControlItem ref={ref} value="grid" className="mine" style={{ marginTop: 4 }}>
          Grid
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(ref.current).toBe(radio('Grid'));
    const label = container.querySelector('label.flg-segmented-item') as HTMLLabelElement;
    expect(label).toHaveClass('mine');
    expect(label).toHaveStyle({ marginTop: '4px' });
  });

  it('submits the selected value with the form, and the browser resets it with the form', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Views name="view" defaultValue="grid" />
        <button type="reset">Reset</button>
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('view')).toBe('grid');
    await user.click(radio('Table'));
    expect(new FormData(form).get('view')).toBe('table');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(new FormData(form).get('view')).toBe('grid');
    expect(radio('Grid')).toBeChecked();
  });

  it('puts a controlled group back in step with its value after a form reset', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('grid');
      return <Views name="view" value={value} onValueChange={setValue} />;
    }
    const { container } = render(
      <form>
        <Controlled />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    await user.click(radio('Table'));
    expect(radio('Table')).toBeChecked();
    act(() => form.reset());
    await waitFor(() => expect(radio('Table')).toBeChecked());
    expect(radio('Grid')).not.toBeChecked();
    expect(new FormData(form).get('view')).toBe('table');
  });

  it('puts an uncontrolled group back to its default after a form reset', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Views name="view" defaultValue="grid" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    await user.click(radio('Table'));
    act(() => form.reset());
    await waitFor(() => expect(radio('Grid')).toBeChecked());
    expect(new FormData(form).get('view')).toBe('grid');
  });

  it('raises the segment that has the keyboard focus above its neighbours', () => {
    const css = readFileSync('src/styles/components/segmented-control.css', 'utf8');
    expect(css).toMatch(/\.flg-segmented-item:has\(> input:focus-visible\) \{[^}]*z-index: 1;/);
  });

  it('does not submit anything from a disabled group', () => {
    const { container } = render(
      <form>
        <Views name="view" defaultValue="grid" disabled />
      </form>,
    );
    expect(new FormData(container.querySelector('form') as HTMLFormElement).has('view')).toBe(
      false,
    );
  });

  it('is named by a Field label and described by the Field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <Field label="View" description="How the list looks." error="Pick a view." required>
        <SegmentedControl>
          <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        </SegmentedControl>
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'View' });
    expect(container.querySelector('label.flg-field-label')).toBeNull();
    expect(group).toHaveAccessibleDescription('How the list looks. Pick a view.');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(radio('Grid')).toBeRequired();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns about a group without a name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <SegmentedControl>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[h2d-glass-ui] <SegmentedControl> needs a name: pass aria-label or aria-labelledby.',
    );
  });

  it('warns about an item outside a SegmentedControl', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SegmentedControlItem value="grid">Grid</SegmentedControlItem>);
    expect(warn).toHaveBeenCalledWith(
      '[h2d-glass-ui] SegmentedControlItem must be inside a SegmentedControl, which gives it its name.',
    );
  });

  it('warns about two items with the same value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <SegmentedControl aria-label="View">
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="grid">Grid again</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[h2d-glass-ui] Two SegmentedControlItem parts have the value "grid", so the user cannot tell them apart.',
    );
  });

  it('does not warn when a control with distinct values re-renders', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function Counter() {
      const [n, setN] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setN(n + 1)}>
            More {n}
          </button>
          <Views />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByRole('button', { name: 'More 0' }));
    expect(warn).not.toHaveBeenCalled();
  });
});
