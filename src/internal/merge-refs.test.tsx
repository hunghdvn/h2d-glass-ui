import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mergeRefs } from './merge-refs';

describe('mergeRefs', () => {
  it('assigns the node to object refs and callback refs', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    render(<div ref={mergeRefs(objectRef, callbackRef)} />);
    expect(objectRef.current).toBeInstanceOf(HTMLDivElement);
    expect(callbackRef).toHaveBeenCalledWith(objectRef.current);
  });

  it('clears object refs and calls callback refs with null on unmount', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    const { unmount } = render(<div ref={mergeRefs(objectRef, callbackRef)} />);
    unmount();
    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it('runs a cleanup returned by a callback ref instead of calling it with null', () => {
    const cleanup = vi.fn();
    const callbackRef = vi.fn(() => cleanup);
    const dispose = mergeRefs<HTMLDivElement>(callbackRef)(document.createElement('div'));
    expect(typeof dispose).toBe('function');
    (dispose as () => void)();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(callbackRef).toHaveBeenCalledTimes(1);
  });

  it('ignores null and undefined refs', () => {
    expect(() =>
      mergeRefs<HTMLDivElement>(null, undefined)(document.createElement('div')),
    ).not.toThrow();
  });
});
