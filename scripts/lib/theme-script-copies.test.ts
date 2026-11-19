import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { themeScriptSource } from '../../src/components/theme-switch/theme-script';

// The script of the theme is copied by hand to two places that no server renders it for: the docs
// of ThemeSwitch, which an application copies from, and the `shell.html` of the Vite fixture. These
// tests keep both the same as what `ThemeScript` renders, so a change to the script cannot leave a
// copy behind.
const ROOT = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');
const scriptOf = (text: string, pattern: RegExp) => {
  const match = pattern.exec(text);
  if (!match?.[1]) throw new Error(`no script found by ${pattern}`);
  return match[1];
};

describe('the copies of the theme script', () => {
  const source = themeScriptSource('flg-theme');

  it('is what the fixture of Vite has in the head of its frame page, character for character', () => {
    const html = read('fixtures/vite-app/shell.html');
    expect(scriptOf(html, /<head>[\s\S]*?<script>([\s\S]*?)<\/script>/)).toBe(source);
  });

  it('is what the docs of ThemeSwitch show, once Prettier has set it out for reading', () => {
    // The docs snippet is formatted: it has line breaks and single quotes, and a `;` where Prettier
    // puts one. None of that is code, so the two are compared without it.
    const flat = (code: string) =>
      code
        .replace(/\s+/g, '')
        .replace(/"/g, "'")
        .replace(/;(?=[})]|$)/g, '');
    const docs = read('src/components/theme-switch/ThemeSwitch.mdx');
    const snippet = scriptOf(docs, /```html\n<script>\n([\s\S]*?)\n<\/script>\n```/);
    expect(flat(snippet)).toBe(flat(source));
  });
});
