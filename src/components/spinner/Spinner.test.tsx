import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders a status region that says "Loading" by default', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading');
    expect(status).toHaveClass('flg-spinner');
    expect(status).toHaveAttribute('data-size', 'md');
    expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces a custom label', () => {
    render(<Spinner label="Saving changes" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes');
  });

  it.each(['sm', 'md', 'lg'] as const)('reflects size %s', (size) => {
    render(<Spinner size={size} />);
    expect(screen.getByRole('status')).toHaveAttribute('data-size', size);
  });

  it('joins a className and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} className="mine" />);
    expect(ref.current).toHaveClass('flg-spinner', 'mine');
  });
});
