'use client';

import { clsx } from 'clsx';
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { CheckIcon, ChevronIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { resolveLazy } from '../../internal/react-lazy';
import { hasKeys, hasNoKey } from '../../internal/shortcut-format';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import { Kbd } from '../kbd/Kbd';
import type { KbdLabels } from '../kbd/Kbd';
import { focusMenuEdge, isPointInPolygon, useMenu } from './menu-context';
import type { FocusOnOpen, MenuLevelContextValue } from './menu-context';
import { MenuPanel } from './MenuPanel';

const CHECK = <CheckIcon />;
const CHEVRON = <ChevronIcon className="flg-menu-chevron" direction="right" />;

/** What happens when an item is chosen: `event.preventDefault()` keeps the menu open. */
export type MenuSelectEvent = Event;

interface ItemBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Called when the item is chosen. `event.preventDefault()` keeps the menu open. */
  onSelect?: (event: MenuSelectEvent) => void;
  /** Leaves the item in the menu but out of reach: skipped by the keyboard, not chosen on click. */
  disabled?: boolean;
  /** The text typeahead matches. Default: the item's own text. */
  textValue?: string;
}

export interface MenuItemProps extends ItemBaseProps {
  /** `"danger"` for an item that destroys something. Default `"default"`. */
  variant?: 'default' | 'danger';
  /** An icon in the column before the text. */
  icon?: ReactNode;
  /** Render the single child element (for example a link) as the item. */
  asChild?: boolean;
}
export interface MenuCheckboxItemProps extends ItemBaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
export interface MenuRadioGroupProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
export interface MenuRadioItemProps extends ItemBaseProps {
  value: string;
}
export type MenuGroupProps = HTMLAttributes<HTMLDivElement>;
export type MenuLabelProps = HTMLAttributes<HTMLDivElement>;
export type MenuSeparatorProps = HTMLAttributes<HTMLDivElement>;
export type MenuShortcutProps = HTMLAttributes<HTMLSpanElement> &
  (
    | { keys?: never; labels?: never }
    | {
        /** A combination, drawn as a Kbd: `"mod+v"` is ⌘V on Apple and Ctrl V elsewhere. */
        keys: string;
        /** The names a screen reader says for the symbols, as the Kbd takes them. */
        labels?: Partial<KbdLabels>;
        children?: never;
      }
  );
export interface MenuSubProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export interface MenuSubTriggerProps extends Omit<ItemBaseProps, 'onSelect' | 'id'> {
  /** An icon in the column before the text. */
  icon?: ReactNode;
}
export type MenuSubContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>;

/**
 * Chooses an item: dispatches the cancellable select event on it, then closes the tree. An `asChild`
 * child that does not attach the ref leaves no element to dispatch on: `onSelect` gets the event
 * directly, and its `preventDefault()` still keeps the menu open.
 */
function choose(el: HTMLElement | null, onSelect: ItemBaseProps['onSelect'], closeAll: () => void) {
  const event = new Event('flg-menu-select', { cancelable: true });
  if (el) {
    if (onSelect) el.addEventListener('flg-menu-select', onSelect, { once: true });
    el.dispatchEvent(event);
  } else {
    onSelect?.(event);
  }
  if (!event.defaultPrevented) closeAll();
}

/** The consumer's handlers that an item runs before its own. */
type ItemHandlers = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onPointerMove' | 'onFocus' | 'onClick' | 'onKeyDown'
>;

/**
 * What every item shares: the highlight follows focus, the pointer moves the focus (outside the
 * grace triangle of an open submenu), Enter and Space choose. Returns the item's props, with the
 * consumer's handlers composed in: each runs first, and its `preventDefault()` skips the item's own.
 */
function useItem(
  level: MenuLevelContextValue,
  disabled: boolean,
  textValue: string | undefined,
  onActivate: (pointer: boolean) => void,
  { onPointerMove, onFocus, onClick, onKeyDown }: ItemHandlers,
) {
  return {
    tabIndex: -1,
    'aria-disabled': disabled || undefined,
    'data-text-value': textValue,
    onPointerMove: composeEventHandlers(onPointerMove, (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse' || disabled) return;
      const grace = level.pointerGrace.current;
      if (grace) {
        const inside =
          performance.now() < grace.until &&
          isPointInPolygon([event.clientX, event.clientY], grace.polygon);
        if (inside) return;
        level.pointerGrace.current = null;
      }
      if (document.activeElement !== event.currentTarget) {
        event.currentTarget.focus({ preventScroll: true });
      }
    }),
    onFocus: composeEventHandlers(onFocus, (event: FocusEvent<HTMLDivElement>) => {
      const sub = level.openSub.current;
      if (sub && sub.trigger !== event.currentTarget) sub.close();
    }),
    onClick: composeEventHandlers(onClick, (event: MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onActivate(event.detail !== 0);
    }),
    // Enter and Space click the item, so that an item rendered as a link follows it. A held key
    // chooses nothing more: its repeats would otherwise close the menu and, on the trigger, reopen it.
    onKeyDown: composeEventHandlers(onKeyDown, (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!disabled && !event.repeat) event.currentTarget.click();
    }),
  };
}

