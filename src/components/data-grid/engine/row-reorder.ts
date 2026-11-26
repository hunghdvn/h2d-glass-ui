import { isSavedRow } from './flatten';
import type { FlatRow } from './flatten';
import type { DataGridKey, DataGridRowDrop } from '../types';

/** The four moves of the row menu, and what a key does with `up` and `down`. */
export type RowMove = 'up' | 'down' | 'top' | 'bottom';

/** What a move asks of the app: the row it goes to, and which side of it. */
export interface RowAsk {
  toKey: DataGridKey;
  position: DataGridRowDrop;
}

/**
 * What a move of a row asks, worked out over the keys of the rows after the filter in the order shown
 * (`keyed`): up is before the row above, down after the row below, top before the first and bottom after
 * the last (spec phase 6 §6.3). `null` at an edge, where the row cannot go that way, and for a key that is
 * not among them. The one rule for the keys, the menu and which of its items are turned off.
 */
export function askOfMove(
  keys: readonly DataGridKey[],
  key: DataGridKey,
  move: RowMove,
): RowAsk | null {
  const at = keys.findIndex((one) => Object.is(one, key));
  if (at < 0) return null;
  const last = keys.length - 1;
  switch (move) {
    case 'up':
      return at > 0 ? { toKey: keys[at - 1]!, position: 'before' } : null;
    case 'down':
      return at < last ? { toKey: keys[at + 1]!, position: 'after' } : null;
    case 'top':
      return at > 0 ? { toKey: keys[0]!, position: 'before' } : null;
    case 'bottom':
      return at < last ? { toKey: keys[last]!, position: 'after' } : null;
  }
}

/**
 * The place, counted from 1, that the row `key` has among `keys` once it has been moved as `ask` says; `0`
 * when it does not move (the row is not there, or `toKey` is the row itself).
 */
export function placeAfterMove(
  keys: readonly DataGridKey[],
  key: DataGridKey,
  ask: RowAsk,
): number {
  if (Object.is(key, ask.toKey)) return 0;
  const others = keys.filter((one) => !Object.is(one, key));
  const to = others.findIndex((one) => Object.is(one, ask.toKey));
  if (to < 0 || others.length === keys.length) return 0;
  return to + (ask.position === 'after' ? 2 : 1);
}

/**
 * Whether the rows are in the order a move asked for: the row `key` is right before `toKey` for `'before'`
 * and right after it for `'after'`. The grid scrolls to a row that has moved only when it is (a `data` that
 * the app did not change, or changed another way, is not this move's).
 */
export function isPlacedAs(keys: readonly DataGridKey[], key: DataGridKey, ask: RowAsk): boolean {
  const at = keys.findIndex((one) => Object.is(one, key));
  const to = keys.findIndex((one) => Object.is(one, ask.toKey));
  return at >= 0 && to >= 0 && at - to === (ask.position === 'after' ? 1 : -1);
}

/**
 * The place of each data row of the page among the data rows of the page: what a drop is worked out
 * from, so a row that a virtual window has not drawn still has its place.
 */
export function pagePlaces<TRow>(rows: readonly FlatRow<TRow>[]): ReadonlyMap<DataGridKey, number> {
  const places = new Map<DataGridKey, number>();
  for (const row of rows)
    if (isSavedRow(row) && !places.has(row.key)) places.set(row.key, places.size);
  return places;
}

/** A row of the page as it is drawn, measured: where its top, its middle and its bottom are (client y). */
export interface RowBlock {
  key: DataGridKey;
  /** Its place among the data rows of the page (`pagePlaces`). */
  place: number;
  top: number;
  /** The middle of the row itself: a pointer above it is `before`, below it `after`. */
  middle: number;
  /** The bottom of the row, and of its detail while it has one open: the place a drop `after` it is at. */
  bottom: number;
}

/** Where a drop at a point would put the row: what it asks, and the y of the boundary, where the line is drawn. */
export interface RowDrop {
  ask: RowAsk;
  /** The client y of the boundary the row would be put on. */
  y: number;
}

/**
 * Where a drop of the row at the place `from` among the data rows of the page, at the client `y`, goes: the
 * row under the pointer, before it in its upper half and after it in its lower half (spec phase 6 §3.8).
 * `null` outside the rows drawn, and where the row would not move: before the row after it and after the row
 * before it are its own place, as are before and after itself. The source need not be drawn (a virtual
 * window may have scrolled past it): only its place counts.
 */
export function rowDrop(blocks: readonly RowBlock[], from: number, y: number): RowDrop | null {
  const block = blocks.find((one) => y >= one.top && y < one.bottom);
  if (!block) return null;
  const position: DataGridRowDrop = y < block.middle ? 'before' : 'after';
  const boundary = position === 'before' ? block.place : block.place + 1;
  if (boundary === from || boundary === from + 1) return null;
  return {
    ask: { toKey: block.key, position },
    y: position === 'before' ? block.top : block.bottom,
  };
}
