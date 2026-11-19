import { describe, expect, it } from 'vitest';
import { ROW_HEIGHT, resolveDensity, resolveVariant, rowPitch } from './row-heights';

describe('ROW_HEIGHT', () => {
  it('holds the table of spec 4.3: density by variant', () => {
    expect(ROW_HEIGHT).toEqual({
      compact: { lined: 31, striped: 30, minimal: 36 },
      standard: { lined: 41, striped: 40, minimal: 52 },
      comfortable: { lined: 49, striped: 48, minimal: 60 },
    });
  });
});

describe('rowPitch', () => {
  it('is the height of the row, and 2px more when the rows are apart (striped)', () => {
    expect(rowPitch(41, 'lined')).toBe(41);
    expect(rowPitch(52, 'minimal')).toBe(52);
    expect(rowPitch(40, 'striped')).toBe(42);
  });
});

describe('resolveDensity and resolveVariant', () => {
  it('keep a known value', () => {
    expect(resolveDensity('compact')).toBe('compact');
    expect(resolveVariant('minimal')).toBe('minimal');
  });

  it('give the default for anything else, without a cast in the caller', () => {
    expect(resolveDensity('tight')).toBe('standard');
    expect(resolveDensity(undefined)).toBe('standard');
    expect(resolveVariant('grid')).toBe('lined');
    expect(resolveVariant(undefined)).toBe('lined');
  });
});
