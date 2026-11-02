import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';

/** How long a press waits before it starts to repeat, and then how often it repeats. */
const FIRST_DELAY = 400;
const REPEAT_DELAY = 60;

/** The handlers a −/+ button needs. */
export interface PressRepeatHandlers {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Press and hold for a step button: `step` runs once at once on the press, then again after 400ms
 * and every 60ms, until the pointer is released, leaves the button or is cancelled, the component
 * goes away, the window loses focus, the page is hidden, or `step` returns false (it has reached its limit). `step` returns whether another
 * step is possible, and the latest one given is the one that runs.
 *
 * The press does not take focus (`preventDefault` on `pointerdown`), so the focus stays where it was.
 * A click that did not come from a pointer (`detail` 0: a screen reader or a switch activating the
 * button) steps once; the click that ends a pointer press does not step a second time.
 */
export function usePressRepeat(step: () => boolean): PressRepeatHandlers {
  const latest = useRef(step);
  useWriteOnCommit(() => {
    latest.current = step;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Takes the window's and the page's listeners off again, which only a running repeat has.
  const unlisten = useRef<(() => void) | undefined>(undefined);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    unlisten.current?.();
    unlisten.current = undefined;
  }, []);
  useEffect(() => stop, [stop]);

  const schedule = useCallback(
    (delay: number) => {
      timer.current = setTimeout(() => {
        if (latest.current()) schedule(REPEAT_DELAY);
        else stop();
      }, delay);
    },
    [stop],
  );

  return {
    onPointerDown: (event) => {
      // Only the main button; a pointer event made without one (a test, an old engine) has none.
      if (event.button > 0 || event.isPrimary === false) return;
      event.preventDefault();
      stop();
      if (latest.current()) {
        // If the page never sees the release (the window loses focus, an OS dialog opens, the tab
        // is hidden), nothing else would stop the repeat.
        const onHide = () => {
          if (document.visibilityState === 'hidden') stop();
        };
        window.addEventListener('blur', stop);
        document.addEventListener('visibilitychange', onHide);
        unlisten.current = () => {
          window.removeEventListener('blur', stop);
          document.removeEventListener('visibilitychange', onHide);
        };
        schedule(FIRST_DELAY);
      }
    },
    // A belt next to the pointerdown one, for an engine that still sends the compatibility mousedown.
    onMouseDown: (event) => event.preventDefault(),
    onPointerUp: stop,
    onPointerCancel: stop,
    onPointerLeave: stop,
    onClick: (event) => {
      if (event.detail === 0) latest.current();
    },
  };
}
