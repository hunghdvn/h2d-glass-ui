import { isNumber, isPositive } from '../../../internal/number';
import type { DataGridColumnLayout, DataGridPin } from '../types';
import type { ResolvedColumn } from './columns';

/** What `resolveWidths` reads of a column: its fixed width, if it has one, and its least width. */
export interface WidthSpec {
  width: number | undefined;
  minWidth: number;
}

/**
 * The width in pixels of each column. A fixed `width` is as given. The flexible columns share what
 * is left equally, none under its `minWidth`: a column that would get less is held at its minimum
 * and the others share the rest. Whole pixels, the remainder one pixel at a time to the last
 * flexible columns, so the widths add up to `available`, or to the fixed widths plus the minimums
 * when that is more. With no flexible column the table may be narrower than `available`.
 */
export function resolveWidths(columns: readonly WidthSpec[], available: number): number[] {
  const widths = columns.map((column) => column.width ?? 0);
  // A minimum counts in whole pixels, so the sum stays whole.
  const minimum = (index: number) => Math.ceil(columns[index]!.minWidth);
  let free = columns.flatMap((column, index) => (column.width === undefined ? [index] : []));
  let left =
    (Number.isFinite(available) ? Math.max(0, Math.floor(available)) : 0) -
    widths.reduce((sum, width) => sum + width, 0);

  // Holding a column at its minimum leaves the others less, which may hold another: repeat until
  // every column that is left can take an equal share.
  for (;;) {
    const share = left / free.length;
    const held = free.filter((index) => minimum(index) > share);
    if (held.length === 0) break;
    for (const index of held) {
      widths[index] = minimum(index);
      left -= minimum(index);
    }
    free = free.filter((index) => !held.includes(index));
  }

  if (free.length > 0) {
    // A fixed width with a fraction can leave a fraction; the pixels shared out are whole.
    const whole = Math.floor(left);
    const base = Math.floor(whole / free.length);
    const remainder = whole - base * free.length;
    free.forEach((index, place) => {
      widths[index] = base + (place >= free.length - remainder ? 1 : 0);
    });
  }
  return widths;
}

/** The widest a column may be, in pixels: what a layout, a drag and a key are held to. */
export const MAX_COLUMN_WIDTH = 2000;

const isPin = (value: unknown): value is DataGridPin => value === 'left' || value === 'right';

/**
 * The layout a grid starts with: the order of the array, the columns that say `visible: false`
 * hidden, the pins and the widths they say. Each part that `given` (`defaultColumnLayout`) has
 * replaces that part, whole, and no other.
 */
export function startLayout<TRow>(
  columns: readonly ResolvedColumn<TRow>[],
  given?: Partial<DataGridColumnLayout>,
): DataGridColumnLayout {
  const widths: Record<string, number> = {};
  const pinned: Record<string, DataGridPin> = {};
  for (const column of columns) {
    if (column.width !== undefined) widths[column.id] = column.width;
    if (column.pinned !== undefined) pinned[column.id] = column.pinned;
  }
  return {
    order: given?.order ?? columns.map((column) => column.id),
    widths: given?.widths ?? widths,
    hidden: given?.hidden ?? columns.flatMap((column) => (column.visible ? [] : [column.id])),
    pinned: given?.pinned ?? pinned,
  };
}

/** The columns a layout shows, and the layout as they are shown. */
export interface AppliedLayout<TRow> {
  /** The shown data columns in zone order: the left zone, the middle, the right zone. */
  columns: ResolvedColumn<TRow>[];
  /** The zone of each of `columns`: `undefined` for the middle. */
  pins: (DataGridPin | undefined)[];
  /** The width of each of `columns` in pixels, `undefined` for a flexible column. */
  widths: (number | undefined)[];
  /**
   * The layout as shown: `order` with the columns it did not know appended in array order, ids of
   * no column and repeated ids dropped, `hidden` and `pinned` cleaned the same way, and `widths`
   * clamped, with the own width of every column that has one and no entry.
   */
  layout: DataGridColumnLayout;
}

