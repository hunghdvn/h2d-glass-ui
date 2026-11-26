import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { checkKeys, reactKeysOf, readRowKey, uniqueKeys, usableKey } from './row-keys';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('reactKeysOf', () => {
  it('prefixes each key by the kind of its row, the form row included, so no two kinds meet', () => {
    expect(
      reactKeysOf([
        { kind: 'data', key: 'a' },
        { kind: 'form', key: 'a' },
        { kind: 'group', key: 'a' },
        { kind: 'detail', key: 'a' },
      ]),
    ).toEqual(['d:a', 'f:a', 'g:a', 'x:a']);
  });

  it('numbers a key that comes again within its kind', () => {
    expect(
      reactKeysOf([
        { kind: 'form', key: 1 },
        { kind: 'form', key: '1' },
      ]),
    ).toEqual(['f:1', 'f:1#2']);
  });
});

describe('usableKey', () => {
  it('takes a string or a finite number', () => {
    expect(usableKey('DH-1030')).toBe('DH-1030');
    expect(usableKey(7)).toBe(7);
    expect(usableKey(0)).toBe(0);
    expect(usableKey('')).toBe('');
  });

  it.each([null, undefined, Number.NaN, Infinity, true, {}, [], Symbol('x'), 10n])(
    'refuses %s',
    (value) => {
      expect(usableKey(value)).toBeUndefined();
    },
  );
});

// A row that is not an object is not something the types allow; the library never throws on it.
const readLoose = readRowKey as (rowKey: string, row: unknown) => unknown;

describe('readRowKey', () => {
  it('reads a property by name, or calls the function', () => {
    expect(readRowKey('id', { id: 'a' })).toBe('a');
    expect(readRowKey((row: { id: string }) => `${row.id}!`, { id: 'a' })).toBe('a!');
  });

  it('gives undefined for a row that is not an object, and never throws', () => {
    expect(readLoose('id', null)).toBeUndefined();
    expect(readLoose('id', 5)).toBeUndefined();
  });
});

describe('uniqueKeys', () => {
  it('leaves distinct keys as they are, as strings', () => {
    expect(uniqueKeys(['a', 'b', 3])).toEqual(['a', 'b', '3']);
  });

  it('numbers the later occurrences of a key', () => {
    expect(uniqueKeys(['a', 'a', 'b', 'a'])).toEqual(['a', 'a#2', 'b', 'a#3']);
  });

  it('treats 1 and "1" as one key, as React does', () => {
    expect(uniqueKeys([1, '1'])).toEqual(['1', '1#2']);
  });

  it('never gives two rows the same React key, also when a real key looks like a numbered one', () => {
    const keys = uniqueKeys(['a', 'a#2', 'a', 'a#2']);
    expect(new Set(keys).size).toBe(4);
    expect(keys[0]).toBe('a');
    expect(keys[1]).toBe('a#2');
  });
});

/** The keys the grid reads: the row's own, or its place in the list. */
const listed = <TRow>(data: readonly TRow[], key: (row: TRow) => unknown) =>
  data.map((row, index) => ({ key: usableKey(key(row)) ?? index }));

describe('checkKeys', () => {
  const id = (row: { id?: unknown }) => row.id;

  it('is silent when every row has its own key', () => {
    const warn = spyWarn();
    const data = [{ id: 'a' }, { id: 'b' }];
    checkKeys(data, 'id', listed(data, id));
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once for rows with no usable key, whatever their number', () => {
    const warn = spyWarn();
    const data = [{ id: null }, { id: undefined }, { id: 'a' }, {}];
    checkKeys(data, 'id', listed(data, id));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('no usable key');
  });

  it('warns once for a repeated key, without saying which', () => {
    const warn = spyWarn();
    const data = [{ id: 'a' }, { id: 'a' }, { id: 'a' }];
    checkKeys(data, 'id', listed(data, id));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('same key');
    expect(warn.mock.calls[0]?.[0]).not.toContain('"a"');
  });

  it('warns for a key that is the place of a row with no key, which the grid reads as its key', () => {
    const warn = spyWarn();
    const data = [{ id: 2 }, { id: 0 }, {}];
    checkKeys(data, 'id', listed(data, id));
    const texts = warn.mock.calls.map(([text]) => String(text));
    expect(texts).toHaveLength(2);
    expect(texts[0]).toContain('no usable key');
    expect(texts[1]).toContain('same key');
    expect(texts[1]).not.toMatch(/\b2\b/);
  });

  it('does not read a single row in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = spyWarn();
    const key = vi.fn((row: { id: string }) => row.id);
    checkKeys([{ id: 'a' }, { id: 'a' }], key, [{ key: 'a' }, { key: 'a' }]);
    expect(key).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
