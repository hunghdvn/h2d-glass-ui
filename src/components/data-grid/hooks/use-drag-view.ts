import { useSyncExternalStore } from 'react';
import { createExternalStore, useExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/**
 * What a drag in flight shows: the chip that follows the pointer, the line where a column would drop in
 * the heading, and what the group panel shows of a title or a chip that is over it.
 */
export interface DragView {
  /** The caption of the column that is dragged, which the chip says. */
  readonly caption: string;
  /** Where the pointer is, in the client coordinates of the viewport. */
  readonly x: number;
  readonly y: number;
  /**
   * Where the column would go: the client x of the boundary it would be dropped on, `null` where it
   * would not move (beside itself, outside its zone, outside the heading) and no line is drawn. Each
   * snapshot is a new object, so what reads it measures again.
   */
  readonly edge: number | null;
  /**
   * What the pointer is over that takes a drop: the group panel (a title or a chip dropped there groups,
   * or moves its level), the heading (a chip dropped there ungroups), or nothing. Drawn only by the
   * panel, from `target` and `slot`.
   */
  readonly target: 'tray' | 'heading' | null;
  /**
   * Where a drop on the panel would put the level, as a slot from 0 (before the first chip) to the
   * number of chips (after the last): the bar is drawn there. `null` where a drop would not move the
   * level (beside the chip that is dragged), and over the panel with a title that cannot be grouped.
   */
  readonly slot: number | null;
  /** The field of the chip that is dragged, which the panel dims; `null` for a title. */
  readonly chip: string | null;
}

/**
 * The chip and the drop line of a drag, apart from what the rows read: only the layer that draws them
 * reads this, so a move of the pointer draws no row, no title and no toolbar (spec phase 6 §3.8). The
 * group panel reads three members of it, each as a value that changes only when it is another. `null`
 * while nothing is dragged.
 */
export type DragViewStore = ExternalStore<DragView>;

/** One store for one grid. */
export const createDragView = (): DragViewStore => createExternalStore<DragView>();

/** The drag in flight, `null` when there is none (and on the server). */
export const useDragView = (store: DragViewStore): DragView | null => useExternalStore(store);

const NONE = () => null;

/**
 * One member of the drag in flight, `null` when there is none: a part that reads only this draws again
 * when it changes, and not for each move of the pointer.
 */
export function useDragMember<K extends 'target' | 'slot' | 'chip'>(
  store: DragViewStore,
  key: K,
): DragView[K] | null {
  return useSyncExternalStore(store.subscribe, () => store.get()?.[key] ?? null, NONE);
}
