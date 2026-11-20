import { createExternalStore, useExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/** What a column drag in flight shows: the chip that follows the pointer and the line where it would drop. */
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
}

/**
 * The chip and the drop line of a drag, apart from what the rows read: only the layer that draws them
 * reads this, so a move of the pointer draws no row, no title and no toolbar (spec phase 6 §3.8).
 * `null` while no column is dragged.
 */
export type DragViewStore = ExternalStore<DragView>;

/** One store for one grid. */
export const createDragView = (): DragViewStore => createExternalStore<DragView>();

/** The drag in flight, `null` when there is none (and on the server). */
export const useDragView = (store: DragViewStore): DragView | null => useExternalStore(store);
