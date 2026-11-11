import { themeScriptSource } from './theme-script';

export interface ThemeScriptProps {
  /** The key of `localStorage` that the theme is kept in; the one `ThemeSwitch` uses. Default `"flg-theme"`. */
  storageKey?: string;
  /** The nonce of a Content Security Policy that allows scripts by nonce. */
  nonce?: string;
}

/**
 * Sets the stored theme on `<html>` before the page is painted, so that it does not flash. Render it
 * in the `<head>` of the document, and put `suppressHydrationWarning` on `<html>`, which the script
 * changes before React hydrates. It renders one `<script>` and has no hooks, so a layout that is a
 * Server Component can use it.
 */
export function ThemeScript({ storageKey, nonce }: ThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      // The browser takes the value out of the `nonce` attribute once it has used it, so that React
      // finds another one when it hydrates.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScriptSource(storageKey) }}
    />
  );
}
