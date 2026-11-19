import type { MouseEvent } from 'react';
import { takesOwnPress } from './controls';

/**
 * The `onMouseDown` of a frame around a text input: a press on the frame, the padding or a
 * decorative part of it focuses the input, as if the whole frame were the input. Presses on the
 * input itself, or on a part that takes its own press (controls.ts), such as a clear button, behave
 * normally. The input is the frame's own child.
 */
export function focusInput(event: MouseEvent<HTMLElement>): void {
  if (event.button !== 0) return;
  const frame = event.currentTarget;
  const input = frame.querySelector<HTMLInputElement>(':scope > input');
  if (!input || input.disabled || event.target === input || takesOwnPress(event)) return;
  event.preventDefault();
  input.focus();
}
