/** What a step can be: the three that `value` gives, and the error that only a `status` sets. */
export type StepState = 'complete' | 'current' | 'upcoming' | 'error';
/** What the author of a `Step` can say about it, which wins over the place of the step. */
export type StepStatus = 'complete' | 'error';

export interface StepStatesInput {
  /** How many steps there are. */
  count: number;
  /** The index of the current step, a whole number from 0 to `count`. */
  value: number;
  /** The `status` of each step, by index; a missing entry is no status. */
  statuses: ReadonlyArray<StepStatus | undefined>;
  linear: boolean;
  /** Whether the Stepper has an `onValueChange`, which is what makes a step something to press. */
  interactive: boolean;
}

export interface StepInfo {
  state: StepState;
  clickable: boolean;
}

/**
 * The state of every step and whether it is pressable (spec phase 4 §5). A `status` wins; without
 * one the steps before `value` are done, the one at it is current and the rest are ahead. A step is
 * pressable when the Stepper is interactive and it is not ahead of the current step, unless the
 * Stepper is not `linear` or the step says it is complete.
 */
export function stepStates({
  count,
  value,
  statuses,
  linear,
  interactive,
}: StepStatesInput): StepInfo[] {
  return Array.from({ length: count }, (_, index) => {
    const status = statuses[index];
    const state: StepState =
      status ?? (index < value ? 'complete' : index === value ? 'current' : 'upcoming');
    return {
      state,
      clickable: interactive && (!linear || index <= value || status === 'complete'),
    };
  });
}
