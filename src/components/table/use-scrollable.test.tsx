import { act, render, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollable } from './use-scrollable';

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

/** The sizes jsdom has no layout to give: the frame's room and what the table needs. */
interface Sizes {
  clientWidth: number;
  scrollWidth: number;
  clientHeight: number;
  scrollHeight: number;
}

function sizeOf(element: HTMLElement, sizes: Sizes) {
  for (const name of Object.keys(sizes) as Array<keyof Sizes>) {
    Object.defineProperty(element, name, { configurable: true, get: () => sizes[name] });
  }
}

/** A frame and a table that report `sizes`, put in the document, with every render counted. */
function Probe({ sizes, onRender }: { sizes: Sizes; onRender: (scrollable: boolean) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  // The sizes must be there before the hook's layout effect reads them, as a browser's layout is.
  const refFrame = (element: HTMLDivElement | null) => {
    (frame as { current: HTMLDivElement | null }).current = element;
    if (element) sizeOf(element, sizes);
  };
  const scrollable = useScrollable(frame, table);
  onRender(scrollable);
  return (
    <div ref={refFrame} data-testid="frame" data-scrollable={String(scrollable)}>
      <table ref={table} />
    </div>
  );
}

const fits: Sizes = { clientWidth: 400, scrollWidth: 400, clientHeight: 200, scrollHeight: 200 };

afterEach(() => vi.unstubAllGlobals());

describe('useScrollable', () => {
  it('is false where there is no ResizeObserver, as in jsdom', () => {
    const { result } = renderHook(() => {
      const frame = useRef<HTMLDivElement>(null);
      const table = useRef<HTMLTableElement>(null);
      return useScrollable(frame, table);
    });
    expect(result.current).toBe(false);
  });

  it('is false while the table fits, and observes the frame and the table', () => {
    const observers = fakeResizeObservers();
    const { getByTestId } = render(<Probe sizes={fits} onRender={() => {}} />);
    expect(getByTestId('frame')).toHaveAttribute('data-scrollable', 'false');
    expect(observers).toHaveLength(1);
    expect(Array.from(observers[0]!.observed, (target) => target.tagName)).toEqual([
      'DIV',
      'TABLE',
    ]);
  });

  it.each([
    ['wider', { ...fits, scrollWidth: 700 }],
    ['taller', { ...fits, scrollHeight: 500 }],
  ])('is true when the table is %s than the frame, before the first paint', (_name, sizes) => {
    fakeResizeObservers();
    const { getByTestId } = render(<Probe sizes={sizes} onRender={() => {}} />);
    expect(getByTestId('frame')).toHaveAttribute('data-scrollable', 'true');
  });

  it.each([
    ['width', 'scrollWidth', 'clientWidth'],
    ['height', 'scrollHeight', 'clientHeight'],
  ] as const)(
    'allows 1px of rounding in the %s: +1px is not scrollable, +2px is',
    (_name, scroll, client) => {
      fakeResizeObservers();
      const rounding = render(
        <Probe sizes={{ ...fits, [scroll]: fits[client] + 1 }} onRender={() => {}} />,
      );
      expect(rounding.getByTestId('frame')).toHaveAttribute('data-scrollable', 'false');
      rounding.unmount();
      const real = render(
        <Probe sizes={{ ...fits, [scroll]: fits[client] + 2 }} onRender={() => {}} />,
      );
      expect(real.getByTestId('frame')).toHaveAttribute('data-scrollable', 'true');
    },
  );

  it('follows the frame as it is resized, both ways', () => {
    const observers = fakeResizeObservers();
    const sizes = { ...fits };
    const { getByTestId } = render(<Probe sizes={sizes} onRender={() => {}} />);
    const frame = getByTestId('frame');
    sizes.scrollWidth = 700;
    act(() => observers[0]!.resize());
    expect(frame).toHaveAttribute('data-scrollable', 'true');
    sizes.scrollWidth = 400;
    act(() => observers[0]!.resize());
    expect(frame).toHaveAttribute('data-scrollable', 'false');
  });

  it('renders again only when the answer changes, so a resize does not loop', () => {
    const observers = fakeResizeObservers();
    const sizes = { ...fits };
    const onRender = vi.fn();
    render(<Probe sizes={sizes} onRender={onRender} />);
    const before = onRender.mock.calls.length;
    // Resizes that leave the table fitting, and then ones that leave it scrolling.
    act(() => observers[0]!.resize());
    sizes.clientWidth = 420;
    sizes.scrollWidth = 420;
    act(() => observers[0]!.resize());
    expect(onRender).toHaveBeenCalledTimes(before);
    sizes.scrollWidth = 700;
    act(() => observers[0]!.resize());
    const scrolling = onRender.mock.calls.length;
    expect(scrolling).toBe(before + 1);
    sizes.scrollWidth = 800;
    act(() => observers[0]!.resize());
    expect(onRender).toHaveBeenCalledTimes(scrolling);
  });

  it('stops observing when it unmounts', () => {
    const observers = fakeResizeObservers();
    const { unmount } = render(<Probe sizes={fits} onRender={() => {}} />);
    unmount();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });
});
