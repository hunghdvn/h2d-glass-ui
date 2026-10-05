import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
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

  // React 18 logs "A callback ref should not return a function" if the merged ref returns a cleanup.
  it('sets and clears an asChild ref across re-renders without a console error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ref = vi.fn<(node: HTMLDivElement | null) => void>();
    // The child's own ref makes the slot merge the two.
    const childRef = createRef<HTMLElement>();
    const ui = (name: string) => (
      <Surface asChild ref={ref}>
        <section ref={childRef} aria-label={name}>
          x
        </section>
      </Surface>
    );
    const { rerender, unmount } = render(ui('First'));
    expect(ref).toHaveBeenLastCalledWith(screen.getByRole('region', { name: 'First' }));
    rerender(ui('Second'));
    expect(ref).toHaveBeenLastCalledWith(screen.getByRole('region', { name: 'Second' }));
    unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
