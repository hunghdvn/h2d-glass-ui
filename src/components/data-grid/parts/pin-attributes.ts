import { dataAttr } from '../../../internal/data-attr';
import type { PinPlace } from '../engine/layout';

const NOT_PINNED = {};

/**
 * The pin of a cell that stands for a run of columns of one zone: the place of the first, and the edge
 * of the last, so the cell sticks where the run starts and ends the zone as the run does.
 */
export function runPin(
  pins: readonly (PinPlace | undefined)[],
  from: number,
  to: number,
): PinPlace | undefined {
  const first = pins[from];
  return first ? { ...first, edge: pins[to]?.edge ?? false } : undefined;
}

/**
 * What a cell of a pinned column has on it: the side it sticks to, whether it is the edge of its
 * zone, and the style that sticks it (`left` or `right`, a custom property that the table writes).
 * The cell is made sticky by the stylesheet, which reads these; a column in the middle has nothing.
 */
export function pinAttributes(place: PinPlace | undefined) {
  if (!place) return NOT_PINNED;
  return {
    'data-pinned': place.side,
    'data-pin-edge': dataAttr(place.edge),
    style: place.style,
  };
}
