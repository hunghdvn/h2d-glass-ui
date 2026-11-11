'use client';

import { clsx } from 'clsx';
import {
  cloneElement,
  createContext,
  forwardRef,
  Fragment,
  isValidElement,
  useContext,
  useId,
  useMemo,
} from 'react';
import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  LiHTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { keyedChildren } from '../../internal/child-keys';
import { collectChildren, markPart, partOf } from '../../internal/collect-children';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { ChevronIcon } from '../../internal/icons';
import { resolveLazy } from '../../internal/react-lazy';
import { hasModifier } from '../../internal/roving';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { AppShellContext } from '../app-shell/app-shell-context';
import { Badge } from '../badge/Badge';
import { Divider } from '../divider/Divider';
import {
  CountDot,
  firstLetter,
  noIconWarning,
  RailTooltip,
  useFlyout,
  useRailState,
} from './nav-rail';

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
  // Each child is keyed by its place in the children as written, its own key or its slot, so that a
  // child that comes or goes (`{cond && <NavItem />}`) does not remount the ones after it, and the
  // groups open in them keep their state and their focus.
  const nodes = keyedChildren(children);
  // An empty <nav> would still be a landmark that screen readers list.
  if (nodes.length === 0) return null;

  const blocks: ReactNode[] = [];
  let run: ReactNode[] = [];
  let runs = 0;
  // A run is keyed by its place among the runs, not among the blocks and not by the key of its first
  // item: a section that comes or goes before it, or an item at its head, does not remount it.
  const endRun = () => {
    if (run.length === 0) return;
    blocks.push(<NavList key={`list-${runs}`}>{run}</NavList>);
    runs += 1;
    run = [];
  };
  for (const { key, node } of nodes) {
    const block = <Fragment key={key}>{node}</Fragment>;
    if (partOf(node) === 'nav-section') {
      endRun();
      blocks.push(block);
    } else {
      // What is not recognised (a component of the user's own around an item) is taken for an item.
      run.push(block);
    }
  }
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
    const { railable, rail } = useRailState(nav?.level !== 'group');
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
        <RailTooltip rail={rail} label={label}>
          {link}
        </RailTooltip>
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

  // At the rail the button opens a flyout instead: the list of links itself becomes a popover, whose
  // state is not the `open` of the group (nav-rail.tsx).
  const { railable, rail } = useRailState(nav?.level !== 'group');
  const iconless = !hasContent(icon);
  if (railable && iconless) devWarn(noIconWarning('NavGroup'));
  const flyout = useFlyout(rail);

  const letter = railable && iconless ? firstLetter(label) : undefined;
  const button = (
    <button
      ref={flyout.buttonRef}
      type="button"
      id={buttonId}
      className="flg-nav-item"
      aria-expanded={rail ? flyout.open : open}
      aria-controls={listId}
      onPointerDown={rail ? flyout.press.onPointerDown : undefined}
      onPointerCancel={rail ? flyout.press.onPointerCancel : undefined}
      onClick={(event) => (rail ? flyout.press.onClick(event) : setOpen(!open))}
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
        onBlur={composeEventHandlers(onBlur, flyout.onBlur)}
        className={clsx('flg-nav-group', className)}
        data-open={dataAttr(open)}
        data-has-active={dataAttr(hasActive)}
      >
        {railable ? (
          // The tooltip of the button would cover the arrow of the flyout, so it gives way while that
          // shows.
          <RailTooltip rail={rail} show={rail && !flyout.open} label={label}>
            {button}
          </RailTooltip>
        ) : (
          button
        )}
        <div
          ref={flyout.contentRef}
          id={listId}
          className={clsx('flg-nav-sub', rail && 'flg-surface flg-popover')}
          popover={rail ? 'auto' : undefined}
          data-side={rail ? 'right' : undefined}
          data-align={rail ? 'start' : undefined}
          hidden={rail ? !flyout.open : !open}
        >
          {flyout.open ? (
            <span ref={flyout.arrowRef} className="flg-popover-arrow" aria-hidden="true" />
          ) : null}
          <div className="flg-nav-flyout-title" aria-hidden="true">
            {label}
          </div>
          <NavList aria-labelledby={buttonId} onClick={flyout.closeOnLink}>
            {children}
          </NavList>
        </div>
      </li>
    </NavContext.Provider>
  );
});
