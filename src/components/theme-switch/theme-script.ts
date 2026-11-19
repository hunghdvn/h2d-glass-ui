import { DEFAULT_THEME_STORAGE_KEY } from '../../internal/theme-value';

/**
 * The script that puts the stored theme on `<html>` before the page is painted (spec phase 5 §6.3):
 * `light` and `dark` as `data-flg-theme`, anything else, or nothing, as no attribute, which leaves the
 * choice to the system. `ThemeScript` renders it; an application that has no server to render it
 * (Vite) copies it into its `index.html`. It reads `localStorage` as `theme-store.ts` does.
 *
 * The key goes in as a string literal, and every `<` of it is escaped, so that a key cannot close the
 * `<script>` tag or open a comment inside it.
 */
export function themeScriptSource(storageKey: string = DEFAULT_THEME_STORAGE_KEY): string {
  const key = JSON.stringify(storageKey).replace(/</g, '\\u003c');
  return (
    '(function(k){try{var v=localStorage.getItem(k),d=document.documentElement;' +
    'if(v==="light"||v==="dark")d.setAttribute("data-flg-theme",v);' +
    'else d.removeAttribute("data-flg-theme")}catch(e){}})(' +
    key +
    ')'
  );
}
