'use client';

import { clsx } from 'clsx';
import {
  cloneElement,
  createContext,
  forwardRef,
  Fragment,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AnchorHTMLAttributes,
  FocusEvent,
  HTMLAttributes,
  LiHTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { childKeys } from '../../internal/child-keys';
import {
  collectChildren,
  flattenChildren,
  markPart,
  partOf,
} from '../../internal/collect-children';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { ChevronIcon } from '../../internal/icons';
import { resolveLazy } from '../../internal/react-lazy';
import { hasModifier } from '../../internal/roving';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { AppShellContext, AppShellSidebarContext } from '../app-shell/app-shell-context';
import type { AppShellContextValue } from '../app-shell/app-shell-context';
import { Badge } from '../badge/Badge';
import { Divider } from '../divider/Divider';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../tooltip/Tooltip';

export type NavVariant = 'pill' | 'bar';

/** The words a Nav says; translate them here. */
export interface NavLabels {
  /** The name of the navigation landmark, unless the caller gives `aria-label` or `aria-labelledby`. */
  nav: string;
}

export type NavProps = HTMLAttributes<HTMLElement> & {
  /** The look of the items: a soft pill, or an accent bar on the left edge. Default `pill`. */
  variant?: NavVariant;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<NavLabels>;
};
export type NavSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** The heading of the section; it also names the group of links. */
  title?: ReactNode;
  /** Pushes the section to the foot of the sidebar, under a rule. */
  bottom?: boolean;
};
export type NavItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** The icon before the label. */
  icon?: ReactNode;
  /**
   * A number or a short text is drawn as the look asks (a Badge in `pill`, a plain count in `bar`); an
   * element is put in the last cell as it is. The text is part of the name of the link.
   */
  badge?: ReactNode;
  /** The page the person is on: `aria-current="page"`. Compute it from the current path. */
  active?: boolean;
  /** Not a link that goes anywhere: it stays in the list and cannot be reached. */
  disabled?: boolean;
  /** Render the single child element (a router's `Link`) as the link; its content is the label. */
  asChild?: boolean;
  children: ReactNode;
};
export type NavGroupProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> & {
  /** The name of the group, and the text of its button. */
  label: ReactNode;
  icon?: ReactNode;
  /** Whether the links of the group show. Controlled. */
  open?: boolean;
  /** Not given with `open`: the group starts open when one of its direct `NavItem`s is `active`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

const DEFAULT_LABELS: NavLabels = { nav: 'Main' };

/** Where in a Nav a part is, so that a part out of place is told and a NavItem knows its look. */
type NavLevel = 'nav' | 'section' | 'group';
interface NavContextValue {
  variant: NavVariant;
  level: NavLevel;
}
const NavContext = createContext<NavContextValue | null>(null);

// A value outside the union is a mistake that TypeScript did not see (plain JavaScript): the default.
const toVariant = (variant: unknown): NavVariant => (variant === 'bar' ? 'bar' : 'pill');

// The rail is 68px wide and its items 40px, so an item stands 14px in from its edge: a tooltip 20px
// from the item is 6px beyond the rail, as the mockup draws it (spec phase 5 §4.3).
const RAIL_TOOLTIP_OFFSET = 20;

const noIconWarning = (part: 'NavItem' | 'NavGroup') =>
  `<${part}> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead.`;

/** The count at the rail: the dot of the Indicator, in the corner of the item. */
function CountDot() {
  return <span className="flg-indicator-mark" data-dot data-status="accent" aria-hidden="true" />;
}
// The flyout stands 16px from the button, and 10px more is the room of its arrow, as a Popover's.
const FLYOUT_OFFSET = 26;
// It starts 6px above the button, so that its arrow, 20px from its top, points at the middle of it.
const FLYOUT_ALIGN_OFFSET = -6;

/** What a part of a Nav knows about the rail, which only the sidebar of an `AppShell` can be. */
interface RailState {
  /** The rail can be drawn here: a top-level part in the sidebar of a shell that can collapse. */
  railable: boolean;
  /** The rail is drawn now: the sidebar is collapsed on a wide screen (the generated CSS says the same). */
  rail: boolean;
}

function useRailState(level: NavLevel | undefined): RailState {
  const shell: AppShellContextValue | null = useContext(AppShellContext);
  const inSidebar = useContext(AppShellSidebarContext);
  if (!inSidebar || shell === null || !shell.collapsible || level === 'group') {
    return { railable: false, rail: false };
  }
  return { railable: true, rail: shell.collapsed && shell.isWide };
}

/** The first character of a label that is text, whole: what the rail shows for a part with no icon. */
function firstLetter(label: ReactNode): string | undefined {
  if (typeof label !== 'string') return undefined;
  const text = label.trim();
  // A character is more than a code unit: an emoji, or a letter with a mark written apart from it.
  if (typeof Intl.Segmenter === 'function') {
    return new Intl.Segmenter().segment(text)[Symbol.iterator]().next().value?.segment;
  }
  return Array.from(text)[0];
}

/**
 * The tooltip of a part of the rail. The Tooltip is in the tree all the time and only shown at the
 * rail, so that the link is not mounted again, and does not lose its focus, when the rail comes and
 * goes; that is why its state is controlled here.
 */
function useRailTooltip(show: boolean) {
  const [wanted, setWanted] = useState(false);
  return {
    open: show && wanted,
    onOpenChange: (next: boolean) => setWanted(show && next),
  };
}

/** The list of links. Safari drops the list semantics of a list with `list-style: none`. */
const NavList = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  function NavList(props, ref) {
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    return <ul ref={ref} role="list" className="flg-nav-list" {...props} />;
  },
);

