import type { MouseEvent } from 'react';

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex]';

/**
 * The `onMouseDown` of a frame around a text input: a press on the frame, the padding or a
 * decorative part of it focuses the input, as if the whole frame were the input. Presses on the
 * input itself, or on an interactive part such as a clear button, behave normally. The input is the
 * frame's own child.
 */
export function focusInput(event: MouseEvent<HTMLElement>): void {
  if (event.button !== 0) return;
  const frame = event.currentTarget;
  const input = frame.querySelector<HTMLInputElement>(':scope > input');
  const target = event.target as Element;
  if (!input || input.disabled || target === input) return;
  const interactive = target.closest(INTERACTIVE);
  if (interactive && frame.contains(interactive)) return;
  event.preventDefault();
  input.focus();
}
