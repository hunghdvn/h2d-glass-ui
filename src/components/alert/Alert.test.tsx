import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Alert, AlertActions, AlertDescription, AlertTitle } from './Alert';

const STATUSES = ['info', 'success', 'warning', 'error'] as const;
const NAMES = { info: 'Info', success: 'Success', warning: 'Warning', error: 'Error' };

describe('Alert', () => {
  it('renders a stripe info alert with no role of its own', () => {
    const { container } = render(<Alert>Saved</Alert>);
    const alert = container.firstElementChild!;
    expect(alert.tagName).toBe('DIV');
    expect(alert).toHaveClass('flg-alert');
    expect(alert).toHaveAttribute('data-variant', 'stripe');
    expect(alert).toHaveAttribute('data-status', 'info');
    // A static message in the page is not a live region (spec §3.4); the caller adds a role.
    expect(alert).not.toHaveAttribute('role');
    expect(alert.querySelector('.flg-alert-body')).toHaveTextContent('Saved');
  });

  it.each(['stripe', 'tinted', 'plain'] as const)('reflects variant %s', (variant) => {
    const { container } = render(<Alert variant={variant}>x</Alert>);
    expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
  });

  it.each(STATUSES)('names the %s icon so the status is not told by colour alone', (status) => {
    const { container } = render(<Alert status={status}>x</Alert>);
    expect(container.firstElementChild).toHaveAttribute('data-status', status);
    const icon = screen.getByRole('img', { name: NAMES[status] });
    expect(icon.tagName.toLowerCase()).toBe('svg');
    expect(icon.closest('.flg-alert-icon')).not.toHaveAttribute('aria-hidden');
    // The icon names the status, so no hidden text repeats it.
    expect(container.querySelector('.flg-visually-hidden')).toBeNull();
  });

  it('says the status in the words of `labels`', () => {
    render(
      <Alert status="warning" labels={{ warning: 'Cảnh báo' }}>
        x
      </Alert>,
    );
    expect(screen.getByRole('img', { name: 'Cảnh báo' })).toBeInTheDocument();
  });

  it('passes a role through, for a live region', () => {
    render(
      <Alert role="alert" status="error">
        Payment failed
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
  });

  it('takes an icon of the caller and keeps the status in hidden text', () => {
    const { container } = render(
      <Alert status="warning" icon={<svg data-testid="mine" />}>
        <AlertTitle>Low disk</AlertTitle>
      </Alert>,
    );
    const wrapper = container.querySelector('.flg-alert-icon')!;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper).toContainElement(screen.getByTestId('mine'));
    expect(screen.queryByRole('img')).toBeNull();
    const hidden = container.querySelector('.flg-alert-body > .flg-visually-hidden');
    expect(hidden).toHaveTextContent('Warning:');
    // It comes before the title, so it reads as "Warning: Low disk".
    expect(hidden!.nextElementSibling).toHaveClass('flg-alert-title');
  });

  it('drops the icon with `icon={false}` and still says the status', () => {
    const { container } = render(
      <Alert status="error" icon={false} labels={{ error: 'Lỗi' }}>
        <AlertTitle>Failed</AlertTitle>
      </Alert>,
    );
    expect(container.querySelector('.flg-alert-icon')).toBeNull();
    expect(container.querySelector('.flg-visually-hidden')).toHaveTextContent('Lỗi:');
  });

  it('shows the dismiss button only with onDismiss, and reports the click', async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Alert>x</Alert>);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Alert onDismiss={onDismiss}>x</Alert>);
    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button).toHaveClass('flg-button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button.closest('.flg-alert-dismiss')).not.toBeNull();
    await userEvent.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss.mock.calls[0]![0]).toHaveProperty('type', 'click');
  });

  it('names the dismiss button from `labels`', () => {
    render(
      <Alert onDismiss={() => {}} labels={{ dismiss: 'Đóng' }}>
        x
      </Alert>,
    );
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
  });

  it('joins a className and forwards the ref, style and other props', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Alert ref={ref} className="mine" style={{ margin: 3 }} data-testid="a">
        x
      </Alert>,
    );
    expect(ref.current).toBe(screen.getByTestId('a'));
    expect(ref.current).toHaveClass('flg-alert', 'mine');
    expect(ref.current).toHaveStyle({ margin: '3px' });
  });
});

describe('AlertTitle, AlertDescription and AlertActions', () => {
  it('render the parts of the body, each with its ref', () => {
    const title = createRef<HTMLDivElement>();
    const description = createRef<HTMLDivElement>();
    const actions = createRef<HTMLDivElement>();
    const { container } = render(
      <Alert>
        <AlertTitle ref={title} className="t">
          Card expires
        </AlertTitle>
        <AlertDescription ref={description}>Update it soon.</AlertDescription>
        <AlertActions ref={actions}>
          <button type="button">Update</button>
        </AlertActions>
      </Alert>,
    );
    const body = container.querySelector('.flg-alert-body')!;
    expect(Array.from(body.children).map((child) => child.className)).toEqual([
      'flg-alert-title t',
      'flg-alert-description',
      'flg-alert-actions',
    ]);
    expect(title.current!.tagName).toBe('DIV');
    expect(description.current).toHaveTextContent('Update it soon.');
    expect(actions.current).toContainElement(screen.getByRole('button', { name: 'Update' }));
  });

  it('turns the title into the child element with asChild', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Alert>
        <AlertTitle asChild ref={ref} className="t">
          <h2>Heading</h2>
        </AlertTitle>
      </Alert>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Heading' });
    expect(heading).toHaveClass('flg-alert-title', 't');
    expect(ref.current).toBe(heading);
  });
});
