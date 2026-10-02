import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders a horizontal <hr> separator by default', () => {
    render(<Divider />);
    const separator = screen.getByRole('separator');
    expect(separator.tagName).toBe('HR');
    expect(separator).toHaveClass('flg-divider');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('hides a decorative horizontal divider from assistive technology', () => {
    const { container } = render(<Divider decorative />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(container.querySelector('hr')).toHaveAttribute('role', 'none');
  });

  it('renders a vertical separator with its orientation', () => {
    render(<Divider orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator.tagName).toBe('DIV');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('hides a decorative vertical divider from assistive technology', () => {
    const { container } = render(<Divider orientation="vertical" decorative />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(container.querySelector('.flg-divider')).toHaveAttribute('aria-hidden', 'true');
  });

  it('joins a className and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Divider ref={ref} className="mine" />);
    expect(ref.current).toHaveClass('flg-divider', 'mine');
  });
});
