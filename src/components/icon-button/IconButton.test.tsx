import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { IconButton } from './IconButton';
import type { IconButtonProps } from './IconButton';

const icon = <svg aria-hidden="true" />;
const WARNING =
  '[fl-glass-ui] IconButton needs an accessible name: pass `aria-label` or `aria-labelledby`.';

describe('IconButton', () => {
  beforeEach(() => {
    resetDevWarnings();
    vi.restoreAllMocks();
  });

  it('renders a square button named by aria-label', () => {
    render(<IconButton aria-label="Close">{icon}</IconButton>);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveClass('flg-button');
    expect(button).toHaveAttribute('data-icon-only', '');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('accepts aria-labelledby as its name', () => {
    render(
      <>
        <span id="close-label">Close dialog</span>
        <IconButton aria-labelledby="close-label">{icon}</IconButton>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('warns when it has no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<IconButton {...({} as IconButtonProps)}>{icon}</IconButton>);
    expect(warn).toHaveBeenCalledWith(WARNING);
  });

  it('does not warn when named', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<IconButton aria-label="Close">{icon}</IconButton>);
    expect(warn).not.toHaveBeenCalled();
  });

  it('passes variant, size and loading through to Button', () => {
    render(
      <IconButton aria-label="Add" variant="ghost" size="sm" loading>
        {icon}
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('forwards the ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton ref={ref} aria-label="Close">
        {icon}
      </IconButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
