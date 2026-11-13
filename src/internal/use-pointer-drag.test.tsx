import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePointerDrag } from './use-pointer-drag';
import type { PointerDragOptions } from './use-pointer-drag';

function Handle(props: PointerDragOptions) {
  const { onPointerDown } = usePointerDrag(props);
  return <div data-testid="handle" onPointerDown={onPointerDown} />;
}

const base = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };

function setup(options: PointerDragOptions = {}) {
  const calls = {
    onPress: vi.fn(),
    onStart: vi.fn(),
    onMove: vi.fn(),
    onEnd: vi.fn(),
    onCancel: vi.fn(),
  };
  const view = render(<Handle {...calls} {...options} />);
  const handle = view.getByTestId('handle');
  return { ...view, handle, calls };
}

const press = (el: Element, x = 100, y = 100, init: PointerEventInit = {}) =>
  fireEvent.pointerDown(el, { ...base, clientX: x, clientY: y, ...init });
const move = (el: Element | Document, x: number, y: number, init: PointerEventInit = {}) =>
  fireEvent.pointerMove(el, { ...base, clientX: x, clientY: y, ...init });
const release = (el: Element | Document, x: number, y: number) =>
  fireEvent.pointerUp(el, { ...base, clientX: x, clientY: y });

// The animation frames the hook asks for, run by hand so a test decides when a frame passes.
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const runFrames = () => {
  const due = [...frames.values()];
  frames.clear();
  act(() => due.forEach((callback) => callback(0)));
};

