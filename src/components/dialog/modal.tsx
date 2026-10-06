import { clsx } from 'clsx';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  DialogHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
  Ref,
  RefObject,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { focusFirst, returnFocus } from '../../internal/focus';
import { lockScroll } from '../../internal/lock-scroll';
import { mergeRefs } from '../../internal/merge-refs';
import { registerModal } from '../../internal/modal-stack';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';

// The shared core of Dialog and Drawer (spec §3.4): a native modal `<dialog>` that is a transparent,
// full-viewport frame around the glass panel, with the toast host as the panel's sibling.

interface ModalContextValue {
  /** `"Dialog"` or `"Drawer"`, for dev warnings. */
  name: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string | undefined;
  descriptionId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  setDescriptionId: (id: string | undefined) => void;
  /** Set during layout, so a passive effect in the same commit already sees the title. */
  titleRef: MutableRefObject<string | undefined>;
  /** The trigger, if there is one: where focus returns when nothing had it before opening. */
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const noop = () => {};

function useModalContext(part: string): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside its <Dialog> or <Drawer>.`);
    return {
      name: 'Dialog',
      open: false,
      setOpen: noop,
      contentId: '',
      titleId: undefined,
      descriptionId: undefined,
      setTitleId: noop,
      setDescriptionId: noop,
      titleRef: { current: undefined },
      triggerRef: { current: null },
    };
  }
  return ctx;
}

export interface ModalRootProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function ModalRoot({
  name,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: ModalRootProps & { name: string }) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name,
  });
  const contentId = useId();
  const [titleId, setTitleId] = useState<string | undefined>();
  const [descriptionId, setDescriptionId] = useState<string | undefined>();
  const titleRef = useRef<string | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const value = useMemo(
    () => ({
      name,
      open: isOpen,
      setOpen,
      contentId,
      titleId,
      descriptionId,
      setTitleId,
      setDescriptionId,
      titleRef,
      triggerRef,
    }),
    [name, isOpen, setOpen, contentId, titleId, descriptionId],
  );
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export interface ModalPartProps {
  /** The public name of the part, for dev warnings. */
  part: string;
}

export const ModalTrigger = forwardRef<HTMLButtonElement, ButtonProps & ModalPartProps>(
  function ModalTrigger({ part, onClick, ...props }, ref) {
    const ctx = useModalContext(part);
    const triggerRef = ctx.triggerRef;
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
    return (
      <Button
        ref={mergedRef}
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        {...props}
        onClick={composeEventHandlers(onClick, () => ctx.setOpen(true))}
      />
    );
  },
);

export const ModalClose = forwardRef<HTMLButtonElement, ButtonProps & ModalPartProps>(
  function ModalClose({ part, onClick, ...props }, ref) {
    const ctx = useModalContext(part);
    return (
      <Button
        ref={ref}
        {...props}
        onClick={composeEventHandlers(onClick, () => ctx.setOpen(false))}
      />
    );
  },
);

export interface ModalContentProps
  extends
    Omit<HTMLAttributes<HTMLDialogElement>, 'id'>,
    Pick<DialogHTMLAttributes<HTMLDialogElement>, 'onCancel'> {
  /** Close when the user clicks outside the panel. Default `true`. */
  closeOnOutsideClick?: boolean;
  /** The element that receives focus when it opens. Default: the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>;
}

interface ModalContentInternalProps extends ModalContentProps {
  part: string;
  alert?: boolean | undefined;
  /** Data attributes for the frame: `data-kind`, `data-side`, `data-variant`. */
  frameData: Record<`data-${string}`, string | undefined>;
  panelClassName: string;
  panelData?: Record<`data-${string}`, string | undefined>;
}

/** What one opening of the dialog holds until it closes. */
interface ModalSession {
  /** Where focus returns: the element that had it before opening. */
  previous: HTMLElement | null;
  /** Where focus returns when `previous` has left the DOM since. */
  trigger: MutableRefObject<HTMLButtonElement | null>;
  release: () => void;
  unregister: () => void;
}

export const ModalContent = forwardRef<HTMLDialogElement, ModalContentInternalProps>(
  function ModalContent(
    {
      part,
      alert = false,
      closeOnOutsideClick = true,
      initialFocus,
      frameData,
      panelClassName,
      panelData,
      className,
      style,
      children,
      onPointerDown,
      onPointerUp,
      onClick,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const ctx = useModalContext(part);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hostRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, dialogRef), [ref]);
    const [, forceRender] = useReducer((count: number) => count + 1, 0);

    const session = useRef<ModalSession | null>(null);

    const latest = useRef({ open: ctx.open, setOpen: ctx.setOpen });
    latest.current = { open: ctx.open, setOpen: ctx.setOpen };

    // Releases the scroll lock and the modal-stack entry and returns focus. Safe to call twice.
    const teardown = useRef(() => {
      const current = session.current;
      if (!current) return;
      session.current = null;
      current.release();
      current.unregister();
      returnFocus(current.previous, dialogRef.current, current.trigger.current);
    }).current;

    // Runs after every render: the dialog follows `open`, whatever closed it last.
    useIsoLayoutEffect(() => {
      const dialog = dialogRef.current;
      const host = hostRef.current;
      if (!dialog || !host || !dialog.isConnected) return;
      if (ctx.open && !dialog.open) {
        // Closed without the library: its `close` event is on its way, and onClose decides whether
        // it stays closed. Opening again here would leak the scroll lock and the modal-stack entry.
        if (session.current) return;
        // Safari does not focus a button that is clicked, so nothing may have focus: then the
        // trigger is where focus returns.
        const active = document.activeElement;
        const previous =
          active instanceof HTMLElement && active !== document.body
            ? active
            : ctx.triggerRef.current;
        dialog.showModal();
        const opened: ModalSession = {
          previous,
          trigger: ctx.triggerRef,
          release: lockScroll(),
          unregister: registerModal({ dialog, host }),
        };
        session.current = opened;
        // A long panel scrolls to the element that gets focus, so it can be seen (WCAG 2.4.11).
        // Content that scrolls itself on opening, from an effect, is left alone.
        const panel = panelRef.current;
        const target = initialFocus?.current;
        if (target) target.focus();
        else if (panel) focusFirst(panel, { preventScroll: false });
      } else if (!ctx.open && dialog.open) {
        dialog.close();
        teardown();
      }
    });

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      // Esc: the parent decides, so the native close is cancelled and the request goes through state.
      // React's own listener for the consumer's `onCancel` runs first: one that prevents the event
      // refuses the close as well.
      const onCancel = (event: Event) => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        latest.current.setOpen(false);
        forceRender();
      };
      // Closed without the library: `<form method="dialog">`, or Chromium closing on a repeated Esc.
      // The event arrives a task later, so a dialog that opened again since then ignores it: that is
      // what StrictMode's simulated unmount and remount leaves behind.
      const onClose = () => {
        if (dialog.open) return;
        teardown();
        if (latest.current.open) {
          latest.current.setOpen(false);
          forceRender();
        }
      };
      dialog.addEventListener('cancel', onCancel);
      dialog.addEventListener('close', onClose);
      return () => {
        dialog.removeEventListener('cancel', onCancel);
        dialog.removeEventListener('close', onClose);
        if (dialog.open) dialog.close();
        teardown();
      };
    }, [teardown]);

    const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
    useEffect(() => {
      if (ctx.open && !named && ctx.titleRef.current === undefined) {
        devWarn(
          `<${part}> needs a name: render a ${ctx.name}Title inside it, or pass aria-label or ` +
            'aria-labelledby.',
        );
      }
    }, [ctx.open, ctx.name, ctx.titleRef, named, part]);

    // A click outside the panel lands on the frame itself. Both the press and the release must, so
    // selecting text inside the panel and releasing outside does not close it. The click alone does
    // not tell: a press and a release on different elements send it to the element that holds both,
    // which is the frame for a press on the frame released inside the panel.
    const pressedOnFrame = useRef(false);
    const releasedOnFrame = useRef(false);
    const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
      // A press while a popover inside the dialog is open (a menu, a Select) light-dismisses that
      // popover, and that is all it does: it is not an outside press for the dialog. A manual
      // popover (a Tooltip) does not close on a press, so it does not count.
      const dialog = event.currentTarget;
      pressedOnFrame.current =
        event.target === dialog &&
        dialog.querySelector(':popover-open:not([popover="manual"])') === null;
    };
    const handlePointerUp = (event: PointerEvent<HTMLDialogElement>) => {
      releasedOnFrame.current = event.target === event.currentTarget;
    };
    const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
      const outside =
        pressedOnFrame.current && releasedOnFrame.current && event.target === event.currentTarget;
      pressedOnFrame.current = false;
      releasedOnFrame.current = false;
      if (outside && closeOnOutsideClick && !alert) ctx.setOpen(false);
    };

    return (
      // The click handler only catches a click on the frame around the panel, a pointer shortcut
      // for closing; Esc is the keyboard way, and the browser handles it.
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
      <dialog
        ref={mergedRef}
        role={alert ? 'alertdialog' : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy ?? (ariaLabel === undefined ? ctx.titleId : undefined)}
        aria-describedby={ariaDescribedBy ?? ctx.descriptionId}
        {...props}
        {...frameData}
        id={ctx.contentId}
        className="flg-dialog"
        onPointerDown={composeEventHandlers(onPointerDown, handlePointerDown)}
        onPointerUp={composeEventHandlers(onPointerUp, handlePointerUp)}
        onClick={composeEventHandlers(onClick, handleClick)}
      >
        {ctx.open ? (
          <div
            ref={panelRef}
            className={clsx('flg-surface flg-card', panelClassName, className)}
            style={style as CSSProperties | undefined}
            tabIndex={-1}
            {...panelData}
          >
            {children}
          </div>
        ) : null}
        <div ref={hostRef} className="flg-toast-host" />
      </dialog>
    );
  },
);

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Render the single child element (another heading level) instead of an `h2`. */
  asChild?: boolean;
}

export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps & ModalPartProps>(
  function ModalTitle({ part, asChild = false, id: idProp, className, children, ...props }, ref) {
    const ctx = useModalContext(part);
    const generated = useId();
    const id = idProp ?? generated;
    const { setTitleId, titleRef } = ctx;
    useIsoLayoutEffect(() => {
      titleRef.current = id;
      setTitleId(id);
      return () => {
        titleRef.current = undefined;
        setTitleId(undefined);
      };
    }, [id, setTitleId, titleRef]);
    const shared = { id, className: clsx('flg-card-title', className), ...props };
    if (asChild) {
      return (
        <Slot ref={ref as Ref<HTMLElement>} {...shared}>
          {children}
        </Slot>
      );
    }
    return (
      <h2 ref={ref} {...shared}>
        {children}
      </h2>
    );
  },
);

export const ModalDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement> & ModalPartProps
>(function ModalDescription({ part, id: idProp, className, ...props }, ref) {
  const ctx = useModalContext(part);
  const generated = useId();
  const id = idProp ?? generated;
  const { setDescriptionId } = ctx;
  useIsoLayoutEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);
  return <p ref={ref} id={id} className={clsx('flg-card-description', className)} {...props} />;
});
