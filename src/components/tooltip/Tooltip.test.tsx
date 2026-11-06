import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ButtonHTMLAttributes, ReactElement } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

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
