import { createContext, useContext } from 'react';
import type { ExternalStore } from './hooks/use-external-store';
import type { DataGridEditMode, DataGridEditing, DataGridKey } from './types';

/** The row being edited, as the rows read it: apart from the rest, so only that row draws for a change of it. */
export interface EditTarget {
  readonly key: DataGridKey;
  /** The id of the column whose editor takes the focus when the edit starts; `null` is the first one. */
  readonly focus: string | null;
  /** Whether a save is pending: the editors cannot change and the save button loads. */
  readonly saving: boolean;
}

/**
 * What the parts that edit share while `editing` is on: the mode, the actions (the same functions for as long
 * as the grid lives, so a row that reads them never draws for their sake) and the draft of the row being
 * edited, which each editor reads its own field of. The row being edited is not here, but in
 * `EditViewContext`, which the body reads and hands to each row as a prop.
 */
export interface EditContextValue<TRow = unknown> {
  config: DataGridEditing<TRow>;
  mode: DataGridEditMode;
  /** The size the editors are drawn at: `sm` in a `compact` grid. */
  size: 'sm' | 'md';
  /** The fields typed in the row being edited; `null` while none is. */
  draft: ExternalStore<Partial<TRow>>;
  /** Starts editing the row with this key; `columnId` is the column that takes the focus. */
  start(key: DataGridKey, columnId?: string): void;
  /** Sets the value of a column of the row being edited, from what a default editor holds. */
  setValue(columnId: string, value: unknown): void;
  /** Sets it from a value as the row holds it, which is what a column's own `editor` gives. */
  setRaw(columnId: string, value: unknown): void;
  /** Saves the row being edited. */
  save(): void;
  /** Gives the edit up. */
  cancel(): void;
}

export const EditContext = createContext<EditContextValue | null>(null);

/** The row being edited, for the body; `null` when no row is. */
export const EditViewContext = createContext<EditTarget | null>(null);

/** The edit context of the grid the part is in; `null` when the grid does not edit. */
export function useEditContext<TRow>(): EditContextValue<TRow> | null {
  return useContext(EditContext) as EditContextValue<TRow> | null;
}
