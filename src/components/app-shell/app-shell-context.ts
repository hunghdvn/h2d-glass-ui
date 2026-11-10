import { createContext, useContext, useEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import { devWarn } from '../../internal/warn';

export type AppShellLayout = 'sidebar' | 'header';
export type AppShellBreakpoint = 'md' | 'lg' | 'xl';

/** The words an AppShell says; translate them here. */
export interface AppShellLabels {
  /** The text of the skip link, the first thing a keyboard reaches. */
  skipToContent: string;
}

/** The parts the shell lays out; each of them is a cell of its grid. */
export type AppShellPart = 'header' | 'sidebar' | 'main' | 'footer';

export const PART_NAMES: Record<AppShellPart, string> = {
  header: 'AppShellHeader',
  sidebar: 'AppShellSidebar',
  main: 'AppShellMain',
  footer: 'AppShellFooter',
};

/** What the shell hands to its parts: the ids they point at, the brand to draw, and the registry. */
export interface AppShellContextValue {
  layout: AppShellLayout;
  breakpoint: AppShellBreakpoint;
  labels: AppShellLabels;
  /** Drawn twice, at the head of the header and at the head of the sidebar; CSS shows one. */
  brand: ReactNode;
  mainId: string;
  sidebarId: string;
  /** Tells the shell that a part is mounted, for the dev warnings; returns the way to take it back. */
  registerPart: (part: AppShellPart, element: HTMLElement) => () => void;
  /** The header element, which the shell measures; `null` when there is none. */
  setHeader: (element: HTMLElement | null) => void;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);

/**
 * Registers a part with the shell once it is mounted, or warns that it is not inside one. A part
 * outside an `AppShell` still renders: it is only a misuse, and the library does not throw on those.
 */
export function useAppShellPart(
  part: AppShellPart,
  ref: RefObject<HTMLElement | null>,
): AppShellContextValue | null {
  const context = useContext(AppShellContext);
  // The function, not the context, is the dependency: the context changes with every `brand` and
  // `labels` of the caller, and the registry should not be told each time.
  const register = context?.registerPart;
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (!register) {
      devWarn(`<${PART_NAMES[part]}> must be rendered inside <AppShell>.`);
      return undefined;
    }
    return register(part, element);
  }, [register, part, ref]);
  return context;
}
