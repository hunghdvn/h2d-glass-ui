import { act, render, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useControllableState } from './use-controllable-state';
import { resetDevWarnings } from './warn';

describe('useControllableState', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('keeps its own value when uncontrolled and reports every change', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: false, onChange, name: 'Test' }),
    );
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('follows the parent when controlled and only asks for a change', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, defaultValue: false, onChange, name: 'Test' }),
      { initialProps: { value: false as boolean | undefined } },
    );
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(result.current[0]).toBe(false);
    rerender({ value: true });
    expect(result.current[0]).toBe(true);
  });

  it('resets an uncontrolled value without reporting it, and leaves a controlled one alone', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, defaultValue: 'a', onChange, name: 'Test' }),
      { initialProps: { value: undefined as string | undefined } },
    );
    act(() => result.current[1]('b'));
    onChange.mockClear();
    act(() => result.current[2]('a'));
    expect(result.current[0]).toBe('a');
    expect(onChange).not.toHaveBeenCalled();
    const controlled = renderHook(() =>
      useControllableState({ value: 'x', defaultValue: 'a', onChange, name: 'Other' }),
    );
    act(() => controlled.result.current[2]('a'));
    expect(controlled.result.current[0]).toBe('x');
    expect(onChange).not.toHaveBeenCalled();
    rerender({ value: undefined });
  });

  it('reports every request a controlled parent rejects', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: false, defaultValue: false, onChange, name: 'Test' }),
    );
    act(() => result.current[1](true));
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(result.current[0]).toBe(false);
  });

  it('does not report a value that did not change, even when set twice before a render', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: 'a', onChange, name: 'Test' }),
    );
    act(() => {
      result.current[1]('a');
      result.current[1]('b');
      result.current[1]('b');
    });
    expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('keeps the same setter across renders', () => {
    const { result, rerender } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: 0, name: 'Test' }),
    );
    const first = result.current[1];
    act(() => first(1));
    rerender();
    expect(result.current[1]).toBe(first);
  });

  it('warns once when a component switches between controlled and uncontrolled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function Probe({ value }: { value: boolean | undefined }) {
      useControllableState({ value, defaultValue: false, name: 'Dialog' });
      return null;
    }
    function Parent() {
      const [value, setValue] = useState<boolean | undefined>(undefined);
      return (
        <>
          <Probe value={value} />
          <button type="button" onClick={() => setValue(true)}>
            control
          </button>
        </>
      );
    }
    const { getByRole } = render(<Parent />);
    act(() => getByRole('button').click());
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] Dialog is changing from uncontrolled to controlled. Pick one for the ' +
        'lifetime of the component.',
    );
  });
});
