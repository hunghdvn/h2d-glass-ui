import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sameList, sameMembers, useKept } from './use-kept';

describe('sameList and sameMembers', () => {
  const a = { id: 'a' };
  const b = { id: 'b' };

  it('compare the items by identity, in order or in any order', () => {
    expect(sameList([a, b], [a, b])).toBe(true);
    expect(sameList([a, b], [b, a])).toBe(false);
    expect(sameList([a], [a, b])).toBe(false);
    expect(sameList([a, { id: 'b' }], [a, b])).toBe(false);
    expect(sameMembers([a, b], [b, a])).toBe(true);
    expect(sameMembers([a, b], [a])).toBe(false);
    expect(sameMembers([a, a], [a, b])).toBe(false);
    expect(sameList([], [])).toBe(true);
  });
});

describe('useKept', () => {
  const sameId = (kept: { id: number }, next: { id: number }) => kept.id === next.id;

  it('gives back the value of an earlier render while the new one says the same', () => {
    const first = { id: 1 };
    const { result, rerender } = renderHook((value: { id: number }) => useKept(value, sameId), {
      initialProps: first,
    });
    expect(result.current).toBe(first);
    rerender({ id: 1 });
    expect(result.current).toBe(first);
  });

  it('keeps the new value once it differs, and goes on from it', () => {
    const { result, rerender } = renderHook((value: { id: number }) => useKept(value, sameId), {
      initialProps: { id: 1 },
    });
    const second = { id: 2 };
    rerender(second);
    expect(result.current).toBe(second);
    rerender({ id: 2 });
    expect(result.current).toBe(second);
  });
});
