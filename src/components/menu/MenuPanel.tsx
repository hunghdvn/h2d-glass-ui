import type { ReferenceElement } from '@floating-ui/dom';
import { clsx } from 'clsx';
import { forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  MutableRefObject,
  PointerEvent,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { focusNext } from '../../internal/roving';
import { useFloating } from '../../internal/use-floating';
import type { Align, Side } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { useTypeahead } from '../../internal/use-typeahead';
import {
  MENU_ROVING,
  MenuLevelContext,
  MenuTreeContext,
  focusMenuEdge,
  menuItems,
} from './menu-context';
import type { FocusOnOpen, MenuLevelContextValue } from './menu-context';

// The panel shared by DropdownMenuContent, ContextMenuContent and MenuSubContent: a native
// `popover="auto"` with `role="menu"`, placed by Floating UI, with the menu keyboard (spec §6.3).
// Unlike Popover's, its items stay mounted while it is closed: an uncontrolled checkbox item or radio
// group keeps its value from one opening to the next. A closed popover is `display: none`, so they
// are out of the accessibility tree and the tab order meanwhile.

export interface MenuPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  open: boolean;
  /** Reports a change the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  pendingToggle?: MutableRefObject<boolean | null> | undefined;
  contentId: string;
  reference: () => ReferenceElement | null;
  restoreFocusTo: () => HTMLElement | null;
  focusOnOpen: MutableRefObject<FocusOnOpen>;
  side: Side;
  align: Align;
  offset: number;
  alignOffset?: number | undefined;
  /** A submenu: ← closes it. */
  onCloseSub?: (() => void) | undefined;
}

/** A field that takes typing, such as a filter at the top of a menu: it keeps its own keys. */
function isEditable(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches('input, textarea, select'))
  );
}

export const MenuPanel = forwardRef<HTMLDivElement, MenuPanelProps>(function MenuPanel(
  {
    open,
    report,
    pendingToggle,
    contentId,
    reference,
    restoreFocusTo,
    focusOnOpen,
    side,
    align,
    offset,
    alignOffset,
    onCloseSub,
    className,
    children,
    onKeyDown,
    onKeyDownCapture,
    onPointerLeave,
    onBlur,
    ...props
  },
  ref,
) {
  const tree = useContext(MenuTreeContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref]);
  const openSub = useRef<MenuLevelContextValue['openSub']['current']>(null);
  const pointerGrace = useRef<MenuLevelContextValue['pointerGrace']['current']>(null);
  // Set once the browser shows the panel, so that a submenu open at the same time shows after it.
  const [shown, setShown] = useState(false);
  if (!open && shown) setShown(false);
  const level = useMemo<MenuLevelContextValue>(
    () => ({ contentRef, open: shown, openSub, pointerGrace }),
    [shown],
  );
  const isSub = onCloseSub !== undefined;
  // The items stay mounted while it is closed, so a submenu open from here would stay open too.
  useEffect(() => {
    if (!open) openSub.current?.close();
  }, [open]);

  usePopover(contentRef, {
    open,
    onOpenChange: report,
    pendingToggle,
    restoreFocusTo,
    onShown: () => {
      setShown(true);
      const el = contentRef.current;
      if (!el) return;
      const where = focusOnOpen.current;
      if (where === 'first') focusMenuEdge(el, 'Home');
      else if (where === 'last') focusMenuEdge(el, 'End');
      else if (where === 'menu') el.focus({ preventScroll: true });
    },
  });
  useFloating({
    open,
    reference,
    floating: contentRef,
    side,
    align,
    offset,
    alignOffset,
    maxHeight: Number.POSITIVE_INFINITY,
  });

  const getItems = useCallback(() => menuItems(contentRef.current), []);
  const focusItem = useCallback((el: HTMLElement) => el.focus(), []);
  const typeahead = useTypeahead(getItems, focusItem);

  // Keys pressed in a submenu pass through this panel too; that submenu handles its own.
  const isOwnKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const content = contentRef.current;
    return content !== null && (event.target as Element).closest('[role="menu"]') === content;
  };

  // A field in the panel keeps Home, End and ← for its caret; ↑ and ↓ still move to the items.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isOwnKey(event)) return;
    const editable = isEditable(event.target);
    if (editable && (event.key === 'Home' || event.key === 'End')) return;
    if (focusNext(event, getItems(), MENU_ROVING)) return;
    if (isSub && event.key === 'ArrowLeft' && !editable) {
      event.preventDefault();
      onCloseSub?.();
    }
  };

  // Typeahead sees a key before the item does: a Space inside a running search is a character of
  // it, and the item skips a key that the search used (it is `defaultPrevented`), so the Space does
  // not choose the item. A lone Space still does.
  const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isOwnKey(event) && !isEditable(event.target)) typeahead(event);
  };

  // The pointer leaving the panel takes the highlight with it, unless a submenu is open from here.
  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    const content = contentRef.current;
    if (event.pointerType !== 'mouse' || !content || openSub.current) return;
    if (content.contains(document.activeElement) && document.activeElement !== content) {
      content.focus({ preventScroll: true });
    }
  };

  // Tab moves focus out, the browser's way; the whole tree closes once focus has left it. A submenu
  // sits inside the root panel in the DOM, so only the root panel needs to watch. The close waits a
  // task: during `focusout` nothing has focus yet, and closing then would pull focus back to the
  // trigger instead of letting it land where Tab sent it.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (isSub || !(next instanceof Node) || (contentRef.current?.contains(next) ?? true)) return;
    setTimeout(() => tree?.closeAll(), 0);
  };

  return (
    <MenuLevelContext.Provider value={level}>
      <div
        ref={mergedRef}
        popover="auto"
        role="menu"
        tabIndex={-1}
        data-side={side}
        data-align={align}
        {...props}
        id={contentId}
        className={clsx('flg-surface flg-menu', className)}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
        onKeyDownCapture={composeEventHandlers(onKeyDownCapture, handleKeyDownCapture)}
        onPointerLeave={composeEventHandlers(onPointerLeave, handlePointerLeave)}
        onBlur={composeEventHandlers(onBlur, handleBlur)}
      >
        {children}
      </div>
    </MenuLevelContext.Provider>
  );
});
