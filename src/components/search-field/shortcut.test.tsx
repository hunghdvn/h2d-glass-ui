import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { matchesShortcut, useShortcut } from './shortcut';
import type { Shortcut } from './shortcut';

function press(init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('matchesShortcut', () => {
  const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);

  it('"/" is the slash key with no Ctrl, Meta or Alt, Shift allowed', () => {
    expect(matchesShortcut(key({ key: '/' }), '/', false)).toBe(true);
    expect(matchesShortcut(key({ key: '/', shiftKey: true }), '/', true)).toBe(true);
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey'] as const) {
      expect(matchesShortcut(key({ key: '/', [modifier]: true }), '/', false)).toBe(false);
    }
  });

  it('"mod+k" is K with exactly the modifier of the platform', () => {
    const k = (init: KeyboardEventInit) => key({ key: 'k', ...init });
    expect(matchesShortcut(k({ metaKey: true }), 'mod+k', true)).toBe(true);
    expect(matchesShortcut(k({ ctrlKey: true }), 'mod+k', true)).toBe(false);
    expect(matchesShortcut(k({ ctrlKey: true }), 'mod+k', false)).toBe(true);
    expect(matchesShortcut(k({ metaKey: true }), 'mod+k', false)).toBe(false);
    expect(matchesShortcut(k({}), 'mod+k', false)).toBe(false);
    // Another modifier makes it another shortcut.
    expect(matchesShortcut(k({ ctrlKey: true, shiftKey: true }), 'mod+k', false)).toBe(false);
    expect(matchesShortcut(k({ ctrlKey: true, altKey: true }), 'mod+k', false)).toBe(false);
    expect(matchesShortcut(k({ ctrlKey: true, metaKey: true }), 'mod+k', false)).toBe(false);
  });

  it('"mod+k" takes the capital K that Caps Lock types', () => {
    expect(matchesShortcut(key({ key: 'K', ctrlKey: true }), 'mod+k', false)).toBe(true);
  });
});

function Probe({
  shortcut,
  onMatch,
  enabled = true,
}: {
  shortcut: Shortcut | undefined;
  onMatch: () => boolean;
  enabled?: boolean;
}) {
  useShortcut(shortcut, onMatch, enabled);
  return null;
}

