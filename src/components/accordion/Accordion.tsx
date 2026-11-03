'use client';

import { clsx } from 'clsx';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DetailsHTMLAttributes, HTMLAttributes, MouseEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { ChevronIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn } from '../../internal/warn';

type AccordionBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'>;

export interface AccordionSingleProps extends AccordionBaseProps {
  /** Default `"single"`: one item open at a time. */
  type?: 'single';
  /** The open item, or `null` for none. Pass it with `onValueChange` to control it. */
  value?: string | null;
  /** The item open at first, when uncontrolled. */
  defaultValue?: string;
  /** Called with the open item, or `null` once none is. */
  onValueChange?: (value: string | null) => void;
}
export interface AccordionMultipleProps extends AccordionBaseProps {
  /** Any number of items open at a time. */
  type: 'multiple';
  /** The open items. Pass it with `onValueChange` to control it. */
  value?: string[];
  /** The items open at first, when uncontrolled. */
  defaultValue?: string[];
  /** Called with the open items, in the order they appear. */
  onValueChange?: (value: string[]) => void;
}
export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export interface AccordionItemProps extends Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  'open' | 'name'
> {
  /** Names the item in `value`. */
  value: string;
  /**
   * A click on the trigger, or Enter or Space, does nothing. The item still follows `value`: in a
   * single Accordion, opening another item closes it, and find-in-page can open it.
   */
  disabled?: boolean;
}
export type AccordionTriggerProps = HTMLAttributes<HTMLElement>;
export type AccordionContentProps = HTMLAttributes<HTMLDivElement>;

interface AccordionContextValue {
  /** Shared by every item of a single Accordion, so the browser closes one when another opens. */
  name: string | undefined;
  isOpen: (value: string) => boolean;
  /** Changes whenever the items must put their `open` back in line with the value. */
  sync: number;
  /** True once the Accordion's first commit is done: an item mounting after that is a new one. */
  mounted: { current: boolean };
  /** Asks for an item to open or close, as a click on its trigger does. */
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);
const ItemContext = createContext<{ value: string; disabled: boolean } | null>(null);

/** The value of each item element, for reading the open items off the DOM. */
const itemValues = new WeakMap<HTMLDetailsElement, string>();

/**
 * The items of this Accordion and their values, in order; not those of an Accordion nested in one
 * of them. Only registered items: one in a Suspense boundary that React has not hydrated yet is in
 * the DOM with no value to read.
 */
function itemsOf(root: HTMLElement): { item: HTMLDetailsElement; value: string }[] {
  return Array.from(
    root.querySelectorAll<HTMLDetailsElement>('details.flg-accordion-item'),
    (item) => ({ item, value: itemValues.get(item) }),
  ).filter(
    (entry): entry is { item: HTMLDetailsElement; value: string } =>
      entry.value !== undefined && entry.item.closest('.flg-accordion') === root,
  );
}

/** The open items of a value: one, none (`null`), or several. */
const toList = (value: string | null | string[]): string[] =>
  Array.isArray(value) ? value : value === null ? [] : [value];

const sameValues = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value) => b.includes(value));