/**
 * The navigation of an application: a landmark that holds the links, in sections and in groups of
 * links. It works on its own (in a Drawer, in a Card) and in the sidebar of an `AppShell`, where
 * its links close the sheet on a narrow screen. The items that stand next to each other outside a
 * `NavSection` are one list; each `NavSection` is another.
 */
export const Nav = forwardRef<HTMLElement, NavProps>(function Nav(
  { variant, labels, className, children, 'aria-label': ariaLabel, ...props },
  ref,
) {
  const words = withDefaults(DEFAULT_LABELS, labels);
  const look = toVariant(variant);
  const context = useMemo<NavContextValue>(() => ({ variant: look, level: 'nav' }), [look]);
  const nodes = flattenChildren(children);
  // An empty <nav> would still be a landmark that screen readers list.
  if (nodes.length === 0) return null;
  const keys = childKeys(nodes.map((node) => (isValidElement(node) ? node.key : null)));

  const blocks: ReactNode[] = [];
  let run: ReactNode[] = [];
  // A run is keyed by its place among the blocks, not by the key of its first item: an item that
  // comes or goes at the head of the list must not remount the run, and the groups open in it.
  const endRun = () => {
    if (run.length > 0) blocks.push(<NavList key={`list-${blocks.length}`}>{run}</NavList>);
    run = [];
  };
  nodes.forEach((node, index) => {
    // The child keeps its own key when it has one, so that reordering keyed children keeps the state
    // and the DOM node of each.
    const keyed = <Fragment key={keys[index]}>{node}</Fragment>;
    if (partOf(node) === 'nav-section') {
      endRun();
      blocks.push(keyed);
      return;
    }
    // What is not recognised (a component of the user's own around an item) is taken for an item.
    run.push(keyed);
  });
  endRun();

  const named = ariaLabel !== undefined || props['aria-labelledby'] !== undefined;
  return (
    <NavContext.Provider value={context}>
      {/* The look is written after the caller's props: the CSS draws from it. */}
      <nav
        ref={ref}
        aria-label={named ? ariaLabel : words.nav}
        {...props}
        className={clsx('flg-nav', className)}
        data-variant={look}
      >
        {blocks}
      </nav>
    </NavContext.Provider>
  );
});

/**
 * A block of items under a title. Without a title it is only the gap between two blocks; with
 * `bottom` it goes to the foot of the sidebar. It must be a direct child of `Nav`.
 */
