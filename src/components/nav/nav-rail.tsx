import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { FocusEvent, ReactElement, ReactNode } from 'react';
import { useFloating } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { AppShellContext, AppShellSidebarContext } from '../app-shell/app-shell-context';
import type { AppShellContextValue } from '../app-shell/app-shell-context';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../tooltip/Tooltip';

// The parts of the Nav that only the rail has (spec phase 5 §4.3, §6.3): what a part knows about the
// rail, its tooltip, the first letter and the dot of a count, and the flyout of a group. Its look is
// in the generated rules of the AppShell (scripts/lib/app-shell-css.ts).

/** What a part of a Nav knows about the rail, which only the sidebar of an `AppShell` can be. */
export interface RailState {
  /** The rail can be drawn here: a top-level part in the sidebar of a shell that can collapse. */
  railable: boolean;
  /** The rail is drawn now: the sidebar is collapsed on a wide screen (the generated CSS says the same). */
  rail: boolean;
}

/** `topLevel` is false for the links of a group, which the flyout draws with their labels. */
export function useRailState(topLevel: boolean): RailState {
  const shell: AppShellContextValue | null = useContext(AppShellContext);
  const inSidebar = useContext(AppShellSidebarContext);
  if (!inSidebar || shell === null || !shell.collapsible || !topLevel) {
    return { railable: false, rail: false };
  }
  return { railable: true, rail: shell.collapsed && shell.isWide };
}

export const noIconWarning = (part: 'NavItem' | 'NavGroup') =>
  `<${part}> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.`;

/** The first character of a label that is text, whole: what the rail shows for a part with no icon. */
export function firstLetter(label: ReactNode): string | undefined {
  if (typeof label !== 'string') return undefined;
  const text = label.trim();
  // A character is more than a code unit: an emoji, or a letter with a mark written apart from it.
  if (typeof Intl.Segmenter === 'function') {
    return new Intl.Segmenter().segment(text)[Symbol.iterator]().next().value?.segment;
  }
  return Array.from(text)[0];
}

/** The count at the rail: the dot of the Indicator, in the corner of the item. */
export function CountDot() {
  return <span className="flg-indicator-mark" data-dot data-status="accent" aria-hidden="true" />;
}

/** How far beyond the rail a tooltip stands, as the mockup draws it (spec phase 5 §4.3). */
const BEYOND_THE_RAIL = 6;

/**
 * The distance from the item to its tooltip: from the item to the right edge of the rail, which
 * follows `--flg-app-shell-rail-width`, and 6px more. It is rounded down to a whole pixel: with the
 * 1px border of the panel an item of an even rail stands half a pixel off the middle, and the
 * default 68px rail keeps the 20px of the mockup.
 */
function railTooltipOffset(item: HTMLElement | null): number {
  const panel = item?.closest('.flg-app-shell-sidebar-panel');
  if (!item || !panel) return BEYOND_THE_RAIL;
  const toEdge = panel.getBoundingClientRect().right - item.getBoundingClientRect().right;
  return Math.floor(toEdge) + BEYOND_THE_RAIL;
}

export interface RailTooltipProps {
  /** The rail is drawn: the tooltip is in the page. */
  rail: boolean;
  /** It may show now. Default `rail`; a group's button gives way to its open flyout. */
  show?: boolean;
  label: ReactNode;
  /** The link or the button. */
  children: ReactElement;
}

/**
 * The tooltip of a part of the rail, with its label. The Tooltip is in the tree all the time and only
 * shown at the rail, so that the link is not mounted again, and does not lose its focus, when the
 * rail comes and goes; that is why its state is controlled here. The label is the name of the link
 * already, so the tooltip does not describe it (`describe={false}`). Its distance from the item is
 * measured each time it opens, so that it follows the width of the rail.
 */
export function RailTooltip({ rail, show = rail, label, children }: RailTooltipProps) {
  const [wanted, setWanted] = useState(false);
  const [offset, setOffset] = useState(BEYOND_THE_RAIL);
  const item = useRef<HTMLElement>(null);
  // The wish to show it ends when it may not show: the window narrowed under the item, or the flyout
  // of a group opened over it. Nothing tells the Tooltip that the pointer or the focus went away in
  // the meantime, so it must not open by itself when it may show again. Set during the render, as
  // React does for state that follows a prop, so no commit keeps the old wish.
  if (!show && wanted) setWanted(false);
  const onOpenChange = (next: boolean) => {
    if (show && next) setOffset(railTooltipOffset(item.current));
    setWanted(show && next);
  };
  return (
    <TooltipRoot describe={false} open={show && wanted} onOpenChange={onOpenChange}>
      <TooltipTrigger ref={item}>{children}</TooltipTrigger>
      {rail ? (
        <TooltipContent side="right" sideOffset={offset}>
          {label}
        </TooltipContent>
      ) : null}
    </TooltipRoot>
  );
}

// The flyout stands 16px from the button, and 10px more is the room of its arrow, as a Popover's.
const FLYOUT_OFFSET = 26;
// It starts 6px above the button, so that its arrow, 20px from its top, points at the middle of it.
const FLYOUT_ALIGN_OFFSET = -6;

/**
 * The flyout of a group at the rail: the button opens the list of links itself as a popover. Its state
 * is the group's own and is not the `open` of the group, which is what the expanded sidebar shows when
 * it comes back (spec §6.3). Focus stays on the button when it opens (a disclosure), so there is no
 * `onShown`; Esc and a press outside are the browser's, and focus goes back to the button.
 */
export function useFlyout(rail: boolean) {
  const state = usePopoverState<HTMLDivElement>({
    open: undefined,
    defaultOpen: false,
    onOpenChange: undefined,
    name: 'NavGroup flyout',
  });
  const { report, request, contentRef } = state;
  const open = rail && state.open;
  // Leaving the rail closes the flyout for good: it does not open again with the next rail.
  useEffect(() => {
    if (!rail) report(false);
  }, [rail, report]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  usePopover(contentRef, {
    open,
    onOpenChange: report,
    pendingToggle: state.pendingToggle,
    restoreFocusTo: () => buttonRef.current,
  });
  useFloating({
    open,
    reference: () => buttonRef.current,
    floating: contentRef,
    side: 'right',
    align: 'start',
    offset: FLYOUT_OFFSET,
    alignOffset: FLYOUT_ALIGN_OFFSET,
    arrow: arrowRef,
  });
  const press = useTriggerPress(open, (wasOpen) => request(!wasOpen));

  // Focus that leaves both the button and the flyout closes it. A press on the padding of the flyout
  // leaves focus on nothing (`relatedTarget` is null), which is not leaving: a press outside is the
  // browser's own light dismiss.
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (open && next instanceof Node && !event.currentTarget.contains(next)) request(false);
  };
  // A link that took the person where they were going closes it. Each NavItem of the group calls it,
  // from its own click handler, on a plain click only (internal/click.ts), as it closes the sheet: a
  // listener on the list would hear the click after a router's link has called `preventDefault()`
  // to navigate by itself, and could not tell it from a click that a handler kept on the page. It
  // reads the state of the last commit, so that it keeps its identity, and so does the context of
  // the group that hands it to the links.
  const openNow = useRef(open);
  useWriteOnCommit(() => {
    openNow.current = open;
  });
  const close = useCallback(() => {
    if (openNow.current) request(false);
  }, [request]);

  return { open, contentRef, buttonRef, arrowRef, press, onBlur, close };
}
