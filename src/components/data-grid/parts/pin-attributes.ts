import { dataAttr } from '../../../internal/data-attr';
import type { PinPlace } from '../engine/layout';

const NOT_PINNED = {};

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
