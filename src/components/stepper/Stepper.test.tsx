import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment, createRef } from 'react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Step, Stepper } from './Stepper';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});

/** The four steps of the mockup's checkout. */
function Checkout(props: Partial<ComponentProps<typeof Stepper>>) {
  return (
    <Stepper value={1} {...props}>
      <Step title="Cart" description="3 items" />
      <Step title="Delivery" description="Home delivery" />
      <Step title="Payment" />
      <Step title="Confirm" />
    </Stepper>
  );
}

const items = (container: HTMLElement) => Array.from(container.querySelectorAll('li.flg-step'));
const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const CHECK = 'M2.5 6.2 5 8.5l4.5-5';
const EXCLAMATION = 'M6 2.75v3.75M6 9.25h.01';

describe('Stepper', () => {
  it('renders an ordered list with the variant and orientation, circles and horizontal by default', () => {
    const { container } = render(<Checkout />);
    const list = container.firstElementChild!;
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('flg-stepper');
    expect(list).toHaveAttribute('data-variant', 'circles');
    expect(list).toHaveAttribute('data-orientation', 'horizontal');
    expect(items(container)).toHaveLength(4);
  });

  it.each(['circles', 'compact', 'bars'] as const)('reflects variant %s', (variant) => {
    const { container } = render(<Checkout variant={variant} orientation="vertical" />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
    expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical');
  });

  it('forwards the ref to the <ol> and puts className, style and other props on it', () => {
    const ref = createRef<HTMLOListElement>();
    const { container } = render(
      <Stepper ref={ref} value={0} className="mine" style={{ margin: 3 }} aria-label="Checkout">
        <Step title="Cart" />
      </Stepper>,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('flg-stepper', 'mine');
    expect(ref.current).toHaveStyle({ margin: '3px' });
    expect(screen.getByRole('list', { name: 'Checkout' })).toBe(ref.current);
  });

  it('reads the steps through fragments and arrays, in order', () => {
    const { container } = render(
      <Stepper value={0}>
        <Fragment>
          <Step title="A" />
          {[<Step key="b" title="B" />, <Step key="c" title="C" />]}
        </Fragment>
        {false}
        {null}
      </Stepper>,
    );
    expect(items(container).map((li) => li.querySelector('.flg-step-title')?.textContent)).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('gives every step its own key when keyed and unkeyed Steps are mixed', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rest = ['Delivery', 'Payment'];
    const { container } = render(
      <Stepper value={0}>
        <Step title="Start" />
        {rest.map((title, index) => (
          <Step key={index} title={title} />
        ))}
        {rest.map((title, index) => (
          <Step key={index} title={title} />
        ))}
      </Stepper>,
    );
    expect(items(container)).toHaveLength(5);
    expect(error).not.toHaveBeenCalled();
  });

  describe('states', () => {
    it('marks the steps before value complete, the one at it current, the rest upcoming', () => {
      const { container } = render(<Checkout value={1} />);
      expect(items(container).map((li) => li.getAttribute('data-state'))).toEqual([
        'complete',
        'current',
        'upcoming',
        'upcoming',
      ]);
    });

    it('marks every step complete, and none current, when value is the number of steps', () => {
      const { container } = render(<Checkout value={4} />);
      expect(items(container).map((li) => li.getAttribute('data-state'))).toEqual([
        'complete',
        'complete',
        'complete',
        'complete',
      ]);
      expect(container.querySelector('[aria-current]')).toBeNull();
    });

    it('lets the status of a Step win', () => {
      const { container } = render(
        <Stepper value={1}>
          <Step title="A" />
          <Step title="B" status="error" />
          <Step title="C" status="complete" />
          <Step title="D" />
        </Stepper>,
      );
      expect(items(container).map((li) => li.getAttribute('data-state'))).toEqual([
        'complete',
        'error',
        'complete',
        'upcoming',
      ]);
    });

    it('shows a number until the step is done, then a check, and a mark for an error', () => {
      const { container } = render(
        <Stepper value={2}>
          <Step title="A" />
          <Step title="B" status="error" />
          <Step title="C" />
          <Step title="D" />
        </Stepper>,
      );
      const marks = items(container).map((li) => li.querySelector('.flg-step-indicator')!);
      expect(marks[0]!.querySelector('svg path')).toHaveAttribute('d', CHECK);
      expect(marks[1]!.querySelector('svg path')).toHaveAttribute('d', EXCLAMATION);
      expect(marks[2]).toHaveTextContent('3');
      expect(marks[3]).toHaveTextContent('4');
      for (const mark of marks) expect(mark).toHaveAttribute('aria-hidden', 'true');
    });

    it('puts className and style of a Step on its <li>', () => {
      const { container } = render(
        <Stepper value={0}>
          <Step title="A" className="mine" style={{ opacity: 0.5 }} />
        </Stepper>,
      );
      const li = items(container)[0]!;
      expect(li).toHaveClass('flg-step', 'mine');
      expect(li).toHaveStyle({ opacity: '0.5' });
    });
  });

  describe('the bars look', () => {
    it('has a bar and a caption in place of the circle', () => {
      const { container } = render(
        <Stepper value={1} variant="bars">
          <Step title="Cart" />
          <Step title="Delivery" status="error" />
          <Step title="Payment" />
        </Stepper>,
      );
      expect(container.querySelector('.flg-step-indicator')).toBeNull();
      const [first, second, third] = items(container);
      expect(first!.querySelector('.flg-step-bar')).toHaveAttribute('aria-hidden', 'true');
      const caption = (li: Element) => li.querySelector('.flg-step-caption')!;
      expect(caption(first!)).toHaveAttribute('aria-hidden', 'true');
      expect(caption(first!)).toHaveTextContent('Step 1');
      // The done step has a check and the failed one an exclamation mark before the words.
      expect(caption(first!).querySelector('path')).toHaveAttribute('d', CHECK);
      expect(caption(second!).querySelector('path')).toHaveAttribute('d', EXCLAMATION);
      expect(caption(third!).querySelector('svg')).toBeNull();
    });

    it('renders only the part of the look in use', () => {
      const { container, rerender } = render(<Checkout variant="circles" />);
      expect(container.querySelector('.flg-step-bar, .flg-step-caption')).toBeNull();
      rerender(<Checkout variant="compact" />);
      expect(container.querySelector('.flg-step-bar, .flg-step-caption')).toBeNull();
    });
  });

  describe('reading it', () => {
    it('says the place and the state in hidden text around the title and the description', () => {
      const { container } = render(<Checkout value={1} />);
      const second = items(container)[1]!;
      const hidden = Array.from(second.querySelectorAll('.flg-visually-hidden')).map(
        (node) => node.textContent,
      );
      expect(hidden).toEqual(['Step 2 of 4: ', ', ', ', Current']);
      expect(second.querySelector('.flg-step-title')).toHaveTextContent('Delivery');
      expect(second.querySelector('.flg-step-description')).toHaveTextContent('Home delivery');
      // The order the screen reader reads them in.
      const text = second.querySelector('.flg-step-text')!;
      expect(Array.from(text.children).map((child) => child.className)).toEqual([
        'flg-visually-hidden',
        'flg-step-title',
        'flg-visually-hidden',
        'flg-step-description',
        'flg-visually-hidden',
      ]);
    });

    it('reads exactly as the sentence of the spec, with and without a description', () => {
      const { container } = render(
        <Stepper value={1}>
          <Step title="Cart" />
          <Step title="Delivery" description="Home delivery, 2–3 days" />
        </Stepper>,
      );
      const [cart, delivery] = items(container);
      expect(cart!.querySelector('.flg-step-text')!.textContent).toBe(
        'Step 1 of 2: Cart, Completed',
      );
      expect(delivery!.querySelector('.flg-step-text')!.textContent).toBe(
        'Step 2 of 2: Delivery, Home delivery, 2–3 days, Current',
      );
    });

    it('gives each state its word', () => {
      const { container } = render(
        <Stepper value={2}>
          <Step title="A" />
          <Step title="B" status="error" />
          <Step title="C" />
          <Step title="D" />
        </Stepper>,
      );
      const words = items(container).map((li) => {
        const hidden = li.querySelectorAll('.flg-visually-hidden');
        return hidden[hidden.length - 1]!.textContent;
      });
      expect(words).toEqual([', Completed', ', Error', ', Current', ', Not started']);
    });

    it('leaves out the description when there is none or it renders nothing', () => {
      const { container } = render(
        <Stepper value={0}>
          <Step title="A" />
          <Step title="B" description={false} />
          <Step title="C" description={<></>} />
          <Step title="D" description="" />
        </Stepper>,
      );
      expect(container.querySelector('.flg-step-description')).toBeNull();
    });

    it('takes every word from `labels`', () => {
      const { container } = render(
        <Checkout
          variant="bars"
          value={1}
          labels={{
            step: (n, total) => `Bước ${n}/${total}`,
            caption: (n) => `Bước ${n}`,
            completed: 'Xong',
            current: 'Hiện tại',
            notStarted: 'Chưa tới',
          }}
        />,
      );
      const [first, second, third] = items(container);
      const hidden = (li: Element) =>
        Array.from(li.querySelectorAll('.flg-visually-hidden')).map((node) => node.textContent);
      expect(hidden(first!)).toEqual(['Bước 1/4: ', ', ', ', Xong']);
      expect(hidden(second!)).toEqual(['Bước 2/4: ', ', ', ', Hiện tại']);
      expect(hidden(third!)).toEqual(['Bước 3/4: ', ', Chưa tới']);
      expect(first!.querySelector('.flg-step-caption')).toHaveTextContent('Bước 1');
    });

    it('takes the word of an error from `labels`', () => {
      const { container } = render(
        <Stepper value={0} labels={{ error: 'Lỗi' }}>
          <Step title="A" status="error" />
        </Stepper>,
      );
      expect(container.querySelector('li')).toHaveTextContent(', Lỗi');
    });

    it('keeps the default of a label given as undefined', () => {
      const { container } = render(
        <Checkout labels={{ completed: undefined, step: undefined, error: undefined }} />,
      );
      const first = items(container)[0]!;
      const hidden = Array.from(first.querySelectorAll('.flg-visually-hidden')).map(
        (node) => node.textContent,
      );
      expect(hidden).toEqual(['Step 1 of 4: ', ', ', ', Completed']);
    });

    it('is read as one phrase by its accessible name', () => {
      render(<Checkout value={1} onValueChange={() => {}} />);
      // jsdom has no layout, so the spaces between the lines of a real browser are not there.
      const name = /^Step 2 of 4:\s*Delivery.*, Current$/;
      expect(screen.getByRole('button', { name })).toBeVisible();
    });
  });

  describe('pressing a step', () => {
    it('has no buttons without onValueChange, so it only shows', () => {
      const { container } = render(<Checkout value={2} />);
      expect(screen.queryByRole('button')).toBeNull();
      for (const li of items(container)) {
        expect(li.querySelector('.flg-step-inner')!.tagName).toBe('SPAN');
      }
    });

    it('makes the steps up to the current one buttons, and the rest plain', () => {
      const { container } = render(<Checkout value={1} onValueChange={() => {}} />);
      const tags = items(container).map((li) => li.querySelector('.flg-step-inner')!.tagName);
      expect(tags).toEqual(['BUTTON', 'BUTTON', 'SPAN', 'SPAN']);
      const button = screen.getAllByRole('button')[0]!;
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('flg-step-inner');
    });

    it('makes every step a button when not linear', () => {
      render(<Checkout value={1} linear={false} onValueChange={() => {}} />);
      expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('makes a step ahead a button when its status says it is complete', () => {
      render(
        <Stepper value={0} onValueChange={() => {}}>
          <Step title="A" />
          <Step title="B" status="complete" />
          <Step title="C" status="error" />
        </Stepper>,
      );
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('calls onValueChange with the index of another step, and does nothing for the current one', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Checkout value={2} onValueChange={onValueChange} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      await user.click(buttons[0]!);
      expect(onValueChange).toHaveBeenLastCalledWith(0);
      await user.click(buttons[1]!);
      expect(onValueChange).toHaveBeenLastCalledWith(1);
      onValueChange.mockClear();
      // The current step is a button too, and pressing it calls nothing.
      await user.click(buttons[2]!);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('reaches each button with Tab, and Enter and Space press it', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Checkout value={2} onValueChange={onValueChange} />);
      const [first, second] = screen.getAllByRole('button');
      await user.tab();
      expect(first).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(onValueChange).toHaveBeenLastCalledWith(0);
      await user.tab();
      expect(second).toHaveFocus();
      await user.keyboard(' ');
      expect(onValueChange).toHaveBeenLastCalledWith(1);
    });
  });

  describe('aria-current', () => {
    it('is on the button of the current step when it is a button', () => {
      const { container } = render(<Checkout value={1} onValueChange={() => {}} />);
      const current = container.querySelectorAll('[aria-current]');
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAttribute('aria-current', 'step');
      expect(current[0]!.tagName).toBe('BUTTON');
      expect(current[0]).toHaveTextContent('Delivery');
    });

    it('is on the <li> of the current step when nothing is pressable', () => {
      const { container } = render(<Checkout value={1} />);
      const current = container.querySelectorAll('[aria-current]');
      expect(current).toHaveLength(1);
      expect(current[0]!.tagName).toBe('LI');
      expect(current[0]).toHaveAttribute('aria-current', 'step');
      expect(current[0]).toHaveTextContent('Delivery');
    });

    it('stays on the current step when its status is an error', () => {
      const { container } = render(
        <Stepper value={1}>
          <Step title="A" />
          <Step title="B" status="error" />
        </Stepper>,
      );
      expect(container.querySelector('[aria-current]')).toHaveTextContent('B');
    });

    it('moves with value, and the button stays a button after going back', () => {
      const { container, rerender } = render(<Checkout value={2} onValueChange={() => {}} />);
      expect(container.querySelector('[aria-current]')).toHaveTextContent('Payment');
      rerender(<Checkout value={0} onValueChange={() => {}} />);
      const current = container.querySelector('[aria-current]')!;
      expect(current).toHaveTextContent('Cart');
      expect(current.tagName).toBe('BUTTON');
    });
  });

  describe('value', () => {
    it('rounds it down, clamps it, and takes NaN as 0, with one warning', () => {
      const warn = spyWarn();
      const current = (value: number) => {
        const { container, unmount } = render(<Checkout value={value} />);
        const states = items(container).map((li) => li.getAttribute('data-state'));
        unmount();
        return states.indexOf('current');
      };
      expect(current(1.6)).toBe(1);
      // Never a step done before it is: 2.6 of 4 is still the third step.
      expect(current(2.6)).toBe(2);
      expect(current(-3)).toBe(0);
      expect(current(NaN)).toBe(0);
      // Past the end: every step is done and none is current.
      expect(current(9)).toBe(-1);
      expect(current(Infinity)).toBe(-1);
      expect(current(-Infinity)).toBe(0);
      // The text does not carry the value, so six different values warn once.
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        '[h2d-glass-ui] <Stepper> value must be a whole number from 0 to the number of steps; it was rounded into that range.',
      );
    });

    it('does not warn for any whole number from 0 to the number of steps', () => {
      const warn = spyWarn();
      for (let value = 0; value <= 4; value += 1) {
        const { unmount } = render(<Checkout value={value} />);
        unmount();
      }
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('warnings', () => {
    it('warns about a child that is not a Step and leaves it out', () => {
      const warn = spyWarn();
      const { container } = render(
        <Stepper value={0}>
          <Step title="A" />
          <div>stray</div>
        </Stepper>,
      );
      expect(items(container)).toHaveLength(1);
      expect(container).not.toHaveTextContent('stray');
      expect(warn).toHaveBeenCalledWith(
        '[h2d-glass-ui] <Stepper> has a child that is not a <Step>; it is left out.',
      );
    });

    it('does not warn about whitespace, null or false between the Steps', () => {
      const warn = spyWarn();
      render(
        <Stepper value={0}>
          {' '}
          <Step title="A" /> {null}
          {false}
        </Stepper>,
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns that a Stepper with no steps cannot read any, and renders an empty list', () => {
      const warn = spyWarn();
      // A value above 0, as an interactive Stepper on its second step has: with nothing to count it
      // must not also be blamed for its value.
      const { container } = render(<Stepper value={2}>{[]}</Stepper>);
      expect(container.querySelector('ol')).toBeEmptyDOMElement();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        '[h2d-glass-ui] <Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component).',
      );
    });

    it('does not read a Step that a component of its own wraps, and says so', () => {
      const warn = spyWarn();
      function Steps() {
        return <Step title="A" />;
      }
      render(
        <Stepper value={2}>
          <Steps />
        </Stepper>,
      );
      // Exactly the two warnings that name the cause, and none about the value.
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('has a child that is not a <Step>'),
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no steps'));
    });

    it('warns that linear={false} does nothing without onValueChange', () => {
      const warn = spyWarn();
      render(<Checkout linear={false} onValueChange={() => {}} />);
      render(<Checkout />);
      expect(warn).not.toHaveBeenCalled();
      render(<Checkout linear={false} />);
      expect(warn).toHaveBeenCalledWith(
        '[h2d-glass-ui] <Stepper> linear={false} has no effect without onValueChange.',
      );
    });

    it('says what to do when a Step is rendered outside a Stepper', () => {
      const warn = spyWarn();
      const { container } = render(<Step title="Lonely" />);
      expect(container).toBeEmptyDOMElement();
      expect(warn).toHaveBeenCalledWith(
        '[h2d-glass-ui] <Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them.',
      );
    });
  });

  it('reads the Steps of a Stepper written in the component that renders it', () => {
    function Wizard() {
      return (
        <Stepper value={0} onValueChange={() => {}}>
          <Step title="One" />
          <Step title="Two" />
        </Stepper>
      );
    }
    const { container } = render(<Wizard />);
    expect(
      within(container.firstElementChild as HTMLElement).getAllByRole('listitem'),
    ).toHaveLength(2);
  });
});
