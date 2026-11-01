import { act, fireEvent, render, screen } from '@testing-library/react';
import { memo, useLayoutEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import type { TabsProps } from './Tabs';

function Example(props: Omit<TabsProps, 'children'>) {
  return (
    <Tabs {...props}>
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="members">Members panel</TabsContent>
      <TabsContent value="billing">Billing panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
// A tab inside a memo wrapper that changes alone reaches its list in a microtask, before the paint.
const clickAndSettle = (name: string) =>
  act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
const press = (key: string, init: Record<string, boolean> = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });

describe('Tabs', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('ties every tab to its panel and shows only the selected panel', () => {
    render(<Example defaultValue="members" />);
    const list = screen.getByRole('tablist', { name: 'Project' });
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    const members = tab('Members');
    expect(members).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Members' });
    expect(members).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Members panel');
    expect(panel).toHaveAttribute('tabindex', '0');
    // The other panels stay mounted, hidden.
    expect(screen.getByText('Overview panel')).not.toBeVisible();
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(4);
  });

  it('builds ids that stay single tokens whatever the value holds', () => {
    render(
      <Tabs defaultValue="Billing history">
        <TabsList aria-label="Account">
          <TabsTrigger value="Billing history">Billing history</TabsTrigger>
          <TabsTrigger value="Billing_history">Underscore</TabsTrigger>
        </TabsList>
        <TabsContent value="Billing history">History</TabsContent>
        <TabsContent value="Billing_history">Other</TabsContent>
      </Tabs>,
    );
    const first = tab('Billing history');
    const second = tab('Underscore');
    expect(first.getAttribute('aria-controls')).not.toMatch(/\s/);
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('tabpanel', { name: 'Billing history' })).toHaveTextContent('History');
  });

  it('gives Tab to the selected tab only', () => {
    render(<Example defaultValue="members" />);
    expect(tab('Members')).toHaveAttribute('tabindex', '0');
    for (const name of ['Overview', 'Billing', 'Settings']) {
      expect(tab(name)).toHaveAttribute('tabindex', '-1');
    }
  });

  it('gives Tab to the first enabled tab when nothing is selected', () => {
    render(<Example />);
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
  });

  it('gives Tab to the first enabled tab when the selected tab is disabled', () => {
    // Controlled from the first render, so Tabs never switches between uncontrolled and controlled.
    const { rerender } = render(<Example value="overview" onValueChange={() => {}} />);
    rerender(<Example value="billing" onValueChange={() => {}} />);
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    expect(tab('Billing')).toHaveAttribute('tabindex', '-1');
  });

  it('moves with the arrows, wraps at the ends and skips a disabled tab, selecting as it goes', () => {
    const onValueChange = vi.fn();
    render(<Example defaultValue="overview" onValueChange={onValueChange} />);
    act(() => tab('Overview').focus());
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    press('ArrowRight');
    expect(tab('Settings')).toHaveFocus();
    press('ArrowRight');
    expect(tab('Overview')).toHaveFocus();
    press('ArrowLeft');
    expect(tab('Settings')).toHaveFocus();
    press('Home');
    expect(tab('Overview')).toHaveFocus();
    press('End');
    expect(tab('Settings')).toHaveFocus();
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      'members',
      'settings',
      'overview',
      'settings',
      'overview',
      'settings',
    ]);
  });

  it('leaves the arrows of the other orientation and keys with Alt, Ctrl or Meta alone', () => {
    render(<Example defaultValue="overview" />);
    act(() => tab('Overview').focus());
    press('ArrowDown');
    press('ArrowRight', { ctrlKey: true });
    press('ArrowRight', { altKey: true });
    press('End', { metaKey: true });
    expect(tab('Overview')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('uses ↑ and ↓ when vertical', () => {
    render(<Example defaultValue="overview" orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    act(() => tab('Overview').focus());
    press('ArrowDown');
    expect(tab('Members')).toHaveFocus();
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
  });

  it('moves focus without selecting in manual mode, and selects on a click', () => {
    const onValueChange = vi.fn();
    render(
      <Example defaultValue="overview" activationMode="manual" onValueChange={onValueChange} />,
    );
    act(() => tab('Overview').focus());
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
    // Enter and Space click a focused button.
    fireEvent.click(tab('Members'));
    expect(onValueChange).toHaveBeenCalledWith('members');
    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
  });

  it('reports a click on a controlled Tabs and keeps the value its parent gives', () => {
    const onValueChange = vi.fn();
    render(<Example value="overview" onValueChange={onValueChange} />);
    fireEvent.click(tab('Settings'));
    expect(onValueChange).toHaveBeenCalledWith('settings');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Overview panel')).toBeVisible();
  });

  it('reports one selection per press while a controlled parent has not committed', () => {
    const onValueChange = vi.fn();
    render(<Example value="overview" onValueChange={onValueChange} />);
    // A pointer press focuses the tab, which selects it, and the click of the press does not.
    fireEvent.pointerDown(tab('Members'), { button: 0 });
    act(() => tab('Members').focus());
    fireEvent.click(tab('Members'));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('members');
    // An arrow focuses and selects a tab; the click that Enter then makes does not select again.
    press('ArrowRight');
    expect(tab('Settings')).toHaveFocus();
    fireEvent.click(tab('Settings'));
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenLastCalledWith('settings');
    // A later press asks again: the parent may have refused.
    fireEvent.click(tab('Settings'));
    expect(onValueChange).toHaveBeenCalledTimes(3);
    fireEvent.pointerDown(tab('Settings'), { button: 0 });
    fireEvent.click(tab('Settings'));
    expect(onValueChange).toHaveBeenCalledTimes(4);
  });

  it('counts a pointer press the user prevented as a new press', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs value="overview" onValueChange={onValueChange}>
        <TabsList aria-label="Project">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members" onPointerDown={(event) => event.preventDefault()}>
            Members
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    // The parent refuses: the tab is focused, and asked for once. No click follows, so the focus
    // still counts as the selection when the next press lands on the focused tab.
    act(() => tab('Members').focus());
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('members');
    // A new press asks again, though the user's handler prevented it.
    expect(fireEvent.pointerDown(tab('Members'), { button: 0 })).toBe(false);
    fireEvent.click(tab('Members'));
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('gives Tab to the first enabled tab when a tab inside a memo wrapper changes `disabled`', async () => {
    // The wrapper re-renders alone: neither Tabs nor TabsList renders again.
    const Wrapper = memo(function Wrapper() {
      const [disabled, setDisabled] = useState(true);
      return (
        <>
          <TabsTrigger value="a" disabled={disabled}>
            A
          </TabsTrigger>
          <button type="button" onClick={() => setDisabled((current) => !current)}>
            Toggle
          </button>
        </>
      );
    });
    render(
      <Tabs value={null}>
        <TabsList aria-label="Project">
          <Wrapper />
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(tab('A')).toHaveAttribute('tabindex', '-1');
    expect(tab('B')).toHaveAttribute('tabindex', '0');
    await clickAndSettle('Toggle');
    expect(tab('A')).toHaveAttribute('tabindex', '0');
    expect(tab('B')).toHaveAttribute('tabindex', '-1');
    await clickAndSettle('Toggle');
    expect(tab('A')).toHaveAttribute('tabindex', '-1');
    expect(tab('B')).toHaveAttribute('tabindex', '0');
  });

  describe('the tab that takes Tab when it is the fallback, inside a memo wrapper', () => {
    // The wrapper re-renders alone: neither Tabs nor TabsList renders again.
    const Wrapper = memo(function Wrapper() {
      const [shown, setShown] = useState(true);
      const [value, setValue] = useState('a');
      return (
        <>
          {shown ? <TabsTrigger value={value}>A</TabsTrigger> : null}
          <button type="button" onClick={() => setShown(false)}>
            Remove
          </button>
          <button type="button" onClick={() => setValue('a2')}>
            Rename
          </button>
        </>
      );
    });
    const mount = (value: string | null) =>
      render(
        <Tabs value={value}>
          <TabsList aria-label="Project">
            <Wrapper />
            <TabsTrigger value="b">B</TabsTrigger>
          </TabsList>
        </Tabs>,
      );
    const click = clickAndSettle;

    it('is replaced when it is removed', async () => {
      mount(null);
      expect(tab('A')).toHaveAttribute('tabindex', '0');
      await click('Remove');
      expect(tab('B')).toHaveAttribute('tabindex', '0');
    });

    it('is followed when its value changes', async () => {
      mount(null);
      await click('Rename');
      expect(tab('A')).toHaveAttribute('tabindex', '0');
      expect(tab('B')).toHaveAttribute('tabindex', '-1');
    });

    it('is replaced when the selected tab is removed', async () => {
      mount('a');
      expect(tab('A')).toHaveAttribute('tabindex', '0');
      await click('Remove');
      expect(tab('B')).toHaveAttribute('tabindex', '0');
    });
  });

  it('reports a focus that a layout effect gives a tab in the same commit that changes the value', () => {
    // Focus runs React's handler at once, inside the commit, before the Tabs' own layout effects.
    function Focuser({ go }: { go: boolean }) {
      useLayoutEffect(() => {
        if (go) document.querySelector<HTMLElement>('[role="tab"]')?.focus();
      }, [go]);
      return null;
    }
    const onValueChange = vi.fn();
    const App = ({ value, go }: { value: string; go: boolean }) => (
      <Tabs value={value} onValueChange={onValueChange}>
        <TabsList aria-label="Project">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
          <Focuser go={go} />
        </TabsList>
      </Tabs>
    );
    const { rerender } = render(<App value="a" go={false} />);
    rerender(<App value="b" go />);
    expect(tab('A')).toHaveFocus();
    // The value is now "b", so the focused tab "a" asks to be selected.
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('selects no tab while a controlled value is null, and stays controlled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onValueChange = vi.fn();
    const { rerender } = render(<Example value={null} onValueChange={onValueChange} />);
    expect(screen.queryByRole('tab', { selected: true })).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    rerender(<Example value="members" onValueChange={onValueChange} />);
    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    rerender(<Example value={null} onValueChange={onValueChange} />);
    expect(screen.queryByRole('tab', { selected: true })).toBeNull();
    // A click asks; the tabs stay as the parent says.
    fireEvent.click(tab('Settings'));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('settings');
    expect(screen.queryByRole('tab', { selected: true })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders the selected panel on the server and hides the others', () => {
    const html = renderToString(<Example defaultValue="settings" />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const panels = Array.from(doc.querySelectorAll('[role="tabpanel"]'));
    expect(
      panels.filter((panel) => !panel.hasAttribute('hidden')).map((p) => p.textContent),
    ).toEqual(['Settings panel']);
    expect(doc.querySelector('[aria-selected="true"]')?.getAttribute('tabindex')).toBe('0');
  });

  it('warns when two tabs share a value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Copies">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="a">Again</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] Two <TabsTrigger>s have the value "a". Each tab needs its own: the value ' +
        'makes its id and ties it to its panel.',
    );
  });

  it('keeps the generated ids when an id is forced through a cast', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Project">
          <TabsTrigger value="overview" {...({ id: 'evil-trigger' } as unknown as { id: string })}>
            Overview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" {...({ id: 'evil-panel' } as unknown as { id: string })}>
          Overview panel
        </TabsContent>
      </Tabs>,
    );
    const trigger = tab('Overview');
    const panel = screen.getByRole('tabpanel', { name: 'Overview' });
    expect(trigger.id).not.toBe('evil-trigger');
    expect(panel.id).not.toBe('evil-panel');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('warns when a part is rendered outside Tabs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<TabsTrigger value="lost">Lost</TabsTrigger>);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <TabsTrigger> must be rendered inside a <Tabs>.',
    );
  });
});

const box = (left: number, width: number) =>
  ({ left, right: left + width, top: 0, bottom: 32, width, height: 32, x: left, y: 0 }) as DOMRect;

/**
 * jsdom lays nothing out. This gives every tab list the width `room` and each of its children the
 * width `tab`, side by side from the list's left edge and moved by its scroll, which stays in range
 * as in a browser. A test changes `room` to resize the list.
 */
function mockLayout(sizes: { room: number; tab: number }) {
  const scrolled = new WeakMap<Element, number>();
  const isList = (el: Element) => el.classList.contains('flg-tabs-list');
  const maxScroll = (list: Element) => Math.max(0, list.children.length * sizes.tab - sizes.room);
  const scrollOf = (list: Element) => Math.min(scrolled.get(list) ?? 0, maxScroll(list));
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
    return isList(this) ? sizes.room : 0;
  });
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
    return isList(this) ? sizes.room + maxScroll(this) : 0;
  });
  vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockImplementation(function (this: Element) {
    return scrollOf(this);
  });
  vi.spyOn(Element.prototype, 'scrollLeft', 'set').mockImplementation(function (
    this: Element,
    value: number,
  ) {
    scrolled.set(this, Math.min(Math.max(value, 0), maxScroll(this)));
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const list = this.parentElement;
    if (isList(this)) return box(0, sizes.room);
    if (!list || !isList(list)) return box(0, 0);
    return box(Array.from(list.children).indexOf(this) * sizes.tab - scrollOf(list), sizes.tab);
  });
  return sizes;
}

