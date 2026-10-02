import { expect, userEvent } from 'storybook/test';

/** The computed `rgb(…)` value of a CSS colour, such as `var(--flg-danger)`, inside `host`'s theme. */
function resolveColor(host: HTMLElement, value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/**
 * Focuses `control` the way a user would and checks that `frame`, the element drawing its border,
 * shows the colour `expected` (for example `var(--flg-danger)`). The story always ends unfocused,
 * with its transitions restored, so screenshots and the accessibility check see the resting state.
 */
export async function expectBorderWhileFocused(
  control: HTMLElement,
  frame: HTMLElement,
  expected: string,
): Promise<void> {
  // Forced colours replace every border colour with a system colour: there is nothing to compare.
  if (matchMedia('(forced-colors: active)').matches) return;
  const host = frame.parentElement as HTMLElement;
  const color = resolveColor(host, expected);
  // A token that does not resolve falls back to the text colour, on the border too, and the check
  // would pass without testing anything. The accent is what a focused, valid control shows.
  await expect(color).not.toBe(resolveColor(host, 'currentcolor'));
  await expect(color).not.toBe(resolveColor(host, 'var(--flg-accent-solid)'));

  // Without the transition the computed colour is the final one, not the first frame of a fade.
  frame.style.transition = 'none';
  try {
    await userEvent.click(control);
    await expect(control.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(frame).borderTopColor).toBe(color);
  } finally {
    control.blur();
    // Apply the unfocused style before the transition is back, so no fade runs after the story.
    frame.getBoundingClientRect();
    frame.style.transition = '';
  }
}
