'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { GripIcon } from '../../internal/icons';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { devWarn } from '../../internal/warn';
import type { ButtonProps } from '../button/Button';
import {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
  useModalMovable,
} from './modal';
import type { ModalContentProps, ModalRootProps, ModalTitleProps } from './modal';

export type DialogProps = ModalRootProps;
export type DialogTriggerProps = ButtonProps;
export type DialogCloseProps = ButtonProps;
export type DialogSize = 'sm' | 'md' | 'lg';
export interface DialogContentProps extends ModalContentProps {
  /** Panel width: 360, 480 or 640px. Default `"md"`. */
  size?: DialogSize;
  /** For a decision the user must take: `role="alertdialog"`, and an outside click does not close. */
  alert?: boolean;
  /**
   * Drag the dialog by its `DialogHeader` on screens 640px and wider. It stays inside the screen, a
   * double click on the header puts it back in the middle, and it opens in the middle each time.
   * Default `false`.
   */
  movable?: boolean;
}
export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;
export type DialogTitleProps = ModalTitleProps;
export type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

/** A modal dialog on the native `<dialog>`. Renders no element of its own. */
export function Dialog(props: DialogProps) {
  return <ModalRoot name="Dialog" {...props} />;
}

/** Opens the dialog. Renders the library's `Button` and takes its props, `asChild` included. */
export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger(props, ref) {
    return <ModalTrigger ref={ref} part="DialogTrigger" {...props} />;
  },
);

/** Closes the dialog. Renders the library's `Button` and takes its props, `asChild` included. */
export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  function DialogClose(props, ref) {
    return <ModalClose ref={ref} part="DialogClose" {...props} />;
  },
);

/**
 * The `<dialog>` and its glass panel. The ref and the ARIA attributes go to the `<dialog>`;
 * `className` and `style` go to the panel.
 */
export const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(
  function DialogContent({ size = 'md', alert, movable, ...props }, ref) {
    return (
      <ModalContent
        ref={ref}
        part="DialogContent"
        alert={alert}
        frameData={{ 'data-kind': 'dialog' }}
        panelClassName="flg-dialog-panel"
        panelData={{ 'data-size': size, 'data-movable': movable ? '' : undefined }}
        movable={movable}
        {...props}
      />
    );
  },
);

/**
 * The top of the panel. In a `DialogContent movable` it is what the user drags the dialog by, and
 * shows the grip for it.
 */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
  { className, ...all },
  ref,
) {
  const movable = useModalMovable();
  const classes = clsx('flg-card-header flg-dialog-header', className);
  // Not movable: the header of any other dialog, with its props passed on as they are given,
  // `dangerouslySetInnerHTML` included.
  if (!movable) return <div ref={ref} className={classes} {...all} />;
  const { children, onPointerDown, onMouseDown, onDoubleClick, ...props } = all;
  // HTML given as a string has no place for the grip: it drags all the same.
  const html = props.dangerouslySetInnerHTML !== undefined;
  if (html) devWarn(NO_GRIP);
  return (
    // The press handlers only drag the dialog, a pointer gesture with no keyboard counterpart (spec
    // phase 6 §3.4); the header is no control, and its controls keep their own presses.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      className={classes}
      {...props}
      data-movable=""
      onPointerDown={composeEventHandlers(onPointerDown, movable.onPointerDown)}
      onMouseDown={composeEventHandlers(onMouseDown, movable.onMouseDown)}
      onDoubleClick={composeEventHandlers(onDoubleClick, movable.onDoubleClick)}
    >
      {html ? undefined : (
        <>
          <GripIcon className="flg-dialog-grip" />
          {children}
        </>
      )}
    </div>
  );
});

const NO_GRIP =
  '<DialogHeader> with dangerouslySetInnerHTML draws no grip in a movable dialog; it still drags.';

/** The dialog's name. Renders an `h2`; `asChild` renders another heading level. */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle(props, ref) {
    return <ModalTitle ref={ref} part="DialogTitle" {...props} />;
  },
);

/** Becomes the dialog's accessible description. */
export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription(props, ref) {
    return <ModalDescription ref={ref} part="DialogDescription" {...props} />;
  },
);

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-footer', className)} {...props} />;
});
