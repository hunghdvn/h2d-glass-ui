import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

const notFocusable =
  '[fl-glass-ui] <TooltipTrigger> needs a child that keyboard users can focus, such as a button or a link.';

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

  it('does not inspect the child in production', () => {
    process.env.NODE_ENV = 'production';
    const matches = vi.spyOn(Element.prototype, 'matches');
    const tabIndex = vi.spyOn(HTMLElement.prototype, 'tabIndex', 'get');
    renderWith(<span>Plain text</span>);
    expect(matches).not.toHaveBeenCalled();
    expect(tabIndex).not.toHaveBeenCalled();
  });
});
