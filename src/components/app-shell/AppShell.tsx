'use client';

import { clsx } from 'clsx';
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { CloseIcon, MenuIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllableState } from '../../internal/use-controllable-state';
import { useMediaQuery } from '../../internal/use-media-query';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import type { ButtonProps } from '../button/Button';
import { IconButton } from '../icon-button/IconButton';
import {
  AppShellContext,
  AppShellSidebarContext,
  AppShellTextContext,
  PART_NAMES,
  useAppShellPart,
} from './app-shell-context';
import type {
  AppShellBreakpoint,
  AppShellContextValue,
  AppShellLabels,
  AppShellLayout,
  AppShellPart,
  AppShellTextValue,
} from './app-shell-context';
import { wideQuery } from './breakpoints';
import { useHeaderOffset } from './use-header-offset';
import { useSheet } from './use-sheet';

export type { AppShellBreakpoint, AppShellLabels, AppShellLayout } from './app-shell-context';

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  /** Where the sidebar and the header sit: the sidebar runs the full height, or the header the full width. */
  layout?: AppShellLayout;
  /** The width from which the sidebar is in the grid: `md` 768px, `lg` 1024px, `xl` 1280px. */
  breakpoint?: AppShellBreakpoint;
  /** Drawn at the head of the header and of the sidebar; `AppShellBrand` is made for it. */
  brand?: ReactNode;
  /** Whether the sidebar can fold into a rail on a wide screen. Default `true`. */
  collapsible?: boolean;
  /** Whether the sidebar is a rail (wide screens). Controlled; ignored when not `collapsible`. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Whether the sidebar is open as a sheet (narrow screens). Controlled. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<AppShellLabels>;
};
export type AppShellHeaderProps = HTMLAttributes<HTMLElement> & {
  /** Draws the button that opens and folds the sidebar, before the brand. Default `true`. */
  sidebarTrigger?: boolean;
};
/**
 * The props of a `Button`, less its name and content, which are the shell's, and less `asChild`: as
 * a slot the button would hand its props to its own icon, which cannot take focus or be registered.
 */
export type AppShellSidebarTriggerProps = Omit<
  ButtonProps,
  'aria-label' | 'aria-labelledby' | 'children' | 'asChild'
>;
export type AppShellSidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>;
export type AppShellMainProps = Omit<HTMLAttributes<HTMLElement>, 'id'>;
export type AppShellFooterProps = HTMLAttributes<HTMLElement>;

