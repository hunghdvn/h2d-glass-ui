import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import { devWarn } from '../../internal/warn';

/** Where focus goes when a menu opens. */
export type FocusOnOpen = 'first' | 'last' | 'menu' | 'none';

export type Point = readonly [number, number];

/** The whole menu tree, from the root menu to the deepest submenu. */
export interface MenuTreeContextValue {
  /** Closes every menu of the tree; focus goes back to where the root menu returns it. */
  closeAll: () => void;
}

/** One menu panel: the root menu or a submenu. */
export interface MenuLevelContextValue {
  contentRef: MutableRefObject<HTMLDivElement | null>;
  /** The panel is showing. A submenu waits for it: a nested popover shown first would be hidden. */
  open: boolean;
  /** The submenu open at this level: it closes when another item here is highlighted. */
  openSub: MutableRefObject<{ trigger: HTMLElement | null; close: () => void } | null>;
  /**
   * While the pointer travels from a sub-trigger to its submenu, it may cross other items of this
   * level. Inside this triangle, and until `until`, those items do not take the highlight.
   */
  pointerGrace: MutableRefObject<{ polygon: readonly Point[]; until: number } | null>;
}

export const MenuTreeContext = createContext<MenuTreeContextValue | null>(null);
export const MenuLevelContext = createContext<MenuLevelContextValue | null>(null);

const NO_TREE: MenuTreeContextValue = { closeAll: () => {} };
const NO_LEVEL: MenuLevelContextValue = {
  contentRef: { current: null },
  open: false,
  openSub: { current: null },
  pointerGrace: { current: null },
};

/** The menu a part sits in. Outside one, a dev warning and an inert stand-in. */
export function useMenu(part: string): {
  tree: MenuTreeContextValue;
  level: MenuLevelContextValue;
} {
  const tree = useContext(MenuTreeContext);
  const level = useContext(MenuLevelContext);
  if (!tree || !level) {
    devWarn(
      `<${part}> must be rendered inside a DropdownMenuContent, ContextMenuContent or MenuSubContent.`,
    );
    return { tree: NO_TREE, level: NO_LEVEL };
  }
  return { tree, level };
}

/** The items of one menu panel, in order: not those of a submenu nested in it. */
export function menuItems(content: HTMLElement | null): HTMLElement[] {
  if (!content) return [];
  return Array.from(content.querySelectorAll<HTMLElement>('[role^="menuitem"]')).filter(
    (el) => el.closest('[role="menu"]') === content,
  );
}

/** True when the point lies inside the polygon (ray casting). */
export function isPointInPolygon([x, y]: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i] as Point;
    const [xj, yj] = polygon[j] as Point;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
