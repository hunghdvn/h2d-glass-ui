import { describe, expect, it } from 'vitest';
import { isPointInPolygon } from './menu-context';
import type { Point } from './menu-context';

// The grace triangle of a submenu runs from where the pointer left the sub-trigger to the two
// corners of the submenu's near edge.
describe('isPointInPolygon', () => {
  const triangle: Point[] = [
    [0, 50],
    [100, 0],
    [100, 100],
  ];

  it('is true for a point inside the triangle', () => {
    expect(isPointInPolygon([50, 50], triangle)).toBe(true);
    expect(isPointInPolygon([90, 10], triangle)).toBe(true);
    expect(isPointInPolygon([90, 90], triangle)).toBe(true);
  });

  it('is false for a point outside it', () => {
    // At x = 10 the triangle spans y 45 to 55.
    expect(isPointInPolygon([10, 10], triangle)).toBe(false);
    expect(isPointInPolygon([10, 60], triangle)).toBe(false);
    // Behind the point the pointer left from, and past the submenu's edge.
    expect(isPointInPolygon([-5, 50], triangle)).toBe(false);
    expect(isPointInPolygon([105, 50], triangle)).toBe(false);
  });

  it('tells inside from outside in a thin triangle', () => {
    const thin: Point[] = [
      [0, 0],
      [200, -1],
      [200, 1],
    ];
    // At x = 150 it spans y -0.75 to 0.75.
    expect(isPointInPolygon([150, 0], thin)).toBe(true);
    expect(isPointInPolygon([150, 0.5], thin)).toBe(true);
    expect(isPointInPolygon([150, 0.9], thin)).toBe(false);
    expect(isPointInPolygon([150, -0.9], thin)).toBe(false);
  });

  it('works for a submenu that flipped to the left', () => {
    const flipped: Point[] = [
      [100, 50],
      [0, 0],
      [0, 100],
    ];
    expect(isPointInPolygon([50, 50], flipped)).toBe(true);
    expect(isPointInPolygon([120, 50], flipped)).toBe(false);
    expect(isPointInPolygon([90, 10], flipped)).toBe(false);
  });
});
