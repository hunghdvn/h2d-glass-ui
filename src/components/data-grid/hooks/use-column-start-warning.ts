import { useEffect, useRef } from 'react';
import { devWarn, isProduction } from '../../../internal/warn';
import type { ResolvedColumn } from '../engine/columns';
import type { DataGridColumnLayout } from '../types';

const MESSAGE =
  "<DataGrid> a column's `width`, `visible` and `pinned` only start the column layout. To change them after mount, change `columnLayout` (or remount the grid with a `key`).";

interface Own {
  width: number | undefined;
  visible: boolean;
  pinned: string | undefined;
}

/**
 * Development only: warns once when, after a commit, the own `width`, `visible` or `pinned` of a
 * column changed from what it said before and the layout shown does not already say the new value.
 * A known column is laid out by the layout alone, so such a change would do nothing and say nothing.
 * Compared by value per column id, so `columns` written in the JSX does not warn; a column that is
 * new, or whose new value is the layout's own, does not either.
 */
export function useColumnStartWarning<TRow>(
  columns: readonly ResolvedColumn<TRow>[],
  shown: DataGridColumnLayout,
): void {
  const before = useRef<Map<string, Own> | null>(null);
  useEffect(() => {
    if (isProduction()) return;
    const previous = before.current;
    const now = new Map<string, Own>();
    let ignored = false;
    for (const { id, width, visible, pinned } of columns) {
      now.set(id, { width, visible, pinned });
      const was = previous?.get(id);
      if (!was || ignored) continue;
      const changed = {
        width: was.width !== width && shown.widths[id] !== width,
        visible: was.visible !== visible && !shown.hidden.includes(id) !== visible,
        pinned: was.pinned !== pinned && shown.pinned[id] !== pinned,
      };
      ignored = changed.width || changed.visible || changed.pinned;
    }
    before.current = now;
    if (ignored) devWarn(MESSAGE);
  }, [columns, shown]);
}
