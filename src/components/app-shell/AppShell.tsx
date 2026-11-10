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
import type { HTMLAttributes, ReactNode } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { focusFirst, returnFocus } from '../../internal/focus';
import { hasContent } from '../../internal/has-content';
import { CloseIcon, MenuIcon } from '../../internal/icons';
import { lockScroll } from '../../internal/lock-scroll';
import { mergeRefs } from '../../internal/merge-refs';
import { getTopModal } from '../../internal/modal-stack';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useMediaQuery } from '../../internal/use-media-query';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import type { ButtonProps } from '../button/Button';
import { IconButton } from '../icon-button/IconButton';
import { AppShellContext, PART_NAMES, useAppShellPart } from './app-shell-context';
import type {
  AppShellBreakpoint,
  AppShellContextValue,
  AppShellLabels,
  AppShellLayout,
  AppShellPart,
  AppShellSetOpenOptions,
} from './app-shell-context';
import { wideQuery } from './breakpoints';
import { useHeaderOffset } from './use-header-offset';

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
export type AppShellSidebarTriggerProps = Omit<
  ButtonProps,
  'aria-label' | 'aria-labelledby' | 'children'
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

// `:popover-open` is a selector that older engines, and jsdom, do not know; they throw on it, and
// have no popover to be open either.
function hasOpenPopover(root: HTMLElement): boolean {
  try {
    return root.querySelector(':popover-open') !== null;
  } catch {
    return false;
  }
}

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
 * focus goes in, then back to the button that opened it.
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
  // What the shell made inert, so it releases that and nothing the caller made inert.
  const inerted = useRef(new Set<HTMLElement>());
  const modalRef = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const focusBack = useRef(false);
  const shellLayout = toLayout(layout);
  const shellBreakpoint = toBreakpoint(breakpoint);
  const canCollapse = collapsible !== false;
  const words = useMemo(() => withDefaults(DEFAULT_LABELS, labels), [labels]);
  const isWide = useMediaQuery(wideQuery(shellBreakpoint));
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
  // The sheet: the sidebar as a modal layer. On a wide screen `open` does nothing, and a parent that
  // keeps it true there gets the sheet back when the window narrows.
  const modal = open && !isWide;
  const setOpen = useCallback(
    (next: boolean, { returnFocus: back = true, opener: from }: AppShellSetOpenOptions = {}) => {
      if (next && from !== undefined) opener.current = from;
      focusBack.current = !next && back;
      setOpenState(next);
    },
    [setOpenState],
  );
  // A sidebar that cannot fold is never a rail, whatever `collapsed` says.
  const collapsed = canCollapse && collapsedState;
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
    // A part that comes while the sheet is open is shut out like the others.
    if (modalRef.current && part !== 'sidebar' && !element.inert) {
      element.inert = true;
      inerted.current.add(element);
    }
    return () => {
      elements.delete(element);
      inerted.current.delete(element);
    };
  }, []);

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

  // A window that grows wide closes the sheet. It is the crossing that counts, not the state: a parent
  // that keeps `open` true is not asked again until the window has been narrow once more.
  const wasWide = useRef(isWide);
  useEffect(() => {
    if (isWide && !wasWide.current && open) setOpen(false, { returnFocus: false });
    wasWide.current = isWide;
  }, [isWide, open, setOpen]);

  // Everything the sheet does to the page, done after the commit that shows it and undone in the one
  // that hides it. `inert` goes on as a DOM property: React 18.3 does not know it as a boolean
  // attribute, and 19 does, so a prop would differ between them.
  useIsoLayoutEffect(() => {
    modalRef.current = modal;
    if (!modal) return undefined;
    // The parts register in effects that run after this one, so the shell finds its direct children
    // in the document, which is also where `inert` and the focus are about.
    const root = rootRef.current;
    const sidebar =
      root?.querySelector<HTMLElement>(':scope > .flg-app-shell-sidebar') ?? undefined;
    const shutOut = [
      skipRef.current,
      ...(root?.querySelectorAll<HTMLElement>(
        ':scope > :is(.flg-app-shell-header, .flg-app-shell-main, .flg-app-shell-footer)',
      ) ?? []),
    ];
    for (const element of shutOut) {
      if (element && !element.inert) {
        element.inert = true;
        inerted.current.add(element);
      }
    }
    if (
      shutOut.some(
        (element) => element?.matches('.flg-toaster') || element?.querySelector('.flg-toaster'),
      )
    ) {
      devWarn(
        '<Toaster> is inside a part of <AppShell> that goes inert while the navigation is open, so its toasts cannot be reached. Render it outside <AppShell> or as its direct child.',
      );
    }
    const release = lockScroll();
    if (sidebar) focusFirst(sidebar);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      // A dialog opened from the sidebar takes the key, and so does a popover that is open in it: the
      // browser closes that one as the default action of this very key press.
      if (getTopModal() || (sidebar && hasOpenPopover(sidebar))) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      modalRef.current = false;
      for (const element of inerted.current) element.inert = false;
      inerted.current.clear();
      release();
      if (focusBack.current) {
        const visible = [...triggers.current].find(
          (trigger) => trigger.checkVisibility?.() ?? true,
        );
        returnFocus(opener.current?.isConnected ? opener.current : visible, sidebar, visible);
      }
      focusBack.current = false;
    };
  }, [modal, setOpen]);

  const context = useMemo<AppShellContextValue>(
    () => ({
      layout: shellLayout,
      breakpoint: shellBreakpoint,
      labels: words,
      isWide,
      collapsible: canCollapse,
      collapsed,
      setCollapsed,
      open,
      setOpen,
      brand,
      mainId,
      sidebarId,
      registerPart,
      registerTrigger,
      setHeader,
    }),
    [
      shellLayout,
      shellBreakpoint,
      words,
      isWide,
      canCollapse,
      collapsed,
      setCollapsed,
      open,
      setOpen,
      brand,
      mainId,
      sidebarId,
      registerPart,
      registerTrigger,
    ],
  );
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);

  return (
    <AppShellContext.Provider value={context}>
      <div
        ref={mergedRef}
        className={clsx('flg-app-shell', className)}
        data-layout={shellLayout}
        data-breakpoint={shellBreakpoint}
        data-collapsible={dataAttr(canCollapse)}
        data-collapsed={dataAttr(collapsed)}
        data-open={dataAttr(open)}
        {...props}
      >
        <a ref={skipRef} className="flg-app-shell-skip flg-visually-hidden" href={`#${mainId}`}>
          {words.skipToContent}
        </a>
        {children}
        {modal ? (
          // A click that ends here after a selection that began in the sidebar has the shell as its
          // target, not this element, so it does not reach it.
          <div
            className="flg-app-shell-scrim"
            aria-hidden="true"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          />
        ) : null}
      </div>
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
  const setHeader = context?.setHeader;
  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own, setHeader), [ref, setHeader]);
  return (
    <header
      ref={mergedRef}
      className={clsx('flg-surface flg-app-shell-header', className)}
      {...props}
    >
      {sidebarTrigger ? <AppShellSidebarTrigger /> : null}
      {hasContent(context?.brand) ? (
        <span className="flg-app-shell-header-brand">{context?.brand}</span>
      ) : null}
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

    const labels = context?.labels ?? DEFAULT_LABELS;
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
    const fallbackId = useId();
    const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
    // A sheet while it is open on a narrow screen: a dialog, with the name of the navigation. The
    // caller's own role and name come after and win.
    const sheet = context !== null && context.open && !context.isWide;
    const close = sheet ? (
      <IconButton
        variant="ghost"
        size="md"
        className="flg-app-shell-sidebar-close"
        aria-label={context.labels.closeNavigation}
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
        aria-label={sheet ? context.labels.navigation : undefined}
        {...props}
        id={context?.sidebarId ?? fallbackId}
      >
        <div className="flg-surface flg-app-shell-sidebar-panel">
          {/* The button stands where the trigger and the brand stand in the header: after the brand
              where the brand is the sidebar's (S1), before it where the header has the trigger (S2). */}
          <div className="flg-app-shell-sidebar-head">
            {context?.layout === 'header' ? close : null}
            {context?.brand}
            {context?.layout === 'header' ? null : close}
          </div>
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
