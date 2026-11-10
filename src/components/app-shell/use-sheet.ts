import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, RefObject } from 'react';
import { focusFirst, returnFocus } from '../../internal/focus';
import { lockScroll } from '../../internal/lock-scroll';
import { getTopModal } from '../../internal/modal-stack';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import type { AppShellSetOpenOptions } from './app-shell-context';

/**
 * An open popover that Esc closes, the selector of the Tooltip: the browser closes an auto (or hint)
 * popover as the default action of the key, so the key is that popover's. A manual popover stays open
 * on Esc, so it must not swallow the key for the sheet.
 */
const OPEN_POPOVER_CLOSES_ON_ESC = '[popover]:not([popover="manual"]):popover-open';

// `:popover-open` is a selector that older engines, and jsdom, do not know; they throw on it, and
// have no popover to be open either.
function hasOpenPopover(root: HTMLElement): boolean {
  try {
    return root.querySelector(OPEN_POPOVER_CLOSES_ON_ESC) !== null;
  } catch {
    return false;
  }
}

/** The first trigger that is shown, where focus goes when the one that opened the sheet is gone. */
const firstVisible = (triggers: Iterable<HTMLElement>) =>
  [...triggers].find((trigger) => trigger.checkVisibility?.() ?? true);

export interface SheetOptions {
  /** Whether the sheet is open, as the state of the shell says. */
  open: boolean;
  /** Sets that state, and tells `onOpenChange`. */
  setOpenState: (open: boolean) => void;
  /** Whether the window is wide, as the shell renders it. */
  isWide: boolean;
  /** The media query of a wide screen at the breakpoint of the shell. */
  wideQuery: string;
  /** The root of the shell, whose direct children are the parts. */
  root: RefObject<HTMLDivElement | null>;
  /** The skip link, which is shut out with the parts. */
  skipLink: RefObject<HTMLAnchorElement | null>;
  /** The triggers that are mounted, in the order they mounted. */
  triggers: RefObject<Set<HTMLElement>>;
}

