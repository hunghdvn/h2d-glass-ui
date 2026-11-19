'use client';

import { clsx } from 'clsx';
import { Fragment, forwardRef, useEffect, useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import { useApplePlatform } from '../../internal/platform';
import { DEFAULT_KEY_LABELS, formatKeys, parseKeys } from '../../internal/shortcut-format';
import type { KeyLabels } from '../../internal/shortcut-format';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';

export interface KbdKeysProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  keys: string;
  labels?: Partial<KeyLabels>;
}

/**
 * The part of `Kbd` that needs the browser: a combination of keys, drawn as the platform writes it.
 * It draws the whole outer `<kbd>`, since `data-platform` sits on it and only this part knows the
 * platform. The platform is known after mount (`useApplePlatform`), so the server and the first
 * render in the browser draw the form for other systems and the HTML agrees (spec phase 6 §3.3). Not
 * exported from the package: `Kbd` is its way in.
 */
export const KbdKeys = forwardRef<HTMLElement, KbdKeysProps>(function KbdKeys(
  { keys, labels: labelsProp, className, ...props },
  ref,
) {
  const apple = useApplePlatform() === true;
  const labels = withDefaults(DEFAULT_KEY_LABELS, labelsProp);
  const { parts, unknown } = useMemo(() => parseKeys(keys), [keys]);
  const mistaken = unknown.length > 0;
  useEffect(() => {
    if (mistaken) devWarn('<Kbd> keys has a part it does not know; it is shown as written.');
  }, [mistaken]);

  return (
    <kbd
      ref={ref}
      {...props}
      className={clsx('flg-kbd', className)}
      data-platform={apple ? 'apple' : undefined}
    >
      {formatKeys(parts, apple, labels).map((key, index) => (
        // The list comes from a string and holds no state, and a key may appear twice: the position
        // is its only identity.
        <Fragment key={index}>
          {index > 0 ? <span className="flg-visually-hidden">{labels.separator}</span> : null}
          <kbd>
            {key.name === undefined ? (
              key.glyph
            ) : (
              <>
                <span aria-hidden="true">{key.glyph}</span>
                <span className="flg-visually-hidden">{key.name}</span>
              </>
            )}
          </kbd>
        </Fragment>
      ))}
    </kbd>
  );
});
