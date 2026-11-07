import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { childKeys } from '../../internal/child-keys';
import { collectChildren, markPart } from '../../internal/collect-children';
import { hasContent } from '../../internal/has-content';
import { BoxCheckIcon, ExclamationIcon } from '../../internal/icons';
import { clamp } from '../../internal/number';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { stepStates } from './step-states';
import type { StepState, StepStatus } from './step-states';

export type StepperVariant = 'circles' | 'compact' | 'bars';

/** The words a Stepper says to a screen reader; translate them here. */
export interface StepperLabels {
  /** The place of a step, said before its title: "Step 2 of 4". */
  step: (n: number, total: number) => string;
  /** The line above the title in the `bars` look, which is seen: "Step 2". */
  caption: (n: number) => string;
  completed: string;
  current: string;
  notStarted: string;
  error: string;
}

export type StepperProps = Omit<HTMLAttributes<HTMLOListElement>, 'onChange' | 'children'> & {
  /**
   * The index (from 0) of the current step. A number equal to the number of steps means every step
   * is done. There is no uncontrolled form: the content of each step is yours, so you hold this.
   */
  value: number;
  /**
   * Called with the index of the step the user presses. Giving it makes the steps that can be
   * pressed buttons; pressing the current step calls nothing.
   */
  onValueChange?: (index: number) => void;
  /** Whether a step ahead of the current one stays out of reach. Default `true`. */
  linear?: boolean;
  orientation?: 'horizontal' | 'vertical';
  variant?: StepperVariant;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<StepperLabels>;
  /** `Step` elements, written in the component that renders the Stepper. */
  children: ReactNode;
};

export type StepProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Wins over the place of the step: `error`, or `complete` for a step done out of order. */
  status?: StepStatus;
  /** On the `<li>` of the step. */
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_LABELS: StepperLabels = {
  step: (n, total) => `Step ${n} of ${total}`,
  caption: (n) => `Step ${n}`,
  completed: 'Completed',
  current: 'Current',
  notStarted: 'Not started',
  error: 'Error',
};

/** The word for each state, read after the description. */
const STATE_LABELS = {
  complete: 'completed',
  current: 'current',
  upcoming: 'notStarted',
  error: 'error',
} as const satisfies Record<StepState, keyof StepperLabels>;

/**
 * The steps of a process, in one of three looks, horizontal or vertical. `value` says where the
 * process is; the content of each step is the caller's. The Steps are read from `children` without
 * rendering them, and the Stepper has no state and no hook, so it renders in a Server Component.
 * Write the Steps in the component that renders the Stepper: Steps handed to a client component by a
 * Server Component arrive already rendered, and cannot be read.
 */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  {
    value,
    onValueChange,
    linear = true,
    orientation = 'horizontal',
    variant = 'circles',
    labels,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const words = withDefaults(DEFAULT_LABELS, labels);
  const steps = collectChildren(children, {
    parts: ['step'],
    onUnknown: () => devWarn('<Stepper> has a child that is not a <Step>; it is left out.'),
  });
  const count = steps.length;
  if (count === 0) {
    devWarn(
      '<Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component).',
    );
  }
  // Rounded down, so that a process is never shown as done before it is. `NaN` is the first step;
  // infinities clamp like any other number. The warning leaves the value
  // out of its text, so that `devWarn` can dedupe it.
  const rounded = Math.floor(value);
  const current = Number.isNaN(rounded) ? 0 : clamp(rounded, 0, count);
  // With no steps to count, the value is not the mistake, and the warning above names the cause.
  if (count > 0 && current !== value) {
    devWarn(
      '<Stepper> value must be a whole number from 0 to the number of steps; it was rounded into that range.',
    );
  }
  if (!linear && !onValueChange) {
    devWarn('<Stepper> linear={false} has no effect without onValueChange.');
  }
  const keys = childKeys(steps.map((step) => step.key));
  const states = stepStates({
    count,
    value: current,
    statuses: steps.map((step) => (step.props as StepProps).status),
    linear,
    interactive: onValueChange !== undefined,
  });
  // The number of steps sizes the columns of `compact` (spec phase 4 §4.3); a `style` of the caller's
  // is kept beside it.
  const rootStyle = { '--flg-step-count': count, ...style } as CSSProperties;
  return (
    <ol
      ref={ref}
      className={clsx('flg-stepper', className)}
      style={rootStyle}
      data-variant={variant}
      data-orientation={orientation}
      {...props}
    >
      {steps.map((step, index) => {
        const { title, description, className: stepClass, style } = step.props as StepProps;
        const { state, clickable } = states[index]!;
        const isCurrent = index === current;
        // A screen reader reads `aria-current` only from the element that has the focus, so the
        // attribute is on the button when there is one, and on the <li> when there is not.
        const currentMark = isCurrent ? ({ 'aria-current': 'step' } as const) : undefined;
        const mark =
          variant === 'bars' ? (
            <span className="flg-step-bar" aria-hidden="true" />
          ) : (
            <span className="flg-step-indicator" aria-hidden="true">
              {state === 'complete' ? <BoxCheckIcon /> : null}
              {state === 'error' ? <ExclamationIcon /> : null}
              {state === 'upcoming' || state === 'current' ? index + 1 : null}
            </span>
          );
        const text = (
          <span className="flg-step-text">
            <span className="flg-visually-hidden">{`${words.step(index + 1, count)}: `}</span>
            {variant === 'bars' ? (
              <span className="flg-step-caption" aria-hidden="true">
                {state === 'complete' ? <BoxCheckIcon /> : null}
                {state === 'error' ? <ExclamationIcon /> : null}
                {words.caption(index + 1)}
              </span>
            ) : null}
            <span className="flg-step-title">{title}</span>
            {hasContent(description) ? (
              <>
                {/* So that a step reads "Delivery, Home delivery"; it takes no room in the column. */}
                <span className="flg-visually-hidden">, </span>
                <span className="flg-step-description">{description}</span>
              </>
            ) : null}
            <span className="flg-visually-hidden">{`, ${words[STATE_LABELS[state]]}`}</span>
          </span>
        );
        return (
          <li
            key={keys[index]}
            className={clsx('flg-step', stepClass)}
            style={style}
            data-state={state}
            {...(clickable ? undefined : currentMark)}
          >
            {clickable ? (
              <button
                type="button"
                className="flg-step-inner"
                onClick={isCurrent ? undefined : () => onValueChange?.(index)}
                {...currentMark}
              >
                {mark}
                {text}
              </button>
            ) : (
              <span className="flg-step-inner">
                {mark}
                {text}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
});

/**
 * One step of a Stepper. Read by the Stepper and never rendered on its own, so it takes no `ref`;
 * rendered anywhere else it renders nothing and says why.
 */
export const Step = markPart(function Step(props: StepProps): null {
  void props;
  devWarn(
    '<Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them.',
  );
  return null;
}, 'step');
