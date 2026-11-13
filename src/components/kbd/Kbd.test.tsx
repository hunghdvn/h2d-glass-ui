import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { Kbd } from './Kbd';
import type { KbdProps } from './Kbd';

const UNKNOWN_PART =
  WARN_PREFIX + ' <Kbd> keys has a part it does not know; it is shown as written.';
const BOTH = WARN_PREFIX + ' <Kbd> takes keys or children, not both; keys is used.';

/** Pretends to run on a system whose `navigator.platform` is `name`. */
function platform(name: string) {
  vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue(name);
}

/** The cells of a combination: the `<kbd>` inside the outer one. */
const cells = (outer: Element) => Array.from(outer.querySelectorAll(':scope > kbd'));
/** What a sighted user reads: the text that is not hidden from them. */
const seen = (cell: Element) =>
  Array.from(cell.childNodes)
    .filter(
      (node) =>
        node.nodeType === Node.TEXT_NODE ||
        !(node as Element).classList.contains('flg-visually-hidden'),
    )
    .map((node) => node.textContent)
    .join('');

describe('Kbd', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('with children', () => {
    it('is a plain kbd with the class of the library', () => {
      render(<Kbd>Esc</Kbd>);
      const kbd = screen.getByText('Esc');
      expect(kbd.tagName).toBe('KBD');
      expect(kbd).toHaveClass('flg-kbd');
      expect(kbd).not.toHaveAttribute('data-platform');
    });

    it('keeps what the caller gives, merges the class and points ref at the kbd', () => {
      const ref = createRef<HTMLElement>();
      const onClick = vi.fn();
      render(
        <Kbd ref={ref} className="mine" title="Escape" style={{ color: 'red' }} onClick={onClick}>
          Esc
        </Kbd>,
      );
      const kbd = screen.getByText('Esc');
      expect(ref.current).toBe(kbd);
      expect(kbd).toHaveClass('flg-kbd', 'mine');
      expect(kbd).toHaveAttribute('title', 'Escape');
      expect(kbd).toHaveStyle({ color: 'rgb(255, 0, 0)' });
      fireEvent.click(kbd);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    // `keys={cond && 'mod+k'}` from JavaScript, or behind a cast: the types forbid it.
    it.each([null, false])('takes keys={%s} as no keys: no warning, and nothing throws', (keys) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const props = { keys, children: 'Esc' } as unknown as KbdProps;
      const { container } = render(<Kbd {...props} />);
      expect(container.innerHTML).toBe('<kbd class="flg-kbd">Esc</kbd>');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('with keys', () => {
    it('draws a cell for each key inside the outer kbd, with a hidden "+" between them', () => {
      platform('Win32');
      const ref = createRef<HTMLElement>();
      const { container } = render(<Kbd ref={ref} keys="mod+shift+f" />);
      const outer = container.firstElementChild!;
      expect(outer).toBe(ref.current);
      expect(outer.tagName).toBe('KBD');
      expect(outer).toHaveClass('flg-kbd');
      expect(outer).not.toHaveAttribute('data-platform');
      expect(cells(outer).map((cell) => cell.textContent)).toEqual(['Ctrl', 'Shift', 'F']);
      const separators = Array.from(outer.querySelectorAll(':scope > .flg-visually-hidden'));
      expect(separators.map((separator) => separator.textContent)).toEqual(['+', '+']);
      // The order of the nodes: key, "+", key, "+", key.
      expect(Array.from(outer.children).map((child) => child.tagName)).toEqual([
        'KBD',
        'SPAN',
        'KBD',
        'SPAN',
        'KBD',
      ]);
    });

    it('draws the symbols of Apple with a hidden name each, and marks the outer kbd', () => {
      platform('MacIntel');
      const { container } = render(<Kbd keys="mod+shift+f" />);
      const outer = container.firstElementChild!;
      expect(outer).toHaveAttribute('data-platform', 'apple');
      const [command, shift, f] = cells(outer);
      expect(seen(command!)).toBe('⌘');
      expect(command!.querySelector('[aria-hidden="true"]')?.textContent).toBe('⌘');
      expect(command!.querySelector('.flg-visually-hidden')?.textContent).toBe('Command');
      expect(seen(shift!)).toBe('⇧');
      expect(shift!.querySelector('.flg-visually-hidden')?.textContent).toBe('Shift');
      // A letter is read as it is: no hidden name.
      expect(f!.innerHTML).toBe('F');
    });

    it('keeps the order of the writer', () => {
      platform('MacIntel');
      const { container } = render(<Kbd keys="shift+mod+f" />);
      expect(cells(container.firstElementChild!).map(seen)).toEqual(['⇧', '⌘', 'F']);
    });

    it.each(['Up Arrow', 'Down Arrow'])('names an arrow on both platforms: %s', (name) => {
      const keys = name === 'Up Arrow' ? 'up' : 'down';
      for (const system of ['Win32', 'MacIntel']) {
        platform(system);
        const { container, unmount } = render(<Kbd keys={keys} />);
        expect(container.querySelector('.flg-visually-hidden')?.textContent).toBe(name);
        unmount();
      }
    });

    it('takes the names and the separator from labels, and a label left undefined keeps its default', () => {
      platform('MacIntel');
      const { container } = render(
        <Kbd keys="mod+k" labels={{ command: 'Befehl', separator: ' plus ', shift: undefined }} />,
      );
      const outer = container.firstElementChild!;
      expect(outer.querySelector('.flg-visually-hidden')?.textContent).toBe('Befehl');
      expect(outer.querySelectorAll(':scope > .flg-visually-hidden')[0]?.textContent).toBe(
        ' plus ',
      );
    });

    it('keeps the class, the title, the style, the handlers and the aria of the caller', () => {
      const onClick = vi.fn();
      const { container } = render(
        <Kbd
          keys="mod+k"
          className="mine"
          title="Search"
          style={{ color: 'red' }}
          aria-hidden="true"
          data-testid="k"
          onClick={onClick}
        />,
      );
      const outer = container.firstElementChild!;
      expect(outer).toHaveClass('flg-kbd', 'mine');
      expect(outer).toHaveAttribute('title', 'Search');
      expect(outer).toHaveAttribute('aria-hidden', 'true');
      expect(outer).toHaveAttribute('data-testid', 'k');
      expect(outer).toHaveStyle({ color: 'rgb(255, 0, 0)' });
      fireEvent.click(outer);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('follows `keys` when it changes on the mounted element, and a switch to children', () => {
      platform('Win32');
      const { container, rerender } = render(<Kbd keys="mod+k" />);
      const outer = container.firstElementChild!;
      expect(cells(outer).map(seen)).toEqual(['Ctrl', 'K']);
      rerender(<Kbd keys="alt+j" />);
      expect(container.firstElementChild).toBe(outer);
      expect(cells(outer).map(seen)).toEqual(['Alt', 'J']);
      rerender(<Kbd>Esc</Kbd>);
      expect(container.firstElementChild).toHaveTextContent('Esc');
      expect(container.querySelectorAll('kbd')).toHaveLength(1);
    });

    it('is named by the key names joined with "+", never "CtrlK" or "⌘K"', () => {
      platform('Win32');
      const { unmount } = render(
        <button type="button">
          Save <Kbd keys="mod+k" />
        </button>,
      );
      const name = screen.getByRole('button').textContent;
      expect(screen.getByRole('button', { name: /Ctrl\s*\+\s*K/ })).toBeInTheDocument();
      expect(name).not.toMatch(/CtrlK/);
      unmount();
      platform('MacIntel');
      render(
        <button type="button">
          Save <Kbd keys="mod+k" />
        </button>,
      );
      // The symbol is hidden and its name read.
      expect(screen.getByRole('button', { name: /Command\s*\+\s*K/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /⌘/ })).toBeNull();
    });

    it('draws a part it does not know as written, and says so once', () => {
      platform('Win32');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { container, rerender } = render(<Kbd keys="mod+foo" />);
      expect(cells(container.firstElementChild!).map(seen)).toEqual(['Ctrl', 'foo']);
      expect(warn).toHaveBeenCalledWith(UNKNOWN_PART);
      rerender(<Kbd keys="mod+bar" />);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('says an empty part is wrong and draws nothing for it', () => {
      platform('Win32');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { container } = render(<Kbd keys="mod++" />);
      expect(cells(container.firstElementChild!).map(seen)).toEqual(['Ctrl']);
      expect(warn).toHaveBeenCalledWith(UNKNOWN_PART);
    });

    it('does not warn for a combination it knows', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Kbd keys="mod+shift+f" />);
      expect(warn).not.toHaveBeenCalled();
    });

    it('takes keys when it is given both, and says so', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      platform('Win32');
      const { container } = render(
        // @ts-expect-error `keys` and `children` are not allowed together
        <Kbd keys="mod+k">Esc</Kbd>,
      );
      expect(cells(container.firstElementChild!).map(seen)).toEqual(['Ctrl', 'K']);
      expect(container).not.toHaveTextContent('Esc');
      expect(warn).toHaveBeenCalledWith(BOTH);
    });

    it('does not warn for keys with children that render nothing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(
        // @ts-expect-error `keys` and `children` are not allowed together
        <Kbd keys="mod+k">{false}</Kbd>,
      );
      expect(warn).not.toHaveBeenCalledWith(BOTH);
    });
  });

  describe('server and client agree', () => {
    it('renders the form for other systems on the server, and the Apple one after mount', async () => {
      platform('MacIntel');
      const recoverable = vi.fn();
      const html = renderToString(<Kbd keys="mod+k" />);
      const host = document.createElement('div');
      host.innerHTML = html;
      document.body.append(host);
      expect(host.firstElementChild).not.toHaveAttribute('data-platform');
      expect(cells(host.firstElementChild!).map(seen)).toEqual(['Ctrl', 'K']);
      // After the server render: React 18 warns about a layout effect there, which is the test's jsdom.
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      let root: Root | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(host, <Kbd keys="mod+k" />, { onRecoverableError: recoverable });
        });
        expect(recoverable).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
        expect(host.firstElementChild).toHaveAttribute('data-platform', 'apple');
        expect(cells(host.firstElementChild!).map(seen)).toEqual(['⌘', 'K']);
      } finally {
        // The root is the test's own, which the cleanup of Testing Library does not know about.
        act(() => root?.unmount());
      }
    });

    it('renders children the same way everywhere', () => {
      platform('MacIntel');
      expect(renderToString(<Kbd>Esc</Kbd>)).toBe('<kbd class="flg-kbd">Esc</kbd>');
    });
  });
});
