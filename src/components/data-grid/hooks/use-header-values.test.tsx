import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { resolveColumns } from '../engine/columns';
import { createTextCache } from '../engine/values';
import type { DataGridFilter } from '../types';
import { useHeaderValues } from './use-header-values';
import type { HeaderValuesOptions } from './use-header-values';

interface Order {
  id: string;
  status: string;
}

const COLUMNS = resolveColumns<Order>([{ field: 'status', caption: 'Status' }], {
  locale: 'en-US',
  timeZone: 'UTC',
  yes: 'Yes',
  no: 'No',
  allowSorting: true,
  allowResizing: true,
  allowReordering: true,
  allowPinning: true,
  allowHiding: true,
  allowFiltering: true,
  allowHeaderFiltering: true,
  allowGrouping: true,
});

const NEW: Order = { id: '1', status: 'New' };
const SHIPPED: Order = { id: '2', status: 'Shipped' };
const CANCELLED: Order = { id: '3', status: 'Cancelled' };

const EMPTY: DataGridFilter = {};
const READ = createTextCache<Order>();

function render(initial: Partial<HeaderValuesOptions<Order>>) {
  return renderHook(
    (props: Partial<HeaderValuesOptions<Order>>) =>
      useHeaderValues<Order>({
        enabled: true,
        rows: [],
        filter: EMPTY,
        resolved: COLUMNS,
        remote: false,
        read: READ,
        locale: 'en-US',
        ...props,
      }),
    { initialProps: initial },
  );
}

const texts = (list: ReturnType<ReturnType<typeof render>['result']['current']>) =>
  list.items.map((item) => item.text);

describe('useHeaderValues', () => {
  it('lists the values of the rows of the last commit while it is enabled', () => {
    const { result, rerender } = render({ rows: [NEW, SHIPPED] });
    expect(texts(result.current('status')).sort()).toEqual(['New', 'Shipped']);
    rerender({ rows: [NEW, SHIPPED, CANCELLED] });
    expect(texts(result.current('status')).sort()).toEqual(['Cancelled', 'New', 'Shipped']);
  });

  it('lists nothing for a column the grid does not have', () => {
    const { result } = render({ rows: [NEW] });
    expect(result.current('missing')).toEqual({ items: [], narrowed: false });
  });

  it('keeps no listing while it is disabled: a call lists nothing new and nothing is written', () => {
    const off = render({ enabled: false, rows: [NEW, SHIPPED] });
    expect(off.result.current('status')).toEqual({ items: [], narrowed: false });
    off.rerender({ enabled: false, rows: [NEW, SHIPPED, CANCELLED] });
    expect(off.result.current('status')).toEqual({ items: [], narrowed: false });

    // Turned off after it was on: the rows of the commits since are not written.
    const turned = render({ rows: [NEW] });
    turned.rerender({ enabled: false, rows: [NEW, SHIPPED] });
    expect(texts(turned.result.current('status'))).toEqual(['New']);
    // Turned on again: the next commit writes its own rows.
    turned.rerender({ enabled: true, rows: [NEW, SHIPPED] });
    expect(texts(turned.result.current('status')).sort()).toEqual(['New', 'Shipped']);
  });
});
