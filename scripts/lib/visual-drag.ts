/** How far the visual harness drags the element a story marks, in CSS pixels. */
export interface VisualDrag {
  dx: number;
  dy: number;
}

/** One part: a plain signed number, such as `-112` or `12.5`. */
const PART = /^-?\d+(\.\d+)?$/;

/**
 * Reads the `data-visual-drag="dx,dy"` of a story (tests/visual/stories.visual.ts): two parts, each
 * a plain signed number once trimmed. Anything else throws, with the story and the value: `Number`
 * alone reads an empty part as 0, so `","` or `"12,"` would press and move by nothing on an axis,
 * and a baseline of a dialog that was never dragged would be recorded as the dragging look.
 */
export function parseVisualDrag(storyId: string, value: string | null): VisualDrag {
  const parts = (value ?? '').split(',').map((part) => part.trim());
  const [dx, dy] = parts;
  if (parts.length !== 2 || !PART.test(dx ?? '') || !PART.test(dy ?? '')) {
    throw new Error(
      `${storyId}: data-visual-drag must be "dx,dy", two signed numbers, not ${JSON.stringify(value)}.`,
    );
  }
  return { dx: Number(dx), dy: Number(dy) };
}