/** A command in a menu. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  {
    onSelect,
    disabled = false,
    textValue,
    variant = 'default',
    icon,
    asChild = false,
    className,
    children,
    onPointerMove,
    onFocus,
    onClick,
    onKeyDown,
    ...props
  },
  ref,
) {
  const { tree, level } = useMenu('MenuItem');
  const itemRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
  const item = useItem(
    level,
    disabled,
    textValue,
    () => choose(itemRef.current, onSelect, tree.closeAll),
    { onPointerMove, onFocus, onClick, onKeyDown },
  );
  const iconSlot = (
    <span className="flg-menu-item-icon" aria-hidden="true">
      {icon}
    </span>
  );
  const shared = {
    role: 'menuitem',
    ...props,
    ...item,
    className: clsx('flg-menu-item', className),
    'data-variant': variant,
  };
  if (asChild) {
    const child = resolveLazy(children);
    const withIcon = isValidElement<{ children?: ReactNode }>(child)
      ? cloneElement(
          child as ReactElement<{ children?: ReactNode }>,
          undefined,
          iconSlot,
          child.props.children,
        )
      : child;
    return (
      <Slot ref={mergedRef as Ref<HTMLElement>} {...shared}>
        {withIcon}
      </Slot>
    );
  }
  return (
    <div ref={mergedRef} {...shared}>
      {iconSlot}
      {children}
    </div>
  );
});

/** An item that turns an option on and off. */
export const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  function MenuCheckboxItem(
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      onSelect,
      disabled = false,
      textValue,
      className,
      children,
      onPointerMove,
      onFocus,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const { tree, level } = useMenu('MenuCheckboxItem');
    const itemRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
    const [isChecked, setChecked] = useControllableState({
      value: checked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
      name: 'MenuCheckboxItem',
    });
    const item = useItem(
      level,
      disabled,
      textValue,
      () => {
        setChecked(!isChecked);
        choose(itemRef.current, onSelect, tree.closeAll);
      },
      { onPointerMove, onFocus, onClick, onKeyDown },
    );
    return (
      <div
        ref={mergedRef}
        role="menuitemcheckbox"
        aria-checked={isChecked}
        {...props}
        {...item}
        className={clsx('flg-menu-item', className)}
      >
        <span className="flg-menu-item-icon" aria-hidden="true">
          {isChecked ? CHECK : null}
        </span>
        {children}
      </div>
    );
  },
);

interface GroupContextValue {
  setLabelId: (id: string | undefined) => void;
}
const GroupContext = createContext<GroupContextValue | null>(null);

/** A group that the MenuLabel inside it, if any, names. */
function useGroupLabel() {
  const [labelId, setLabelId] = useState<string | undefined>();
  const context = useMemo<GroupContextValue>(() => ({ setLabelId }), []);
  return [labelId, context] as const;
}

interface RadioGroupContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
}
const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/** A set of items where one is chosen. A MenuLabel inside names it. */
export const MenuRadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  function MenuRadioGroup({ value, defaultValue, onValueChange, ...props }, ref) {
    const [current, setValue] = useControllableState<string | undefined>({
      value,
      defaultValue,
      onChange: onValueChange as ((value: string | undefined) => void) | undefined,
      name: 'MenuRadioGroup',
    });
    const context = useMemo(() => ({ value: current, setValue }), [current, setValue]);
    const [labelId, labelContext] = useGroupLabel();
    return (
      <GroupContext.Provider value={labelContext}>
        <RadioGroupContext.Provider value={context}>
          <div ref={ref} role="group" aria-labelledby={labelId} {...props} />
        </RadioGroupContext.Provider>
      </GroupContext.Provider>
    );
  },
);

/** One choice of a MenuRadioGroup. */
export const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(function MenuRadioItem(
  {
    value,
    onSelect,
    disabled = false,
    textValue,
    className,
    children,
    onPointerMove,
    onFocus,
    onClick,
    onKeyDown,
    ...props
  },
  ref,
) {
  const { tree, level } = useMenu('MenuRadioItem');
  const group = useContext(RadioGroupContext);
  if (!group) devWarn('<MenuRadioItem> must be rendered inside a <MenuRadioGroup>.');
  const itemRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
  const checked = group?.value === value;
  const item = useItem(
    level,
    disabled,
    textValue,
    () => {
      group?.setValue(value);
      choose(itemRef.current, onSelect, tree.closeAll);
    },
    { onPointerMove, onFocus, onClick, onKeyDown },
  );
  return (
    <div
      ref={mergedRef}
      role="menuitemradio"
      aria-checked={checked}
      {...props}
      {...item}
      className={clsx('flg-menu-item', className)}
    >
      <span className="flg-menu-item-icon" aria-hidden="true">
        {checked ? <span className="flg-menu-radio-dot" /> : null}
      </span>
      {children}
    </div>
  );
});

