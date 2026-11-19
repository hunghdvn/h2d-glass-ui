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
import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { px } from '../../internal/number';
import { focusNext } from '../../internal/roving';
import type { Orientation } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';

export type TabsVariant = 'underline' | 'segmented' | 'pill';
export type TabsActivationMode = 'automatic' | 'manual';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /**
   * The value of the selected tab, or `null` for none (`undefined` leaves the Tabs uncontrolled).
   * Pass it with `onValueChange` to control it.
   */
  value?: string | null;
  /** The tab selected at first, when uncontrolled. */
  defaultValue?: string;
  /** Called with the value of the tab the user selects. */
  onValueChange?: (value: string) => void;
  /** Default `"horizontal"`: ← and → move between the tabs. `"vertical"`: ↑ and ↓. */
  orientation?: Orientation;
  /** Default `"automatic"`: the tab that gets focus is selected. `"manual"`: Enter or Space selects. */
  activationMode?: TabsActivationMode;
  /** Default `"underline"`. */
  variant?: TabsVariant;
}
export type TabsListProps = HTMLAttributes<HTMLDivElement>;
export interface TabsTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'id'
> {
  /** Ties the tab to the `TabsContent` with the same value. */
  value: string;
}
export interface TabsContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Ties the panel to the `TabsTrigger` with the same value. */
  value: string;
}

interface TabsContextValue {
  baseId: string;
  value: string | null | undefined;
  select: (value: string) => void;
  orientation: Orientation;
  activationMode: TabsActivationMode;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);
/** The tab that takes Tab when no enabled tab is selected; set by `TabsList`. */
const FallbackContext = createContext<string | null>(null);
/**
 * Asks `TabsList` to look at its tabs again: which one takes Tab when none is selected, and whether
 * they still fit. A tab calls it when it mounts, when its `disabled` or `value` changes and when it
 * unmounts: the tab may sit in a memoized component that renders alone, and then the list does not
 * render. The list looks once the commit is done, so it never sees a tab that is going.
 */
const RefreshTabsContext = createContext<() => void>(() => {});

