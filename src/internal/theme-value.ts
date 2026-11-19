/**
 * What the theme can be. Its own file, with no React in it, because `ThemeScript` (a server-safe
 * module) needs the default key and must not pull in the hooks of `theme-store.ts`.
 */
export type ThemeValue = 'light' | 'dark' | 'system';

/** The key of `localStorage` that `ThemeSwitch`, `ThemeMenuGroup` and `ThemeScript` share. */
export const DEFAULT_THEME_STORAGE_KEY = 'flg-theme';

export function isThemeValue(value: unknown): value is ThemeValue {
  return value === 'light' || value === 'dark' || value === 'system';
}
