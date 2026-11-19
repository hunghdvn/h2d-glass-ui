import type { DataGridColumnLayout } from '../types';
import type { ResolvedColumn } from './columns';

/** One box of the column chooser. */
export interface ChooserItem {
  readonly id: string;
  readonly caption: string;
  readonly shown: boolean;
  /** The column says `allowHiding: false`: the chooser draws a lock beside its box. */
  readonly locked: boolean;
  /** The column is the only one shown and is not locked: its box is disabled for that. */
  readonly last: boolean;
  /** The box cannot change: the column is shown and is locked, or is the only one shown. */
  readonly disabled: boolean;
}

/**
 * The boxes of the column chooser (spec phase 6 §6.3): every data column, in the order the grid shows
 * them (the left zone, the middle, then the right zone; a hidden column at its place in `order`), from
 * the layout as it is shown. A box that is not checked can always be checked; a box that is checked
 * cannot be cleared for a locked column, nor for the only column shown, so that a grid never has none.
 * A locked column that a layout hides can be shown again: the lock is about the user hiding it.
 */
export function chooserItems(
  columns: readonly Pick<ResolvedColumn<unknown>, 'id' | 'caption' | 'allowHiding'>[],
  layout: DataGridColumnLayout,
): ChooserItem[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const known = layout.order.filter((id, at) => byId.has(id) && layout.order.indexOf(id) === at);
  const order = [
    ...known,
    ...columns.map((column) => column.id).filter((id) => !known.includes(id)),
  ];
  // Whatever is no pin is the middle, so that a column is never lost to a layout that is not clean.
  const side = (id: string) => layout.pinned[id];
  const listed = [
    ...order.filter((id) => side(id) === 'left'),
    ...order.filter((id) => side(id) !== 'left' && side(id) !== 'right'),
    ...order.filter((id) => side(id) === 'right'),
  ];
  const shownCount = listed.filter((id) => !layout.hidden.includes(id)).length;
  return listed.map((id) => {
    const column = byId.get(id)!;
    const shown = !layout.hidden.includes(id);
    return {
      id,
      caption: column.caption,
      shown,
      locked: !column.allowHiding,
      last: shown && column.allowHiding && shownCount === 1,
      disabled: shown && (!column.allowHiding || shownCount === 1),
    };
  });
}
