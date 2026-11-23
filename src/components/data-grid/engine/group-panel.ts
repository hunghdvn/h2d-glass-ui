import type { DataGridGroupItem } from '../types';

/**
 * Where a drop on the group panel would put a level: the slot, from 0 (before the first chip) to the
 * number of chips (after the last), is the number of chips whose middle is left of the pointer, so the
 * level goes before the chip under the pointer when the pointer is in its left half, and after it when
 * it is in the right half. `centers` are the client x of the middles of the chips, in order.
 */
export function slotAt(centers: readonly number[], x: number): number {
  let slot = 0;
  for (const center of centers) {
    if (center < x) slot += 1;
  }
  return slot;
}

/**
 * The place, from 0, that the chip at `from` has when it is dropped on `slot` (a slot of the chips as
 * they are, which counts the chip itself), or `null` when that is the place it has: the slots just
 * before and just after a chip are no move.
 */
export function levelTarget(from: number, slot: number): number | null {
  const to = slot > from ? slot - 1 : slot;
  return to === from ? null : to;
}

/** `items` with the one at `from` taken out and put at `to`; a new list. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
}

/**
 * The place in the held grouping of the item a level was made from: the first item of its field with its
 * direction. `effectiveGrouping` keeps the first item of a field that is valid, so an item before it with
 * the same field and a direction that is none is inert and is not the level's.
 */
function placeOf(held: readonly DataGridGroupItem[], level: DataGridGroupItem): number {
  return held.findIndex((item) => item.field === level.field && item.direction === level.direction);
}

/**
 * The grouping a drop or a key asks for when it moves the level `from` to `to`: the held grouping with
 * its levels (`levels`, the items that group) in the new order. The held grouping may hold items that
 * do not group (a field of no column, a repeated field: spec phase 6 §5 "Giá trị lạ"), which stay
 * where they are, so only the places of the levels are written again.
 */
export function regroupLevels(
  held: readonly DataGridGroupItem[],
  levels: readonly DataGridGroupItem[],
  from: number,
  to: number,
): DataGridGroupItem[] {
  const places = levels.map((level) => placeOf(held, level));
  const moved = moveItem(levels, from, to);
  const next = [...held];
  for (const [at, place] of places.entries()) {
    if (place >= 0) next[place] = moved[at]!;
  }
  return next;
}

/**
 * The held grouping with `item` added as a level before the level at `slot` (the end when `slot` is
 * past the last level): before that level's own item in the held list, so the items that do not group
 * keep their places.
 */
export function insertLevel(
  held: readonly DataGridGroupItem[],
  levels: readonly DataGridGroupItem[],
  item: DataGridGroupItem,
  slot: number,
): DataGridGroupItem[] {
  const before = levels[slot];
  const place = before === undefined ? -1 : placeOf(held, before);
  const next = [...held];
  next.splice(place < 0 ? next.length : place, 0, item);
  return next;
}