export interface Sheet {
  /** Whether the sheet is open on a narrow screen: the one state in which it does anything. */
  modal: boolean;
  setOpen: (open: boolean, options?: AppShellSetOpenOptions) => void;
  /** Shuts out a part that mounts while the sheet is open, as the others are; returns the release. */
  shutOutLate: (element: HTMLElement) => () => void;
  /** The press and click handlers of the scrim. */
  onScrimPointerDown: () => void;
  onScrimClick: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * The sidebar as a modal sheet on a narrow screen (spec §3.4): what it does to the page while it is
 * open, how it closes, and where the focus goes when it has closed.
 *
 * The focus goes back to the trigger that opened it, or to the first trigger that is shown, on every
 * close: Esc, the scrim, the close button, a `setOpen(false)` of the context, or a parent that owns
 * `open` setting it false. Two closes leave it alone. One asks so (`returnFocus: false`). The other is
 * a window that grew wide: the sidebar is a column of the grid again, so focus in it stays where it
 * is; only focus on the close button, which goes with the sheet, falls to the body, and that is taken
 * to the trigger. Which close it was is decided when the sheet is put away, from the window itself,
 * as the effect that follows the window runs after that.
 */
export function useSheet({
  open,
  setOpenState,
  isWide,
  wideQuery,
  root,
  skipLink,
  triggers,
}: SheetOptions): Sheet {
  // The sheet: the sidebar as a modal layer. On a wide screen `open` does nothing, and a parent that
  // keeps it true there gets the sheet back when the window narrows.
  const modal = open && !isWide;
  // What the shell made inert, so it releases that and nothing the caller made inert.
  const inerted = useRef(new Set<HTMLElement>());
  const modalRef = useRef(false);
  // The trigger that opened the sheet, and whether the close that comes asked to leave the focus;
  // both are forgotten once the sheet has closed.
  const opener = useRef<HTMLElement | null>(null);
  const keepFocus = useRef(false);
  const unmounting = useRef(false);

  const setOpen = useCallback(
    (next: boolean, { returnFocus: back = true, opener: from }: AppShellSetOpenOptions = {}) => {
      if (next) opener.current = from ?? null;
      keepFocus.current = !next && !back;
      setOpenState(next);
    },
    [setOpenState],
  );

  const shutOutLate = useCallback((element: HTMLElement) => {
    if (modalRef.current && !element.inert) {
      element.inert = true;
      inerted.current.add(element);
    }
    // The release gives the element back as it was: a registration that runs again on the same element
    // while the sheet is open (StrictMode, an `<Activity>` shown again) would otherwise find it inert,
    // take it for the caller's, and leave it inert once the sheet has closed.
    return () => {
      if (inerted.current.delete(element)) element.inert = false;
    };
  }, []);

  // A press on the scrim while a popover in the sidebar is open (a menu, a Select) light-dismisses
  // that popover, and that is all it does, as a press outside a Dialog: by the click the popover is
  // gone, so whether it was open is noted when the press starts. A manual popover does not close on
  // a press, so it does not count.
  const pressDismissed = useRef(false);
  const onScrimPointerDown = useCallback(() => {
    const sidebar = root.current?.querySelector<HTMLElement>(':scope > .flg-app-shell-sidebar');
    pressDismissed.current = sidebar ? hasOpenPopover(sidebar) : false;
  }, [root]);

  const onScrimClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const dismissed = pressDismissed.current;
      pressDismissed.current = false;
      // A click that ends here after a selection that began in the sidebar has the shell as its
      // target, not this element, so it does not reach it.
      if (!dismissed && event.target === event.currentTarget) setOpen(false);
    },
    [setOpen],
  );

  // A window that grows wide closes the sheet. It is the crossing that counts, not the state: a parent
  // that keeps `open` true is not asked again until the window has been narrow once more. The state is
  // set directly: where the focus goes was decided when the sheet was put away, before this runs.
  const wasWide = useRef(isWide);
  useEffect(() => {
    if (isWide && !wasWide.current && open) setOpenState(false);
    wasWide.current = isWide;
  }, [isWide, open, setOpenState]);
  // Declared after the effect above, so on mount the window has the last word: a page that hydrates
  // on a wide screen renders the narrow frame once (`useMediaQuery` is false while hydrating), and
  // the render that follows is not a window that grew wide.
  useEffect(() => {
    wasWide.current = window.matchMedia?.(wideQuery).matches ?? false;
  }, [wideQuery]);

  // Declared before the sheet's effect, so on unmount its cleanup runs first and tells that one that
  // the shell is going, not the sheet closing: then there is nowhere to send the focus.
  useIsoLayoutEffect(() => {
    unmounting.current = false;
    return () => {
      unmounting.current = true;
    };
  }, []);

  // Everything the sheet does to the page, done after the commit that shows it and undone in the one
  // that hides it. `inert` goes on as a DOM property: React 18.3 does not know it as a boolean
  // attribute, and 19 does, so a prop would differ between them.
  useIsoLayoutEffect(() => {
    // The narrow frame that a page hydrating on a wide screen renders once shows no sheet, whatever
    // the render says: nothing of it is done, so the page is neither shut out, locked nor focused.
    const shown = modal && !window.matchMedia?.(wideQuery).matches;
    modalRef.current = shown;
    if (!shown) return undefined;
    // The parts register in effects that run after this one, so the shell finds its direct children
    // in the document, which is also where `inert` and the focus are about.
    const shell = root.current;
    const sidebar =
      shell?.querySelector<HTMLElement>(':scope > .flg-app-shell-sidebar') ?? undefined;
    const shutOut = [
      skipLink.current,
      ...(shell?.querySelectorAll<HTMLElement>(
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
      // A dialog opened from the sidebar takes the key, and so does a popover open in it that Esc
      // closes: the browser closes that one as the default action of this very key press.
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
      const from = opener.current;
      const keep = keepFocus.current;
      opener.current = null;
      keepFocus.current = false;
      if (keep || unmounting.current) return;
      const visible = firstVisible(triggers.current);
      // The cleanup runs in the commit that hides the sheet, before the effect that follows the
      // window: the window itself says whether it grew wide.
      if (window.matchMedia?.(wideQuery).matches) {
        const active = document.activeElement;
        if (active === null || active === document.body) visible?.focus({ preventScroll: true });
        return;
      }
      returnFocus(from?.isConnected ? from : visible, sidebar, visible);
    };
  }, [modal, setOpen, wideQuery, root, skipLink, triggers]);

  return { modal, setOpen, shutOutLate, onScrimPointerDown, onScrimClick };
}
