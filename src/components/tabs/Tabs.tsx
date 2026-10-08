'use client';

import { clsx } from 'clsx';
import { createContext, forwardRef, useContext, useId, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { getNextIndex, hasModifier } from '../../internal/roving';
import type { Orientation } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';

export type TabsVariant = 'underline' | 'segmented' | 'pill';
export type TabsActivationMode = 'automatic' | 'manual';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /** The value of the selected tab. Pass it with `onValueChange` to control it. */
  value?: string;
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
export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Ties the tab to the `TabsContent` with the same value. */
  value: string;
}
export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Ties the panel to the `TabsTrigger` with the same value. */
  value: string;
}

interface TabsContextValue {
  baseId: string;
  value: string | undefined;
  select: (value: string) => void;
  orientation: Orientation;
  activationMode: TabsActivationMode;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);
/** The tab that takes Tab when no enabled tab is selected; set by `TabsList`. */
const FallbackContext = createContext<string | null>(null);

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
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((value: string | undefined) => void) | undefined,
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
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const tabs = tabsOf(list);
    const reachable = tabs.some(
      (tab) => tab.getAttribute('aria-selected') === 'true' && !tab.disabled,
    );
    const first = reachable ? undefined : tabs.find((tab) => !tab.disabled);
    const next = first ? (values.get(first) ?? null) : null;
    setFallback((current) => (current === next ? current : next));
  });
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list || hasModifier(event)) return;
    const tabs = tabsOf(list);
    const current = tabs.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    const next = getNextIndex(
      tabs.map((tab) => ({ disabled: tab.disabled })),
      current,
      event.key,
      { orientation: ctx.orientation, loop: true },
    );
    if (next === null) return;
    event.preventDefault();
    // Focus selects the tab in automatic mode (see TabsTrigger).
    tabs[next]?.focus();
  };
  return (
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
  );
});

/** One tab. A disabled tab uses the native `disabled` and is skipped by the arrow keys. */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, disabled = false, className, onClick, onFocus, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsTrigger');
  const fallback = useContext(FallbackContext);
  const selected = ctx.value === value;
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
      id={triggerId(ctx.baseId, value)}
      aria-selected={selected}
      aria-controls={contentId(ctx.baseId, value)}
      tabIndex={(selected && !disabled) || fallback === value ? 0 : -1}
      disabled={disabled}
      className={clsx('flg-tabs-trigger', className)}
      {...props}
      onClick={composeEventHandlers(onClick, () => ctx.select(value))}
      onFocus={composeEventHandlers(onFocus, () => {
        if (ctx.activationMode === 'automatic') ctx.select(value);
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
      id={contentId(ctx.baseId, value)}
      aria-labelledby={triggerId(ctx.baseId, value)}
      tabIndex={0}
      hidden={ctx.value !== value}
      className={clsx('flg-tabs-content', className)}
      {...props}
    />
  );
});
