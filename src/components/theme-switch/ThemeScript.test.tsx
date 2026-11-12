import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeScript } from './ThemeScript';
import { themeScriptSource } from './theme-script';

describe('ThemeScript', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders exactly one <script>, with the source of the default key', () => {
    expect(renderToStaticMarkup(<ThemeScript />)).toBe(
      `<script>${themeScriptSource('flg-theme')}</script>`,
    );
  });

  it('renders the source as it is, not as text: its quotes are not escaped', () => {
    const markup = renderToStaticMarkup(<ThemeScript storageKey="my-key" />);
    expect(markup).toContain('("my-key")');
    expect(markup).not.toContain('&quot;');
  });

  it('puts the nonce on the tag, and has no attribute without one', () => {
    expect(renderToStaticMarkup(<ThemeScript nonce="abc123" />)).toMatch(
      /^<script nonce="abc123">/,
    );
    expect(renderToStaticMarkup(<ThemeScript />)).not.toContain('nonce');
  });

  it('cannot be closed early by a key that holds a tag', () => {
    const markup = renderToStaticMarkup(<ThemeScript storageKey="</script><b>" />);
    expect(markup.match(/<\/script>/g)).toHaveLength(1);
    expect(markup.endsWith('</script>')).toBe(true);
  });

  it('hydrates without a warning when the browser has hidden the nonce, as it does after it ran the script', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = renderToString(<ThemeScript nonce="abc123" />);
    // The browser keeps the value in the property and takes it out of the attribute, so that a
    // script of the page cannot read it.
    container.querySelector('script')!.removeAttribute('nonce');
    document.body.append(container);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <ThemeScript nonce="abc123" />);
    });
    expect(error).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
  });
});
