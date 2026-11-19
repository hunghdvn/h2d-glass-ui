import { describe, expect, it } from 'vitest';
import { stepStates } from './step-states';
import type { StepStatus } from './step-states';

const states = (value: number, count: number) =>
  stepStates({ count, value, statuses: [], linear: true, interactive: false }).map(
    (step) => step.state,
  );

describe('stepStates', () => {
  it('is empty for no steps', () => {
    expect(
      stepStates({ count: 0, value: 0, statuses: [], linear: true, interactive: true }),
    ).toEqual([]);
  });

  it.each([
    [0, ['current', 'upcoming', 'upcoming', 'upcoming']],
    [1, ['complete', 'current', 'upcoming', 'upcoming']],
    [2, ['complete', 'complete', 'current', 'upcoming']],
    [3, ['complete', 'complete', 'complete', 'current']],
    // A value equal to the count means every step is done and none is current.
    [4, ['complete', 'complete', 'complete', 'complete']],
  ])(
    'puts the steps before value %i behind it, the step at it current, the rest ahead',
    (value, expected) => {
      expect(states(value, 4)).toEqual(expected);
    },
  );

  it('covers every value from 0 to the count, for every count up to six', () => {
    for (let count = 1; count <= 6; count += 1) {
      for (let value = 0; value <= count; value += 1) {
        const result = states(value, count);
        expect(result).toHaveLength(count);
        expect(result.filter((state) => state === 'complete')).toHaveLength(value);
        expect(result.filter((state) => state === 'current')).toHaveLength(value < count ? 1 : 0);
        expect(result.filter((state) => state === 'upcoming')).toHaveLength(
          Math.max(0, count - value - 1),
        );
      }
    }
  });

  it('lets the status of a step win, whatever its place', () => {
    const statuses: Array<StepStatus | undefined> = [undefined, 'error', 'complete', undefined];
    const result = stepStates({ count: 4, value: 1, statuses, linear: true, interactive: false });
    expect(result.map((step) => step.state)).toEqual(['complete', 'error', 'complete', 'upcoming']);
  });

  it('keeps a step with the status error as the error even when it is behind the value', () => {
    const result = stepStates({
      count: 3,
      value: 2,
      statuses: ['error'],
      linear: true,
      interactive: false,
    });
    expect(result.map((step) => step.state)).toEqual(['error', 'complete', 'current']);
  });

  it('takes a status list shorter than the steps as no status for the rest', () => {
    const result = stepStates({
      count: 2,
      value: 0,
      statuses: ['error'],
      linear: true,
      interactive: false,
    });
    expect(result.map((step) => step.state)).toEqual(['error', 'upcoming']);
  });

  it('ignores the statuses past the last step', () => {
    const result = stepStates({
      count: 1,
      value: 0,
      statuses: ['complete', 'error'],
      linear: true,
      interactive: false,
    });
    expect(result.map((step) => step.state)).toEqual(['complete']);
  });

  describe('clickable', () => {
    const clickable = (options: {
      value: number;
      statuses?: Array<StepStatus | undefined>;
      linear: boolean;
      interactive: boolean;
    }) => stepStates({ count: 4, statuses: [], ...options }).map((step) => step.clickable);

    it('is false for every step when the stepper is not interactive', () => {
      expect(clickable({ value: 2, linear: true, interactive: false })).toEqual([
        false,
        false,
        false,
        false,
      ]);
      expect(clickable({ value: 2, linear: false, interactive: false })).toEqual([
        false,
        false,
        false,
        false,
      ]);
    });

    it('is true up to and including the current step when linear', () => {
      expect(clickable({ value: 0, linear: true, interactive: true })).toEqual([
        true,
        false,
        false,
        false,
      ]);
      expect(clickable({ value: 2, linear: true, interactive: true })).toEqual([
        true,
        true,
        true,
        false,
      ]);
    });

    it('is true for every step when the value is the count', () => {
      expect(clickable({ value: 4, linear: true, interactive: true })).toEqual([
        true,
        true,
        true,
        true,
      ]);
    });

    it('is true for every step when not linear', () => {
      expect(clickable({ value: 1, linear: false, interactive: true })).toEqual([
        true,
        true,
        true,
        true,
      ]);
    });

    it('is true for a step ahead whose status is complete, and false for one that is an error', () => {
      expect(
        clickable({
          value: 0,
          statuses: [undefined, 'complete', 'error'],
          linear: true,
          interactive: true,
        }),
      ).toEqual([true, true, false, false]);
    });
  });
});
