import { act, render, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDiscardable } from '../../tests/discarded-render';
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
      '[h2d-glass-ui] Dialog is changing from uncontrolled to controlled. Pick one for the ' +
        'lifetime of the component.',
    );
  });

  describe('when React throws a render away', () => {
    // The setter is called after the discarded render, so it works from the last commit.
    function setup(discardedProps: { value?: string; onChange: (value: string) => void }) {
      const committed = vi.fn();
      let set: (next: string) => void = () => {};
      function Probe({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
        [, set] = useControllableState<string>({
          value,
          defaultValue: 'a',
          onChange,
          name: 'Test',
        });
        return null;
      }
      const view = renderDiscardable((discarded) =>
        discarded ? <Probe {...discardedProps} /> : <Probe value="a" onChange={committed} />,
      );
      return { view, committed, set: (next: string) => act(() => set(next)) };
    }

    it('reports to the onChange of the last commit', () => {
      const thrownAway = vi.fn();
      const { view, committed, set } = setup({ value: 'a', onChange: thrownAway });
      view.discard();
      set('b');
      expect(committed).toHaveBeenCalledExactlyOnceWith('b');
      expect(thrownAway).not.toHaveBeenCalled();
    });

    it('compares a request with the value of the last commit', () => {
      const { view, committed, set } = setup({ value: 'b', onChange: vi.fn() });
      view.discard();
      // The discarded render said 'b'; on screen it is still 'a', so a request for 'b' is a change.
      set('b');
      expect(committed).toHaveBeenCalledExactlyOnceWith('b');
    });

    it('does not warn about a switch that no commit made', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { view } = setup({ value: undefined, onChange: vi.fn() });
      view.discard();
      expect(warn).not.toHaveBeenCalled();
    });
  });
});