const DEFAULT_LABELS: AppShellLabels = {
  skipToContent: 'Skip to content',
  navigation: 'Navigation',
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
  collapseSidebar: 'Collapse sidebar',
  expandSidebar: 'Expand sidebar',
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
 *
 * It keeps two states, one for each kind of screen: `collapsed` (a rail, on a wide screen) and
 * `open` (the sidebar as a sheet, on a narrow one). Both can be controlled. A rail stays a rail when
 * the window crosses the breakpoint; an open sheet is closed by a window that grows wide, and a
 * parent that keeps `open` true gets nothing from it at that size.
 *
 * While the sheet is open on a narrow screen it is a modal one, though not a `<dialog>`: the sidebar
 * stays the one element of the grid (a `<dialog>` would need the navigation twice, or moved about
 * and its state lost). The rest of the frame is `inert`, the page does not scroll, Esc closes it and
 * focus goes in, then back to the button that opened it (use-sheet.ts).
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    layout,
    breakpoint,
    brand,
    collapsible,
    collapsed: collapsedProp,
    defaultCollapsed,
    onCollapsedChange,
    open: openProp,
    defaultOpen,
    onOpenChange,
    labels,
    className,
    children,
    ...props
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLAnchorElement>(null);
  const mainId = useId();
  const sidebarId = useId();
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const parts = useRef(new Map<AppShellPart, Set<HTMLElement>>());
  const triggers = useRef(new Set<HTMLElement>());
  const shellLayout = toLayout(layout);
  const shellBreakpoint = toBreakpoint(breakpoint);
  const canCollapse = collapsible !== false;
  const words = useMemo(() => withDefaults(DEFAULT_LABELS, labels), [labels]);
  const query = wideQuery(shellBreakpoint);
  const isWide = useMediaQuery(query);
  const [collapsedState, setCollapsedState] = useControllableState({
    value: collapsedProp,
    defaultValue: defaultCollapsed ?? false,
    onChange: onCollapsedChange,
    name: 'AppShell `collapsed`',
  });
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
    name: 'AppShell `open`',
  });
  const { modal, setOpen, shutOutLate, onScrimPointerDown, onScrimClick } = useSheet({
    open,
    setOpenState,
    isWide,
    wideQuery: query,
    root: rootRef,
    skipLink: skipRef,
    triggers,
  });
  // A sidebar that cannot fold is never a rail, whatever `collapsed` says.
  const collapsed = canCollapse && collapsedState;
  // Whether the rail is in effect: `collapsed` is the state, kept on a narrow screen too, where the
  // sidebar is a sheet and never a rail. The library draws its own rail from `data-collapsed` in the
  // generated media queries, so the server's HTML is right; `data-rail` is for what the caller draws
  // in the sidebar, which does not know the breakpoint. Only the window knows the width, so it comes
  // after hydration.
  const rail = collapsed && isWide;
  const setCollapsed = useCallback(
    (next: boolean) => {
      if (canCollapse) setCollapsedState(next);
    },
    [canCollapse, setCollapsedState],
  );
  useHeaderOffset(header);
  const wantsRail = collapsedProp !== undefined || defaultCollapsed !== undefined;
  useEffect(() => {
    if (!canCollapse && wantsRail) {
      devWarn(
        '<AppShell> has `collapsed` or `defaultCollapsed` but `collapsible` is false: the sidebar cannot collapse, so they are ignored.',
      );
    }
  }, [canCollapse, wantsRail]);

  const registerPart = useCallback(
    (part: AppShellPart, element: HTMLElement) => {
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
      // A part that comes while the sheet is open is shut out like the others.
      const release = part === 'sidebar' ? undefined : shutOutLate(element);
      return () => {
        elements.delete(element);
        release?.();
      };
    },
    [shutOutLate],
  );

  const registerTrigger = useCallback((element: HTMLElement) => {
    triggers.current.add(element);
    return () => {
      triggers.current.delete(element);
    };
  }, []);

  // The parts register in their own effects, which run before this one.
  useEffect(() => {
    if (!parts.current.get('main')?.size) {
      devWarn('<AppShell> has no <AppShellMain>: the skip link has nowhere to go.');
    }
    if (parts.current.get('sidebar')?.size && !triggers.current.size) {
      devWarn(
        '<AppShell> has a sidebar but no <AppShellSidebarTrigger>: on narrow screens the navigation cannot be opened.',
      );
    }
  }, []);

  const context = useMemo<AppShellContextValue>(
    () => ({
      layout: shellLayout,
      breakpoint: shellBreakpoint,
      isWide,
      collapsible: canCollapse,
      collapsed,
      setCollapsed,
      open,
      modal,
      setOpen,
      mainId,
      sidebarId,
      registerPart,
      registerTrigger,
      setHeader,
    }),
    [
      shellLayout,
      shellBreakpoint,
      isWide,
      canCollapse,
      collapsed,
      setCollapsed,
      open,
      modal,
      setOpen,
      mainId,
      sidebarId,
      registerPart,
      registerTrigger,
    ],
  );
  const text = useMemo<AppShellTextValue>(() => ({ labels: words, brand }), [words, brand]);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);

  // The link keeps its `href`, so it works before the page is hydrated. Once it is, the shell does
  // what the browser does for the fragment, without the fragment: with a hash router that would be
  // read as a page (a no-match page, and a bogus entry for Back). It scrolls the main to the top,
  // under the `scroll-padding-top` of the page, then focuses it. Focus alone would not do: it
  // scrolls only an element that is out of view, and the main seldom is, only its top.
  const skipToMain = (event: MouseEvent<HTMLAnchorElement>) => {
    const root = event.currentTarget.getRootNode() as Document | ShadowRoot;
    const main = root.getElementById(mainId);
    if (!main) return;
    event.preventDefault();
    main.scrollIntoView();
    main.focus({ preventScroll: true });
  };

  return (
    <AppShellContext.Provider value={context}>
      <AppShellTextContext.Provider value={text}>
        {/* The state attributes come after the caller's props: the CSS draws from them, so a
          `data-*` that a wrapper forwards must not make it draw another state than the shell keeps. */}
        <div
          {...props}
          ref={mergedRef}
          className={clsx('flg-app-shell', className)}
          data-layout={shellLayout}
          data-breakpoint={shellBreakpoint}
          data-collapsible={dataAttr(canCollapse)}
          data-collapsed={dataAttr(collapsed)}
          data-rail={dataAttr(rail)}
          data-open={dataAttr(open)}
        >
          <a
            ref={skipRef}
            className="flg-app-shell-skip flg-visually-hidden"
            href={`#${mainId}`}
            onClick={skipToMain}
          >
            {words.skipToContent}
          </a>
          {children}
          {modal ? (
            <div
              className="flg-app-shell-scrim"
              aria-hidden="true"
              onPointerDown={onScrimPointerDown}
              onClick={onScrimClick}
            />
          ) : null}
        </div>
      </AppShellTextContext.Provider>
    </AppShellContext.Provider>
  );
});

