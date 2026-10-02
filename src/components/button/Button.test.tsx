import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

function MountProbe({ onMount }: { onMount: () => void }) {
  useEffect(onMount, []); // eslint-disable-line react-hooks/exhaustive-deps -- counts mounts only
  return <b>label</b>;
}

describe('Button', () => {
  it('renders a primary, medium button that does not submit forms', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('flg-button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).not.toHaveAttribute('data-loading');
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('does not submit the surrounding form unless type="submit"', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Plain</Button>
        <Button type="submit">Send</Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Plain' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'reflects variant %s',
    (variant) => {
      render(<Button variant={variant}>x</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
    },
  );

  it.each(['sm', 'md', 'lg'] as const)('reflects size %s', (size) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
  });

  it('uses the native disabled attribute', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Off' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps a loading button focusable but ignores clicks, Enter and form submission', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading onClick={onClick}>
          Saving
        </Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-loading', '');
    expect(button).not.toBeDisabled();
    expect(button.querySelector('.flg-spinner svg')).toHaveAttribute('aria-hidden', 'true');

    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
  });

  it('renders its child with button styling through asChild', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveClass('flg-button');
    expect(link).toHaveAttribute('data-variant', 'secondary');
    expect(link).not.toHaveAttribute('type');
  });

  it('blocks a disabled asChild link completely', () => {
    const onClick = vi.fn();
    const onLinkClick = vi.fn();
    render(
      <Button asChild disabled onClick={onClick}>
        <a href="/docs" onClick={onLinkClick}>
          Docs
        </a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    // fireEvent returns false when the default action (navigation) was prevented.
    expect(fireEvent.click(link)).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it('shows the spinner inside an asChild element while loading', () => {
    render(
      <Button asChild loading>
        <a href="/save">Save</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Save' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(link.querySelector('.flg-spinner')).not.toBeNull();
  });

  it('keeps its children mounted when loading toggles', () => {
    const onMount = vi.fn();
    const { rerender } = render(
      <Button>
        <MountProbe onMount={onMount} />
      </Button>,
    );
    for (const loading of [true, false]) {
      rerender(
        <Button loading={loading}>
          <MountProbe onMount={onMount} />
        </Button>,
      );
    }
    expect(onMount).toHaveBeenCalledOnce();
  });

  it('keeps an asChild element and its children mounted when loading toggles', () => {
    const onMount = vi.fn();
    const { rerender } = render(
      <Button asChild>
        <a href="/x">
          <MountProbe onMount={onMount} />
        </a>
      </Button>,
    );
    const link = screen.getByRole('link');
    for (const loading of [true, false]) {
      rerender(
        <Button asChild loading={loading}>
          <a href="/x">
            <MountProbe onMount={onMount} />
          </a>
        </Button>,
      );
    }
    expect(screen.getByRole('link')).toBe(link);
    expect(onMount).toHaveBeenCalledOnce();
  });

  it('activates with Space as well as Enter', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await user.tab();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not run its own onClickCapture while loading, since the click is blocked', () => {
    const onClickCapture = vi.fn();
    const { rerender } = render(<Button onClickCapture={onClickCapture}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClickCapture).toHaveBeenCalledOnce();
    rerender(
      <Button onClickCapture={onClickCapture} loading>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClickCapture).toHaveBeenCalledOnce();
  });

  it('renders a void element through asChild, without a spinner slot', () => {
    const { rerender } = render(
      <Button asChild>
        <input type="submit" value="Send" />
      </Button>,
    );
    const input = screen.getByRole('button', { name: 'Send' });
    expect(input).toHaveClass('flg-button');
    rerender(
      <Button asChild loading>
        <input type="submit" value="Send" />
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Send' })).toBe(input);
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(input.childNodes).toHaveLength(0);
  });

  it('blocks a middle-click on a disabled asChild link', () => {
    render(
      <Button asChild disabled>
        <a href="/docs">Docs</a>
      </Button>,
    );
    const event = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 });
    expect(fireEvent(screen.getByRole('link', { name: 'Docs' }), event)).toBe(false);
  });

  it('forwards the ref to the element it renders', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const linkRef = createRef<HTMLButtonElement>();
    render(
      <>
        <Button ref={buttonRef}>x</Button>
        <Button asChild ref={linkRef}>
          <a href="/x">y</a>
        </Button>
      </>,
    );
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(linkRef.current?.tagName).toBe('A');
  });
});
