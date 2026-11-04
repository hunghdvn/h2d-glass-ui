import { render } from '@testing-library/react';
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