/**
 * The banner of the page, sticky at the top. It draws the button that opens and folds the sidebar,
 * then the brand, then what the caller puts in it: in that order, so the Tab key goes the way the eye
 * does. Where the sidebar runs the full height, the brand is in the sidebar on a wide screen and not
 * here.
 */
export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(function AppShellHeader(
  { sidebarTrigger = true, className, children, ...props },
  ref,
) {
  const own = useRef<HTMLElement>(null);
  const context = useAppShellPart('header', own);
  const brand = useContext(AppShellTextContext)?.brand;
  const setHeader = context?.setHeader;
  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own, setHeader), [ref, setHeader]);
  return (
    <header
      ref={mergedRef}
      className={clsx('flg-surface flg-app-shell-header', className)}
      {...props}
    >
      {sidebarTrigger ? <AppShellSidebarTrigger /> : null}
      {hasContent(brand) ? <span className="flg-app-shell-header-brand">{brand}</span> : null}
      {children}
    </header>
  );
});

/**
 * One button for the two things a sidebar does: on a narrow screen it opens the navigation, on a wide
 * one it folds the sidebar into a rail and back. Which it is only the window knows, and the server
 * does not, so the first render is the narrow one and a wide screen renames the button after
 * hydration (spec §3.5). `AppShellHeader` draws it; `sidebarTrigger={false}` leaves it to the caller.
 * With `collapsible={false}` the CSS hides it on a wide screen, where there is nothing for it to do.
 */
export const AppShellSidebarTrigger = forwardRef<HTMLButtonElement, AppShellSidebarTriggerProps>(
  function AppShellSidebarTrigger({ className, onClick, ...props }, ref) {
    const context = useContext(AppShellContext);
    const own = useRef<HTMLButtonElement>(null);
    const register = context?.registerTrigger;
    const mergedRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, own), [ref]);
    useEffect(() => {
      const element = own.current;
      if (!element) return undefined;
      if (!register) {
        devWarn('<AppShellSidebarTrigger> must be rendered inside <AppShell>.');
        return undefined;
      }
      return register(element);
    }, [register]);

    const labels = useContext(AppShellTextContext)?.labels ?? DEFAULT_LABELS;
    const rail = context?.isWide === true;
    const collapsed = context?.collapsed === true;
    const name = rail
      ? collapsed
        ? labels.expandSidebar
        : labels.collapseSidebar
      : labels.openNavigation;
    const toggle = () => {
      if (!context) return;
      if (context.isWide) context.setCollapsed(!context.collapsed);
      else context.setOpen(!context.open, { opener: own.current });
    };

    return (
      <IconButton
        variant="ghost"
        size="md"
        {...props}
        ref={mergedRef}
        className={clsx('flg-app-shell-trigger', className)}
        aria-label={name}
        aria-expanded={rail ? !collapsed : context?.open === true}
        aria-controls={context?.sidebarId}
        onClick={composeEventHandlers(onClick, toggle)}
      >
        <MenuIcon />
      </IconButton>
    );
  },
);

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
    const text = useContext(AppShellTextContext);
    const fallbackId = useId();
    const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
    // A sheet while it is open on a narrow screen: a dialog, with the name of the navigation. The
    // caller's own role and name come after and win.
    const sheet = context?.modal === true;
    const close = sheet ? (
      <IconButton
        variant="ghost"
        size="md"
        className="flg-app-shell-sidebar-close"
        aria-label={(text?.labels ?? DEFAULT_LABELS).closeNavigation}
        onClick={() => context.setOpen(false)}
      >
        <CloseIcon />
      </IconButton>
    ) : null;
    return (
      <div
        ref={mergedRef}
        className={clsx('flg-app-shell-sidebar', className)}
        role={sheet ? 'dialog' : undefined}
        aria-label={sheet ? (text?.labels ?? DEFAULT_LABELS).navigation : undefined}
        {...props}
        id={context?.sidebarId ?? fallbackId}
      >
        <div className="flg-surface flg-app-shell-sidebar-panel">
          {/* The button stands where the trigger and the brand stand in the header: after the brand
              where the brand is the sidebar's (S1), before it where the header has the trigger (S2). */}
          <div className="flg-app-shell-sidebar-head">
            {context?.layout === 'header' ? close : null}
            {text?.brand}
            {context?.layout === 'header' ? null : close}
          </div>
          <div className="flg-app-shell-sidebar-body">
            <AppShellSidebarContext.Provider value>{children}</AppShellSidebarContext.Provider>
          </div>
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