describe('usePointerDrag', () => {
  beforeEach(() => {
    frames = new Map();
    nextFrame = 1;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(nextFrame, callback);
      return nextFrame++;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('a press that stays under the threshold is no drag', () => {
    const { handle, calls } = setup();
    press(handle);
    move(handle, 102, 102);
    release(handle, 102, 102);
    expect(calls.onPress).toHaveBeenCalledTimes(1);
    expect(calls.onStart).not.toHaveBeenCalled();
    expect(calls.onMove).not.toHaveBeenCalled();
    expect(calls.onEnd).not.toHaveBeenCalled();
    expect(calls.onCancel).not.toHaveBeenCalled();
  });

  it('the threshold is a distance, not a limit per axis', () => {
    const { handle, calls } = setup();
    press(handle);
    // 3px on each axis is under 4px per axis but 4.24px away.
    move(handle, 103, 103);
    expect(calls.onStart).toHaveBeenCalledTimes(1);
  });

  it('a custom threshold applies, and a distance just under it does not start', () => {
    const { handle, calls } = setup({ threshold: 10 });
    press(handle);
    move(handle, 108, 105);
    expect(calls.onStart).not.toHaveBeenCalled();
    move(handle, 108, 106);
    expect(calls.onStart).toHaveBeenCalledTimes(1);
  });

  it('the event that crosses the threshold reaches onMove at once, after onStart', () => {
    const order: string[] = [];
    const { handle, calls } = setup({
      onStart: (info) => order.push(`start ${info.dx},${info.dy}`),
      onMove: (info) => order.push(`move ${info.dx},${info.dy}`),
    });
    press(handle, 50, 60);
    move(handle, 56, 63);
    // No frame has run: the first visible move is not delayed.
    expect(frames.size).toBe(0);
    expect(order).toEqual(['start 6,3', 'move 6,3']);
    expect(calls.onEnd).not.toHaveBeenCalled();
  });

  it('onStart reports the press point, the position and the distance travelled', () => {
    const { handle, calls } = setup();
    press(handle, 50, 60);
    move(handle, 56, 60);
    expect(calls.onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 56,
        y: 60,
        startX: 50,
        startY: 60,
        dx: 6,
        dy: 0,
        pointerId: 1,
        pointerType: 'mouse',
      }),
    );
    expect(calls.onMove).toHaveBeenCalledTimes(1);
  });

  it('coalesces moves per frame, the last wins, and flushes before onEnd', () => {
    const order: string[] = [];
    const { handle, calls } = setup({
      onMove: (info) => order.push(`move ${info.x}`),
      onEnd: (info) => order.push(`end ${info.x}`),
    });
    press(handle);
    move(handle, 110, 100);
    move(handle, 120, 100);
    move(handle, 130, 100);
    expect(frames.size).toBe(1);
    runFrames();
    expect(order).toEqual(['move 110', 'move 130']);
    move(handle, 140, 100);
    move(handle, 150, 100);
    release(handle, 150, 100);
    expect(order).toEqual(['move 110', 'move 130', 'move 150', 'end 150']);
    expect(frames.size).toBe(0);
    expect(calls.onCancel).not.toHaveBeenCalled();
  });

  it('the document follows the pointer when the capture is not in effect', () => {
    const { handle, calls } = setup();
    press(handle);
    move(document, 120, 100);
    release(document, 120, 100);
    expect(calls.onStart).toHaveBeenCalledTimes(1);
    expect(calls.onEnd).toHaveBeenCalledTimes(1);
  });

  it('captures the pointer when the drag starts, not on the press, and lets go on the release', () => {
    const order: string[] = [];
    const { handle } = setup({ onStart: () => order.push('start') });
    const capture = vi.fn(() => order.push('capture'));
    const letGo = vi.fn();
    handle.setPointerCapture = capture;
    handle.hasPointerCapture = () => capture.mock.calls.length > 0;
    handle.releasePointerCapture = letGo;
    // A press that is let go before the threshold takes nothing.
    press(handle);
    move(handle, 102, 100);
    release(handle, 102, 100);
    expect(capture).not.toHaveBeenCalled();
    expect(letGo).not.toHaveBeenCalled();
    press(handle);
    move(handle, 102, 100);
    expect(capture).not.toHaveBeenCalled();
    move(handle, 120, 100);
    expect(capture).toHaveBeenCalledExactlyOnceWith(1);
    expect(order).toEqual(['capture', 'start']);
    release(handle, 120, 100);
    expect(letGo).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('a pointer that cannot be captured still drags', () => {
    const { handle, calls } = setup();
    handle.setPointerCapture = () => {
      throw new DOMException('gone', 'NotFoundError');
    };
    press(handle);
    move(handle, 120, 100);
    release(handle, 120, 100);
    expect(calls.onEnd).toHaveBeenCalledTimes(1);
  });

  it('filters by pointer type and ignores the press whole', () => {
    const { handle, calls } = setup({ pointerTypes: ['mouse', 'pen'] });
    press(handle, 100, 100, { pointerType: 'touch' });
    move(handle, 140, 100, { pointerType: 'touch' });
    expect(calls.onPress).not.toHaveBeenCalled();
    expect(calls.onStart).not.toHaveBeenCalled();
    press(handle, 100, 100, { pointerType: 'pen' });
    move(handle, 140, 100, { pointerType: 'pen' });
    expect(calls.onStart).toHaveBeenCalledTimes(1);
  });

  it('ignores a secondary button and a non-primary pointer', () => {
    const { handle, calls } = setup();
    press(handle, 100, 100, { button: 2 });
    press(handle, 100, 100, { isPrimary: false, pointerId: 2 });
    move(handle, 140, 100);
    expect(calls.onPress).not.toHaveBeenCalled();
    expect(calls.onStart).not.toHaveBeenCalled();
  });

  it('follows only the pointer that pressed', () => {
    const { handle, calls } = setup();
    press(handle);
    move(handle, 140, 100, { pointerId: 2, isPrimary: false });
    expect(calls.onStart).not.toHaveBeenCalled();
  });

  describe('Ctrl and the mouse', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is a right click on Apple and does not drag', () => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
      const { handle, calls } = setup();
      press(handle, 100, 100, { ctrlKey: true });
      expect(calls.onPress).not.toHaveBeenCalled();
    });

    it('is a plain press elsewhere', () => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
      const { handle, calls } = setup();
      press(handle, 100, 100, { ctrlKey: true });
      expect(calls.onPress).toHaveBeenCalledTimes(1);
    });

    it('does not apply to touch on Apple', () => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
      const { handle, calls } = setup();
      press(handle, 100, 100, { ctrlKey: true, pointerType: 'touch' });
      expect(calls.onPress).toHaveBeenCalledTimes(1);
    });
  });

  it('onPress can prevent the default of the press', () => {
    const { handle } = setup({ onPress: (event) => event.preventDefault() });
    expect(press(handle)).toBe(false);
  });

  describe('Esc', () => {
    const esc = (init: KeyboardEventInit = {}) =>
      fireEvent.keyDown(document.body, { key: 'Escape', ...init });

    it('cancels a drag that has begun, prevents the key, and ends the drag for good', () => {
      const { handle, calls } = setup();
      press(handle);
      move(handle, 120, 100);
      expect(esc()).toBe(false);
      expect(calls.onCancel).toHaveBeenCalledTimes(1);
      expect(calls.onCancel).toHaveBeenCalledWith(expect.objectContaining({ x: 120 }));
      move(handle, 160, 100);
      release(handle, 160, 100);
      expect(calls.onMove).toHaveBeenCalledTimes(1);
      expect(calls.onEnd).not.toHaveBeenCalled();
    });

    it('is heard in the capture phase, before a handler that stops it', () => {
      const { handle, calls } = setup();
      const bubble = (event: Event) => event.stopPropagation();
      document.body.addEventListener('keydown', bubble);
      try {
        press(handle);
        move(handle, 120, 100);
        esc();
        expect(calls.onCancel).toHaveBeenCalledTimes(1);
      } finally {
        document.body.removeEventListener('keydown', bubble);
      }
    });

    it('does nothing before a press, before the threshold, and after the end', () => {
      const { handle, calls } = setup();
      expect(esc()).toBe(true);
      press(handle);
      move(handle, 101, 100);
      expect(esc()).toBe(true);
      move(handle, 120, 100);
      release(handle, 120, 100);
      expect(esc()).toBe(true);
      expect(calls.onCancel).not.toHaveBeenCalled();
    });

    it('is left alone with cancelOnEscape false', () => {
      const { handle, calls } = setup({ cancelOnEscape: false });
      press(handle);
      move(handle, 120, 100);
      expect(esc()).toBe(true);
      expect(calls.onCancel).not.toHaveBeenCalled();
      release(handle, 120, 100);
      expect(calls.onEnd).toHaveBeenCalledTimes(1);
    });

    it('belongs to the input method during a composition', () => {
      const { handle, calls } = setup();
      press(handle);
      move(handle, 120, 100);
      expect(esc({ isComposing: true })).toBe(true);
      expect(esc({ keyCode: 229 })).toBe(true);
      expect(calls.onCancel).not.toHaveBeenCalled();
    });
  });

  it('pointercancel after the start is a cancel, and before it is nothing', () => {
    const early = setup();
    press(early.handle);
    fireEvent.pointerCancel(early.handle, { ...base });
    expect(early.calls.onCancel).not.toHaveBeenCalled();
    early.unmount();

    const { handle, calls } = setup();
    press(handle);
    move(handle, 120, 100);
    fireEvent.pointerCancel(handle, { ...base });
    expect(calls.onCancel).toHaveBeenCalledTimes(1);
    release(handle, 120, 100);
    expect(calls.onEnd).not.toHaveBeenCalled();
  });

  it('lostpointercapture before the release is a cancel; a release after it does nothing', () => {
    const { handle, calls } = setup();
    press(handle);
    move(handle, 120, 100);
    fireEvent.lostPointerCapture(handle, { ...base });
    expect(calls.onCancel).toHaveBeenCalledTimes(1);
    release(handle, 120, 100);
    expect(calls.onEnd).not.toHaveBeenCalled();
    expect(calls.onCancel).toHaveBeenCalledTimes(1);
  });

  it('lostpointercapture after a release is not a cancel', () => {
    const { handle, calls } = setup();
    press(handle);
    move(handle, 120, 100);
    release(handle, 120, 100);
    fireEvent.lostPointerCapture(handle, { ...base });
    expect(calls.onEnd).toHaveBeenCalledTimes(1);
    expect(calls.onCancel).not.toHaveBeenCalled();
  });

  it('a cancel drops a pending move', () => {
    const { handle, calls } = setup();
    press(handle);
    move(handle, 120, 100);
    move(handle, 130, 100);
    fireEvent.pointerCancel(handle, { ...base });
    expect(frames.size).toBe(0);
    // Only the crossing event was reported; the pending 130 is dropped, not flushed.
    expect(calls.onMove).toHaveBeenCalledTimes(1);
    expect(calls.onMove).toHaveBeenCalledWith(expect.objectContaining({ x: 120 }));
  });

  it('reads the latest callbacks, so new ones never restart a drag', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { handle, rerender, calls } = setup({ onEnd: first });
    press(handle);
    move(handle, 120, 100);
    rerender(<Handle {...calls} onEnd={second} threshold={50} />);
    release(handle, 120, 100);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(calls.onStart).toHaveBeenCalledTimes(1);
  });

  it('a drag in flight at unmount ends quietly and leaves nothing behind', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    try {
      const { handle, calls, unmount } = setup();
      press(handle);
      move(handle, 120, 100);
      move(handle, 130, 100);
      expect(frames.size).toBe(1);
      expect(calls.onMove).toHaveBeenCalledTimes(1);
      unmount();
      expect(frames.size).toBe(0);
      move(document, 150, 100);
      release(document, 150, 100);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      runFrames();
      // Only the crossing event, reported before the unmount.
      expect(calls.onMove).toHaveBeenCalledTimes(1);
      expect(calls.onEnd).not.toHaveBeenCalled();
      expect(calls.onCancel).not.toHaveBeenCalled();
      const added = add.mock.calls.map(([type]) => type).sort();
      const removed = remove.mock.calls.map(([type]) => type).sort();
      expect(added).toEqual(removed);
    } finally {
      add.mockRestore();
      remove.mockRestore();
    }
  });

  describe('the click', () => {
    /** Counts the clicks that reach the handle, and the ones that reach the page around it. */
    function listen(handle: HTMLElement) {
      const onHandle = vi.fn();
      const onPage = vi.fn();
      handle.addEventListener('click', onHandle);
      document.body.addEventListener('click', onPage);
      const stop = () => {
        handle.removeEventListener('click', onHandle);
        document.body.removeEventListener('click', onPage);
      };
      return { onHandle, onPage, stop };
    }
    const nextTask = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    it('of a press that does not reach the threshold is a click', () => {
      const { handle } = setup();
      const clicks = listen(handle);
      try {
        press(handle);
        move(handle, 102, 100);
        release(handle, 102, 100);
        expect(fireEvent.click(handle)).toBe(true);
        expect(clicks.onHandle).toHaveBeenCalledTimes(1);
        expect(clicks.onPage).toHaveBeenCalledTimes(1);
      } finally {
        clicks.stop();
      }
    });

    it('that a drag makes is not delivered, on the element or anywhere else, and only that one', () => {
      const { handle, calls } = setup();
      const clicks = listen(handle);
      try {
        press(handle);
        move(handle, 120, 100);
        release(handle, 120, 100);
        expect(calls.onEnd).toHaveBeenCalledTimes(1);
        // The browser sends it to the element that holds both the press and the release, which can
        // be one around the handle.
        expect(fireEvent.click(document.body)).toBe(false);
        expect(clicks.onPage).not.toHaveBeenCalled();
        expect(fireEvent.click(handle)).toBe(true);
        expect(clicks.onHandle).toHaveBeenCalledTimes(1);
      } finally {
        clicks.stop();
      }
    });

    it('is a click again on the next task when the drag made none', async () => {
      const { handle } = setup();
      const clicks = listen(handle);
      try {
        press(handle);
        move(handle, 120, 100);
        release(handle, 120, 100);
        await nextTask();
        expect(fireEvent.click(handle)).toBe(true);
        expect(clicks.onHandle).toHaveBeenCalledTimes(1);
      } finally {
        clicks.stop();
      }
    });

    it.each([
      ['Esc', () => fireEvent.keyDown(document.body, { key: 'Escape' })],
      [
        'a lost capture',
        (handle: HTMLElement) => fireEvent.lostPointerCapture(handle, { ...base }),
      ],
    ])('of a drag cancelled by %s is not delivered when the button is let go', (_name, end) => {
      const { handle, calls } = setup();
      const clicks = listen(handle);
      try {
        press(handle);
        move(handle, 120, 100);
        end(handle);
        expect(calls.onCancel).toHaveBeenCalledTimes(1);
        move(document, 160, 100);
        release(document, 160, 100);
        expect(fireEvent.click(handle)).toBe(false);
        expect(clicks.onHandle).not.toHaveBeenCalled();
        expect(clicks.onPage).not.toHaveBeenCalled();
        fireEvent.click(handle);
        expect(clicks.onHandle).toHaveBeenCalledTimes(1);
      } finally {
        clicks.stop();
      }
    });

    it('of the next press is a click when the browser took the pointer of a drag', () => {
      const { handle } = setup();
      const clicks = listen(handle);
      try {
        press(handle);
        move(handle, 120, 100);
        // No release and no click follow a pointercancel, so there is nothing to wait for.
        fireEvent.pointerCancel(handle, { ...base });
        press(handle);
        release(handle, 100, 100);
        expect(fireEvent.click(handle)).toBe(true);
        expect(clicks.onHandle).toHaveBeenCalledTimes(1);
      } finally {
        clicks.stop();
      }
    });

    it('is not waited for any longer by an unmount, at any stage, which leaves nothing behind', () => {
      const add = vi.spyOn(document, 'addEventListener');
      const remove = vi.spyOn(document, 'removeEventListener');
      const types = (spy: typeof add) => spy.mock.calls.map(([type]) => type).sort();
      try {
        // Waiting for the release of a cancelled drag.
        const waiting = setup();
        press(waiting.handle);
        move(waiting.handle, 120, 100);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        waiting.unmount();
        expect(types(add)).toEqual(types(remove));
        release(document, 120, 100);
        expect(fireEvent.click(document.body)).toBe(true);
        // Armed: released, and the click not come yet.
        const armed = setup();
        press(armed.handle);
        move(armed.handle, 120, 100);
        release(armed.handle, 120, 100);
        armed.unmount();
        expect(types(add)).toEqual(types(remove));
        expect(fireEvent.click(document.body)).toBe(true);
      } finally {
        add.mockRestore();
        remove.mockRestore();
      }
    });
  });

  it('a new press replaces a drag whose end never came, and cancels it', () => {
    const { handle, calls } = setup();
    press(handle);
    move(handle, 120, 100);
    press(handle, 300, 300);
    expect(calls.onCancel).toHaveBeenCalledTimes(1);
    move(handle, 320, 300);
    expect(calls.onStart).toHaveBeenCalledTimes(2);
  });
});
