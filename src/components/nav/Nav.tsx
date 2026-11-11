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
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { AppShellContext } from '../app-shell/app-shell-context';
import { Badge } from '../badge/Badge';
import { Divider } from '../divider/Divider';

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
    if (!nav) devWarn('<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>.');
    const look = nav?.variant ?? 'pill';

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
    const inside = (label: ReactNode) => (
      <>
        {hasContent(icon) ? (
          <span className="flg-nav-item-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="flg-nav-item-label">{label}</span>
        {count}
      </>
    );

    const shared = {
      ...props,
      className: clsx('flg-nav-item', className),
      'aria-current': props['aria-current'] ?? (active ? ('page' as const) : undefined),
      'aria-disabled': disabled ? true : props['aria-disabled'],
      onClick: composeEventHandlers(onClick, closeSheet),
      onClickCapture: disabled ? blockActivation : props.onClickCapture,
      onAuxClickCapture: disabled ? blockActivation : props.onAuxClickCapture,
    };

    let link: ReactNode;
    if (asChild) {
      // A Server Component can pass the child as a lazy reference, which says nothing about the
      // element until it is resolved.
      const element = resolveLazy(children);
      const child = isValidElement<{ children?: ReactNode }>(element)
        ? cloneElement(element, undefined, inside(element.props.children))
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
    return <li>{link}</li>;
  }),
  'nav-item',
);

/**
 * A button that shows or hides a list of links under it: two levels at most. It is open from the
 * start when one of its direct `NavItem`s is `active`; a link that a component of the user's own
 * wraps is not seen, and then `defaultOpen` says it.
 */
export const NavGroup = forwardRef<HTMLLIElement, NavGroupProps>(function NavGroup(
  { label, icon, open: openProp, defaultOpen, onOpenChange, className, children, ...props },
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
  return (
    <NavContext.Provider value={context}>
      <li
        ref={ref}
        {...props}
        className={clsx('flg-nav-group', className)}
        data-open={dataAttr(open)}
        data-has-active={dataAttr(hasActive)}
      >
        <button
          type="button"
          id={buttonId}
          className="flg-nav-item"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen(!open)}
        >
          {hasContent(icon) ? (
            <span className="flg-nav-item-icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className="flg-nav-item-label">{label}</span>
          <ChevronIcon className="flg-nav-group-chevron" />
        </button>
        <div className="flg-nav-sub" id={listId} hidden={!open}>
          <NavList aria-labelledby={buttonId}>{children}</NavList>
        </div>
      </li>
    </NavContext.Provider>
  );
});
