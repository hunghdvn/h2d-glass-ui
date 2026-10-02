import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../field/Field';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders a native checkbox with role switch inside a label', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Switch ref={ref} className="mine" name="push" defaultChecked>
        Push notifications
      </Switch>,
    );
    const toggle = screen.getByRole('switch', { name: 'Push notifications' });
    expect(ref.current).toBe(toggle);
    expect(toggle).toHaveAttribute('type', 'checkbox');
    expect(toggle).toBeChecked();
    expect(container.querySelector('label')).toHaveClass('flg-switch', 'mine');
    expect(container.querySelector('.flg-switch-track')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onChange first, then onCheckedChange, and toggles with Space', async () => {
    const calls: string[] = [];
    const user = userEvent.setup();
    render(
      <Switch
        onChange={(event) => calls.push(`change:${event.target.checked}`)}
        onCheckedChange={(checked) => calls.push(`checked:${checked}`)}
      >
        Push
      </Switch>,
    );
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('switch', { name: 'Push' })).toBeChecked();
    expect(calls).toEqual(['change:true', 'checked:true']);
  });

  it('takes its description and disabled state from a Field', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Field description="Sent to this device only." disabled>
        <Switch onCheckedChange={onCheckedChange}>Push</Switch>
      </Field>,
    );
    const toggle = screen.getByRole('switch', { name: 'Push' });
    expect(toggle).toHaveAccessibleDescription('Sent to this device only.');
    expect(toggle).toBeDisabled();
    await userEvent.setup().click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
