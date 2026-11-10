import type { AppShellBreakpoint } from './app-shell-context';

/**
 * The widths from which the sidebar is in the grid. The CSS of the wide screen is generated from the
 * same numbers (scripts/lib/app-shell-css.ts), and the shell asks the window the same question
 * (`useMediaQuery`), so what the script knows and what the stylesheet draws cannot disagree.
 */
export const APP_SHELL_BREAKPOINTS: Record<AppShellBreakpoint, number> = {
  md: 768,
  lg: 1024,
  xl: 1280,
};

/** The media query of a wide screen for a breakpoint, the one the generated CSS uses. */
export const wideQuery = (breakpoint: AppShellBreakpoint) =>
  `(min-width: ${APP_SHELL_BREAKPOINTS[breakpoint]}px)`;
