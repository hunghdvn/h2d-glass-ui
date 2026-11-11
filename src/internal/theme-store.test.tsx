import { act, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, useThemeValue } from './theme-store';

type Options = Partial<Parameters<typeof useThemeValue>[0]>;

/** Shows the value, and has one button for each value that sets it. */
function Probe({ id = 'probe', ...options }: Options & { id?: string }) {
  const [value, setValue] = useThemeValue({
    defaultValue: 'system',
    storageKey: 'flg-theme',
    ...options,
  } as Parameters<typeof useThemeValue>[0]);
  return (
    <div>
      <output data-testid={id}>{value}</output>
      {(['light', 'dark', 'system'] as const).map((next) => (
        <button key={next} type="button" onClick={() => setValue(next)}>
          {`${id}:${next}`}
        </button>
      ))}
    </div>
  );
}

const html = () => document.documentElement.getAttribute('data-flg-theme');
const shown = (id = 'probe') => screen.getByTestId(id).textContent;
const choose = (name: string) => act(() => screen.getByText(name).click());
/** A `storage` event as another tab causes it. */
function storage(key: string | null, newValue: string | null) {
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }));
  });
}

describe('applyTheme', () => {
  afterEach(() => document.documentElement.removeAttribute('data-flg-theme'));

  it("puts 'light' and 'dark' on <html> and takes the attribute off for 'system'", () => {
    applyTheme('dark');
    expect(html()).toBe('dark');
    applyTheme('light');
    expect(html()).toBe('light');
    applyTheme('system');
    expect(html()).toBeNull();
  });
});

