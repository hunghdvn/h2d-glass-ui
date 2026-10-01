import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Surface } from './Surface';

describe('Surface', () => {
  it('renders a div with the glass class and its children', () => {
    render(<Surface>Content</Surface>);
    const surface = screen.getByText('Content');
    expect(surface.tagName).toBe('DIV');
    expect(surface).toHaveClass('flg-surface');
  });

  it('joins a custom className and passes other attributes through', () => {
    render(
      <Surface className="mine" id="panel" aria-label="Panel">
        x
      </Surface>,
    );
    const surface = screen.getByLabelText('Panel');
    expect(surface).toHaveClass('flg-surface', 'mine');
    expect(surface).toHaveAttribute('id', 'panel');
  });

  it('forwards the ref to the div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Surface ref={ref}>x</Surface>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders the child element instead of a div with asChild', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Surface asChild ref={ref} className="outer">
        <section aria-label="Profile" className="inner">
          x
        </section>
      </Surface>,
    );
    const section = screen.getByRole('region', { name: 'Profile' });
    expect(section).toHaveClass('flg-surface', 'outer', 'inner');
    expect(ref.current).toBe(section);
  });
});