/**
 * Lays the columns out by a layout (spec phase 6 §3.5, §6.3). A column whose id is in `order` is
 * laid out by the layout alone: its own `visible` and `pinned` no longer count, and its own `width`
 * only while `widths` has no entry. A column that is not in `order` is new, and goes to the end of
 * its zone, laid out by what `hidden`, `pinned` and `widths` say of its id and by its own values for
 * what they do not: a `defaultColumnLayout` given before its column came still counts for it, since
 * the layout starts with the columns of the first render. A layout may come from the end user's
 * storage, so what does not fit is dropped without a word: ids of no column (the grid's own `flg:`
 * ids are none), repeated ids,
 * pins that are no pin, widths that are no positive number; a width is held to the column's limits as
 * a resize holds it (`clampWidth`), unless it is the column's own width, which a column is always
 * allowed. A layout that hides every column shows the first in `order`. The `ResolvedColumn` objects
 * are the ones given, so a new layout builds no column again.
 */
export function applyLayout<TRow>(
  columns: readonly ResolvedColumn<TRow>[],
  layout: DataGridColumnLayout,
): AppliedLayout<TRow> {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const known = new Set<string>();
  const order: string[] = [];
  for (const id of layout.order) {
    if (!byId.has(id) || known.has(id)) continue;
    known.add(id);
    order.push(id);
  }
  const added = columns.filter((column) => !known.has(column.id));
  for (const column of added) order.push(column.id);
  const isNew = new Set(added.map((column) => column.id));

  const hiddenIds = new Set<string>();
  const pins = new Map<string, DataGridPin>();
  const widths = new Map<string, number>();
  for (const id of order) {
    const column = byId.get(id)!;
    // What the layout says of the id counts for a new column too (a default given before the column
    // came, a layout from storage that names it); its own `visible` and `pinned` fill the rest.
    const fresh = isNew.has(id);
    if (layout.hidden.includes(id) || (fresh && !column.visible)) hiddenIds.add(id);
    const pin = layout.pinned[id];
    if (isPin(pin)) pins.set(id, pin);
    else if (fresh && column.pinned !== undefined) pins.set(id, column.pinned);
    const width = layout.widths[id];
    if (isPositive(width)) {
      widths.set(id, width === column.width ? width : clampWidth(width, column.minWidth));
    } else if (column.width !== undefined) {
      widths.set(id, column.width);
    }
  }
  // At least one column is shown: the first in `order` when the layout hides them all.
  if (order.length > 0 && hiddenIds.size === order.length) hiddenIds.delete(order[0]!);

  const zone = (pin: DataGridPin | undefined) =>
    order.filter((id) => pins.get(id) === pin && !hiddenIds.has(id));
  const shown = [...zone('left'), ...zone(undefined), ...zone('right')];
  return {
    columns: shown.map((id) => byId.get(id)!),
    pins: shown.map((id) => pins.get(id)),
    widths: shown.map((id) => widths.get(id)),
    layout: {
      order,
      widths: Object.fromEntries(
        order.flatMap((id) => (widths.has(id) ? [[id, widths.get(id)!]] : [])),
      ),
      hidden: order.filter((id) => hiddenIds.has(id)),
      pinned: Object.fromEntries(
        order.flatMap((id) => (pins.has(id) ? [[id, pins.get(id)!]] : [])),
      ),
    },
  };
}

/**
 * `order` with `id` just `before` or `after` `target`; the other ids, the hidden ones too, keep
 * their places. A new array always, with the same ids in the same order when nothing can move (an
 * id that is not there, a column onto itself, a column that is already there).
 */
export function moveColumn(
  order: readonly string[],
  id: string,
  target: string,
  side: 'before' | 'after',
): string[] {
  if (id === target || !order.includes(id) || !order.includes(target)) return [...order];
  const rest = order.filter((other) => other !== id);
  rest.splice(rest.indexOf(target) + (side === 'after' ? 1 : 0), 0, id);
  return rest;
}

/**
 * The layout with a column pinned to `side`, or unpinned (`null`). Pinned, it goes to the end of the
 * left zone or the start of the right one; unpinned, to the start of the middle (from the left) or
 * its end (from the right), which are the same two places seen from the other side (spec §6.3
 * "Ghim"). The zones are in the order of `order`, so the order is put into zone order first; the
 * layout given when there is nothing to do (an unpin of a column that is not pinned, an unknown id).
 */
export function pinColumn(
  layout: DataGridColumnLayout,
  id: string,
  side: DataGridPin | null,
): DataGridColumnLayout {
  const was = layout.pinned[id];
  if (!layout.order.includes(id) || (side === null && !isPin(was))) return layout;
  const pinned = { ...layout.pinned };
  if (side === null) delete pinned[id];
  else pinned[id] = side;
  const rest = layout.order.filter((other) => other !== id);
  const zone = (pin: DataGridPin | undefined) =>
    rest.filter((other) => (isPin(pinned[other]) ? pinned[other] : undefined) === pin);
  const left = zone('left');
  const middle = zone(undefined);
  const right = zone('right');
  const toTheLeft = (side ?? was) === 'left';
  return {
    ...layout,
    pinned,
    order: toTheLeft ? [...left, id, ...middle, ...right] : [...left, ...middle, id, ...right],
  };
}

