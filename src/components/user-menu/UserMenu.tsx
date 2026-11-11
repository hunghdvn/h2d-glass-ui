'use client';

import { clsx } from 'clsx';
import { forwardRef, useId } from 'react';
import type { ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { ChevronIcon } from '../../internal/icons';
import { joinIds } from '../../internal/join-ids';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { Avatar } from '../avatar/Avatar';
import type { AvatarProps } from '../avatar/Avatar';
import type { ButtonProps } from '../button/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import type { DropdownMenuContentProps } from '../dropdown-menu/DropdownMenu';
import { MenuSeparator } from '../menu/Menu';

export interface UserMenuLabels {
  /** The name of the button, made from the name of the user. */
  trigger: (name: string) => string;
}

export type UserMenuProps = Omit<
  ButtonProps,
  'children' | 'aria-label' | 'aria-labelledby' | 'asChild' | 'id'
> & {
  /** The name of the user: on the button with `showName`, in the name of the button, in the menu. */
  name: string;
  /** The line under the name at the top of the menu, such as an email address. */
  description?: ReactNode;
  /** The picture. Without `src` and `fallback` it shows the initials of `name`. */
  avatar?: Omit<AvatarProps, 'size'>;
  /** Shows the name and a chevron on the button, next to the avatar. */
  showName?: boolean;
  /** Whether the menu is open. Pass it with `onOpenChange` to control it. */
  open?: boolean;
  /** Whether the menu starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Props of the menu, which opens below the button and lines up with its end, 17px away. */
  contentProps?: Omit<DropdownMenuContentProps, 'children'>;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<UserMenuLabels>;
  /** The items of the menu, after the header. */
  children: ReactNode;
};

const DEFAULT_LABELS: UserMenuLabels = {
  trigger: (name) => `Account: ${name}`,
};

/** The first letter of a word, as a person sees it: a code point, not a UTF-16 unit. */
const firstLetter = (word: string) => Array.from(word.normalize('NFC'))[0] ?? '';

/**
 * The initials of a name: the first letter of its first word and of its last, in capitals, or the
 * one letter of a single word; `undefined` when there is none, so that the avatar draws its icon.
 * Names that are written the other way round, as Vietnamese ones are, pass `avatar.fallback`.
 */
function initialsOf(name: string): string | undefined {
  const words = name.split(/\s+/).filter(Boolean);
  const first = firstLetter(words[0] ?? '');
  const last = words.length > 1 ? firstLetter(words[words.length - 1] ?? '') : '';
  return (first + last).toUpperCase() || undefined;
}

/**
 * The menu of the signed-in user, for the end of a header: a round button with the avatar, and with
 * `showName` the name and a chevron, that opens a menu whose first lines say who is signed in. It is
 * a `DropdownMenu` underneath; the items are its `children`. `className`, `style` and every other
 * prop of a button go on the button, which is what `ref` points to; the menu takes `contentProps`.
 */
export const UserMenu = forwardRef<HTMLButtonElement, UserMenuProps>(function UserMenu(
  {
    name,
    description,
    avatar,
    showName = false,
    open,
    defaultOpen,
    onOpenChange,
    contentProps,
    labels: labelsProp,
    variant = 'ghost',
    size = 'md',
    className,
    children,
    ...props
  },
  ref,
) {
  const headerId = useId();
  const labels = withDefaults(DEFAULT_LABELS, labelsProp);
  // A caller that is not checked by TypeScript may leave it out.
  const text = String(name ?? '');
  if (!text.trim()) {
    devWarn(
      '<UserMenu> needs a name: it is the name of the button and the first line of the menu.',
    );
  }
  const initials = initialsOf(text);
  // The name is on the button or in the menu, so the picture adds nothing to it: it is decorative.
  const picture = (pictureSize: AvatarProps['size']) => (
    <Avatar {...avatar} alt="" size={pictureSize} fallback={avatar?.fallback ?? initials} />
  );

  const {
    side = 'bottom',
    align = 'end',
    sideOffset = 17,
    className: contentClassName,
    'aria-describedby': describedBy,
    ...contentRest
  } = contentProps ?? {};

  return (
    <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        ref={ref}
        variant={variant}
        size={size}
        {...props}
        className={clsx('flg-user-menu', className)}
        aria-label={labels.trigger(text)}
        data-show-name={dataAttr(showName)}
        data-icon-only={dataAttr(!showName)}
      >
        {picture(showName ? 'sm' : 'md')}
        {showName ? (
          <>
            <span className="flg-user-menu-name">{text}</span>
            <ChevronIcon className="flg-user-menu-chevron" />
          </>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        {...contentRest}
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={clsx('flg-user-menu-content', contentClassName)}
        // The header says who is signed in, so it is what a screen reader reads when the menu opens.
        aria-describedby={joinIds(headerId, describedBy)}
        data-show-name={dataAttr(showName)}
      >
        <div id={headerId} className="flg-user-menu-header" role="presentation">
          {picture(showName ? 'md' : 'lg')}
          <div className="flg-user-menu-text">
            <div className="flg-user-menu-title">{text}</div>
            {hasContent(description) ? (
              <div className="flg-user-menu-description">{description}</div>
            ) : null}
          </div>
        </div>
        <MenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