export const NavSection = markPart(
  forwardRef<HTMLDivElement, NavSectionProps>(function NavSection(
    { title, bottom = false, className, children, ...props },
    ref,
  ) {
    const nav = useContext(NavContext);
    const titleId = useId();
    const look = nav?.variant ?? 'pill';
    const context = useMemo<NavContextValue>(() => ({ variant: look, level: 'section' }), [look]);
    if (nav?.level !== 'nav') devWarn('<NavSection> must be a direct child of <Nav>.');
    const titled = hasContent(title);
    // A name the caller gives is theirs: `aria-labelledby` would win over their `aria-label`.
    const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
    return (
      <NavContext.Provider value={context}>
        <div
          ref={ref}
          role={titled ? 'group' : undefined}
          aria-labelledby={titled && !named ? titleId : undefined}
          {...props}
          className={clsx('flg-nav-section', className)}
          data-bottom={dataAttr(bottom)}
        >
          {bottom ? <Divider decorative /> : null}
          {titled ? (
            <div className="flg-nav-section-title" id={titleId}>
              {title}
            </div>
          ) : null}
          <NavList>{children}</NavList>
        </div>
      </NavContext.Provider>
    );
  }),
  'nav-section',
);

// Runs in the capture phase, so neither the link's own `onClick` nor one of a child's fires, and
// `preventDefault()` stops the navigation.
function blockActivation(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * A link of the navigation. In the sheet that the sidebar of an `AppShell` is on a narrow screen, a
 * plain click on it closes the sheet and focus goes back to the button that opened it.
 */
export const NavItem = markPart(
  forwardRef<HTMLAnchorElement, NavItemProps>(function NavItem(
    {
      icon,
      badge,
      active = false,
      disabled = false,
      asChild = false,
      className,
      children,
      href,
      onClick,
      ...props
    },
    ref,
  ) {
    const nav = useContext(NavContext);
    // Only the part of the shell that does not change with its brand and its words, so that an inline
    // `brand` or `labels` does not render every link again.
    const setOpen = useContext(AppShellContext)?.setOpen;
    const { railable, rail } = useRailState(nav?.level);
    const tip = useRailTooltip(rail);
    if (!nav) devWarn('<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>.');
    const look = nav?.variant ?? 'pill';
    const iconless = !hasContent(icon);
    if (railable && iconless) devWarn(noIconWarning('NavItem'));

    // A plain click: Ctrl, Meta and Shift open the link somewhere else, Alt downloads it, and a
    // handler that called `preventDefault()` has taken the click for something of its own.
    // `setOpen(false)` does nothing when the sheet is not open.
    const closeSheet = (event: MouseEvent<HTMLElement>) => {
      if (event.shiftKey || hasModifier(event)) return;
      setOpen?.(false);
    };

    const count =
      typeof badge === 'number' || (typeof badge === 'string' && badge !== '') ? (
        look === 'bar' ? (
          <span className="flg-nav-item-count">{badge}</span>
        ) : (
          <Badge className="flg-nav-item-badge">{badge}</Badge>
        )
      ) : hasContent(badge) ? (
        badge
      ) : null;
    // What the link holds. The parts of the rail are in the HTML all the time and the CSS shows them
    // (the server does not know the window): the first letter where the icon would be, and the count
    // as a dot. A sidebar that cannot collapse has no rail, and a link outside a sidebar none.
    const inside = (label: ReactNode) => {
      const letter = railable && iconless ? firstLetter(label) : undefined;
      return (
        <>
          {!iconless ? (
            <span className="flg-nav-item-icon" aria-hidden="true">
              {icon}
            </span>
          ) : letter ? (
            <span className="flg-nav-item-letter" aria-hidden="true">
              {letter}
            </span>
          ) : null}
          <span className="flg-nav-item-label">{label}</span>
          {count}
          {railable && count !== null ? <CountDot /> : null}
        </>
      );
    };

    const shared = {
      ...props,
      className: clsx('flg-nav-item', className),
      'aria-current': props['aria-current'] ?? (active ? ('page' as const) : undefined),
      'aria-disabled': disabled ? true : props['aria-disabled'],
      onClick: composeEventHandlers(onClick, closeSheet),
      onClickCapture: disabled ? blockActivation : props.onClickCapture,
      onAuxClickCapture: disabled ? blockActivation : props.onAuxClickCapture,
    };

    // A Server Component can pass the child of `asChild` as a lazy reference, which says nothing about
    // the element until it is resolved.
    const element = asChild ? resolveLazy(children) : null;
    const label = isValidElement<{ children?: ReactNode }>(element)
      ? element.props.children
      : children;

    let link: ReactElement;
    if (asChild) {
      const child = isValidElement<{ children?: ReactNode }>(element)
        ? cloneElement(element, undefined, inside(label))
        : element;
      link = (
        <Slot ref={ref as Ref<HTMLElement>} {...shared} tabIndex={disabled ? -1 : props.tabIndex}>
          {child}
        </Slot>
      );
    } else if (disabled) {
      // An <a> without an `href` is not a link and cannot be reached, which is what a disabled one
      // is; the role says it is a link all the same, so its name and state are read.
      link = (
        <a ref={ref} role="link" {...shared}>
          {inside(children)}
        </a>
      );
    } else {
      link = (
        <a ref={ref} href={href} {...shared}>
          {inside(children)}
        </a>
      );
    }
    // A link that is disabled cannot be reached, which the Tooltip asks of its trigger, and its label
    // is not worth a tooltip to a person who cannot use it.
    if (!railable || disabled) return <li>{link}</li>;
    return (
      <li>
        <TooltipRoot describe={false} {...tip}>
          <TooltipTrigger>{link}</TooltipTrigger>
          {rail ? (
            <TooltipContent side="right" sideOffset={RAIL_TOOLTIP_OFFSET}>
              {label}
            </TooltipContent>
          ) : null}
        </TooltipRoot>
      </li>
    );
  }),
  'nav-item',
);

/**
 * A button that shows or hides a list of links under it: two levels at most. It is open from the
 * start when one of its direct `NavItem`s is `active`; a link that a component of the user's own
 * wraps is not seen, and then `defaultOpen` says it.
 */
export const NavGroup = forwardRef<HTMLLIElement, NavGroupProps>(function NavGroup(
  { label, icon, open: openProp, defaultOpen, onOpenChange, onBlur, className, children, ...props },
  ref,
) {
  const nav = useContext(NavContext);
  const buttonId = useId();
  const listId = useId();
  const look = nav?.variant ?? 'pill';
  const context = useMemo<NavContextValue>(() => ({ variant: look, level: 'group' }), [look]);
  if (!nav) devWarn('<NavGroup> must be rendered inside <Nav>, <NavSection> or <NavGroup>.');
  else if (nav.level === 'group') {
    devWarn('<NavGroup> inside <NavGroup> is not supported: navigation has at most two levels.');
  }
  // Read from the elements, not from what they render, so that it is the same on the server.
  const hasActive = collectChildren(children, { parts: ['nav-item'] }).some(
    (item) => item.props.active === true,
  );
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? hasActive,
    onChange: onOpenChange,
    name: 'NavGroup `open`',
  });

  // At the rail the button opens a flyout instead: the list of links itself becomes a popover. Its
  // state is the group's own and is not the `open` of the group, which is what the expanded sidebar
  // shows when it comes back (spec §6.3).
  const { railable, rail } = useRailState(nav?.level);
  const iconless = !hasContent(icon);
  if (railable && iconless) devWarn(noIconWarning('NavGroup'));
  const flyoutState = usePopoverState<HTMLDivElement>({
    open: undefined,
    defaultOpen: false,
    onOpenChange: undefined,
    name: 'NavGroup flyout',
  });
  const { report: setFlyout, request: requestFlyout } = flyoutState;
  const flyoutOpen = rail && flyoutState.open;
  // Leaving the rail closes the flyout for good: it does not open again with the next rail.
  useEffect(() => {
    if (!rail) setFlyout(false);
  }, [rail, setFlyout]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  // Focus stays on the button when it opens (a disclosure), so there is no `onShown`.
  usePopover(flyoutState.contentRef, {
    open: flyoutOpen,
    onOpenChange: setFlyout,
    pendingToggle: flyoutState.pendingToggle,
    restoreFocusTo: () => buttonRef.current,
  });
  useFloating({
    open: flyoutOpen,
    reference: () => buttonRef.current,
    floating: flyoutState.contentRef,
    side: 'right',
    align: 'start',
    offset: FLYOUT_OFFSET,
    alignOffset: FLYOUT_ALIGN_OFFSET,
    arrow: arrowRef,
  });
  const press = useTriggerPress(flyoutOpen, (wasOpen) => requestFlyout(!wasOpen));
  // The tooltip of the button would cover the arrow of the flyout, so it gives way while that shows.
  const tip = useRailTooltip(rail && !flyoutOpen);

  // Focus that leaves both the button and the flyout closes it. A press on the padding of the flyout
  // leaves focus on nothing (`relatedTarget` is null), which is not leaving: a press outside is the
  // browser's own light dismiss.
  const closeOnFocusLeaving = (event: FocusEvent<HTMLLIElement>) => {
    const next = event.relatedTarget;
    if (flyoutOpen && next instanceof Node && !event.currentTarget.contains(next)) {
      requestFlyout(false);
    }
  };
  // A link that is activated has taken the person where they were going.
  const closeOnLink = (event: MouseEvent<HTMLUListElement>) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (flyoutOpen && link && link.getAttribute('aria-disabled') !== 'true') requestFlyout(false);
  };

  const letter = railable && iconless ? firstLetter(label) : undefined;
  const button = (
    <button
      ref={buttonRef}
      type="button"
      id={buttonId}
      className="flg-nav-item"
      aria-expanded={rail ? flyoutOpen : open}
      aria-controls={listId}
      onPointerDown={rail ? press.onPointerDown : undefined}
      onPointerCancel={rail ? press.onPointerCancel : undefined}
      onClick={(event) => (rail ? press.onClick(event) : setOpen(!open))}
    >
      {!iconless ? (
        <span className="flg-nav-item-icon" aria-hidden="true">
          {icon}
        </span>
      ) : letter ? (
        <span className="flg-nav-item-letter" aria-hidden="true">
          {letter}
        </span>
      ) : null}
      <span className="flg-nav-item-label">{label}</span>
      <ChevronIcon className="flg-nav-group-chevron" />
    </button>
  );
  return (
    <NavContext.Provider value={context}>
      <li
        ref={ref}
        {...props}
        onBlur={composeEventHandlers(onBlur, closeOnFocusLeaving)}
        className={clsx('flg-nav-group', className)}
        data-open={dataAttr(open)}
        data-has-active={dataAttr(hasActive)}
      >
        {railable ? (
          <TooltipRoot describe={false} {...tip}>
            <TooltipTrigger>{button}</TooltipTrigger>
            {rail ? (
              <TooltipContent side="right" sideOffset={RAIL_TOOLTIP_OFFSET}>
                {label}
              </TooltipContent>
            ) : null}
          </TooltipRoot>
        ) : (
          button
        )}
        <div
          ref={flyoutState.contentRef}
          id={listId}
          className={clsx('flg-nav-sub', rail && 'flg-surface flg-popover')}
          popover={rail ? 'auto' : undefined}
          data-side={rail ? 'right' : undefined}
          data-align={rail ? 'start' : undefined}
          hidden={rail ? !flyoutOpen : !open}
        >
          {flyoutOpen ? (
            <span ref={arrowRef} className="flg-popover-arrow" aria-hidden="true" />
          ) : null}
          <div className="flg-nav-flyout-title" aria-hidden="true">
            {label}
          </div>
          <NavList aria-labelledby={buttonId} onClick={closeOnLink}>
            {children}
          </NavList>
        </div>
      </li>
    </NavContext.Provider>
  );
});
