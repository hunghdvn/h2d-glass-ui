'use client';

import { clsx } from 'clsx';
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { hasContent } from '../../internal/has-content';
import { mergeRefs } from '../../internal/merge-refs';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { AppShellContext, PART_NAMES, useAppShellPart } from './app-shell-context';
import type {
  AppShellBreakpoint,
  AppShellContextValue,
  AppShellLabels,
  AppShellLayout,
  AppShellPart,
} from './app-shell-context';
import { useHeaderOffset } from './use-header-offset';

export type { AppShellBreakpoint, AppShellLabels, AppShellLayout } from './app-shell-context';

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  /** Where the sidebar and the header sit: the sidebar runs the full height, or the header the full width. */
  layout?: AppShellLayout;
  /** The width from which the sidebar is in the grid: `md` 768px, `lg` 1024px, `xl` 1280px. */
  breakpoint?: AppShellBreakpoint;
  /** Drawn at the head of the header and of the sidebar; `AppShellBrand` is made for it. */
  brand?: ReactNode;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<AppShellLabels>;
};
export type AppShellHeaderProps = HTMLAttributes<HTMLElement>;
export type AppShellSidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>;
export type AppShellMainProps = Omit<HTMLAttributes<HTMLElement>, 'id'>;
export type AppShellFooterProps = HTMLAttributes<HTMLElement>;

const DEFAULT_LABELS: AppShellLabels = {
  skipToContent: 'Skip to content',
};

// A value outside the union is a mistake of a caller that TypeScript did not see (plain JavaScript,
// a value read from a cookie): it gets the default look, as every prop of the library does.
const toLayout = (layout: unknown): AppShellLayout => (layout === 'header' ? 'header' : 'sidebar');
const toBreakpoint = (breakpoint: unknown): AppShellBreakpoint =>
  breakpoint === 'md' || breakpoint === 'xl' ? breakpoint : 'lg';

/**
 * The frame of an application: a header, a sidebar, the main content and a footer, laid out on a
 * grid by CSS alone, so the HTML from the server is right at every width. The page scrolls with the
 * document, the header and the sidebar stick. The parts are its direct children, in any order.
 * Beside the layout it gives the page two rules of its own, on pages that render it: the margin of
 * `<body>` is dropped, and the height of the header is written on `<html>` so that what is scrolled
 * to is not left under it (see the docs).
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  { layout, breakpoint, brand, labels, className, children, ...props },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainId = useId();
  const sidebarId = useId();
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const parts = useRef(new Map<AppShellPart, Set<HTMLElement>>());
  const shellLayout = toLayout(layout);
  const shellBreakpoint = toBreakpoint(breakpoint);
  const words = useMemo(() => withDefaults(DEFAULT_LABELS, labels), [labels]);
  useHeaderOffset(header);

  const registerPart = useCallback((part: AppShellPart, element: HTMLElement) => {
    const elements = parts.current.get(part) ?? new Set<HTMLElement>();
    parts.current.set(part, elements);
    elements.add(element);
    const name = PART_NAMES[part];
    if (elements.size > 1) devWarn(`<AppShell> has more than one <${name}>.`);
    // The parts are cells of the grid of the shell, so an element around one takes its place.
    if (element.parentElement !== rootRef.current) {
      devWarn(
        `<${name}> must be a direct child of <AppShell>: a component around it is fine, an element around it is not.`,
      );
    }
    return () => {
      elements.delete(element);
    };
  }, []);

  // The parts register in their own effects, which run before this one.
  useEffect(() => {
    if (!parts.current.get('main')?.size) {
      devWarn('<AppShell> has no <AppShellMain>: the skip link has nowhere to go.');
    }
  }, []);

  const context = useMemo<AppShellContextValue>(
    () => ({
      layout: shellLayout,
      breakpoint: shellBreakpoint,
      labels: words,
      brand,
      mainId,
      sidebarId,
      registerPart,
      setHeader,
    }),
    [shellLayout, shellBreakpoint, words, brand, mainId, sidebarId, registerPart],
  );
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);

  return (
    <AppShellContext.Provider value={context}>
      <div
        ref={mergedRef}
        className={clsx('flg-app-shell', className)}
        data-layout={shellLayout}
        data-breakpoint={shellBreakpoint}
        {...props}
      >
        <a className="flg-app-shell-skip flg-visually-hidden" href={`#${mainId}`}>
          {words.skipToContent}
        </a>
        {children}
      </div>
    </AppShellContext.Provider>
  );
});

/**
 * The banner of the page, sticky at the top. The brand comes first, then what the caller puts in it.
 * Where the sidebar runs the full height, the brand is in the sidebar on a wide screen and not here.
 */
export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(function AppShellHeader(
  { className, children, ...props },
  ref,
) {
  const own = useRef<HTMLElement>(null);
  const context = useAppShellPart('header', own);
  const setHeader = context?.setHeader;
  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own, setHeader), [ref, setHeader]);
  return (
    <header
      ref={mergedRef}
      className={clsx('flg-surface flg-app-shell-header', className)}
      {...props}
    >
      {hasContent(context?.brand) ? (
        <span className="flg-app-shell-header-brand">{context?.brand}</span>
      ) : null}
      {children}
    </header>
  );
});

/**
 * The navigation column. It is not a landmark; the `Nav` inside it is. The element is the cell of the
 * grid and has no look of its own: the glass is the panel in it, which is the part that sticks. A
 * sticky box is held by the content box of its parent, not by the grid area it sits in, so a panel
 * that was the cell itself could not be stopped by the footer at the end of the page; in a parent
 * that fills the cell it is. The body of the panel scrolls on its own when its content is taller
 * than the screen.
 */
export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
  function AppShellSidebar({ className, children, ...props }, ref) {
    const own = useRef<HTMLDivElement>(null);
    const context = useAppShellPart('sidebar', own);
    const fallbackId = useId();
    const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
    return (
      <div
        ref={mergedRef}
        className={clsx('flg-app-shell-sidebar', className)}
        {...props}
        id={context?.sidebarId ?? fallbackId}
      >
        <div className="flg-surface flg-app-shell-sidebar-panel">
          <div className="flg-app-shell-sidebar-head">{context?.brand}</div>
          <div className="flg-app-shell-sidebar-body">{children}</div>
        </div>
      </div>
    );
  },
);

/** The content of the page, and the place the skip link goes to. */
export const AppShellMain = forwardRef<HTMLElement, AppShellMainProps>(function AppShellMain(
  { className, children, ...props },
  ref,
) {
  const own = useRef<HTMLElement>(null);
  const context = useAppShellPart('main', own);
  const fallbackId = useId();
  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own), [ref]);
  return (
    <main
      ref={mergedRef}
      className={clsx('flg-app-shell-main', className)}
      tabIndex={-1}
      {...props}
      id={context?.mainId ?? fallbackId}
    >
      {children}
    </main>
  );
});

/** The strip at the foot of the page. */
export const AppShellFooter = forwardRef<HTMLElement, AppShellFooterProps>(function AppShellFooter(
  { className, children, ...props },
  ref,
) {
  const own = useRef<HTMLElement>(null);
  useAppShellPart('footer', own);
  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own), [ref]);
  return (
    <footer
      ref={mergedRef}
      className={clsx('flg-surface flg-app-shell-footer', className)}
      {...props}
    >
      {children}
    </footer>
  );
});