describe('useThemeValue', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-flg-theme');
  });

  describe('on the server', () => {
    it('is the default value, whatever the page holds', () => {
      localStorage.setItem('flg-theme', 'dark');
      expect(renderToString(<Probe defaultValue="light" />)).toContain('>light</output>');
      expect(renderToString(<Probe />)).toContain('>system</output>');
    });

    it('hydrates with the markup of the server and then reads the stored value, without a warning', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const markup = renderToString(<Probe />);
      localStorage.setItem('flg-theme', 'dark');
      const container = document.createElement('div');
      container.innerHTML = markup;
      document.body.append(container);
      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(container, <Probe />);
      });
      expect(error).not.toHaveBeenCalled();
      expect(container.querySelector('output')?.textContent).toBe('dark');
      // It subscribes to the store until it goes; the tests after this one read the page afresh.
      act(() => root.unmount());
      container.remove();
    });
  });

  describe('uncontrolled', () => {
    it('reads the stored value after mount and puts it on <html>', () => {
      localStorage.setItem('flg-theme', 'dark');
      render(<Probe />);
      expect(shown()).toBe('dark');
      expect(html()).toBe('dark');
    });

    it("takes the attribute off <html> for a stored 'system'", () => {
      localStorage.setItem('flg-theme', 'system');
      document.documentElement.setAttribute('data-flg-theme', 'dark');
      render(<Probe />);
      expect(shown()).toBe('system');
      expect(html()).toBeNull();
    });

    it('has the default value when nothing is stored and <html> has no attribute, and puts it on <html>', () => {
      render(<Probe defaultValue="dark" />);
      expect(shown()).toBe('dark');
      expect(html()).toBe('dark');
    });

    it('takes the attribute of <html> when nothing is stored, and leaves it as it is', () => {
      document.documentElement.setAttribute('data-flg-theme', 'light');
      render(<Probe defaultValue="dark" />);
      expect(shown()).toBe('light');
      expect(html()).toBe('light');
    });

    it('ignores a stored value that is none of the three', () => {
      localStorage.setItem('flg-theme', 'sepia');
      document.documentElement.setAttribute('data-flg-theme', 'dark');
      render(<Probe />);
      expect(shown()).toBe('dark');
    });

    it('writes a choice to localStorage, puts it on <html> and reports it', () => {
      const onValueChange = vi.fn();
      render(<Probe onValueChange={onValueChange} />);
      choose('probe:dark');
      expect(shown()).toBe('dark');
      expect(localStorage.getItem('flg-theme')).toBe('dark');
      expect(html()).toBe('dark');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
      // System is written too, so that another tab hears of it.
      choose('probe:system');
      expect(localStorage.getItem('flg-theme')).toBe('system');
      expect(html()).toBeNull();
    });

    it('does not report the value it already has', () => {
      localStorage.setItem('flg-theme', 'dark');
      const onValueChange = vi.fn();
      render(<Probe onValueChange={onValueChange} />);
      choose('probe:dark');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps every consumer of one key in step, and the other keys apart', () => {
      render(
        <>
          <Probe id="a" />
          <Probe id="b" />
          <Probe id="c" storageKey="other" />
        </>,
      );
      choose('a:dark');
      expect(shown('a')).toBe('dark');
      expect(shown('b')).toBe('dark');
      expect(shown('c')).toBe('system');
      expect(localStorage.getItem('other')).toBeNull();
    });

    it('reads localStorage once for all the consumers that mount together, and again after they have all gone', () => {
      const get = vi.spyOn(Storage.prototype, 'getItem');
      const { unmount } = render(
        <>
          <Probe id="a" />
          <Probe id="b" />
        </>,
      );
      expect(get).toHaveBeenCalledTimes(1);
      unmount();
      localStorage.setItem('flg-theme', 'light');
      get.mockClear();
      render(<Probe />);
      expect(get).toHaveBeenCalledTimes(1);
      expect(shown()).toBe('light');
    });

    it('follows a storage event for its key, from another tab, and puts it on <html>', () => {
      render(<Probe />);
      storage('flg-theme', 'dark');
      expect(shown()).toBe('dark');
      expect(html()).toBe('dark');
      storage('flg-theme', 'light');
      expect(shown()).toBe('light');
      expect(html()).toBe('light');
    });

    it("takes a key that was removed, or all of localStorage cleared, for 'system'", () => {
      render(<Probe />);
      storage('flg-theme', 'dark');
      storage('flg-theme', null);
      expect(shown()).toBe('system');
      expect(html()).toBeNull();
      storage('flg-theme', 'dark');
      storage(null, null);
      expect(shown()).toBe('system');
    });

    it('ignores a storage event for another key', () => {
      render(<Probe />);
      storage('other', 'dark');
      expect(shown()).toBe('system');
      expect(html()).toBeNull();
    });

    it('stops listening to storage once the last consumer has gone', () => {
      const add = vi.spyOn(window, 'addEventListener');
      const remove = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(
        <>
          <Probe id="a" />
          <Probe id="b" />
        </>,
      );
      expect(add.mock.calls.filter(([type]) => type === 'storage')).toHaveLength(1);
      unmount();
      expect(remove.mock.calls.filter(([type]) => type === 'storage')).toHaveLength(1);
    });

    it('does not report a change that came from another tab as a choice', () => {
      const onValueChange = vi.fn();
      render(<Probe onValueChange={onValueChange} />);
      storage('flg-theme', 'dark');
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('controlled', () => {
    it('is the value it is given, and never reads, writes or touches <html>', () => {
      localStorage.setItem('flg-theme', 'dark');
      const get = vi.spyOn(Storage.prototype, 'getItem');
      const set = vi.spyOn(Storage.prototype, 'setItem');
      const onValueChange = vi.fn();
      render(<Probe value="light" onValueChange={onValueChange} />);
      expect(shown()).toBe('light');
      expect(get).not.toHaveBeenCalled();
      choose('probe:dark');
      // The parent decides: the value stays until it passes another.
      expect(shown()).toBe('light');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
      expect(set).not.toHaveBeenCalled();
      expect(html()).toBeNull();
      storage('flg-theme', 'dark');
      expect(shown()).toBe('light');
    });

    it('reports a choice that is the value it has, as the parent may mean to undo it', () => {
      const onValueChange = vi.fn();
      render(<Probe value="light" onValueChange={onValueChange} />);
      choose('probe:light');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('light');
    });

    it('shows the default value for one that is none of the three', () => {
      render(<Probe value={'sepia' as 'light'} defaultValue="dark" />);
      expect(shown()).toBe('dark');
    });

    it('follows the value of the parent', () => {
      const { rerender } = render(<Probe value="light" />);
      rerender(<Probe value="dark" />);
      expect(shown()).toBe('dark');
    });
  });

  describe('when localStorage is not there', () => {
    it('reads <html> when it cannot be read, and the default value when <html> has nothing', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      document.documentElement.setAttribute('data-flg-theme', 'dark');
      const { unmount } = render(<Probe />);
      expect(shown()).toBe('dark');
      unmount();
      document.documentElement.removeAttribute('data-flg-theme');
      render(<Probe defaultValue="light" />);
      expect(shown()).toBe('light');
    });

    it('keeps a choice in the page when it cannot be written, and still reports it', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });
      const onValueChange = vi.fn();
      render(<Probe onValueChange={onValueChange} />);
      choose('probe:dark');
      expect(shown()).toBe('dark');
      expect(html()).toBe('dark');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
    });

    it('works when reaching localStorage itself throws', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      render(<Probe />);
      expect(shown()).toBe('system');
      choose('probe:light');
      expect(shown()).toBe('light');
      expect(html()).toBe('light');
    });
  });
});
