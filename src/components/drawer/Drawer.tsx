'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { ButtonProps } from '../button/Button';
import {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from '../dialog/modal';
import type { ModalContentProps, ModalRootProps, ModalTitleProps } from '../dialog/modal';

export type DrawerProps = ModalRootProps;
export type DrawerTriggerProps = ButtonProps;
export type DrawerCloseProps = ButtonProps;
export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerVariant = 'flush' | 'floating';
export interface DrawerContentProps extends ModalContentProps {
  /** The edge it slides in from. Default `"right"`. */
  side?: DrawerSide;
  /** `"flush"` touches the edge; `"floating"` sits 10px inside it. Default `"flush"`. */
  variant?: DrawerVariant;
}
export type DrawerHeaderProps = HTMLAttributes<HTMLDivElement>;
export type DrawerTitleProps = ModalTitleProps;
export type DrawerDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type DrawerFooterProps = HTMLAttributes<HTMLDivElement>;

/** A modal panel that slides in from an edge, on the native `<dialog>`. Renders no element. */
export function Drawer(props: DrawerProps) {
  return <ModalRoot name="Drawer" {...props} />;
}

/** Opens the drawer. Renders the library's `Button` and takes its props, `asChild` included. */
export const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  function DrawerTrigger(props, ref) {
    return <ModalTrigger ref={ref} part="DrawerTrigger" {...props} />;
  },
);

/** Closes the drawer. Renders the library's `Button` and takes its props, `asChild` included. */
export const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(
  function DrawerClose(props, ref) {
    return <ModalClose ref={ref} part="DrawerClose" {...props} />;
  },
);

/**
 * The `<dialog>` and its glass panel. The ref and the ARIA attributes go to the `<dialog>`;
 * `className` and `style` go to the panel.
 */
export const DrawerContent = forwardRef<HTMLDialogElement, DrawerContentProps>(
  function DrawerContent({ side = 'right', variant = 'flush', ...props }, ref) {
    return (
      <ModalContent
        ref={ref}
        part="DrawerContent"
        frameData={{ 'data-kind': 'drawer', 'data-side': side, 'data-variant': variant }}
        panelClassName="flg-drawer-panel"
        {...props}
      />
    );
  },
);

export const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(function DrawerHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-header', className)} {...props} />;
});

/** The drawer's name. Renders an `h2`; `asChild` renders another heading level. */
export const DrawerTitle = forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  function DrawerTitle(props, ref) {
    return <ModalTitle ref={ref} part="DrawerTitle" {...props} />;
  },
);

/** Becomes the drawer's accessible description. */
export const DrawerDescription = forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
  function DrawerDescription(props, ref) {
    return <ModalDescription ref={ref} part="DrawerDescription" {...props} />;
  },
);

export const DrawerFooter = forwardRef<HTMLDivElement, DrawerFooterProps>(function DrawerFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-footer', className)} {...props} />;
});