function useTabsContext(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <Tabs>.`);
    return {
      baseId: '',
      value: undefined,
      select: () => {},
      orientation: 'horizontal',
      activationMode: 'automatic',
      variant: 'underline',
    };
  }
  return ctx;
}

/**
 * A value as part of an id. `aria-controls` and `aria-labelledby` hold space-separated ids, so only
 * letters, digits and `-` stay as they are; every other character (`_` too) becomes `_<hex>_`, and
 * two values never share an id.
 */
function idPart(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, (char) => `_${(char.codePointAt(0) ?? 0).toString(16)}_`);
}
const triggerId = (baseId: string, value: string) => `${baseId}-tab-${idPart(value)}`;
const contentId = (baseId: string, value: string) => `${baseId}-panel-${idPart(value)}`;

/** The tabs of this list, in order; not those of a Tabs nested inside one of its panels. */
function tabsOf(list: HTMLElement): HTMLButtonElement[] {
  return Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter(
    (tab) => tab.closest('[role="tablist"]') === list,
  );
}

/** The value of each tab element, for the list's fallback; kept off the DOM. */
const values = new WeakMap<HTMLElement, string>();

/**
 * Whether a horizontal list needs to scroll. While it does not, the test is whether a child reaches
 * past its content box by more than a pixel; while it does, whether anything is left to scroll, not
 * counting the padding that only this state has (room for the focus ring), so that a row leaves the
 * state at the width where a fresh load shows the plain row. The two layouts round differently, and
 * the gap between the tests keeps the list from switching back and forth at the boundary.
 */
function overflows(list: HTMLElement): boolean {
  const style = getComputedStyle(list);
  if (list.hasAttribute('data-overflow')) {
    return list.scrollWidth - px(style.paddingLeft) - px(style.paddingRight) > list.clientWidth;
  }
  const end =
    list.getBoundingClientRect().right - px(style.borderRightWidth) - px(style.paddingRight);
  const reach = Math.max(...Array.from(list.children, (el) => el.getBoundingClientRect().right));
  return reach > end + 1;
}

/**
 * Scrolls a list that scrolls, and only the list (`scrollIntoView` would scroll the page too), so
 * its selected tab is in full view and clear of the fades, whose width the list's `scroll-padding`
 * holds. A tab wider than the view shows its start.
 */
function revealSelected(list: HTMLElement) {
  const tab = tabsOf(list).find((item) => item.getAttribute('aria-selected') === 'true');
  if (!tab) return;
  const style = getComputedStyle(list);
  const left = list.getBoundingClientRect().left + list.clientLeft;
  const start = left + px(style.scrollPaddingLeft);
  const end = left + list.clientWidth - px(style.scrollPaddingRight);
  const rect = tab.getBoundingClientRect();
  if (rect.left < start) list.scrollLeft -= start - rect.left;
  else if (rect.right > end) list.scrollLeft += Math.min(rect.right - end, rect.left - start);
}

/**
 * Tabs: a list of tabs, each showing its own panel. Every panel stays mounted; the ones not selected
 * are `hidden`. `TabsList`, `TabsTrigger` and `TabsContent` go inside.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    activationMode = 'automatic',
    variant = 'underline',
    className,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState<string | null | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((value: string | null | undefined) => void) | undefined,
    name: 'Tabs',
  });
  const baseId = useId();
  const ctx = useMemo(
    () => ({ baseId, value, select: setValue, orientation, activationMode, variant }),
    [baseId, value, setValue, orientation, activationMode, variant],
  );
  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={ref}
        className={clsx('flg-tabs', className)}
        data-orientation={orientation}
        data-variant={variant}
        {...props}
      />
    </TabsContext.Provider>
  );
});

/** The row (or column) of tabs. Name it with `aria-label` or `aria-labelledby`. */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, onKeyDown, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsList');
  const listRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, listRef), [ref]);
  // With no enabled tab selected (no value yet, or the selected one is disabled), Tab would skip the
  // list: the first enabled tab takes Tab instead. Known only once the tabs are in the document.
  const [fallback, setFallback] = useState<string | null>(null);
  // Set by the effect below while the list is horizontal: looks again at whether the tabs fit and,
  // when asked, brings the selected tab into view.
  const overflowRef = useRef<((reveal: boolean) => void) | null>(null);
  const pending = useRef(false);
  // One look at the tabs: which one takes Tab, whether two share a value, and, through the effect
  // below, whether they fit (and, when asked, the selected one in view).
  const look = useCallback((reveal = false) => {
    pending.current = false;
    const list = listRef.current;
    if (!list) return;
    const tabs = tabsOf(list);
    const reachable = tabs.some(
      (tab) => tab.getAttribute('aria-selected') === 'true' && !tab.disabled,
    );
    const first = reachable ? undefined : tabs.find((tab) => !tab.disabled);
    const next = first ? (values.get(first) ?? null) : null;
    setFallback((current) => (current === next ? current : next));
    const seen = new Set<string>();
    for (const tab of tabs) {
      const value = values.get(tab);
      if (value === undefined) continue;
      if (seen.has(value)) {
        devWarn(
          `Two <TabsTrigger>s have the value "${value}". Each tab needs its own: the value makes ` +
            'its id and ties it to its panel.',
        );
      }
      seen.add(value);
    }
    overflowRef.current?.(reveal);
  }, []);
  // A tab that unmounts asks from its cleanup, when it is still in the document: the list looks in a
  // microtask, which runs before the next paint. Several asks in one commit make one look.
  const refreshTabs = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    queueMicrotask(() => {
      if (pending.current) look();
    });
  }, [look]);
  // The list looks when it mounts and when the selected value changes. Nothing else about a render
  // of the list can change what it sees: the tabs ask for a look themselves (see TabsTrigger), and
  // a size change is the ResizeObserver's to report. A look reads the layout, which is not free.
  useIsoLayoutEffect(() => {
    look();
  }, [look]);
  // The selected tab comes into view whenever it changes, whoever changed it: a parent may set
  // `value`. One the arrow keys moved to is in view already, as the browser scrolled to it on focus.
  // A tab that a press selects (focus does, in automatic mode) is not brought into view before the
  // press ends: moving it under the pointer would send the click to another element, and the user's
  // `onClick` would never run. A press starts with the primary button, or the first finger, going
  // down on a tab. It ends at the click that follows, or when the pointer is cancelled (a swipe
  // along the row, which the browser takes over) or opens a context menu, or after a second if none
  // of these comes. A tap on a touch screen focuses the tab only after the finger is up, from the
  // mouse events the browser makes up, so the press cannot end at `pointerup`.
  const horizontal = ctx.orientation === 'horizontal';
  const pressing = useRef(false);
  const revealAfterPress = useRef(false);
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !horizontal) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const watched = ['click', 'pointercancel', 'contextmenu'] as const;
    const finish = () => {
      clearTimeout(fallback);
      for (const type of watched) document.removeEventListener(type, end, true);
      timer = setTimeout(() => {
        pressing.current = false;
        if (!revealAfterPress.current) return;
        revealAfterPress.current = false;
        overflowRef.current?.(true);
      }, 0);
    };
    // The reveal comes a task after the end, when the click has been delivered.
    function end() {
      finish();
    }
    const start = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      if (!(event.target instanceof Element) || !event.target.closest('[role="tab"]')) return;
      clearTimeout(timer);
      clearTimeout(fallback);
      pressing.current = true;
      for (const type of watched) document.addEventListener(type, end, true);
      fallback = setTimeout(finish, 1000);
    };
    list.addEventListener('pointerdown', start, true);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
      list.removeEventListener('pointerdown', start, true);
      for (const type of watched) document.removeEventListener(type, end, true);
      pressing.current = false;
      revealAfterPress.current = false;
    };
  }, [horizontal]);
  const looked = useRef(ctx.value);
  useIsoLayoutEffect(() => {
    if (looked.current === ctx.value) return;
    looked.current = ctx.value;
    if (pressing.current) {
      revealAfterPress.current = true;
      look(false);
    } else {
      look(true);
    }
  }, [ctx.value, look]);
  // A horizontal list whose tabs do not fit scrolls (see tabs.css). It carries `data-overflow` while
  // it does, and `data-at-start` or `data-at-end` while scrolled to that edge, which turns the fade
  // there off. Vertical lists stay as they are.
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !horizontal) return;
    const markEdges = () => {
      const overflow = list.hasAttribute('data-overflow');
      const { scrollLeft, clientWidth, scrollWidth } = list;
      list.toggleAttribute('data-at-start', overflow && scrollLeft <= 1);
      list.toggleAttribute('data-at-end', overflow && scrollLeft + clientWidth >= scrollWidth - 1);
    };
    let observer: ResizeObserver | undefined;
    const watched = new WeakSet<Element>();
    const update = (reveal: boolean) => {
      for (const el of [list, ...Array.from(list.children)]) {
        if (watched.has(el)) continue;
        watched.add(el);
        observer?.observe(el);
      }
      const was = list.hasAttribute('data-overflow');
      const overflow = overflows(list);
      list.toggleAttribute('data-overflow', overflow);
      // A list that has just started to scroll (on mount, or its room shrank, or a web font arrived)
      // shows its selected tab.
      if (overflow && (reveal || !was)) revealSelected(list);
      markEdges();
    };
    // The list's width follows its container, and its children's widths follow their labels and the
    // fonts. The look waits for the next frame: switching layouts resizes the list, which the
    // observer would otherwise have to report again within this one, a "loop" error.
    let frame = 0;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (!entry.target.isConnected) observer?.unobserve(entry.target);
        }
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => update(false));
      });
    }
    overflowRef.current = update;
    // The mark that the list is measured, which the CSS waits for before it clamps a segmented track.
    list.setAttribute('data-measured', '');
    update(false);
    list.addEventListener('scroll', markEdges, { passive: true });
    return () => {
      overflowRef.current = null;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      list.removeEventListener('scroll', markEdges);
      for (const name of ['data-measured', 'data-overflow', 'data-at-start', 'data-at-end']) {
        list.removeAttribute(name);
      }
    };
  }, [horizontal]);
  // A key on one of the list's own tabs moves from that tab. Focus selects the tab it lands on in
  // automatic mode (see TabsTrigger).
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current;
    const tabs = list ? tabsOf(list) : [];
    const tab = event.target as HTMLButtonElement;
    if (!tabs.includes(tab)) return;
    focusNext(event, tabs, { orientation: ctx.orientation, loop: true }, tab);
  };
  return (
    <RefreshTabsContext.Provider value={refreshTabs}>
      <FallbackContext.Provider value={fallback}>
        {/* The tabs take focus, not the list: the arrow keys reach it from the focused tab (APG). */}
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
        <div
          ref={mergedRef}
          role="tablist"
          aria-orientation={ctx.orientation}
          className={clsx('flg-tabs-list', className)}
          data-variant={ctx.variant}
          {...props}
          onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
        />
      </FallbackContext.Provider>
    </RefreshTabsContext.Provider>
  );
});

/** One tab. A disabled tab uses the native `disabled` and is skipped by the arrow keys. */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, disabled = false, className, onClick, onFocus, onPointerDown, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsTrigger');
  const fallback = useContext(FallbackContext);
  const refreshTabs = useContext(RefreshTabsContext);
  const selected = ctx.value === value;
  // A press focuses the tab, then clicks it; an arrow key focuses a tab, then Enter or Space clicks
  // it. In automatic mode the focus selects, and the click after it does not select again: a parent
  // that commits later (a router) would get it twice. A new pointer press asks again.
  const selectedOnFocus = useRef(false);
  // Whether this tab can be the fallback depends on its `disabled` and `value`, and whether the tabs
  // fit on this tab being there; a render of this tab alone (inside a memoized component) does not
  // make the list look again. Nor does a tab that goes.
  useIsoLayoutEffect(() => {
    refreshTabs();
    return refreshTabs;
  }, [disabled, value, refreshTabs]);
  const register = useMemo(
    () =>
      mergeRefs(ref, (el: HTMLButtonElement | null) => {
        if (el) values.set(el, value);
      }),
    [ref, value],
  );
  return (
    <button
      ref={register}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={contentId(ctx.baseId, value)}
      tabIndex={(selected && !disabled) || fallback === value ? 0 : -1}
      disabled={disabled}
      className={clsx('flg-tabs-trigger', className)}
      {...props}
      id={triggerId(ctx.baseId, value)}
      onPointerDown={(event) => {
        // Reset even when the user's handler prevents the press: it is a new press all the same.
        selectedOnFocus.current = false;
        onPointerDown?.(event);
      }}
      onFocus={composeEventHandlers(onFocus, () => {
        if (ctx.activationMode !== 'automatic') return;
        ctx.select(value);
        selectedOnFocus.current = true;
      })}
      onClick={composeEventHandlers(onClick, () => {
        const already = selectedOnFocus.current;
        selectedOnFocus.current = false;
        if (!already) ctx.select(value);
      })}
    />
  );
});

/** The panel of the tab with the same value. Stays mounted; `hidden` while its tab is not selected. */
export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, className, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsContent');
  return (
    <div
      ref={ref}
      role="tabpanel"
      aria-labelledby={triggerId(ctx.baseId, value)}
      tabIndex={0}
      hidden={ctx.value !== value}
      className={clsx('flg-tabs-content', className)}
      {...props}
      id={contentId(ctx.baseId, value)}
    />
  );
});
