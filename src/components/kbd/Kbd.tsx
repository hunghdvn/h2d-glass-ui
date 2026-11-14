import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { hasContent } from '../../internal/has-content';
import { hasKeys, hasNoKey } from '../../internal/shortcut-format';
import type { KeyLabels } from '../../internal/shortcut-format';
import { devWarn } from '../../internal/warn';
import { KbdKeys } from './kbd-keys';

/** The names a screen reader says for the symbols of a combination, and the "+" between its keys. */
export type KbdLabels = KeyLabels;

export type KbdProps = Omit<HTMLAttributes<HTMLElement>, 'children'> &
  (
    | {
        /** A combination: `"mod+k"` is ⌘K on Apple and Ctrl K elsewhere. */
        keys: string;
        /** Default English names; any of them can be replaced. */
        labels?: Partial<KbdLabels>;
        children?: never;
      }
    | {
        keys?: never;
        labels?: never;
        /** The text of one key, such as `Esc`, as it is. */
        children: ReactNode;
      }
  );

/**
 * A key, or a combination of keys, as the keyboard shows it. With `children` it is a plain `<kbd>`;
 * with `keys` the platform decides how it is written (`⌘K` or `Ctrl K`) and the part that knows the
 * platform is a client component, so a Server Component can render this one. It only draws: it
 * listens to no key and sets `aria-keyshortcuts` for nobody. `ref` points to the outer `<kbd>`.
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { keys, labels, children, className, ...props },
  ref,
) {
  // A `keys` with no key in it is no keys at all (see `hasKeys`): it draws no empty cell.
  if (!hasKeys(keys)) {
    if (hasNoKey(keys)) devWarn('<Kbd> keys has no key in it; its children are shown instead.');
    return (
      <kbd ref={ref} {...props} className={clsx('flg-kbd', className)}>
        {children}
      </kbd>
    );
  }
  if (hasContent(children)) devWarn('<Kbd> takes keys or children, not both; keys is used.');
  return <KbdKeys ref={ref} {...props} className={className} keys={keys} labels={labels} />;
});
