import { createContext, useContext, useEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import { devWarn } from '../../internal/warn';

export type AppShellLayout = 'sidebar' | 'header';
export type AppShellBreakpoint = 'md' | 'lg' | 'xl';

/** The words an AppShell says; translate them here. */
export interface AppShellLabels {
  /** The text of the skip link, the first thing a keyboard reaches. */
  skipToContent: string;
  /** The name of the sidebar while it is open as a sheet, which then is a dialog. */
  navigation: string;
  /** The name of the trigger on a narrow screen, where it opens the navigation. */
  openNavigation: string;
  /** The name of the button that closes the sheet. */
  closeNavigation: string;
  /** The name of the trigger on a wide screen while the sidebar is expanded. */
  collapseSidebar: string;
  /** The name of the trigger on a wide screen while the sidebar is a rail. */
  expandSidebar: string;
}

export interface AppShellSetOpenOptions {
  /**
   * Whether focus goes back to the button that opened the sheet once it is closed. Default `true`; a
   * close that follows a change of the window leaves the focus where it is.
   */
  returnFocus?: boolean;
  /** The button that opens the sheet, so that focus can come back to it. */
  opener?: HTMLElement | null;
}

/** The parts the shell lays out; each of them is a cell of its grid. */
export type AppShellPart = 'header' | 'sidebar' | 'main' | 'footer';

export const PART_NAMES: Record<AppShellPart, string> = {
  header: 'AppShellHeader',
  sidebar: 'AppShellSidebar',
  main: 'AppShellMain',
  footer: 'AppShellFooter',
};

/** What the shell hands to its parts: the ids they point at, the brand to draw, its state and the registry. */
export interface AppShellContextValue {
  layout: AppShellLayout;
  breakpoint: AppShellBreakpoint;
  labels: AppShellLabels;
  /**
   * Whether the window is at least as wide as the breakpoint. It is `false` on the server and while
   * hydrating, so the first render is the narrow one the HTML was written for.
   */
  isWide: boolean;
  /** Whether the sidebar can fold into a rail on a wide screen. */
  collapsible: boolean;
  /** Whether the sidebar is a rail; always `false` when it is not `collapsible`. */
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Whether the sidebar is open as a sheet on a narrow screen. */
  open: boolean;
  setOpen: (open: boolean, options?: AppShellSetOpenOptions) => void;
  /** Drawn twice, at the head of the header and at the head of the sidebar; CSS shows one. */
  brand: ReactNode;
  mainId: string;
  sidebarId: string;
  /** Tells the shell that a part is mounted, for the dev warnings; returns the way to take it back. */
  registerPart: (part: AppShellPart, element: HTMLElement) => () => void;
  /** Tells the shell that a trigger is mounted, so focus can go back to it; returns the way to take it back. */
  registerTrigger: (element: HTMLElement) => () => void;
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
