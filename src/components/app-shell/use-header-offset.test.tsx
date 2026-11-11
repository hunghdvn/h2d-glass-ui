import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell, AppShellHeader, AppShellMain } from './AppShell';
import { HEADER_OFFSET_PROPERTY } from './use-header-offset';

/** Stands in for ResizeObserver, which jsdom lacks; `resize(target, height)` reports what a browser would. */
function fakeResizeObservers() {
  const all: FakeResizeObserver[] = [];
  class FakeResizeObserver {
    readonly observed = new Set<Element>();
    readonly disconnect = vi.fn(() => this.observed.clear());
    constructor(readonly callback: ResizeObserverCallback) {
      all.push(this);
    }
    observe(target: Element) {
      this.observed.add(target);
    }
    unobserve(target: Element) {
      this.observed.delete(target);
    }
    resize(target: Element, blockSize: number) {
      const entry = { target, borderBoxSize: [{ blockSize }] } as unknown as ResizeObserverEntry;
      this.callback([entry], this as unknown as ResizeObserver);
    }
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  return all;
}

const offset = () => document.documentElement.style.getPropertyValue(HEADER_OFFSET_PROPERTY);

beforeEach(() => {
  document.documentElement.style.removeProperty(HEADER_OFFSET_PROPERTY);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the measure of the header', () => {
  it('is written on <html> as soon as the shell mounts, from the layout height of the header', () => {
    const observers = fakeResizeObservers();
    // jsdom has no layout, so the height a header has is given to every element.
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(60);
    render(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    expect(offset()).toBe('60px');
    expect(observers).toHaveLength(1);
  });

  it('follows the header when it grows, with the size the observer reports', () => {
    const observers = fakeResizeObservers();
    const { container } = render(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    const header = container.querySelector('header')!;
    act(() => observers[0]!.resize(header, 56));
    expect(offset()).toBe('56px');
    // A fraction is kept: the observer reports the layout size, not a rounded one.
    act(() => observers[0]!.resize(header, 71.5));
    expect(offset()).toBe('71.5px');
  });

  it('is written only when the height changes', () => {
    const observers = fakeResizeObservers();
    const set = vi.spyOn(document.documentElement.style, 'setProperty');
    const { container } = render(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
      </AppShell>,
    );
    const header = container.querySelector('header')!;
    act(() => observers[0]!.resize(header, 56));
    const writes = set.mock.calls.length;
    act(() => observers[0]!.resize(header, 56));
    act(() => observers[0]!.resize(header, 56));
    expect(set.mock.calls.length).toBe(writes);
    act(() => observers[0]!.resize(header, 60));
    expect(set.mock.calls.length).toBe(writes + 1);
  });

  it('is taken off <html> when the shell unmounts, and observing stops', () => {
    const observers = fakeResizeObservers();
    const { container, unmount } = render(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
      </AppShell>,
    );
    act(() => observers[0]!.resize(container.querySelector('header')!, 56));
    expect(offset()).toBe('56px');
    unmount();
    expect(offset()).toBe('');
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });

  it('follows a header that mounts after the shell, and goes when the header is removed', () => {
    const observers = fakeResizeObservers();
    const { container, rerender } = render(
      <AppShell>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    expect(observers).toHaveLength(0);
    expect(offset()).toBe('');
    rerender(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    expect(observers).toHaveLength(1);
    const header = container.querySelector('header')!;
    act(() => observers[0]!.resize(header, 56));
    expect(offset()).toBe('56px');
    rerender(
      <AppShell>
        <AppShellMain>M</AppShellMain>
      </AppShell>,
    );
    expect(offset()).toBe('');
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });

  it('writes nothing where there is no ResizeObserver, and the stylesheet keeps its 56px', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
      </AppShell>,
    );
    expect(offset()).toBe('');
  });

  it('reads the layout height where an entry has no border-box size', () => {
    const observers = fakeResizeObservers();
    const { container } = render(
      <AppShell>
        <AppShellHeader>H</AppShellHeader>
      </AppShell>,
    );
    const header = container.querySelector('header')!;
    vi.spyOn(header, 'offsetHeight', 'get').mockReturnValue(64);
    act(() =>
      observers[0]!.callback(
        [{ target: header } as unknown as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    );
    expect(offset()).toBe('64px');
  });
});
