'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useId, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { MonitorIcon, MoonIcon, SunIcon } from '../../internal/icons';
import { joinIds } from '../../internal/join-ids';
import { useThemeValue } from '../../internal/theme-store';
import { DEFAULT_THEME_STORAGE_KEY, isThemeValue } from '../../internal/theme-value';
import type { ThemeValue } from '../../internal/theme-value';
import { withDefaults } from '../../internal/with-defaults';
import type { ButtonProps } from '../button/Button';
import { IconButton } from '../icon-button/IconButton';
import { MenuLabel, MenuRadioGroup, MenuRadioItem } from '../menu/Menu';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../tooltip/Tooltip';

export type { ThemeValue };

export interface ThemeSwitchLabels {
  light: string;
  dark: string;
  system: string;
  /** The name of the button, made from the word for the value it has. */
  trigger: (current: string) => string;
  /** The text of the tooltip, made from the words for the value it has and the one it goes to. */
  tooltip: (current: string, next: string) => string;
  /** The hint that describes the button to a screen reader, made from the word for the next value. */
  hint: (next: string) => string;
}

export type ThemeSwitchProps = Omit<
  ButtonProps,
  'aria-label' | 'aria-labelledby' | 'children' | 'value' | 'defaultValue' | 'asChild'
> & {
  /** The theme. Pass it with `onValueChange` to own it: nothing is read, stored or put on `<html>`. */
  value?: ThemeValue;
  /** The theme of the server's HTML, and until the stored one is read. Default `"system"`. */
  defaultValue?: ThemeValue;
  /** Called with the theme that was chosen. */
  onValueChange?: (value: ThemeValue) => void;
  /** The key of `localStorage` the theme is kept in. Default `"flg-theme"`. */
  storageKey?: string;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<ThemeSwitchLabels>;
};

export type ThemeMenuGroupProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'children'
> & {
  /** The theme. Pass it with `onValueChange` to own it: nothing is read, stored or put on `<html>`. */
  value?: ThemeValue;
  /** The theme of the server's HTML, and until the stored one is read. Default `"system"`. */
  defaultValue?: ThemeValue;
  /** Called with the theme that was chosen. */
  onValueChange?: (value: ThemeValue) => void;
  /** The key of `localStorage` the theme is kept in. Default `"flg-theme"`. */
  storageKey?: string;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<ThemeMenuGroupLabels>;
};

export interface ThemeMenuGroupLabels {
  /** The title of the group. */
  group: string;
  light: string;
  dark: string;
  system: string;
}

const DEFAULT_LABELS: ThemeSwitchLabels = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
  trigger: (current) => `Theme: ${current}`,
  tooltip: (current, next) => `Theme: ${current} · click to switch to ${next}`,
  hint: (next) => `Click to switch to ${next}`,
};

const DEFAULT_GROUP_LABELS: ThemeMenuGroupLabels = {
  group: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

/** The order of the button, and of the items of the menu. */
const NEXT: Record<ThemeValue, ThemeValue> = { light: 'dark', dark: 'system', system: 'light' };

/**
 * The button that goes round the themes: light, dark, system. It shows an icon for the value it has
 * (all three are in the DOM, and the CSS shows one) and says it in its name; the tooltip says what a
 * click will do, and a hidden hint says that to a screen reader instead of the tooltip, so that the
 * name is not read twice. Uncontrolled it keeps the theme in `localStorage` and on `<html>`, as does
 * any `ThemeMenuGroup` with the same `storageKey`; with `value` it only reports a click.
 */
export const ThemeSwitch = forwardRef<HTMLButtonElement, ThemeSwitchProps>(function ThemeSwitch(
  {
    value,
    defaultValue = 'system',
    onValueChange,
    storageKey = DEFAULT_THEME_STORAGE_KEY,
    labels: labelsProp,
    variant = 'ghost',
    size = 'md',
    className,
    onClick,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const labels = withDefaults(DEFAULT_LABELS, labelsProp);
  const hintId = useId();
  const [current, setValue] = useThemeValue({ value, defaultValue, onValueChange, storageKey });
  const next = NEXT[current];

  // The server's HTML, and the render that hydrates it, show the default value, which may not be the
  // stored one, so the button is `pending` until the first effect: the CSS draws the icon of
  // `<html data-flg-theme>` meanwhile, which `ThemeScript` has set before the page was painted. This
  // effect is declared after the one of the store (in `useThemeValue`), so both change in one render.
  // A controlled button shows the default value in those two renders too (the store's server
  // snapshot, in both modes), and `value` after them; it is not pending, since the theme it shows is
  // its parent's, which need not be the one on `<html>`.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <TooltipRoot describe={false}>
        <TooltipTrigger>
          <IconButton
            ref={ref}
            variant={variant}
            size={size}
            {...props}
            className={clsx('flg-theme-switch', className)}
            aria-label={labels.trigger(labels[current])}
            aria-describedby={joinIds(hintId, describedBy)}
            data-value={current}
            data-pending={dataAttr(value === undefined && !mounted)}
            onClick={composeEventHandlers(onClick, () => setValue(next))}
          >
            <SunIcon className="flg-theme-switch-icon" data-for="light" />
            <MoonIcon className="flg-theme-switch-icon" data-for="dark" />
            <MonitorIcon className="flg-theme-switch-icon" data-for="system" />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" sideOffset={17}>
          {labels.tooltip(labels[current], labels[next])}
        </TooltipContent>
      </TooltipRoot>
      <span id={hintId} hidden>
        {labels.hint(labels[next])}
      </span>
    </>
  );
});

const GROUP_ITEMS = [
  { value: 'light', Icon: SunIcon },
  { value: 'dark', Icon: MoonIcon },
  { value: 'system', Icon: MonitorIcon },
] as const;

/**
 * The three themes as a group of radio items, for a menu (the `UserMenu`, or any
 * `DropdownMenuContent`): a title, and Light, Dark and System, each with its icon at the end. It
 * shares its store with the `ThemeSwitch` of the same `storageKey`, so the two always agree.
 */
export const ThemeMenuGroup = forwardRef<HTMLDivElement, ThemeMenuGroupProps>(
  function ThemeMenuGroup(
    {
      value,
      defaultValue = 'system',
      onValueChange,
      storageKey = DEFAULT_THEME_STORAGE_KEY,
      labels: labelsProp,
      ...props
    },
    ref,
  ) {
    const labels = withDefaults(DEFAULT_GROUP_LABELS, labelsProp);
    const [current, setValue] = useThemeValue({ value, defaultValue, onValueChange, storageKey });
    return (
      <MenuRadioGroup
        ref={ref}
        {...props}
        value={current}
        onValueChange={(chosen) => {
          if (isThemeValue(chosen)) setValue(chosen);
        }}
      >
        <MenuLabel>{labels.group}</MenuLabel>
        {GROUP_ITEMS.map(({ value: item, Icon }) => (
          <MenuRadioItem key={item} value={item} textValue={labels[item]}>
            {labels[item]}
            <span className="flg-theme-menu-icon" aria-hidden="true">
              <Icon />
            </span>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    );
  },
);