/** Groups items; a MenuLabel inside names the group. */
export const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(function MenuGroup(props, ref) {
  const [labelId, labelContext] = useGroupLabel();
  return (
    <GroupContext.Provider value={labelContext}>
      <div ref={ref} role="group" aria-labelledby={labelId} {...props} />
    </GroupContext.Provider>
  );
});

/** A heading for the items after it. Inside a MenuGroup, it names the group. */
export const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(function MenuLabel(
  { id: idProp, className, ...props },
  ref,
) {
  const generated = useId();
  const id = idProp ?? generated;
  const group = useContext(GroupContext);
  const setLabelId = group?.setLabelId;
  useIsoLayoutEffect(() => {
    if (!setLabelId) return;
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);
  return (
    <div
      ref={ref}
      role="presentation"
      id={id}
      className={clsx('flg-menu-label', className)}
      {...props}
    />
  );
});

export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator(
  { className, ...props },
  ref,
) {
  return (
    <div ref={ref} role="separator" className={clsx('flg-menu-separator', className)} {...props} />
  );
});

/**
 * A keyboard shortcut shown at the end of an item: text as it is, or `keys`, which a Kbd draws for
 * the platform. It only shows the keys; the app binds them.
 */
export const MenuShortcut = forwardRef<HTMLSpanElement, MenuShortcutProps>(function MenuShortcut(
  { className, keys, labels, children, ...props },
  ref,
) {
  // A `keys` with no key in it is no keys at all (see `hasKeys`): it draws no empty cell.
  const given = hasKeys(keys) ? keys : undefined;
  if (hasNoKey(keys)) {
    devWarn('<MenuShortcut> keys has no key in it; its children are shown instead.');
  }
  if (given !== undefined && hasContent(children)) {
    devWarn('<MenuShortcut> takes keys or children, not both; keys is used.');
  }
  return (
    <span ref={ref} className={clsx('flg-menu-shortcut', className)} {...props}>
      {given === undefined ? children : <Kbd keys={given} labels={labels} />}
    </span>
  );
});

interface SubContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLDivElement | null>;
  focusOnOpen: MutableRefObject<FocusOnOpen>;
  /** A close by the browser that the submenu overrides: its late `toggle` is not reported. */
  pendingToggle: MutableRefObject<boolean | null>;
  /** The menu the submenu opens from. */
  parent: MenuLevelContextValue;
}
const SubContext = createContext<SubContextValue | null>(null);

function useSub(part: string): SubContextValue | null {
  const sub = useContext(SubContext);
  if (!sub) devWarn(`<${part}> must be rendered inside a <MenuSub>.`);
  return sub;
}

/** A submenu: a MenuSubTrigger and the MenuSubContent it opens. */
export function MenuSub({ open, defaultOpen = false, onOpenChange, children }: MenuSubProps) {
  const { level } = useMenu('MenuSub');
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'MenuSub',
  });
  const contentId = useId();
  const triggerId = useId();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const focusOnOpen = useRef<FocusOnOpen>('none');
  const pendingToggle = useRef<boolean | null>(null);
  // While open, it is the submenu of its level: highlighting another item there closes it. Set
  // during layout, in the commit that opens it: a passive effect would leave a gap before it runs,
  // in which a quick move onto another item would not close it.
  useIsoLayoutEffect(() => {
    if (!isOpen) return;
    const entry = { trigger: triggerRef.current, close: () => setOpen(false) };
    level.openSub.current = entry;
    return () => {
      if (level.openSub.current === entry) level.openSub.current = null;
    };
  }, [isOpen, level, setOpen]);
  const context = useMemo(
    () => ({
      open: isOpen,
      setOpen,
      contentId,
      triggerId,
      triggerRef,
      focusOnOpen,
      pendingToggle,
      parent: level,
    }),
    [isOpen, setOpen, contentId, triggerId, level],
  );
  return (
    <SubContext.Provider value={context}>
      <div role="none" className="flg-menu-sub">
        {children}
      </div>
    </SubContext.Provider>
  );
}

/** How long the pointer rests on a sub-trigger before its submenu opens, in ms. */
const SUB_OPEN_DELAY = 100;
/** How long the pointer may take to reach the submenu through the grace triangle, in ms. */
const GRACE_TIME = 300;

