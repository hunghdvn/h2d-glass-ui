import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { Point } from '../../menu/menu-context';
import { hasMenu } from '../engine/column-menu';
import type { ResolvedColumn } from '../engine/columns';
import { cellsOf } from '../grid-dom';
import { createExternalStore, useExternalStore } from './use-external-store';
import type { ExternalStore } from './use-external-store';

/**
 * What the one menu of the grid is about: the column, and where it opens (under a button, or at a
 * point). `open` is the only part that goes back and forth: a closed menu keeps its column, so its items
 * stay while the browser hides it and the focus is given back.
 */
export interface ColumnMenuView {
  readonly open: boolean;
  readonly columnId: string;
  /** The button the menu opens under, or `null` when it opens at `point`. */
  readonly from: HTMLElement | null;
  readonly point: Point | null;
}

/**
 * The menu's state, apart from what the rows read: the buttons of the titles and the menu read it, so
 * opening and closing it draws no row (spec phase 6 §3.8). `null` until the menu is first opened.
 */
export type ColumnMenuStore = ExternalStore<ColumnMenuView>;

/** One store for one grid. */
export const createColumnMenuStore = (): ColumnMenuStore => createExternalStore<ColumnMenuView>();

/** The state of the menu, `null` before it was opened (and on the server). */
export const useColumnMenuView = (store: ColumnMenuStore): ColumnMenuView | null =>
  useExternalStore(store);

export interface ColumnMenuOptions<TRow> {
  tableRef: RefObject<HTMLTableElement | null>;
  /** The shown columns, the column of boxes first when there is one. */
  columns: readonly ResolvedColumn<TRow>[];
  /** Whether more than one data column is shown. */
  hideable: boolean;
}

/** Where a menu opens: under a button, or at a point of the viewport. */
export type ColumnMenuPlace = { from: HTMLElement } | { point: Point };

export interface ColumnMenuControl {
  store: ColumnMenuStore;
  /**
   * Opens the menu of a column. Asked while it is open, it closes and opens afresh a task later: the
   * press that asks has already light-dismissed the menu, and the browser reports that a task later.
   */
  open: (columnId: string, place: ColumnMenuPlace) => void;
  close: () => void;
  /** The keys on a title: opens the menu under its button; nothing when the column has no button. */
  openFromKey: (columnId: string) => void;
  /** The press on a title, which a `contextmenu` that comes before it ends must wait for. */
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  /** The right press on a title: the menu at the pointer, where the column has one. */
  onContextMenu: (event: ReactMouseEvent<HTMLElement>, columnId: string) => void;
  /** Whether the menu of a column has an item: the button on its title is drawn only then. */
  hasItems: (columnId: string) => boolean;
}

interface Press {
  pointerId: number;
  /** Where the menu opens once the press ends: set by the `contextmenu` that came before the end. */
  armed: { columnId: string; point: Point } | null;
  stop: () => void;
}

/**
 * Opening the one menu of a grid (spec phase 6 §3.6, §6.3). A right press opens it when the press
 * ends: the browser light-dismisses a popover shown while a pointer is down as soon as that pointer
 * comes up, and WebKit and Firefox fire `contextmenu` before the button is released (the same rule as
 * `ContextMenuTrigger`'s). Everything the handlers read comes from the latest commit, so they are the
 * same functions for as long as the grid lives.
 */
export function useColumnMenu<TRow>(options: ColumnMenuOptions<TRow>): ColumnMenuControl {
  const latest = useRef(options);
  useWriteOnCommit(() => {
    latest.current = options;
  });
  const store = useMemo(createColumnMenuStore, []);
  const reopen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const press = useRef<Press | null>(null);

  const open = useCallback(
    (columnId: string, place: ColumnMenuPlace) => {
      clearTimeout(reopen.current);
      const view: ColumnMenuView = {
        open: true,
        columnId,
        from: 'from' in place ? place.from : null,
        point: 'point' in place ? place.point : null,
      };
      const now = store.get();
      if (now?.open) {
        store.set({ ...now, open: false });
        reopen.current = setTimeout(() => store.set(view), 0);
      } else {
        store.set(view);
      }
    },
    [store],
  );

  // A close does not cancel a reopening that is waiting: the focus that moves from the menu to the
  // button of another column ends the menu by a timer of its own, which comes after the close that
  // the reopening began with.
  const close = useCallback(() => {
    const now = store.get();
    if (now?.open) store.set({ ...now, open: false });
  }, [store]);

  const hasItems = useCallback((columnId: string) => {
    const { columns, hideable } = latest.current;
    const column = columns.find((candidate) => candidate.id === columnId);
    return column !== undefined && column.service === undefined && hasMenu(column, hideable);
  }, []);

  const openFromKey = useCallback(
    (columnId: string) => {
      const { columns, tableRef } = latest.current;
      const row = tableRef.current?.tHead?.rows[0];
      const index = columns.findIndex((column) => column.id === columnId);
      const button = row
        ? cellsOf(row)[index]?.querySelector<HTMLElement>('.flg-data-grid-head-button[data-more]')
        : null;
      if (button) open(columnId, { from: button });
    },
    [open],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      press.current?.stop();
      const { pointerId } = event;
      const current: Press = { pointerId, armed: null, stop: () => {} };
      // A cancelled press is followed by no `pointerup`, so there is no light dismiss to wait for.
      const onEnd = (end: PointerEvent) => {
        if (end.pointerId !== pointerId) return;
        current.stop();
        if (press.current === current) press.current = null;
        if (current.armed) open(current.armed.columnId, { point: current.armed.point });
      };
      current.stop = () => {
        document.removeEventListener('pointerup', onEnd, true);
        document.removeEventListener('pointercancel', onEnd, true);
      };
      document.addEventListener('pointerup', onEnd, true);
      document.addEventListener('pointercancel', onEnd, true);
      press.current = current;
    },
    [open],
  );

  const onContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>, columnId: string) => {
      if (!hasItems(columnId)) return;
      event.preventDefault();
      const point: Point = [event.clientX, event.clientY];
      if (press.current) {
        press.current.armed = { columnId, point };
        return;
      }
      // After the press (Chromium on Windows), or from assistive technology: open now.
      open(columnId, { point });
    },
    [hasItems, open],
  );

  useEffect(
    () => () => {
      clearTimeout(reopen.current);
      press.current?.stop();
      press.current = null;
    },
    [],
  );

  return useMemo(
    () => ({ store, open, close, openFromKey, onPointerDown, onContextMenu, hasItems }),
    [store, open, close, openFromKey, onPointerDown, onContextMenu, hasItems],
  );
}
