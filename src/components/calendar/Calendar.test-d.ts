import { expectTypeOf, test } from 'vitest';
import { Calendar } from './Calendar';
import type { CalendarProps } from './Calendar';

test('Calendar value takes null, so a controlled calendar can have no date', () => {
  expectTypeOf<CalendarProps['value']>().toEqualTypeOf<string | null | undefined>();
  Calendar({ value: null });
  Calendar({ value: '2026-11-14', onValueChange: (value) => expectTypeOf(value).toBeString() });
  Calendar({ defaultValue: '2026-11-14' });
});

test('Calendar defaultValue does not take null, and onValueChange always gets a date', () => {
  // @ts-expect-error null is "no value" only for a controlled calendar.
  Calendar({ defaultValue: null });
  expectTypeOf<NonNullable<CalendarProps['onValueChange']>>().parameter(0).toBeString();
});

test('Calendar weekStartsOn rejects a day that is not 0 to 6', () => {
  Calendar({ weekStartsOn: 0 });
  Calendar({ weekStartsOn: 6 });
  // @ts-expect-error the week has days 0 (Sunday) to 6 (Saturday).
  Calendar({ weekStartsOn: 7 });
});

test('Calendar months and dates are strings, never a Date', () => {
  // @ts-expect-error an ISO string, not a Date.
  Calendar({ value: new Date() });
  // @ts-expect-error an ISO month, not a Date.
  Calendar({ month: new Date() });
  Calendar({ min: '2026-01-01', max: '2026-12-31', today: '2026-11-04', month: '2026-11' });
});
