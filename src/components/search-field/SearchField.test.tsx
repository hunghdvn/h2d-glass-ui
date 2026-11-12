import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { SearchField } from './SearchField';
import type { SearchFieldProps } from './SearchField';

// jsdom has no Popover API; the tooltip of a collapsed field needs a stand-in to be in the page.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

const NO_NAME =
  WARN_PREFIX +
  ' <SearchField> needs a name: a Field label or aria-label. A placeholder is not a name.';
const BAD_SHORTCUT = WARN_PREFIX + ' <SearchField> shortcut must be "/" or "mod+k"; it is ignored.';

const search = () => screen.getByRole('searchbox') as HTMLInputElement;
const rootOf = (input: HTMLElement) => input.closest('.flg-search-field') as HTMLElement;
const kbds = () => Array.from(document.querySelectorAll('.flg-search-field-kbd'));
const press = (init: KeyboardEventInit, target: Element | Document = document.body) =>
  fireEvent.keyDown(target, init);

/** Pretends to run on a system whose `navigator.platform` is `platform`. */
function platform(name: string) {
  vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue(name);
}

function Search(props: SearchFieldProps) {
  return <SearchField aria-label="Search docs" {...props} />;
}

describe('SearchField', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('structure', () => {
    it('renders a search input in an Input frame with a magnifier, and routes className and style to the root', () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <SearchField
          aria-label="Search docs"
          ref={ref}
          className="mine"
          style={{ width: 200 }}
          name="q"
          placeholder="Search…"
          maxLength={40}
        />,
      );
      const input = search();
      const root = rootOf(input);
      expect(ref.current).toBe(input);
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('name', 'q');
      expect(input).toHaveAttribute('maxlength', '40');
      expect(input).not.toHaveAttribute('class');
      expect(root).toHaveClass('flg-search-field', 'mine');
      expect(root).toHaveStyle({ width: '200px' });
      expect(root).not.toHaveAttribute('data-collapsible');
      const frame = input.parentElement!;
      expect(frame).toHaveClass('flg-input');
      expect(frame).not.toHaveClass('mine');
      expect(frame.querySelector('.flg-input-adornment > svg circle')).not.toBeNull();
    });

    it('takes the size of an Input, and a size it does not know is medium', () => {
      const { rerender } = render(<Search size="sm" />);
      expect(search().parentElement).toHaveAttribute('data-size', 'sm');
      rerender(<Search size="lg" />);
      expect(search().parentElement).toHaveAttribute('data-size', 'lg');
      rerender(<Search size={'huge' as 'sm'} />);
      expect(search().parentElement).toHaveAttribute('data-size', 'md');
    });

    it('marks an invalid field, as an Input does', () => {
      render(<Search invalid />);
      expect(search()).toHaveAttribute('aria-invalid', 'true');
      expect(search().parentElement).toHaveAttribute('data-invalid');
    });
  });

  describe('value', () => {
    it('starts from defaultValue and follows what is typed', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Search defaultValue="ab" onValueChange={onValueChange} />);
      expect(search()).toHaveValue('ab');
      await user.type(search(), 'c');
      expect(search()).toHaveValue('abc');
      expect(onValueChange).toHaveBeenLastCalledWith('abc');
    });

    it('is controlled by value, and shows the value of the parent whatever is typed', async () => {
      const user = userEvent.setup();
      const seen: string[] = [];
      function Parent() {
        const [value, setValue] = useState('x');
        return (
          <Search
            value={value}
            onValueChange={(next) => {
              seen.push(next);
              if (next.length < 3) setValue(next);
            }}
          />
        );
      }
      render(<Parent />);
      await user.type(search(), 'yz');
      expect(seen).toEqual(['xy', 'xyz']);
      expect(search()).toHaveValue('xy');
    });

    it('calls the onChange of the caller first, and leaves the text alone when it prevents the event', () => {
      const order: string[] = [];
      render(
        <Search
          onChange={(event) => {
            order.push(`change:${event.target.value}`);
            event.preventDefault();
          }}
          onValueChange={(value) => order.push(`value:${value}`)}
        />,
      );
      fireEvent.change(search(), { target: { value: 'a' } });
      expect(order).toEqual(['change:a']);
    });

    it('sends its name and text with the form', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <Search name="q" />
        </form>,
      );
      await user.type(search(), 'glass');
      expect(new FormData(container.querySelector('form')!).get('q')).toBe('glass');
    });

    it('puts back defaultValue when its form is reset, and the clear button follows', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <Search name="q" defaultValue="start" />
        </form>,
      );
      await user.type(search(), '!');
      expect(search()).toHaveValue('start!');
      act(() => container.querySelector('form')!.reset());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
      expect(search()).toHaveValue('start');
      expect(new FormData(container.querySelector('form')!).get('q')).toBe('start');
      await user.clear(search());
      act(() => container.querySelector('form')!.reset());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
      expect(search()).toHaveValue('start');
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });

    it('follows a form that its form attribute names', async () => {
      const user = userEvent.setup();
      render(
        <>
          <form id="outside" />
          <Search defaultValue="start" form="outside" />
        </>,
      );
      await user.type(search(), '!');
      act(() => (document.getElementById('outside') as HTMLFormElement).reset());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
      expect(search()).toHaveValue('start');
    });

    it('submits the form it is in on Enter, as a native input does', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      render(
        <form role="search" onSubmit={onSubmit}>
          <Search name="q" />
          <button type="submit">Go</button>
        </form>,
      );
      await user.type(search(), 'x{Enter}');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear button', () => {
    it('shows only while there is text, is named by labels.clear and is in the Tab order', async () => {
      const user = userEvent.setup();
      render(<Search labels={{ clear: 'Xoá' }} />);
      expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
      await user.type(search(), 'a');
      const clear = screen.getByRole('button', { name: 'Xoá' });
      expect(clear).toHaveAttribute('type', 'button');
      expect(clear).not.toHaveAttribute('tabindex');
      await user.tab();
      expect(clear).toHaveFocus();
    });

    it('clears the text, tells onValueChange and puts the focus back in the field', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Search defaultValue="abc" onValueChange={onValueChange} />);
      await user.click(screen.getByRole('button', { name: 'Clear search' }));
      expect(search()).toHaveValue('');
      expect(onValueChange).toHaveBeenCalledWith('');
      expect(search()).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    });

    it('is not there on a field that cannot be changed', () => {
      const { rerender } = render(<Search defaultValue="abc" disabled />);
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
      rerender(<Search defaultValue="abc" readOnly />);
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
      rerender(<Search defaultValue="abc" />);
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });

    it('is not done by Esc either on a field that cannot be changed, which leaves the key to the page', () => {
      for (const props of [{ readOnly: true }, { disabled: true }]) {
        const onValueChange = vi.fn();
        const { unmount } = render(
          <Search defaultValue="abc" onValueChange={onValueChange} {...props} />,
        );
        expect(press({ key: 'Escape' }, search()), JSON.stringify(props)).toBe(true);
        expect(search()).toHaveValue('abc');
        expect(onValueChange).not.toHaveBeenCalled();
        unmount();
      }
    });

    it('lets Esc close a collapsible field that cannot be changed, with its text kept', async () => {
      const user = userEvent.setup();
      render(<Search collapsible defaultValue="abc" readOnly />);
      await user.click(screen.getByRole('button', { name: 'Search' }));
      expect(search()).toHaveFocus();
      expect(press({ key: 'Escape' }, search())).toBe(false);
      expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
      expect(search()).toHaveValue('abc');
    });

    it('is not there inside a disabled Field either', () => {
      render(
        <Field label="Docs" disabled>
          <SearchField defaultValue="abc" />
        </Field>,
      );
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    });
  });

  describe('Esc', () => {
    it('clears the text, keeps the event from going on, and the field open for the next Esc', () => {
      const onValueChange = vi.fn();
      render(<Search defaultValue="abc" onValueChange={onValueChange} />);
      search().focus();
      expect(press({ key: 'Escape' }, search())).toBe(false);
      expect(search()).toHaveValue('');
      expect(onValueChange).toHaveBeenCalledWith('');
      expect(search()).toHaveFocus();
    });

    it('does nothing to an empty field that is not collapsible, and lets the key go on', () => {
      render(<Search />);
      search().focus();
      expect(press({ key: 'Escape' }, search())).toBe(true);
      expect(search()).toHaveFocus();
    });

    it('leaves the key to the input method while it composes', () => {
      render(<Search defaultValue="abc" />);
      press({ key: 'Escape', isComposing: true }, search());
      press({ key: 'Escape', keyCode: 229 }, search());
      expect(search()).toHaveValue('abc');
    });

    it('is left alone by the field when the caller prevented it', () => {
      render(<Search defaultValue="abc" onKeyDown={(event) => event.preventDefault()} />);
      press({ key: 'Escape' }, search());
      expect(search()).toHaveValue('abc');
    });
  });

  describe('name', () => {
    it('warns once the field is in the page without a name, and a placeholder is not one', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<SearchField placeholder="Search…" />);
      expect(warn).toHaveBeenCalledWith(NO_NAME);
    });

    it('does not warn with aria-label, aria-labelledby or a Field label', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { unmount } = render(<SearchField aria-label="Search docs" />);
      unmount();
      render(
        <>
          <span id="title">Docs</span>
          <SearchField aria-labelledby="title" />
        </>,
      ).unmount();
      render(
        <Field label="Docs">
          <SearchField />
        </Field>,
      );
      expect(warn).not.toHaveBeenCalled();
      expect(screen.getByRole('searchbox', { name: 'Docs' })).toBeInTheDocument();
    });

    it('does not take a Field that has no label for a name', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(
        <Field description="Looks in the docs">
          <SearchField />
        </Field>,
      );
      expect(warn).toHaveBeenCalledWith(NO_NAME);
    });

    it('lets a Field describe it and mark it invalid', () => {
      render(
        <Field label="Docs" description="Looks in the docs" error="Too short">
          <SearchField />
        </Field>,
      );
      const input = screen.getByRole('searchbox', { name: 'Docs' });
      expect(input).toHaveAccessibleDescription('Looks in the docs Too short');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('shortcut', () => {
    it('"/" focuses the field and selects its text, and no "/" is typed', () => {
      render(<Search shortcut="/" defaultValue="abc" />);
      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(search()).toHaveFocus();
      expect(search().selectionStart).toBe(0);
      expect(search().selectionEnd).toBe(3);
    });

    it('leaves the key to a place where the user types, including this field', async () => {
      const user = userEvent.setup();
      render(
        <>
          <input aria-label="other" />
          <Search shortcut="/" />
        </>,
      );
      const other = screen.getByRole('textbox', { name: 'other' });
      await user.click(other);
      await user.keyboard('/');
      expect(other).toHaveValue('/');
      expect(other).toHaveFocus();
      await user.click(search());
      await user.keyboard('a/b');
      expect(search()).toHaveValue('a/b');
    });

    it('"mod+k" types nothing, so it is taken in a text field: another one, and this one, where it selects the text', async () => {
      platform('Win32');
      const user = userEvent.setup();
      render(
        <>
          <input aria-label="other" defaultValue="note" />
          <Search shortcut="mod+k" defaultValue="abc" />
        </>,
      );
      const other = screen.getByRole('textbox', { name: 'other' });
      await user.click(other);
      expect(press({ key: 'k', ctrlKey: true }, other)).toBe(false);
      expect(search()).toHaveFocus();
      expect(other).toHaveValue('note');
      search().setSelectionRange(1, 1);
      expect(press({ key: 'k', ctrlKey: true }, search())).toBe(false);
      expect(search()).toHaveFocus();
      expect([search().selectionStart, search().selectionEnd]).toEqual([0, 3]);
    });

    it('leaves "mod+k" to a text field that prevented it first, as an editor with its own Ctrl K does', async () => {
      platform('Win32');
      const user = userEvent.setup();
      render(
        <>
          <input
            aria-label="editor"
            onKeyDown={(event) => {
              if (event.ctrlKey && event.key === 'k') event.preventDefault();
            }}
          />
          <Search shortcut="mod+k" />
        </>,
      );
      const editor = screen.getByRole('textbox', { name: 'editor' });
      await user.click(editor);
      press({ key: 'k', ctrlKey: true }, editor);
      expect(editor).toHaveFocus();
    });

    it('leaves a key that something else prevented, and one the input method owns', () => {
      render(<Search shortcut="/" />);
      document.addEventListener('keydown', (event) => event.preventDefault(), {
        once: true,
        capture: true,
      });
      press({ key: '/' });
      press({ key: '/', isComposing: true });
      expect(search()).not.toHaveFocus();
    });

    it('"mod+k" is ⌘K on an Apple system and Ctrl K elsewhere', () => {
      platform('MacIntel');
      const { unmount } = render(<Search shortcut="mod+k" />);
      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['⌘K']);
      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Meta+K');
      press({ key: 'k', ctrlKey: true });
      expect(search()).not.toHaveFocus();
      press({ key: 'k', metaKey: true });
      expect(search()).toHaveFocus();
      unmount();
      platform('Win32');
      render(<Search shortcut="mod+k" />);
      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['Ctrl K']);
      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Control+K');
      press({ key: 'k', metaKey: true });
      expect(search()).not.toHaveFocus();
      press({ key: 'k', ctrlKey: true });
      expect(search()).toHaveFocus();
    });

    it('writes the hint with labels.shortcut, which is told the key and the platform', () => {
      platform('Linux x86_64');
      const text = vi.fn((shortcut: string, apple: boolean) => `${shortcut}/${apple}`);
      render(<Search shortcut="mod+k" labels={{ shortcut: text }} />);
      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['mod+k/false']);
    });

    it('hides the hint from assistive technology, and the shortcut is said by aria-keyshortcuts', () => {
      render(<Search shortcut="/" />);
      expect(kbds()[0]).toHaveAttribute('aria-hidden', 'true');
      expect(search()).toHaveAttribute('aria-keyshortcuts', '/');
    });

    it('keeps the aria-keyshortcuts of the caller', () => {
      render(<Search shortcut="/" aria-keyshortcuts="Alt+S" />);
      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Alt+S');
    });

    it('shows the hint only while the field is empty, and the clear button in its place', async () => {
      const user = userEvent.setup();
      render(<Search shortcut="/" />);
      expect(kbds()).toHaveLength(1);
      await user.type(search(), 'a');
      expect(kbds()).toHaveLength(0);
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
      await user.clear(search());
      expect(kbds()).toHaveLength(1);
    });

    it('has no hint and no aria-keyshortcuts on a field that cannot take the key, and keeps those of the caller', () => {
      platform('Win32');
      const { rerender } = render(<Search shortcut="mod+k" disabled />);
      expect(kbds()).toHaveLength(0);
      expect(search()).not.toHaveAttribute('aria-keyshortcuts');
      rerender(<Search shortcut="/" readOnly />);
      expect(kbds()).toHaveLength(0);
      expect(search()).not.toHaveAttribute('aria-keyshortcuts');
      rerender(<Search shortcut="/" readOnly aria-keyshortcuts="Alt+S" />);
      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Alt+S');
      rerender(<Search shortcut="/" />);
      expect(kbds()).toHaveLength(1);
      expect(search()).toHaveAttribute('aria-keyshortcuts', '/');
    });

    it('has no hint and no aria-keyshortcuts inside a disabled Field', () => {
      platform('Win32');
      render(
        <Field label="Docs" disabled>
          <SearchField shortcut="mod+k" />
        </Field>,
      );
      expect(kbds()).toHaveLength(0);
      expect(screen.getByRole('searchbox', { name: 'Docs' })).not.toHaveAttribute(
        'aria-keyshortcuts',
      );
    });

    it('has no hint and no aria-keyshortcuts without a shortcut', () => {
      render(<Search />);
      expect(kbds()).toHaveLength(0);
      expect(search()).not.toHaveAttribute('aria-keyshortcuts');
    });

    it('ignores a shortcut it does not know and says so once', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(<Search shortcut={'ctrl+p' as '/'} />);
      expect(kbds()).toHaveLength(0);
      expect(warn).toHaveBeenCalledWith(BAD_SHORTCUT);
      press({ key: 'p', ctrlKey: true });
      expect(search()).not.toHaveFocus();
    });

    it('follows a shortcut that changes, and one that is turned off', () => {
      platform('Win32');
      const { rerender } = render(<Search shortcut="/" />);
      rerender(<Search shortcut="mod+k" />);
      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['Ctrl K']);
      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Control+K');
      press({ key: '/' });
      expect(search()).not.toHaveFocus();
      press({ key: 'k', ctrlKey: true });
      expect(search()).toHaveFocus();
      search().blur();
      rerender(<Search />);
      expect(search()).not.toHaveAttribute('aria-keyshortcuts');
      press({ key: 'k', ctrlKey: true });
      expect(search()).not.toHaveFocus();
    });

    it('is not taken by a field that is disabled, and is again when it is enabled', () => {
      const { rerender } = render(<Search shortcut="/" disabled />);
      expect(press({ key: '/' })).toBe(true);
      expect(search()).not.toHaveFocus();
      rerender(<Search shortcut="/" />);
      expect(press({ key: '/' })).toBe(false);
      expect(search()).toHaveFocus();
    });

    it('is not taken by a field under an inert element, which stays shut, and the key goes on', () => {
      render(
        <div data-testid="sheet-behind">
          <Search collapsible shortcut="/" />
        </div>,
      );
      // Set on the DOM, as the AppShell does: React 18.3 does not know the attribute.
      const behind = screen.getByTestId('sheet-behind');
      behind.setAttribute('inert', '');
      expect(press({ key: '/' })).toBe(true);
      expect(rootOf(search())).not.toHaveAttribute('data-open');
      behind.removeAttribute('inert');
      expect(press({ key: '/' })).toBe(false);
      expect(rootOf(search())).toHaveAttribute('data-open');
    });

    // A field out of sight (in a hidden panel, in a closed sheet) or under a modal is one the browser
    // does not focus. jsdom focuses anything, so a `focus` that does nothing plays the browser here;
    // the stories `HiddenFieldLeavesTheKey`, `SidebarFieldUnderAClosedSheet` and
    // `FieldUnderAModalLeavesTheKey` show it in the real engines.
    it('is not taken by a field that does not get the focus, and the key goes on', () => {
      render(<Search shortcut="/" defaultValue="abc" />);
      vi.spyOn(search(), 'focus').mockImplementation(() => undefined);
      expect(press({ key: '/' })).toBe(true);
      expect(search()).not.toHaveFocus();
      expect(search().selectionStart).toBe(search().selectionEnd);
    });

    it('is not taken by a collapsed field whose button does not get the focus, which stays shut', () => {
      render(<Search collapsible shortcut="/" />);
      const button = screen.getByRole('button', { name: 'Search' });
      vi.spyOn(button, 'focus').mockImplementation(() => undefined);
      expect(press({ key: '/' })).toBe(true);
      expect(rootOf(button)).not.toHaveAttribute('data-open');
      expect(button).toBeInTheDocument();
    });

    it('goes to the field mounted last when two ask for the same key, and back when it unmounts', () => {
      const { rerender } = render(
        <>
          <Search aria-label="First" shortcut="/" />
          <Search aria-label="Second" shortcut="/" />
        </>,
      );
      press({ key: '/' });
      expect(screen.getByRole('searchbox', { name: 'Second' })).toHaveFocus();
      rerender(<Search aria-label="First" shortcut="/" />);
      press({ key: '/' });
      expect(screen.getByRole('searchbox', { name: 'First' })).toHaveFocus();
    });

    it('goes to the field mounted before when the one mounted last does not get the focus', () => {
      render(
        <>
          <Search aria-label="First" shortcut="/" />
          <Search aria-label="Second" collapsible shortcut="/" />
        </>,
      );
      // The later field is out of sight, say in a hidden panel: the browser does not focus it.
      vi.spyOn(screen.getByRole('button', { name: 'Search' }), 'focus').mockImplementation(
        () => undefined,
      );
      expect(press({ key: '/' })).toBe(false);
      expect(screen.getByRole('searchbox', { name: 'First' })).toHaveFocus();
      expect(rootOf(screen.getByRole('searchbox', { name: 'Second' }))).not.toHaveAttribute(
        'data-open',
      );
    });

    it('stays behind the field mounted after it when it is disabled and enabled again', () => {
      const both = (disabled: boolean) => (
        <>
          <Search aria-label="First" shortcut="/" disabled={disabled} />
          <Search aria-label="Second" shortcut="/" />
        </>
      );
      const { rerender } = render(both(false));
      rerender(both(true));
      rerender(both(false));
      press({ key: '/' });
      expect(screen.getByRole('searchbox', { name: 'Second' })).toHaveFocus();
    });
  });

  describe('server and client agree on the key hint', () => {
    it('renders an empty hidden key for mod+k and the key itself for "/"', () => {
      const html = renderToString(
        <>
          <Search aria-label="One" shortcut="mod+k" />
          <Search aria-label="Two" shortcut="/" />
        </>,
      );
      const host = document.createElement('div');
      host.innerHTML = html;
      const [mod, slash] = Array.from(host.querySelectorAll('kbd'));
      expect(mod).toHaveAttribute('hidden');
      expect(mod?.textContent).toBe('');
      expect(slash).not.toHaveAttribute('hidden');
      expect(slash?.textContent).toBe('/');
      const [first, second] = Array.from(host.querySelectorAll('input'));
      expect(first).not.toHaveAttribute('aria-keyshortcuts');
      expect(second).toHaveAttribute('aria-keyshortcuts', '/');
    });

    it('hydrates that HTML without a mismatch, then fills in the key of the platform', async () => {
      platform('MacIntel');
      const recoverable = vi.fn();
      const html = renderToString(<Search shortcut="mod+k" />);
      // After the server render: React 18 warns about a layout effect there, which is the test's jsdom.
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      // The server knows no platform: its HTML is what a server with no `navigator` renders.
      const host = document.createElement('div');
      host.innerHTML = html.replace('>⌘K<', '><');
      document.body.append(host);
      expect(host.querySelector('kbd')?.textContent).toBe('');
      await act(async () => {
        hydrateRoot(host, <Search shortcut="mod+k" />, { onRecoverableError: recoverable });
      });
      expect(recoverable).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(host.querySelector('kbd')?.textContent).toBe('⌘K');
      expect(host.querySelector('kbd')).not.toHaveAttribute('hidden');
      expect(host.querySelector('input')).toHaveAttribute('aria-keyshortcuts', 'Meta+K');
    });
  });

  describe('collapsible', () => {
    const open = async (user = userEvent.setup()) => {
      await user.click(screen.getByRole('button', { name: 'Search' }));
      return user;
    };

    it('rests as a button named by labels.open, with the key in aria-keyshortcuts, and no tooltip description', () => {
      platform('Win32');
      render(<Search collapsible shortcut="mod+k" labels={{ open: 'Tìm' }} />);
      const button = screen.getByRole('button', { name: 'Tìm' });
      expect(rootOf(button)).toHaveAttribute('data-collapsible');
      expect(rootOf(button)).not.toHaveAttribute('data-open');
      expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+K');
      // The tooltip says what the name does: a second reading would repeat the name.
      expect(button).not.toHaveAttribute('aria-describedby');
      expect(button).toHaveAttribute('data-icon-only');
      expect(button).toHaveAttribute('data-variant', 'ghost');
    });

    it('has a tooltip with the name and the key, below the button', () => {
      platform('Win32');
      render(<Search collapsible shortcut="mod+k" />);
      const tip = screen.getByRole('tooltip', { hidden: true });
      expect(tip.firstChild?.textContent).toBe('Search');
      expect(tip.querySelector('kbd')?.textContent).toBe('Ctrl K');
      expect(tip).toHaveAttribute('data-side', 'bottom');
    });

    it('says no key, in its tooltip or on its button, when it cannot take the key', () => {
      platform('Win32');
      const { rerender } = render(<Search collapsible shortcut="mod+k" readOnly />);
      const button = screen.getByRole('button', { name: 'Search' });
      const tip = () => screen.getByRole('tooltip', { hidden: true });
      expect(button).not.toHaveAttribute('aria-keyshortcuts');
      expect(tip().querySelector('kbd')).toBeNull();
      expect(tip().textContent).not.toContain('Ctrl K');
      rerender(<Search collapsible shortcut="mod+k" disabled />);
      expect(tip().querySelector('kbd')).toBeNull();
      rerender(<Search collapsible shortcut="mod+k" />);
      expect(tip().querySelector('kbd')?.textContent).toBe('Ctrl K');
      expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+K');
    });

    it('opens on a click: the button goes, the field has the focus, and the ← button is there', async () => {
      render(<Search collapsible />);
      await open();
      expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
      expect(rootOf(search())).toHaveAttribute('data-open');
      expect(search()).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Close search' })).toBeInTheDocument();
      expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    });

    it('opens on Enter, from the keyboard', async () => {
      const user = userEvent.setup();
      render(<Search collapsible />);
      await user.tab();
      await user.keyboard('{Enter}');
      expect(search()).toHaveFocus();
    });

    it('the shortcut opens it, focuses the field and selects the text', async () => {
      render(<Search collapsible shortcut="/" defaultValue="abc" />);
      expect(rootOf(screen.getByRole('button', { name: 'Search' }))).not.toHaveAttribute(
        'data-open',
      );
      press({ key: '/' });
      expect(rootOf(search())).toHaveAttribute('data-open');
      expect(search()).toHaveFocus();
      expect(search().selectionStart).toBe(0);
      expect(search().selectionEnd).toBe(3);
      // Open already: it only takes the focus and selects the text again.
      search().setSelectionRange(1, 1);
      search().blur();
      press({ key: '/' });
      expect(search()).toHaveFocus();
      expect(search().selectionEnd).toBe(3);
    });

    it('closes when it is empty and the focus leaves it, and the button is back', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Search collapsible />
          <button type="button">After</button>
        </>,
      );
      await open(user);
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
      expect(screen.queryByRole('searchbox')).not.toBeNull();
      expect(rootOf(search())).not.toHaveAttribute('data-open');
    });

    it('closes when the page is clicked', async () => {
      const user = userEvent.setup();
      render(<Search collapsible />);
      await open(user);
      await user.click(document.body);
      expect(rootOf(search())).not.toHaveAttribute('data-open');
    });

    it('does not close while it has text, or while the focus is on one of its own buttons', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Search collapsible />
          <button type="button">After</button>
        </>,
      );
      await open(user);
      await user.type(search(), 'abc');
      await user.tab();
      expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();
      expect(rootOf(search())).toHaveAttribute('data-open');
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(rootOf(search())).toHaveAttribute('data-open');
      await user.click(search());
      await user.clear(search());
      // Now empty, with the focus in the field: the clear button is gone and the field stays open.
      expect(rootOf(search())).toHaveAttribute('data-open');
      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'Close search' })).toHaveFocus();
      expect(rootOf(search())).toHaveAttribute('data-open');
    });

    it('does not close when the window loses the focus, which leaves the field the active element', async () => {
      const user = userEvent.setup();
      render(<Search collapsible />);
      await open(user);
      fireEvent.blur(search(), { relatedTarget: null });
      expect(search()).toHaveFocus();
      expect(rootOf(search())).toHaveAttribute('data-open');
    });

    it('Esc on the empty field closes it, puts the focus on the button and keeps the key from going on', async () => {
      render(<Search collapsible />);
      await open();
      expect(press({ key: 'Escape' }, search())).toBe(false);
      const button = screen.getByRole('button', { name: 'Search' });
      expect(rootOf(button)).not.toHaveAttribute('data-open');
      expect(button).toHaveFocus();
    });

    it('Esc on a field with text clears it first, and closes it on the next', async () => {
      const user = userEvent.setup();
      render(<Search collapsible />);
      await open(user);
      await user.type(search(), 'abc');
      press({ key: 'Escape' }, search());
      expect(search()).toHaveValue('');
      expect(rootOf(search())).toHaveAttribute('data-open');
      press({ key: 'Escape' }, search());
      expect(rootOf(search())).not.toHaveAttribute('data-open');
      expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
    });

    it('Esc during an input method composition does not close it', async () => {
      render(<Search collapsible />);
      await open();
      press({ key: 'Escape', isComposing: true }, search());
      expect(rootOf(search())).toHaveAttribute('data-open');
    });

    it('the ← button closes it with the text kept, the focus on the button; opening again shows the text', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Search collapsible onValueChange={onValueChange} />);
      await open(user);
      await user.type(search(), 'abc');
      await user.click(screen.getByRole('button', { name: 'Close search' }));
      expect(rootOf(search())).not.toHaveAttribute('data-open');
      expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
      expect(search()).toHaveValue('abc');
      expect(onValueChange).toHaveBeenLastCalledWith('abc');
      await open(user);
      expect(search()).toHaveValue('abc');
      expect(search()).toHaveFocus();
    });

    it('names the ← button with labels.close', async () => {
      render(<Search collapsible labels={{ close: 'Đóng' }} />);
      await open();
      expect(screen.getByRole('button', { name: 'Đóng' })).toHaveClass('flg-search-field-back');
    });

    it('keeps the text it has in a form while it is closed', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <Search collapsible name="q" />
        </form>,
      );
      await open(user);
      await user.type(search(), 'abc');
      await user.click(screen.getByRole('button', { name: 'Close search' }));
      expect(new FormData(container.querySelector('form')!).get('q')).toBe('abc');
    });

    it('a field that becomes collapsible and back follows the prop', () => {
      const { rerender } = render(<Search />);
      expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
      rerender(<Search collapsible />);
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
      rerender(<Search />);
      expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
      expect(rootOf(search())).not.toHaveAttribute('data-collapsible');
    });

    it('a disabled collapsed field has a button that does not open it, and the shortcut does not', () => {
      render(<Search collapsible shortcut="/" disabled />);
      expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
      press({ key: '/' });
      expect(rootOf(search())).not.toHaveAttribute('data-open');
    });
  });
});
