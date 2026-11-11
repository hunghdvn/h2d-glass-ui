import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ButtonHTMLAttributes, ReactElement } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { Tooltip, TooltipContent, TooltipRoot, TooltipTrigger } from './Tooltip';

// jsdom has no Popover API. This stand-in is enough for a tooltip to open.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

const notFocusable =
  WARN_PREFIX +
  ' <TooltipTrigger> needs a child that keyboard users can focus, such as a button or a link.';
const unreachable =
  WARN_PREFIX +
  ' <TooltipTrigger> could not reach its child element: the child must forward its ref to a DOM element.';

// Spreads its props but drops the ref, as a component written without forwardRef on React 18 does.
function DropsItsRef(props: ButtonHTMLAttributes<HTMLButtonElement> & { ref?: unknown }) {
  const { ref, ...rest } = props;
  void ref;
  return <button type="button" {...rest} />;
}

function renderWith(child: ReactElement, wrap: (tooltip: ReactElement) => ReactElement = (t) => t) {
  return render(
    wrap(
      <Tooltip>
        <TooltipTrigger>{child}</TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>,
    ),
  );
}

describe('TooltipTrigger', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('does not warn about a child that keyboard users can focus, even while it is hidden or inert', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWith(<button type="button">Visible</button>);
    renderWith(<button type="button">Hidden</button>, (t) => <div hidden>{t}</div>);
    // Set as an attribute: React 18 does not know the `inert` prop.
    const inert = (el: HTMLDivElement | null) => el?.setAttribute('inert', '');
    renderWith(<button type="button">Inert</button>, (t) => <div ref={inert}>{t}</div>);
    renderWith(
      <div role="button" tabIndex={0}>
        Custom
      </div>,
    );
    expect(warn).not.toHaveBeenCalledWith(notFocusable);
  });

  it('does not warn about a button that a disabled fieldset disables for now', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWith(<button type="button">Save</button>, (t) => <fieldset disabled>{t}</fieldset>);
    expect(warn).not.toHaveBeenCalledWith(notFocusable);
  });

  it('warns about a button with the disabled attribute, which gets no events', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWith(
      <button type="button" disabled>
        Save
      </button>,
    );
    expect(warn).toHaveBeenCalledWith(notFocusable);
  });

  it('warns about a child that keyboard users cannot focus', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWith(<span>Plain text</span>);
    expect(warn).toHaveBeenCalledWith(notFocusable);
  });

  it('warns about a control taken out of the tab order', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWith(
      <button type="button" tabIndex={-1}>
        Skipped
      </button>,
    );
    expect(warn).toHaveBeenCalledWith(notFocusable);
  });

  it('warns when it opens and its child did not pass the ref on to a DOM element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // React 18 also logs that a function component cannot be given a ref.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger>
          <DropsItsRef>Save</DropsItsRef>
        </TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>,
    );
    expect(warn).toHaveBeenCalledWith(unreachable);
  });

  it('does not warn when it opens and its child forwards the ref', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger>
          <button type="button">Save</button>
        </TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>,
    );
    expect(warn).not.toHaveBeenCalledWith(unreachable);
  });

  it('does not inspect the child in production', () => {
    process.env.NODE_ENV = 'production';
    const matches = vi.spyOn(Element.prototype, 'matches');
    const tabIndex = vi.spyOn(HTMLElement.prototype, 'tabIndex', 'get');
    renderWith(<span>Plain text</span>);
    expect(matches).not.toHaveBeenCalled();
    expect(tabIndex).not.toHaveBeenCalled();
  });
});

