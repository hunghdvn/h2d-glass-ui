import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataGrid } from '../DataGrid';
import type { DataGridProps } from '../index';
import { FOOT_HEIGHT_PROPERTY } from './use-foot-height';

// The height of the sticky footer is measured for a grid that has a height and a footer, and only then:
// the rows keep clear of the footer by the property it writes on the frame (`scroll-margin-bottom`).

interface Row {
  id: string;
  qty: number;
}
const DATA: Row[] = [
  { id: 'a', qty: 1 },
  { id: 'b', qty: 2 },
];

const observers: {
  callback: ResizeObserverCallback;
  observed: Element[];
  disconnected: boolean;
}[] = [];
class FakeObserver {
  private readonly entry: (typeof observers)[number];
  constructor(callback: ResizeObserverCallback) {
    this.entry = { callback, observed: [], disconnected: false };
    observers.push(this.entry);
  }
  observe(element: Element) {
    this.entry.observed.push(element);
  }
  unobserve(element: Element) {
    this.entry.observed = this.entry.observed.filter((other) => other !== element);
  }
  disconnect() {
    this.entry.disconnected = true;
  }
}

afterEach(() => {
  observers.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Orders(props: Partial<DataGridProps<Row>>) {
  return (
    <DataGrid
      data={DATA}
      rowKey="id"
      columns={[
        { field: 'id', caption: 'Id', width: 80 },
        { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
      ]}
      caption="Rows"
      paging={false}
      {...props}
    />
  );
}

const SUMMARY = { total: [{ column: 'qty', type: 'sum' as const }] };
const frame = () => document.querySelector<HTMLElement>('.flg-data-grid-frame')!;
const property = () => frame().style.getPropertyValue(FOOT_HEIGHT_PROPERTY);
// The observers that watch a footer: the ones the grid made for its height, which watch the table.
const watchingFooter = () =>
  observers.filter((entry) => entry.observed.some((element) => element.tagName === 'TFOOT'));

describe('useFootHeight', () => {
  it('writes the height of the footer on the frame for a grid with a height and a footer', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'TFOOT' ? 37 : 0;
    });
    render(<Orders height={300} summary={SUMMARY} />);
    expect(property()).toBe('37px');
    expect(watchingFooter()).toHaveLength(1);
  });

  it('follows the footer when it changes size, and takes it off when the footer goes', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    let height = 37;
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'TFOOT' ? height : 0;
    });
    const { rerender } = render(<Orders height={300} summary={SUMMARY} />);
    height = 45;
    act(() => {
      for (const entry of watchingFooter()) entry.callback([], {} as ResizeObserver);
    });
    expect(property()).toBe('45px');
    rerender(<Orders height={300} />);
    expect(property()).toBe('');
    expect(watchingFooter().every((entry) => entry.disconnected)).toBe(true);
  });

  it('writes nothing, and observes no footer, for a grid with no height', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    render(<Orders summary={SUMMARY} />);
    expect(property()).toBe('');
    expect(watchingFooter()).toHaveLength(0);
  });

  it('writes nothing, and observes no footer, for a grid with a height and no footer', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    render(<Orders height={300} />);
    expect(property()).toBe('');
    expect(watchingFooter()).toHaveLength(0);
    // The group totals have no footer either.
    render(<Orders height={300} summary={{ group: [{ column: 'qty', type: 'sum' }] }} />);
    expect(watchingFooter()).toHaveLength(0);
  });

  it('leaves the property to the stylesheet where nothing observes, as in jsdom', () => {
    render(<Orders height={300} summary={SUMMARY} />);
    expect(property()).toBe('');
  });
});
