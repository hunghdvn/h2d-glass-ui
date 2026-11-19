import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  LiHTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { devWarn } from '../../internal/warn';

export type ListVariant = 'inset' | 'cards' | 'plain';

export type ListProps = HTMLAttributes<HTMLUListElement> & {
  variant?: ListVariant;
  size?: 'sm' | 'md';
  /**
   * Whether an `inset` list is a block of glass of its own. Pass `false` for a list that sits in a
   * panel that is already glass (a Popover, a Card, a Dialog): the rows run to the edges of the panel
   * and there is no second layer of glass, border and shadow. Has no effect on another variant.
   * Default `true`.
   */
  surface?: boolean;
};

/** What the library puts on the `<a>` of a link row, for `renderLink` to pass on. */
export type ListItemLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  className: string;
  children: ReactNode;
};

export type ListItemProps = Omit<
  LiHTMLAttributes<HTMLLIElement>,
  'title' | 'onSelect' | 'value'
> & {
  /** The name of the row, and the link or button that a pressable row stretches over itself. */
  title?: ReactNode;
  description?: ReactNode;
  /** The cell before the text: an Avatar or an icon. */
  start?: ReactNode;
  /** The cell after the text: a Badge, a date, a chevron or a button. */
  end?: ReactNode;
  /** Makes the title a link. Needs a `title`. */
  href?: string;
  /**
   * Renders the link of a row that has an `href`, for a router's `Link`:
   * `renderLink={(props) => <Link {...props} />}`. Pass every prop on. It is not called for a
   * disabled row, which gets the library's own `<a role="link" aria-disabled="true">` without an
   * `href`: a router link needs somewhere to go. Ignored, with a warning, without `href`.
   */
  renderLink?: (props: ListItemLinkProps) => ReactElement;
  /** Makes the title a button. Ignored when there is an `href`. Needs a `title`. */
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The row of the page the person is on. */
  current?: boolean;
  /** Only has an effect on a row that can be pressed. */
  disabled?: boolean;
};

/**
 * A list of rows to read, in one of three looks, with the rows that lead somewhere pressable
 * anywhere on them. It is a list of things to show, not a listbox that chooses a value. It has no
 * state and no hook, so it renders in a Server Component.
 */
export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  { variant = 'inset', size = 'md', surface = true, className, ...props },
  ref,
) {
  // The glass belongs to `inset` alone, so `false` has something to take away only there.
  if (!surface && variant !== 'inset') {
    devWarn(
      '<List> surface={false} only has an effect on variant="inset"; the other variants draw no glass of their own.',
    );
  }
  const flat = !surface && variant === 'inset';
  return (
    // Safari drops the list semantics of a list with `list-style: none`, so the role says it again.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    <ul
      ref={ref}
      role="list"
      className={clsx('flg-list', variant === 'inset' && !flat && 'flg-surface', className)}
      data-variant={variant}
      data-size={size}
      data-surface={flat ? 'false' : undefined}
      {...props}
    />
  );
});

/**
 * One row of a List: a cell before, a column with the title and the description, and a cell after.
 * The title of a pressable row is its link or button, and covers the whole row, so a press anywhere
 * on the row is a press of the title. What sits in `end` and can be pressed is above that cover.
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  {
    title,
    description,
    start,
    end,
    href,
    renderLink,
    onSelect,
    current = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const hasTitle = hasContent(title);
  const pressable = href !== undefined || onSelect !== undefined;
  if (href !== undefined && onSelect !== undefined) {
    devWarn('<ListItem> has both href and onSelect; the href wins and onSelect is ignored.');
  }
  if ((pressable || renderLink) && !hasTitle) {
    devWarn(
      '<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable.',
    );
  }
  if (renderLink && href === undefined) {
    devWarn('<ListItem> renderLink has no effect without href.');
  }
  const interactive = pressable && hasTitle;
  const currentMark = current ? ({ 'aria-current': 'page' } as const) : undefined;

  let titleElement: ReactNode = null;
  if (hasTitle) {
    const titleClass = 'flg-list-item-title';
    if (!interactive) {
      titleElement = <span className={titleClass}>{title}</span>;
    } else if (href === undefined) {
      titleElement = (
        <button
          type="button"
          className={titleClass}
          disabled={disabled}
          onClick={onSelect}
          {...currentMark}
        >
          {title}
        </button>
      );
    } else if (disabled) {
      // An <a> without href has no role of its own, so its name and state would not be read.
      titleElement = (
        <a role="link" aria-disabled="true" className={titleClass} {...currentMark}>
          {title}
        </a>
      );
    } else {
      const linkProps: ListItemLinkProps = {
        href,
        className: titleClass,
        children: title,
        ...currentMark,
      };
      // The content is in `children`, which the linter cannot see through the object.
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      titleElement = renderLink ? renderLink(linkProps) : <a {...linkProps} />;
    }
  }

  const showMain = hasTitle || hasContent(description) || hasContent(children);
  return (
    <li
      ref={ref}
      className={clsx('flg-list-item', className)}
      data-interactive={dataAttr(interactive && !disabled)}
      data-current={dataAttr(current)}
      data-disabled={dataAttr(interactive && disabled)}
      // A screen reader reads `aria-current` from the element that has the focus, so a row with a
      // link or button has it there, and the rest of the rows on the <li>.
      {...(interactive ? undefined : currentMark)}
      {...props}
    >
      {hasContent(start) ? <span className="flg-list-item-start">{start}</span> : null}
      {showMain ? (
        <span className="flg-list-item-main">
          {titleElement}
          {hasContent(description) ? (
            <span className="flg-list-item-description">{description}</span>
          ) : null}
          {children}
        </span>
      ) : null}
      {hasContent(end) ? <span className="flg-list-item-end">{end}</span> : null}
    </li>
  );
});