/**
 * A stack of items that open and close, on native `<details>`: the items work before hydration,
 * and find-in-page opens the one that holds a match. `AccordionItem`, `AccordionTrigger` and
 * `AccordionContent` go inside.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(props, ref) {
  const {
    type,
    value: valueProp,
    defaultValue,
    onValueChange,
    className,
    ...rest
  } = props as AccordionBaseProps & {
    type?: 'single' | 'multiple';
    value?: string | null | string[];
    defaultValue?: string | string[];
    onValueChange?: (value: string | null | string[]) => void;
  };
  const multiple = type === 'multiple';
  const [value, setValue] = useControllableState<string | null | string[]>({
    value: valueProp,
    defaultValue: defaultValue ?? (multiple ? [] : null),
    onChange: onValueChange,
    name: 'Accordion',
  });
  const open = toList(value);
  const groupName = useId();
  const [sync, setSync] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
  const mounted = useRef(false);
  // The values of the last commit, for handlers and the effect below. Written after the commit, not
  // during a render that React may throw away, and before the effects that read it.
  const latest = useRef({ open, multiple, setValue });
  useWriteOnCommit(() => {
    latest.current = { open, multiple, setValue };
  });

  // A click on a trigger (also the one Enter or Space makes) asks for the change instead of making
  // it: the item opens or closes once `value` says so. A controlled parent that commits later (a
  // router) sees no item open, close and open again, and one that refuses sees nothing move.
  const toggle = useCallback((item: string) => {
    const { open: before, multiple: many, setValue: set } = latest.current;
    const opening = !before.includes(item);
    if (!many) {
      set(opening ? item : null);
      return;
    }
    const wanted = opening ? [...before, item] : before.filter((value) => value !== item);
    const root = rootRef.current;
    const order = root ? itemsOf(root).map((entry) => entry.value) : [];
    // In the order the items appear; a value whose item is not rendered stays, at the end.
    set([
      ...order.filter((value) => wanted.includes(value)),
      ...wanted.filter((value) => !order.includes(value)),
    ]);
  }, []);

  // What the DOM last reported, until the next commit. The browser fires one toggle event per item
  // it changes: two when it opens one item of a single Accordion and closes the other. React 18
  // can render only after both, and the second must not report the same change again.
  const reported = useRef<string[] | null>(null);
  useIsoLayoutEffect(() => {
    reported.current = null;
  });

  // The browser opens and closes items too (find-in-page, a click before hydration, closing the
  // other item of a single Accordion): read the open items back from the DOM. A controlled parent
  // may refuse the change; the re-render then puts every item back as `value` says.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reconcile = () => {
      const { open, multiple: many, setValue: set } = latest.current;
      const before = reported.current ?? open;
      const items = itemsOf(root);
      const present = items.map((entry) => entry.value);
      const now = items.filter((entry) => entry.item.open).map((entry) => entry.value);
      // A value whose item is not rendered (yet) is not the DOM's to change: it stays.
      const absent = before.filter((item) => !present.includes(item));
      if (many) {
        const next = [...now, ...absent];
        if (sameValues(next, before)) return;
        set(next);
        reported.current = next;
      } else {
        const next = now.find((item) => !before.includes(item)) ?? now[0] ?? absent[0] ?? null;
        if (next === (before[0] ?? null)) return;
        set(next);
        reported.current = toList(next);
      }
      // Always a commit, which also ends `reported`.
      setSync((count) => count + 1);
    };
    // `toggle` does not bubble: listen in the capture phase, for this Accordion's own items.
    const onToggle = (event: Event) => {
      const item = event.target;
      if (item instanceof HTMLDetailsElement && itemValues.has(item)) {
        if (item.closest('.flg-accordion') === root) reconcile();
      }
    };
    // An item the user opened or closed before hydration counts too.
    reconcile();
    root.addEventListener('toggle', onToggle, true);
    mounted.current = true;
    return () => root.removeEventListener('toggle', onToggle, true);
  }, []);

  const ctx = useMemo(() => {
    const items = toList(value);
    return {
      name: multiple ? undefined : groupName,
      isOpen: (item: string) => items.includes(item),
      sync,
      mounted,
      toggle,
    };
  }, [multiple, groupName, value, sync, toggle]);
  return (
    <AccordionContext.Provider value={ctx}>
      <div
        ref={mergedRef}
        className={clsx('flg-surface', 'flg-accordion', className)}
        data-type={multiple ? 'multiple' : 'single'}
        {...rest}
      />
    </AccordionContext.Provider>
  );
});

/** One item: a native `<details>`. */
export const AccordionItem = forwardRef<HTMLDetailsElement, AccordionItemProps>(
  function AccordionItem({ value, disabled = false, className, ...props }, ref) {
    const ctx = useContext(AccordionContext);
    if (!ctx) devWarn('<AccordionItem> must be rendered inside an <Accordion>.');
    const open = ctx?.isOpen(value) ?? false;
    const itemRef = useRef<HTMLDetailsElement | null>(null);
    const register = useMemo(
      () =>
        mergeRefs(ref, itemRef, (el: HTMLDetailsElement | null) => {
          if (el) itemValues.set(el, value);
        }),
      [ref, value],
    );
    // React sets `open` only when it changes; after a change the parent refused, the DOM is put
    // back here. Not on the first run of an item in the Accordion's first commit: the Accordion
    // first reads what the user did before hydration. An item added later is put in line at once:
    // the browser closes an open <details> inserted into a name group that has an open one.
    const mounted = useRef(false);
    const accordionMounted = ctx?.mounted;
    useIsoLayoutEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        if (!accordionMounted?.current) return;
      }
      const el = itemRef.current;
      if (el && el.open !== open) el.open = open;
    }, [open, ctx?.sync, accordionMounted]);
    const item = useMemo(() => ({ value, disabled }), [value, disabled]);
    return (
      <ItemContext.Provider value={item}>
        <details
          ref={register}
          name={ctx?.name}
          open={open}
          // The user can open an item before hydration; the Accordion reads it back then.
          suppressHydrationWarning
          className={clsx('flg-accordion-item', className)}
          data-disabled={disabled ? '' : undefined}
          {...props}
        />
      </ItemContext.Provider>
    );
  },
);

/** A control that keeps its own click inside a trigger; a native <details> does not toggle for it. */
const CONTROL = 'a[href], button, input, select, textarea, label';

const CHEVRON = (
  <span className="flg-accordion-chevron" aria-hidden="true">
    <ChevronIcon direction="down" />
  </span>
);

/** The item's heading: a native `<summary>`, with a chevron after its children. */
export const AccordionTrigger = forwardRef<HTMLElement, AccordionTriggerProps>(
  function AccordionTrigger({ className, children, onClick, ...props }, ref) {
    const accordion = useContext(AccordionContext);
    const item = useContext(ItemContext);
    if (!item) devWarn('<AccordionTrigger> must be rendered inside an <AccordionItem>.');
    const disabled = item?.disabled ?? false;
    return (
      <summary
        ref={ref}
        className={clsx('flg-accordion-trigger', className)}
        aria-disabled={disabled || undefined}
        {...props}
        // A click, also the one Enter and Space make, would open or close the item at once: the
        // Accordion asks for the change instead. A disabled item stays as it is. A click on a
        // control inside the trigger (a link, a checkbox) is the control's, as with <details>.
        onClick={composeEventHandlers(onClick, (event: MouseEvent<HTMLElement>) => {
          const control = (event.target as Element).closest(CONTROL);
          if (control && control !== event.currentTarget && event.currentTarget.contains(control)) {
            return;
          }
          if (disabled) {
            event.preventDefault();
          } else if (item && accordion) {
            event.preventDefault();
            accordion.toggle(item.value);
          }
        })}
      >
        {children}
        {CHEVRON}
      </summary>
    );
  },
);

/** What the item shows while open. */
export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  function AccordionContent({ className, ...props }, ref) {
    return <div ref={ref} className={clsx('flg-accordion-content', className)} {...props} />;
  },
);
