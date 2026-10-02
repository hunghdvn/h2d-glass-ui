import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../field/Field';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a native checkbox inside a label, with className and style on the label', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Checkbox ref={ref} className="mine" style={{ marginTop: 4 }} name="news">
        Email me updates
      </Checkbox>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Email me updates' });
    const label = container.querySelector('label') as HTMLLabelElement;
    expect(ref.current).toBe(checkbox);
    expect(checkbox).toHaveClass('flg-checkbox-input');
    expect(checkbox).toHaveAttribute('name', 'news');
    expect(label).toHaveClass('flg-checkbox', 'mine');
    expect(label).toHaveStyle({ marginTop: '4px' });
    expect(container.querySelector('.flg-checkbox-box')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.flg-checkbox-label')).toHaveTextContent('Email me updates');
  });

  it('calls onChange first, then onCheckedChange with the new state', async () => {
    const calls: string[] = [];
    const user = userEvent.setup();
    render(
      <Checkbox
        onChange={(event) => calls.push(`change:${event.target.checked}`)}
        onCheckedChange={(checked) => calls.push(`checked:${checked}`)}
      >
        Email me
      </Checkbox>,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Email me' }));
    expect(calls).toEqual(['change:true', 'checked:true']);
  });

  it('toggles with Space', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox onCheckedChange={onCheckedChange}>Email me</Checkbox>);
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Email me' })).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('shows indeterminate, and keeps showing it while the prop says so', async () => {
    function SelectAll() {
      const [, setClicks] = useState(0);
      return (
        <Checkbox indeterminate onCheckedChange={() => setClicks((count) => count + 1)}>
          All
        </Checkbox>
      );
    }
    const user = userEvent.setup();
    render(<SelectAll />);
    const checkbox = screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement;
    expect(checkbox).toBePartiallyChecked();
    await user.click(checkbox);
    expect(checkbox.indeterminate).toBe(true);
  });

  it('clears indeterminate when the prop does', () => {
    const { rerender } = render(<Checkbox indeterminate>All</Checkbox>);
    const checkbox = screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement;
    rerender(<Checkbox indeterminate={false}>All</Checkbox>);
    expect(checkbox.indeterminate).toBe(false);
  });

  it('is invalid and described inside a Field with an error', () => {
    const { container } = render(
      <Field error="Accept the terms to continue.">
        <Checkbox required>I accept the terms</Checkbox>
      </Field>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'I accept the terms' });
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAccessibleDescription('Accept the terms to continue.');
    expect(checkbox).toBeRequired();
    expect(container.querySelector('.flg-checkbox')).toHaveAttribute('data-invalid');
  });

  it('renders no label text span without children', () => {
    const { container } = render(<Checkbox aria-label="Select row" />);
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
    expect(container.querySelector('.flg-checkbox-label')).toBeNull();
  });

  it('keeps showing indeterminate after a click that does not re-render it', async () => {
    const user = userEvent.setup();
    render(
      <Checkbox checked={false} indeterminate onCheckedChange={() => {}}>
        All
      </Checkbox>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement;
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(checkbox.indeterminate).toBe(true);
  });

  it('does not report a change that onChange prevented', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Checkbox onChange={(event) => event.preventDefault()} onCheckedChange={onCheckedChange}>
        Email me
      </Checkbox>,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Email me' }));
    expect(screen.getByRole('checkbox', { name: 'Email me' })).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('marks indeterminate in the server HTML, before any effect runs', () => {
    const html = renderToString(<Checkbox indeterminate>All</Checkbox>);
    expect(html).toContain('data-indeterminate=""');
  });

  it('marks itself invalid when asked to', () => {
    const { container } = render(<Checkbox invalid>Terms</Checkbox>);
    expect(screen.getByRole('checkbox', { name: 'Terms' })).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.flg-checkbox')).toHaveAttribute('data-invalid');
  });
});
