import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders a neutral badge by default', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('flg-badge');
    expect(badge).toHaveAttribute('data-variant', 'neutral');
  });

  it.each(['neutral', 'accent', 'success', 'warning', 'danger'] as const)(
    'reflects variant %s',
    (variant) => {
      render(<Badge variant={variant}>x</Badge>);
      expect(screen.getByText('x')).toHaveAttribute('data-variant', variant);
    },
  );

  it('joins a className and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Badge ref={ref} className="mine">
        x
      </Badge>,
    );
    expect(ref.current).toHaveClass('flg-badge', 'mine');
  });
});
