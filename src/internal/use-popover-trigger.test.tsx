import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePopoverState, useTriggerPress } from './use-popover-trigger';

// jsdom has no Popover API: a stand-in element answers `:popover-open` from a flag.
function fakePopover(showing: boolean) {
  const el = document.createElement('div');
  el.matches = ((selector: string) => selector === ':popover-open' && showing) as typeof el.matches;
  return el;
}

describe('usePopoverState', () => {
  it('keeps request stable while the open state changes', () => {
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: false,
        onOpenChange: undefined,
        name: 'Test',
      }),
    );
    const first = result.current.request;
    act(() => first(true));
    expect(result.current.open).toBe(true);
    expect(result.current.request).toBe(first);
  });

  it('notes a close the browser already made, so its late toggle is not reported again', () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: true,
        onOpenChange,
        name: 'Test',
      }),
    );
    // Light dismiss already hid the panel when the trigger's click asks to close it.
    result.current.contentRef.current = fakePopover(false);
    act(() => result.current.request(false));
    expect(result.current.pendingToggle.current).toBe(false);
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('reports nothing and notes nothing for a request for the state it already has', () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: false,
        onOpenChange,
        name: 'Test',
      }),
    );
    result.current.contentRef.current = fakePopover(false);
    act(() => result.current.request(false));
    expect(result.current.open).toBe(false);
    expect(result.current.pendingToggle.current).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('notes nothing for a request for the state of the last commit, even when the panel shows it', () => {
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: true,
        onOpenChange: undefined,
        name: 'Test',
      }),
    );
    // Open, and the browser agrees: a request to open has nothing to note.
    result.current.contentRef.current = fakePopover(true);
    act(() => result.current.request(true));
    expect(result.current.pendingToggle.current).toBeNull();
  });

  it('compares a request with the state after the commit that changed it', () => {
    const { result, rerender } = renderHook(
      ({ open }) =>
        usePopoverState<HTMLDivElement>({
          open,
          defaultOpen: false,
          onOpenChange: undefined,
          name: 'Test',
        }),
      { initialProps: { open: false } },
    );
    result.current.contentRef.current = fakePopover(true);
    rerender({ open: true });
    // It is open now, and showing: asking to open is no change the browser made ahead of us. Had
    // the note kept the state of the first render, this request would look like a new opening.
    act(() => result.current.request(true));
    expect(result.current.pendingToggle.current).toBeNull();
  });

  it('notes nothing for a change the browser has not made yet', () => {
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: true,
        onOpenChange: undefined,
        name: 'Test',
      }),
    );
    result.current.contentRef.current = fakePopover(true);
    act(() => result.current.request(false));
    expect(result.current.pendingToggle.current).toBeNull();
  });
});

describe('useTriggerPress', () => {
  it('goes by the state at the press: a press on the open trigger closes it', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
      initialProps: { open: true },
    });
    result.current.onPointerDown();
    // Light dismiss closed it between the press and the click.
    rerender({ open: false });
    result.current.onClick({ detail: 1 });
    expect(toggle).toHaveBeenCalledWith(true, true);
  });

  it('goes by the state now for a click from the keyboard or from code', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
      initialProps: { open: true },
    });
    // A press that never became a click (dragged off) leaves a note from when it was open.
    result.current.onPointerDown();
    rerender({ open: false });
    result.current.onClick({ detail: 0 });
    expect(toggle).toHaveBeenCalledWith(false, false);
  });

  it('goes by the state now for a code click, also when it was closed at an earlier press', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
      initialProps: { open: false },
    });
    // A press that never became a click leaves a note from when it was closed; it opened since.
    result.current.onPointerDown();
    rerender({ open: true });
    result.current.onClick({ detail: 0 });
    expect(toggle).toHaveBeenCalledWith(true, false);
    // The note is spent: a click without a detail at all goes by the state as well.
    toggle.mockClear();
    result.current.onClick(undefined);
    expect(toggle).toHaveBeenCalledWith(true, false);
  });

  it('forgets a press that was cancelled', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
      initialProps: { open: true },
    });
    result.current.onPointerDown();
    result.current.onPointerCancel();
    rerender({ open: false });
    result.current.onClick({ detail: 1 });
    expect(toggle).toHaveBeenCalledWith(false, true);
  });
});
