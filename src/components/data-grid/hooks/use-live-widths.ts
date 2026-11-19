import { createExternalStore, useExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/** What a column resize in flight says to the table: the width of every column, for as long as it lasts. */
export interface LiveWidths {
  /** The id of the column that is dragged. */
  readonly id: string;
  /** The handle that is pressed, which the guide stands on. */
  readonly handle: HTMLElement;
  /**
   * The width of every shown column in pixels: the ones the layout has and the ones the first resize
   * freezes, and the dragged column's own. Each snapshot is a new object, also when no width changed
   * (the frame scrolled under a still pointer), so what reads it measures again.
   */
  readonly widths: Readonly<Record<string, number>>;
}

/**
 * The widths of a drag, apart from what the rows read: the table (`<col>`, its width, the offsets of
 * the pinned columns) and the guide read them, and nothing else does, so a move of the pointer draws
 * no row, no title and no toolbar (spec phase 6 §3.7, option b of the owner's review of PR #42).
 * `null` while no column is dragged.
 */
export type LiveWidthsStore = ExternalStore<LiveWidths>;

/** One store for one grid. */
export const createLiveWidths = (): LiveWidthsStore => createExternalStore<LiveWidths>();

/** The drag in flight, `null` when there is none (and on the server). */
export const useLiveWidths = (store: LiveWidthsStore): LiveWidths | null => useExternalStore(store);