/** The layout with `id` hidden or shown; the layout given when that changes nothing. */
export function setHidden(
  layout: DataGridColumnLayout,
  id: string,
  hidden: boolean,
): DataGridColumnLayout {
  if (layout.hidden.includes(id) === hidden) return layout;
  return {
    ...layout,
    hidden: hidden ? [...layout.hidden, id] : layout.hidden.filter((other) => other !== id),
  };
}

function sameRecord<T>(a: Readonly<Record<string, T>>, b: Readonly<Record<string, T>>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

/** Whether two lists of ids hold the same ids, in any order and however often each is repeated. */
function sameIds(a: readonly string[], b: readonly string[]): boolean {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((id) => right.has(id));
}

/**
 * Whether two layouts say the same, each part by value; `hidden` is a set (a layout from storage may
 * repeat an id), the rest are not.
 */
export function sameLayout(a: DataGridColumnLayout, b: DataGridColumnLayout): boolean {
  return (
    a.order.length === b.order.length &&
    a.order.every((id, index) => id === b.order[index]) &&
    sameIds(a.hidden, b.hidden) &&
    sameRecord(a.widths, b.widths) &&
    sameRecord(a.pinned, b.pinned)
  );
}

/**
 * How far each shown column sticks from the edge of the frame: for a column of the left zone the
 * sum of the widths of the zone before it, for one of the right zone the sum of the widths after it,
 * and `undefined` for the columns in between, which do not stick. `widths` are the widths of the
 * shown columns, the column of boxes first; the filler column is no column, and has none.
 */
export function pinOffsets(
  widths: readonly number[],
  pins: readonly (DataGridPin | undefined)[],
): (number | undefined)[] {
  let left = 0;
  const offsets = pins.map((pin, index) => {
    if (pin !== 'left') return undefined;
    const offset = left;
    left += widths[index] ?? 0;
    return offset;
  });
  let right = 0;
  for (let index = pins.length - 1; index >= 0; index--) {
    if (pins[index] !== 'right') continue;
    offsets[index] = right;
    right += widths[index] ?? 0;
  }
  return offsets;
}

/**
 * Where the filler column goes among the shown columns: before the right zone, so that the zone
 * ends the row at the edge of the frame (the filler takes what the columns leave), and at the end
 * of the row when no column is pinned to the right (spec phase 6 §3.7).
 */
export function fillerIndex(pins: readonly (DataGridPin | undefined)[]): number {
  const first = pins.indexOf('right');
  return first < 0 ? pins.length : first;
}

/**
 * What a cell of a pinned column says about itself: the side it sticks to, whether it is the one
 * next to the middle (the last of the left zone, the first of the right zone: it draws the edge
 * line and the shadow), and the style that sticks it. The offset is a custom property of the table
 * (`--flg-data-grid-pin-<i>`, written with the widths), so a change of a width changes the table and
 * not the cells.
 */
export interface PinPlace {
  side: DataGridPin;
  edge: boolean;
  style: { left: string } | { right: string };
}

/** The place of each shown column among the zones; `undefined` for a column in the middle. */
export function pinPlaces(pins: readonly (DataGridPin | undefined)[]): (PinPlace | undefined)[] {
  const lastLeft = pins.lastIndexOf('left');
  const firstRight = pins.indexOf('right');
  return pins.map((side, index) => {
    if (side === undefined) return undefined;
    const offset = `var(--flg-data-grid-pin-${index})`;
    return {
      side,
      edge: index === (side === 'left' ? lastLeft : firstRight),
      style: side === 'left' ? { left: offset } : { right: offset },
    };
  });
}

/** The widest a column gets from "fit to its content", in pixels (spec phase 6 §6.3). */
export const MAX_FIT_WIDTH = 600;

/**
 * A width as a drag, a key or a fit leaves it: in whole pixels, not under the least width of the
 * column (a least width with a fraction counts as the next whole pixel, as `resolveWidths` counts
 * it) and not over `MAX_COLUMN_WIDTH`. A width that is no number is the least width. A column whose
 * least width is over the greatest keeps its least.
 */
export function clampWidth(width: number, minWidth: number): number {
  const least = Math.ceil(minWidth);
  return isNumber(width) ? Math.max(least, Math.min(MAX_COLUMN_WIDTH, Math.round(width))) : least;
}

/**
 * The width a column gets from "fit to its content": the widest of what the title and the drawn
 * cells need, in whole pixels, held to the least width of the column and to `MAX_FIT_WIDTH` (the
 * least width wins where it is the greater). Nothing to measure is the least width.
 */
export function autoFitWidth(measures: readonly number[], minWidth: number): number {
  const least = Math.ceil(minWidth);
  return Math.max(least, Math.min(MAX_FIT_WIDTH, Math.ceil(Math.max(...measures))));
}

/**
 * The widths of a layout when a column is resized the first time (spec phase 6 §3.7, the widget
 * freeze): every shown column that has no width in `widths` gets the one it has now, `size` (its
 * least width when it was not measured), and `id` gets `width`. So a drag or a key makes the table
 * wider or narrower and never takes the room of a neighbour. A width the layout has is kept, and so
 * is that of a column that is not shown. A new record.
 */
export function freezeWidths(
  widths: Readonly<Record<string, number>>,
  columns: readonly { id: string; minWidth: number; size: number | undefined }[],
  id: string,
  width: number,
): Record<string, number> {
  const frozen: Record<string, number> = { ...widths };
  for (const column of columns) {
    if (frozen[column.id] === undefined) {
      frozen[column.id] = clampWidth(column.size ?? 0, column.minWidth);
    }
  }
  frozen[id] = width;
  return frozen;
}

/**
 * What a press of `Alt+Shift+←` or `Alt+Shift+→` on a title changes the width of its column by, in
 * pixels.
 */
export const RESIZE_KEY_STEP = 10;

/** The columns of one zone: the indexes of its first and its last column. */
export interface Zone {
  first: number;
  last: number;
}

/** Where a column goes: just `before` or `after` the column `target`, which `moveColumn` takes. */
export interface Move {
  target: string;
  side: 'before' | 'after';
}

/**
 * The zone of the column at `index`: the run of columns with its pin that holds it, given the pin of
 * each data column in order. The zones are in order (left, middle, right), so a run is a zone.
 */
export function zoneOf(sides: readonly (DataGridPin | undefined)[], index: number): Zone {
  let first = index;
  let last = index;
  while (first > 0 && sides[first - 1] === sides[index]) first -= 1;
  while (last < sides.length - 1 && sides[last + 1] === sides[index]) last += 1;
  return { first, last };
}

/**
 * The boundary of a zone that a drop at `x` is for, counted from the zone's start: `edges` are the x of
 * the boundaries of the zone's columns, one more than there are columns (the left edge of each, then
 * the right edge of the last), and `source` is the column that is dragged, counted the same way. It is
 * the boundary nearest to `x`, the lower one when two are as near. The two boundaries beside the column
 * itself are no move, and so is anywhere outside the zone: `null`, where no line is drawn and a drop
 * does nothing (spec phase 6 §3.8).
 */
export function dropTarget(edges: readonly number[], source: number, x: number): number | null {
  const start = edges[0];
  const end = edges[edges.length - 1];
  if (start === undefined || end === undefined || x < start || x > end) return null;
  let nearest = 0;
  for (let edge = 1; edge < edges.length; edge += 1) {
    if (Math.abs(edges[edge]! - x) < Math.abs(edges[nearest]! - x)) nearest = edge;
  }
  return nearest === source || nearest === source + 1 ? null : nearest;
}

/**
 * The move that a drop on the boundary `edge` of a zone makes, with `edge` counted from the zone's
 * start: before the column that starts it, or after the last column of the zone for its end. `ids` are
 * the data columns in order, and `zone` is counted in them.
 */
export function dropMove(ids: readonly string[], zone: Zone, edge: number): Move {
  const count = zone.last - zone.first + 1;
  return edge < count
    ? { target: ids[zone.first + edge]!, side: 'before' }
    : { target: ids[zone.last]!, side: 'after' };
}

/**
 * The move of the column at `index` by one place within its zone, past the next shown column (a hidden
 * one keeps its place: `moveColumn` only moves this one). `null` at the edge of the zone, though a
 * column of another zone lies beyond it.
 */
export function stepMove(
  ids: readonly string[],
  zone: Zone,
  index: number,
  step: -1 | 1,
): Move | null {
  const next = index + step;
  if (next < zone.first || next > zone.last) return null;
  return { target: ids[next]!, side: step < 0 ? 'before' : 'after' };
}