/** Stands in for ResizeObserver, which jsdom lacks; `resize()` reports what a browser would. */
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
    resize() {
      const entries = Array.from(this.observed, (target) => ({ target }) as ResizeObserverEntry);
      this.callback(entries, this as unknown as ResizeObserver);
    }
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  return all;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

describe('Tabs that do not fit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('marks a row whose tabs do not fit, and the edges it has been scrolled to', async () => {
    const observers = fakeResizeObservers();
    // Four tabs of 100px in 250px.
    const sizes = mockLayout({ room: 250, tab: 100 });
    render(<Example defaultValue="overview" />);
    const list = screen.getByRole('tablist');
    expect(list).toHaveAttribute('data-overflow');
    expect(list).toHaveAttribute('data-at-start');
    expect(list).not.toHaveAttribute('data-at-end');
    list.scrollLeft = 150;
    fireEvent.scroll(list);
    expect(list).not.toHaveAttribute('data-at-start');
    expect(list).toHaveAttribute('data-at-end');
    // The row grows until the tabs fit, and the marks go.
    sizes.room = 400;
    await act(async () => {
      for (const observer of observers) observer.resize();
      await nextFrame();
    });
    for (const name of ['data-overflow', 'data-at-start', 'data-at-end']) {
      expect(list).not.toHaveAttribute(name);
    }
  });

  it('marks nothing while the tabs fit, nor in the HTML from the server', () => {
    // A characterization test: before the row could scroll, nothing was marked either.
    fakeResizeObservers();
    mockLayout({ room: 400, tab: 100 });
    render(<Example defaultValue="overview" />);
    const list = screen.getByRole('tablist');
    for (const name of ['data-overflow', 'data-at-start', 'data-at-end']) {
      expect(list).not.toHaveAttribute(name);
    }
    expect(renderToString(<Example defaultValue="overview" />)).not.toMatch(/data-(overflow|at-)/);
  });

  it('scrolls the row, and not the page, to the selected tab', () => {
    mockLayout({ room: 250, tab: 100 });
    const scrollIntoView = vi.fn();
    vi.stubGlobal('scrollTo', vi.fn());
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    try {
      // Settings, the fourth tab, spans 300px to 400px; the row shows 250px of them.
      const { rerender } = render(<Example value="settings" onValueChange={() => {}} />);
      const list = screen.getByRole('tablist');
      expect(list.scrollLeft).toBe(150);
      // A parent selects another tab out of view, then one already in view.
      rerender(<Example value="overview" onValueChange={() => {}} />);
      expect(list.scrollLeft).toBe(0);
      rerender(<Example value="members" onValueChange={() => {}} />);
      expect(list.scrollLeft).toBe(0);
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(window.scrollTo).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

  it('looks again when a tab inside a memo wrapper mounts', async () => {
    // The wrapper re-renders alone: neither Tabs nor TabsList renders again.
    const Wrapper = memo(function Wrapper() {
      const [more, setMore] = useState(false);
      return (
        <>
          <TabsTrigger value="a">A</TabsTrigger>
          {more ? <TabsTrigger value="b">B</TabsTrigger> : null}
          <button type="button" onClick={() => setMore(true)}>
            More
          </button>
        </>
      );
    });
    fakeResizeObservers();
    // The list holds A and the button; B makes three 100px children in 250px.
    mockLayout({ room: 250, tab: 100 });
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Project">
          <Wrapper />
        </TabsList>
      </Tabs>,
    );
    const list = screen.getByRole('tablist');
    expect(list).not.toHaveAttribute('data-overflow');
    await clickAndSettle('More');
    expect(list).toHaveAttribute('data-overflow');
  });

  it('removes its scroll listener and its ResizeObserver when it unmounts', () => {
    const observers = fakeResizeObservers();
    mockLayout({ room: 250, tab: 100 });
    const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const remove = vi.spyOn(EventTarget.prototype, 'removeEventListener');
    const { unmount } = render(<Example defaultValue="overview" />);
    const list = screen.getByRole('tablist');
    const onList = (spy: typeof add) =>
      spy.mock.calls.filter(
        ([type], index) => type === 'scroll' && spy.mock.contexts[index] === list,
      );
    expect(onList(add)).toHaveLength(1);
    expect(observers).toHaveLength(1);
    unmount();
    expect(onList(remove).map(([, listener]) => listener)).toEqual([onList(add)[0]?.[1]]);
    expect(observers[0]?.disconnect).toHaveBeenCalled();
  });

  it('marks a horizontal row as measured once it has looked, and no vertical row nor server HTML', () => {
    // The clamp of a segmented track waits for this mark (tabs.css), so that a row that has not been
    // measured, such as one before hydration, spills out as it did before the tabs could scroll.
    fakeResizeObservers();
    mockLayout({ room: 400, tab: 100 });
    const { unmount } = render(<Example defaultValue="overview" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('data-measured');
    unmount();
    render(<Example defaultValue="overview" orientation="vertical" />);
    expect(screen.getByRole('tablist')).not.toHaveAttribute('data-measured');
    expect(renderToString(<Example defaultValue="overview" />)).not.toMatch(/data-measured/);
  });

  describe('measuring', () => {
    // A characterization of how often the list reads its layout: each look reads the list's rect once.
    const looks = (list: Element) =>
      vi
        .mocked(Element.prototype.getBoundingClientRect)
        .mock.contexts.filter((context) => context === list).length;
    const reset = () => vi.mocked(Element.prototype.getBoundingClientRect).mockClear();

    function Parent({ more = 0, value }: { more?: number; value: string }) {
      const [text, setText] = useState('');
      return (
        <>
          <input aria-label="Text" value={text} onChange={(event) => setText(event.target.value)} />
          <Tabs value={value} onValueChange={() => {}}>
            <TabsList aria-label="Project">
              {Array.from({ length: 4 + more }, (_, index) => (
                <TabsTrigger key={index} value={`t${index}`}>
                  {`Tab ${index}`}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </>
      );
    }

    it('looks once when the list mounts with its tabs', () => {
      fakeResizeObservers();
      mockLayout({ room: 400, tab: 100 });
      render(<Example defaultValue="overview" />);
      expect(looks(screen.getByRole('tablist'))).toBe(1);
    });

    it('does not look when a parent renders again and nothing changed', () => {
      fakeResizeObservers();
      mockLayout({ room: 400, tab: 100 });
      render(<Parent value="t0" />);
      const list = screen.getByRole('tablist');
      reset();
      fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'abc' } });
      fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'abcd' } });
      expect(looks(list)).toBe(0);
    });

    it('looks once when the value changes', () => {
      fakeResizeObservers();
      mockLayout({ room: 400, tab: 100 });
      const { rerender } = render(<Parent value="t0" />);
      const list = screen.getByRole('tablist');
      reset();
      rerender(<Parent value="t1" />);
      expect(looks(list)).toBe(1);
    });

    it('looks once when several tabs mount in one commit', async () => {
      fakeResizeObservers();
      // Ten tabs of 100px still fit.
      mockLayout({ room: 1000, tab: 100 });
      const { rerender } = render(<Parent value="t0" />);
      const list = screen.getByRole('tablist');
      reset();
      await act(async () => rerender(<Parent value="t0" more={6} />));
      expect(looks(list)).toBe(1);
    });
  });

  describe('a press on a tab that is partly hidden', () => {
    const settled = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));

    it('reveals the tab only after the press ends, so the click lands on it', async () => {
      fakeResizeObservers();
      // Settings spans 300px to 400px of a 250px row; focus selects it, and revealing it scrolls.
      mockLayout({ room: 250, tab: 100 });
      render(<Example defaultValue="overview" />);
      const list = screen.getByRole('tablist');
      const settings = tab('Settings');
      expect(list.scrollLeft).toBe(0);
      fireEvent.pointerDown(settings, { button: 0 });
      act(() => settings.focus());
      expect(settings).toHaveAttribute('aria-selected', 'true');
      // The row stays where it is until the pointer is up.
      expect(list.scrollLeft).toBe(0);
      fireEvent.pointerUp(settings, { button: 0 });
      fireEvent.click(settings);
      expect(list.scrollLeft).toBe(0);
      await settled();
      expect(list.scrollLeft).toBe(150);
    });

    it('also waits when the press is cancelled', async () => {
      fakeResizeObservers();
      mockLayout({ room: 250, tab: 100 });
      render(<Example defaultValue="overview" />);
      const list = screen.getByRole('tablist');
      fireEvent.pointerDown(tab('Settings'), { button: 0 });
      act(() => tab('Settings').focus());
      expect(list.scrollLeft).toBe(0);
      fireEvent.pointerCancel(tab('Settings'));
      await settled();
      expect(list.scrollLeft).toBe(150);
    });

    it('reveals a tab that keyboard focus selects at once', () => {
      fakeResizeObservers();
      mockLayout({ room: 250, tab: 100 });
      render(<Example defaultValue="overview" />);
      act(() => tab('Settings').focus());
      expect(screen.getByRole('tablist').scrollLeft).toBe(150);
    });
  });

  it('leaves a vertical list alone', () => {
    // A characterization test: a vertical list never scrolled sideways.
    const observers = fakeResizeObservers();
    mockLayout({ room: 250, tab: 100 });
    const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
    render(<Example defaultValue="settings" orientation="vertical" />);
    const list = screen.getByRole('tablist');
    expect(list).not.toHaveAttribute('data-overflow');
    expect(list.scrollLeft).toBe(0);
    expect(add.mock.contexts).not.toContain(list);
    expect(observers).toEqual([]);
  });
});