// Esc pressed while the pointer is on the trigger keeps hover from opening it until the pointer
// leaves, as a press does (WCAG 1.4.13). Browsers report a pointer that rests on the trigger as
// entering it again, without a move, when the page changes under it.
describe('Tooltip after Esc', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const at = (x: number, y: number, pointerType = 'mouse') => ({
    pointerType,
    clientX: x,
    clientY: y,
  });
  const settle = (ms = 600) => act(() => vi.advanceTimersByTime(ms));

  function renderTooltip() {
    const onOpenChange = vi.fn();
    render(
      <Tooltip onOpenChange={onOpenChange}>
        <TooltipTrigger>
          <button type="button">Save</button>
        </TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Save' });
    // jsdom lays nothing out: the trigger spans (0,0) to (100,40).
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON: () => ({}),
    });
    return { trigger, onOpenChange };
  }

  function openFromTheKeyboard(trigger: HTMLElement) {
    fireEvent.keyDown(document, { key: 'Tab' });
    vi.spyOn(trigger, 'matches').mockImplementation((selector) => selector === ':focus-visible');
    fireEvent.focus(trigger);
    settle(10);
  }

  function hoverThenEsc() {
    const rendered = renderTooltip();
    fireEvent.pointerEnter(rendered.trigger, at(10, 10));
    settle();
    expect(rendered.onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(rendered.onOpenChange).toHaveBeenLastCalledWith(false);
    rendered.onOpenChange.mockClear();
    return rendered;
  }

  it('does not open again when the pointer on the trigger is reported entering it again', () => {
    const { trigger, onOpenChange } = hoverThenEsc();
    fireEvent.pointerEnter(trigger, at(10, 10));
    settle(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not open again while the pointer moves within the trigger, as after a press', () => {
    const { trigger, onOpenChange } = hoverThenEsc();
    fireEvent.pointerMove(trigger, at(11, 10));
    fireEvent.pointerEnter(trigger, at(11, 10));
    settle(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('opens again on hover once the pointer has left the trigger', () => {
    const { trigger, onOpenChange } = hoverThenEsc();
    fireEvent.pointerLeave(trigger, at(150, 10));
    fireEvent.pointerEnter(trigger, at(10, 10));
    settle();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('opens on a hover that jumps onto the trigger, when Esc closed it with the pointer elsewhere', () => {
    // Opened from the keyboard while the pointer rests away from the trigger (the Default story).
    const { trigger, onOpenChange } = renderTooltip();
    fireEvent.pointerMove(document.body, at(300, 300));
    openFromTheKeyboard(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    fireEvent.pointerEnter(trigger, at(10, 10));
    settle();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('opens when the page later moves the trigger under a pointer that rested elsewhere at Esc', () => {
    const { trigger, onOpenChange } = renderTooltip();
    fireEvent.pointerMove(document.body, at(300, 300));
    openFromTheKeyboard(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    fireEvent.pointerEnter(trigger, at(300, 300));
    settle();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('does not let a touch elsewhere replace where the mouse is', () => {
    const { trigger, onOpenChange } = renderTooltip();
    fireEvent.pointerEnter(trigger, at(10, 10));
    settle();
    fireEvent.pointerMove(document.body, at(300, 300, 'touch'));
    fireEvent.keyDown(document, { key: 'Escape' });
    onOpenChange.mockClear();
    fireEvent.pointerEnter(trigger, at(10, 10));
    settle(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('still opens on keyboard focus', () => {
    const { trigger, onOpenChange } = hoverThenEsc();
    openFromTheKeyboard(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });
});

describe('the description of the trigger', () => {
  const described = (describe: boolean | undefined) => {
    render(
      <TooltipRoot {...(describe === undefined ? {} : { describe })}>
        <TooltipTrigger>
          <button type="button" aria-describedby="mine">
            Save
          </button>
        </TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </TooltipRoot>,
    );
    return screen.getByRole('button', { name: 'Save' });
  };

  it('is wired by default, after the description the trigger already has', () => {
    const content = () => document.querySelector('[role="tooltip"]')!;
    const button = described(undefined);
    expect(button.getAttribute('aria-describedby')).toBe(`mine ${content().id}`);
  });

  it('is left out with describe={false}, and the trigger keeps its own', () => {
    expect(described(false)).toHaveAttribute('aria-describedby', 'mine');
  });

  it('is not an option of the public Tooltip: it is wired whatever a caller passes', () => {
    render(
      // @ts-expect-error describe is for the library's own parts
      <Tooltip describe={false}>
        <TooltipTrigger>
          <button type="button">Save</button>
        </TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-describedby');
  });
});

// The internal option of a part that shows its tooltip only in some states and keeps its trigger
// mounted in the others, such as an item of the navigation rail.
describe('a tooltip that is turned off (enabled={false})', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const settle = (ms = 600) => act(() => vi.advanceTimersByTime(ms));

  interface PairProps {
    enabled: boolean;
    onOpenChange: (open: boolean) => void;
    onOtherOpenChange?: (open: boolean) => void;
  }
  /** Another tooltip, open from the start, and the one that is turned on or off. */
  function Pair({ enabled, onOpenChange, onOtherOpenChange }: PairProps) {
    return (
      <>
        <Tooltip defaultOpen onOpenChange={onOtherOpenChange}>
          <TooltipTrigger>
            <button type="button">Other</button>
          </TooltipTrigger>
          <TooltipContent>Open already</TooltipContent>
        </Tooltip>
        <TooltipRoot enabled={enabled} onOpenChange={onOpenChange}>
          <TooltipTrigger>
            <button type="button">Save</button>
          </TooltipTrigger>
          <TooltipContent>Hint</TooltipContent>
        </TooltipRoot>
      </>
    );
  }
  const save = () => screen.getByRole('button', { name: 'Save' });

  it('does not open on hover or keyboard focus, and closes no other tooltip', () => {
    const onOpenChange = vi.fn();
    const onOtherOpenChange = vi.fn();
    render(
      <Pair enabled={false} onOpenChange={onOpenChange} onOtherOpenChange={onOtherOpenChange} />,
    );
    const trigger = save();
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    settle();
    fireEvent.keyDown(document, { key: 'Tab' });
    vi.spyOn(trigger, 'matches').mockImplementation((selector) => selector === ':focus-visible');
    fireEvent.focus(trigger);
    settle(10);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onOtherOpenChange).not.toHaveBeenCalled();
  });

  it('closes when it is turned off, and does not open by itself when it is turned on again', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Pair enabled onOpenChange={onOpenChange} />);
    fireEvent.pointerEnter(save(), { pointerType: 'mouse' });
    settle();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    rerender(<Pair enabled={false} onOpenChange={onOpenChange} />);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    onOpenChange.mockClear();
    rerender(<Pair enabled onOpenChange={onOpenChange} />);
    settle(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('stops a hover timer that runs when it is turned off', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Pair enabled onOpenChange={onOpenChange} />);
    // The timer starts, at no delay with another tooltip open, and is not run before the render.
    fireEvent.pointerEnter(save(), { pointerType: 'mouse' });
    rerender(<Pair enabled={false} onOpenChange={onOpenChange} />);
    settle(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
