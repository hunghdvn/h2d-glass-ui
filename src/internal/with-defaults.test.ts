import { describe, expect, it } from 'vitest';
import { withDefaults } from './with-defaults';

const DEFAULTS = { a: 'one', b: 'two' };

describe('withDefaults', () => {
  it('returns the defaults when nothing is given', () => {
    expect(withDefaults(DEFAULTS, undefined)).toEqual(DEFAULTS);
  });

  it('lets a given string win', () => {
    expect(withDefaults(DEFAULTS, { a: 'uno' })).toEqual({ a: 'uno', b: 'two' });
  });

  it('keeps the default of a key given as undefined or null', () => {
    expect(withDefaults(DEFAULTS, { a: undefined, b: null as unknown as string })).toEqual(
      DEFAULTS,
    );
  });

  it('keeps the empty string, which is a value', () => {
    expect(withDefaults(DEFAULTS, { a: '' })).toEqual({ a: '', b: 'two' });
  });

  it('does not copy a key the defaults do not have', () => {
    const given = { a: 'uno', extra: 'x' } as Partial<typeof DEFAULTS>;
    expect(withDefaults(DEFAULTS, given)).toEqual({ a: 'uno', b: 'two' });
  });

  it('does not change the defaults object', () => {
    const defaults = { a: 'one' };
    const result = withDefaults(defaults, { a: 'uno' });
    expect(defaults).toEqual({ a: 'one' });
    expect(result).not.toBe(defaults);
  });
});
