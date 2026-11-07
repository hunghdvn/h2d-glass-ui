import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { hasContent } from '../../internal/has-content';
import { CloseIcon, StatusIcon } from '../../internal/icons';
import type { StatusIconStatus } from '../../internal/icons';
import { Slot } from '../../internal/slot';
import { withDefaults } from '../../internal/with-defaults';
import { IconButton } from '../icon-button/IconButton';

export type AlertStatus = StatusIconStatus;
export type AlertVariant = 'stripe' | 'tinted' | 'plain';

/** The words an Alert says; translate them here. */
export interface AlertLabels {
  info: string;
  success: string;
  warning: string;
  error: string;
  /** The name of the close button. */
  dismiss: string;
}

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  status?: AlertStatus;
  variant?: AlertVariant;
  /** Replaces the icon of the status; `false`, `null`, `true` or `''` leaves it out. */
  icon?: ReactNode | false;
  /** Shows a close button. The Alert does not hide itself: the parent drops it from the tree. */
  onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<AlertLabels>;
}

export interface AlertTitleProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element (a heading, say) instead of a `div`. */
  asChild?: boolean;
}
export type AlertDescriptionProps = HTMLAttributes<HTMLDivElement>;
export type AlertActionsProps = HTMLAttributes<HTMLDivElement>;

const DEFAULT_LABELS: AlertLabels = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  dismiss: 'Dismiss',
};

/**
 * A message that stays in the page, in one of three looks. It has no role of its own: content that
 * is there when the page loads is not read out whatever its role, so the caller puts the role it
 * needs on it (see the docs for `status` and `alert`). Safe to render in React Server Components;
 * the close button is a client component that only appears with `onDismiss`.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { status = 'info', variant = 'stripe', icon, onDismiss, labels, className, children, ...props },
  ref,
) {
  const words = withDefaults(DEFAULT_LABELS, labels);
  // `undefined` is "no choice": the glyph of the status. Whatever renders nothing (`false`, `null`,
  // `true`, `''`) means no icon, and then the status is read from the hidden text.
  const ownIcon = icon !== undefined;
  const hasIcon = icon === undefined || hasContent(icon);
  return (
    <div
      ref={ref}
      className={clsx('flg-alert', className)}
      data-variant={variant}
      data-status={status}
      {...props}
    >
      {hasIcon ? (
        // The colour is on the span, not on the <svg>: in forced colours an <svg> keeps its own.
        <span className="flg-alert-icon" aria-hidden={ownIcon ? true : undefined}>
          {ownIcon ? (
            icon
          ) : (
            // Named, so the status is not told by its colour alone. `aria-hidden` is left undefined:
            // the icon carries its own name.
            <StatusIcon
              status={status}
              aria-hidden={undefined}
              role="img"
              aria-label={words[status]}
            />
          )}
        </span>
      ) : null}
      <div className="flg-alert-body">
        {/* An icon of the caller says nothing, and none says less: the status is read out as text. */}
        {ownIcon || !hasIcon ? (
          <span className="flg-visually-hidden">{`${words[status]}: `}</span>
        ) : null}
        {children}
      </div>
      {onDismiss ? (
        <span className="flg-alert-dismiss">
          <IconButton variant="ghost" size="sm" aria-label={words.dismiss} onClick={onDismiss}>
            <CloseIcon />
          </IconButton>
        </span>
      ) : null}
    </div>
  );
});

/** The title: bold text, not a heading, since the level depends on the page. */
export const AlertTitle = forwardRef<HTMLDivElement, AlertTitleProps>(function AlertTitle(
  { asChild = false, className, children, ...props },
  ref,
) {
  const classes = clsx('flg-alert-title', className);
  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

export const AlertDescription = forwardRef<HTMLDivElement, AlertDescriptionProps>(
  function AlertDescription({ className, ...props }, ref) {
    return <div ref={ref} className={clsx('flg-alert-description', className)} {...props} />;
  },
);

/** A row for the buttons or links of the Alert; they are the caller's own. */
export const AlertActions = forwardRef<HTMLDivElement, AlertActionsProps>(function AlertActions(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-alert-actions', className)} {...props} />;
});