describe('useShortcut', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('runs the handler on a match and prevents the key', () => {
    const onMatch = vi.fn(() => true);
    render(<Probe shortcut="/" onMatch={onMatch} />);
    const event = press({ key: '/' });
    expect(onMatch).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves the key alone when the handler did not take it', () => {
    render(<Probe shortcut="/" onMatch={() => false} />);
    expect(press({ key: '/' }).defaultPrevented).toBe(false);
  });

  it('does nothing without a shortcut, for another key or while disabled', () => {
    const onMatch = vi.fn(() => true);
    const { rerender } = render(<Probe shortcut={undefined} onMatch={onMatch} />);
    press({ key: '/' });
    rerender(<Probe shortcut="/" onMatch={onMatch} />);
    press({ key: 'a' });
    rerender(<Probe shortcut="/" onMatch={onMatch} enabled={false} />);
    press({ key: '/' });
    expect(onMatch).not.toHaveBeenCalled();
  });

  it('skips an editable target, an event that was prevented and one in an IME composition', () => {
    const onMatch = vi.fn(() => true);
    const { container } = render(
      <>
        <Probe shortcut="/" onMatch={onMatch} />
        <input aria-label="other" />
        <div contentEditable suppressContentEditableWarning />
      </>,
    );
    press({ key: '/' }, container.querySelector('input')!);
    press({ key: '/' }, container.querySelector('[contenteditable]')!);
    document.addEventListener('keydown', (event) => event.preventDefault(), {
      once: true,
      capture: true,
    });
    press({ key: '/' });
    press({ key: '/', isComposing: true });
    expect(onMatch).not.toHaveBeenCalled();
    press({ key: '/' });
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('takes "mod+k" where the user types, which it types nothing in, unless the element prevented it', () => {
    const onMatch = vi.fn(() => true);
    vi.stubGlobal('navigator', { platform: 'Win32' });
    const { container } = render(
      <>
        <Probe shortcut="mod+k" onMatch={onMatch} />
        <input aria-label="other" />
        <div contentEditable suppressContentEditableWarning />
      </>,
    );
    const input = container.querySelector('input')!;
    expect(press({ key: 'k', ctrlKey: true }, input).defaultPrevented).toBe(true);
    const editor = container.querySelector<HTMLElement>('[contenteditable]')!;
    expect(press({ key: 'k', ctrlKey: true }, editor).defaultPrevented).toBe(true);
    expect(onMatch).toHaveBeenCalledTimes(2);
    // An editor with a Ctrl K of its own prevents it on its element first, and keeps it.
    editor.addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    press({ key: 'k', ctrlKey: true }, editor);
    expect(onMatch).toHaveBeenCalledTimes(2);
  });

  it('reads the platform when the key is pressed', () => {
    const onMatch = vi.fn(() => true);
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    render(<Probe shortcut="mod+k" onMatch={onMatch} />);
    press({ key: 'k', ctrlKey: true });
    expect(onMatch).not.toHaveBeenCalled();
    press({ key: 'k', metaKey: true });
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('gives the key to the one mounted last, and back when it unmounts', () => {
    const first = vi.fn(() => true);
    const second = vi.fn(() => true);
    render(<Probe shortcut="/" onMatch={first} />);
    const later = render(<Probe shortcut="/" onMatch={second} />);
    press({ key: '/' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    later.unmount();
    press({ key: '/' });
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('keeps one claim per shortcut: another shortcut is another claim', () => {
    const slash = vi.fn(() => true);
    const mod = vi.fn(() => true);
    vi.stubGlobal('navigator', { platform: 'Win32' });
    render(
      <>
        <Probe shortcut="/" onMatch={slash} />
        <Probe shortcut="mod+k" onMatch={mod} />
      </>,
    );
    press({ key: '/' });
    press({ key: 'k', ctrlKey: true });
    expect(slash).toHaveBeenCalledTimes(1);
    expect(mod).toHaveBeenCalledTimes(1);
  });

  it('a field that changes its shortcut and back is the one mounted last again', () => {
    const first = vi.fn(() => true);
    const second = vi.fn(() => true);
    const both = (a: Shortcut) => (
      <>
        <Probe shortcut={a} onMatch={first} />
        <Probe shortcut="/" onMatch={second} />
      </>
    );
    const { rerender } = render(both('/'));
    press({ key: '/' });
    expect([first.mock.calls.length, second.mock.calls.length]).toEqual([0, 1]);
    rerender(both('mod+k'));
    rerender(both('/'));
    press({ key: '/' });
    expect([first.mock.calls.length, second.mock.calls.length]).toEqual([1, 1]);
  });

  it('a field that is turned off hands the key to the one before it', () => {
    const first = vi.fn(() => true);
    const second = vi.fn(() => true);
    const both = (enabled: boolean) => (
      <>
        <Probe shortcut="/" onMatch={first} />
        <Probe shortcut="/" onMatch={second} enabled={enabled} />
      </>
    );
    const { rerender } = render(both(true));
    rerender(both(false));
    press({ key: '/' });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('offers the key to the one before when the one mounted last does not take it, and prevents it once', () => {
    const calls: string[] = [];
    const handler = (name: string, takes: boolean) => () => {
      calls.push(name);
      return takes;
    };
    render(
      <>
        <Probe shortcut="/" onMatch={handler('first', true)} />
        <Probe shortcut="/" onMatch={handler('second', true)} />
        <Probe shortcut="/" onMatch={handler('third', false)} />
      </>,
    );
    expect(press({ key: '/' }).defaultPrevented).toBe(true);
    expect(calls).toEqual(['third', 'second']);
  });

  it('lets the key go on when none of them takes it', () => {
    const first = vi.fn(() => false);
    const second = vi.fn(() => false);
    render(
      <>
        <Probe shortcut="/" onMatch={first} />
        <Probe shortcut="/" onMatch={second} />
      </>,
    );
    expect(press({ key: '/' }).defaultPrevented).toBe(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('keeps the place of a field that is turned off and on again: it stays behind the one mounted after it', () => {
    const first = vi.fn(() => true);
    const second = vi.fn(() => true);
    const both = (enabled: boolean) => (
      <>
        <Probe shortcut="/" onMatch={first} enabled={enabled} />
        <Probe shortcut="/" onMatch={second} />
      </>
    );
    const { rerender } = render(both(true));
    rerender(both(false));
    rerender(both(true));
    press({ key: '/' });
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('calls the handler of the latest render', () => {
    const calls: string[] = [];
    const handler = (name: string) => () => {
      calls.push(name);
      return true;
    };
    const { rerender } = render(<Probe shortcut="/" onMatch={handler('a')} />);
    rerender(<Probe shortcut="/" onMatch={handler('b')} />);
    press({ key: '/' });
    expect(calls).toEqual(['b']);
  });
});