/** The item that opens a submenu: →, Enter, Space, a click, or the pointer resting on it. */
export const MenuSubTrigger = forwardRef<HTMLDivElement, MenuSubTriggerProps>(
  function MenuSubTrigger(
    {
      disabled = false,
      textValue,
      icon,
      className,
      children,
      onPointerMove,
      onPointerLeave,
      onFocus,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const { level } = useMenu('MenuSubTrigger');
    const sub = useSub('MenuSubTrigger');
    const triggerRef = sub?.triggerRef;
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    const openSub = (focus: FocusOnOpen) => {
      if (!sub) return;
      sub.focusOnOpen.current = focus;
      if (!sub.open) {
        sub.setOpen(true);
        return;
      }
      const content = document.getElementById(sub.contentId);
      // A press on the trigger light-dismissed it before this click, which keeps it open. It shows
      // again in the same task, so no frame paints it closed. `pendingToggle` drops a late `toggle`
      // for the close, should the browser not merge it with the show's; if the show is refused,
      // usePopover shows it again once that `toggle` arrives.
      if (content && !content.matches(':popover-open')) {
        sub.pendingToggle.current = false;
        try {
          content.showPopover();
        } catch {
          // Shown again by usePopover once the `toggle` arrives.
        }
      }
      // Already open, from the pointer: the keyboard moves into it now.
      if (focus === 'first' && content) focusMenuEdge(content, 'Home');
    };
    // The submenu's own pointer and key behaviour runs after the consumer's handlers and before the
    // item's: resting on it opens it after a delay, and the right arrow opens it on its first item.
    const item = useItem(
      level,
      disabled,
      textValue,
      (pointer) => openSub(pointer ? 'none' : 'first'),
      {
        onFocus,
        onClick,
        onPointerMove: composeEventHandlers(
          onPointerMove,
          (event: PointerEvent<HTMLDivElement>) => {
            if (event.pointerType !== 'mouse' || disabled || sub?.open) return;
            if (timer.current === undefined) {
              timer.current = setTimeout(() => {
                timer.current = undefined;
                // The menu closed in the meantime (Esc, Tab): the submenu stays closed with it.
                if (!level.contentRef.current?.matches(':popover-open')) return;
                openSub('none');
              }, SUB_OPEN_DELAY);
            }
          },
        ),
        onKeyDown: composeEventHandlers(onKeyDown, (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== 'ArrowRight') return;
          event.preventDefault();
          if (!disabled) openSub('first');
        }),
      },
    );

    return (
      <div
        ref={mergedRef}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={sub?.open ?? false}
        aria-controls={sub?.open ? sub.contentId : undefined}
        data-open={dataAttr(sub?.open)}
        {...props}
        {...item}
        id={sub?.triggerId}
        className={clsx('flg-menu-item', className)}
        onPointerLeave={composeEventHandlers(
          onPointerLeave,
          (event: PointerEvent<HTMLDivElement>) => {
            clearTimeout(timer.current);
            timer.current = undefined;
            const content = sub?.open ? document.getElementById(sub.contentId) : null;
            if (event.pointerType !== 'mouse' || !content) return;
            // The pointer heads for the submenu: other items it crosses on the way stay unlit.
            const box = content.getBoundingClientRect();
            const edge = content.dataset.side === 'left' ? box.right : box.left;
            level.pointerGrace.current = {
              polygon: [
                [event.clientX, event.clientY],
                [edge, box.top],
                [edge, box.bottom],
              ],
              until: performance.now() + GRACE_TIME,
            };
          },
        )}
      >
        <span className="flg-menu-item-icon" aria-hidden="true">
          {icon}
        </span>
        {children}
        {CHEVRON}
      </div>
    );
  },
);

/** The panel of a submenu. Opens to the right of its trigger, and flips when there is no room. */
export const MenuSubContent = forwardRef<HTMLDivElement, MenuSubContentProps>(
  function MenuSubContent({ onPointerEnter, ...props }, ref) {
    const sub = useSub('MenuSubContent');
    const close = () => sub?.setOpen(false);
    return (
      <MenuPanel
        ref={ref}
        aria-labelledby={sub?.triggerId}
        {...props}
        open={(sub?.open ?? false) && (sub?.parent.open ?? false)}
        report={(next) => sub?.setOpen(next)}
        pendingToggle={sub?.pendingToggle}
        contentId={sub?.contentId ?? ''}
        reference={() => sub?.triggerRef.current ?? null}
        restoreFocusTo={() => sub?.triggerRef.current ?? null}
        focusOnOpen={sub?.focusOnOpen ?? { current: 'none' }}
        side="right"
        align="start"
        offset={2}
        // The panel's 4px padding and 1px border: its first item lines up with the trigger.
        alignOffset={-5}
        onCloseSub={close}
        onPointerEnter={composeEventHandlers(onPointerEnter, () => {
          if (sub) sub.parent.pointerGrace.current = null;
        })}
      />
    );
  },
);
