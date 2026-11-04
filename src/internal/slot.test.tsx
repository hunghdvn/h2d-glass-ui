import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Slot } from './slot';
import { WARN_PREFIX, resetDevWarnings } from './warn';

describe('Slot', () => {
  beforeEach(() => {
    resetDevWarnings();
    vi.restoreAllMocks();
  });

  it('renders the child element with both class names', () => {
    render(
      <Slot className="from-slot">
        <a href="/x" className="from-child">
          Link
        </a>
      </Slot>,
    );
    expect(screen.getByRole('link', { name: 'Link' })).toHaveClass('from-slot', 'from-child');
  });

  it('renders a child that a Server Component passed as a lazy reference', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // What React's Flight client hands over in development: the element, behind a lazy reference.
    const lazy = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: <a href="/x">Link</a>,
      _init: (payload: unknown) => payload,
    } as unknown as ReactElement;
    render(<Slot className="from-slot">{lazy}</Slot>);
    expect(screen.getByRole('link', { name: 'Link' })).toHaveClass('from-slot');
    expect(warn).not.toHaveBeenCalled();
  });

  it('lets child props win over slot props', () => {
    render(
      <Slot id="slot-id" title="slot">
        <span id="child-id">x</span>
      </Slot>,
    );
    const span = screen.getByText('x');
    expect(span).toHaveAttribute('id', 'child-id');
    expect(span).toHaveAttribute('title', 'slot');
  });

  it('merges styles with child values winning on conflicts', () => {
    render(
      <Slot style={{ color: 'red', padding: 4 }}>
        <span style={{ color: 'blue' }}>x</span>
      </Slot>,
    );
    const span = screen.getByText('x');
    expect(span.style.color).toBe('blue');
    expect(span.style.padding).toBe('4px');
  });

  it('calls the child handler first, then the slot handler', () => {
    const calls: string[] = [];
    render(
      <Slot onClick={() => calls.push('slot')}>
        <button type="button" onClick={() => calls.push('child')}>
          go
        </button>
      </Slot>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(calls).toEqual(['child', 'slot']);
  });

  it('skips the slot handler when the child handler prevents default', () => {
    const slotHandler = vi.fn();
    render(
      <Slot onClick={slotHandler}>
        <button type="button" onClick={(event) => event.preventDefault()}>
          go
        </button>
      </Slot>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(slotHandler).not.toHaveBeenCalled();
  });

  it('forwards its ref and keeps the child ref', () => {
    const slotRef = createRef<HTMLElement>();
    const childRef = createRef<HTMLAnchorElement>();
    render(
      <Slot ref={slotRef}>
        <a href="/x" ref={childRef}>
          Link
        </a>
      </Slot>,
    );
    expect(slotRef.current).toBe(screen.getByRole('link'));
    expect(childRef.current).toBe(screen.getByRole('link'));
  });

  it('keeps a forwarded callback ref attached across re-renders when the child has no ref', () => {
    const ref = vi.fn<(node: HTMLElement | null) => void>();
    const ui = (title: string) => (
      <Slot ref={ref} title={title}>
        <a href="/x">Link</a>
      </Slot>
    );
    const { rerender } = render(ui('First'));
    expect(ref).toHaveBeenCalledOnce();
    // A merged ref would be a new function each render: React would detach and attach it again.
    rerender(ui('Second'));
    expect(ref).toHaveBeenCalledOnce();
    expect(ref).toHaveBeenCalledWith(screen.getByRole('link'));
  });

  it('applies a slot-only handler, class name and style to a child that has none', () => {
    const slotHandler = vi.fn();
    render(
      <Slot onClick={slotHandler} className="from-slot" style={{ color: 'red' }}>
        <button type="button">go</button>
      </Slot>,
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(slotHandler).toHaveBeenCalledOnce();
    expect(button).toHaveClass('from-slot');
    expect(button.style.color).toBe('red');
  });

  it.each([
    ['text', 'just text'],
    ['two elements', [<span key="a">a</span>, <span key="b">b</span>]],
    ['null', null],
  ])('renders nothing and warns when the child is %s', (_label, children) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Slot>{children}</Slot>);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' `asChild` expects exactly one React element as its child.',
    );
  });

  it('renders nothing and warns when the child is a Fragment', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <Slot className="x">
        <>
          <span>a</span>
        </>
      </Slot>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' `asChild` cannot merge props into a Fragment; pass a single element.',
    );
  });
});
