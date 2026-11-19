import { expectTypeOf, test } from 'vitest';
import type { IndicatorProps, IndicatorStatus } from './Indicator';

test('an Indicator takes only the four documented statuses', () => {
  expectTypeOf<IndicatorStatus>().toEqualTypeOf<'accent' | 'danger' | 'success' | 'warning'>();
  expectTypeOf<IndicatorProps['status']>().toEqualTypeOf<IndicatorStatus | undefined>();
  // @ts-expect-error an unknown status
  const unknown: IndicatorProps = { status: 'info', children: 'x' };
  // @ts-expect-error `error` is a status of Alert and Progress, `danger` is this one
  const other: IndicatorProps = { status: 'error', children: 'x' };
  expectTypeOf(unknown).toBeObject();
  expectTypeOf(other).toBeObject();
});

test('what shows is a number or a flag, and every one may be left out', () => {
  expectTypeOf<IndicatorProps['count']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<IndicatorProps['max']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<IndicatorProps['dot']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<IndicatorProps['showZero']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<IndicatorProps['show']>().toEqualTypeOf<boolean | undefined>();
  const bare: IndicatorProps = { children: 'x' };
  expectTypeOf(bare).toBeObject();
  // @ts-expect-error the count is a number
  const text: IndicatorProps = { count: '3', children: 'x' };
  expectTypeOf(text).toBeObject();
});

test('an Indicator sits on something, so the children are required', () => {
  // @ts-expect-error nothing to put the mark on
  const empty: IndicatorProps = { count: 3 };
  expectTypeOf(empty).toBeObject();
});
