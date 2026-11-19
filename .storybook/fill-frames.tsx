// Frames for a component that fills the row it is in (spec phase 4 §3.5): a 400px block, and a 400px
// flex row beside a 40px box, each with the component given `margin: 0 16px` and then `padding: 8px`.
// Its margin, padding and border come out of its width, so it stays inside its parent and still fills
// what the parent leaves it. Only a real layout can show either.
import type { CSSProperties, ReactNode } from 'react';
import { expect } from 'storybook/test';

const SPACINGS: ReadonlyArray<{ name: string; style: CSSProperties }> = [
  { name: 'margin', style: { margin: '0 16px' } },
  { name: 'padding', style: { padding: 8 } },
];
const PARENT = 400;
const BOX = 40;
const GAP = 12;

export function FillFrames({
  name,
  render,
}: {
  name: string;
  render: (style: CSSProperties) => ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {SPACINGS.map(({ name: spacing, style }) => (
        <div key={`block ${spacing}`} data-fill-frame={`${name}, block, ${spacing}`}>
          <div style={{ width: PARENT }}>{render(style)}</div>
        </div>
      ))}
      {SPACINGS.map(({ name: spacing, style }) => (
        <div key={`row ${spacing}`} data-fill-frame={`${name}, flex row, ${spacing}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: GAP, width: PARENT }}>
            <span style={{ flex: 'none', width: BOX, height: BOX }} />
            {render(style)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Checks the four frames of `FillFrames` with this `name`. */
export async function checkFillFrames(canvasElement: HTMLElement, name: string) {
  const frames = Array.from(
    canvasElement.querySelectorAll<HTMLElement>(`[data-fill-frame^="${name}, "]`),
  );
  await expect(frames).toHaveLength(4);
  for (const frame of frames) {
    const label = frame.dataset.fillFrame;
    const parent = frame.firstElementChild!;
    const item = parent.lastElementChild!;
    const outer = parent.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    const { marginLeft, marginRight } = getComputedStyle(item);
    // What the parent leaves it: its width, less the box and the gap in a row, less its margins.
    const room =
      outer.width -
      (parent.childElementCount > 1 ? BOX + GAP : 0) -
      parseFloat(marginLeft) -
      parseFloat(marginRight);
    await expect(box.left, `${label}: left edge`).toBeGreaterThanOrEqual(outer.left - 0.5);
    await expect(box.right, `${label}: right edge`).toBeLessThanOrEqual(outer.right + 0.5);
    await expect(Math.abs(box.width - room), `${label}: fills the room`).toBeLessThanOrEqual(1);
  }
}
