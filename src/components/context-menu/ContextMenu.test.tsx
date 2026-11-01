import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './ContextMenu';

// jsdom has no Popover API. This stand-in is enough for the menu to open and close.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

describe('ContextMenu', () => {
  beforeEach(() => resetDevWarnings());
  // A spy that a failed assertion left behind would swallow the warnings of the tests after it.
  afterEach(() => vi.restoreAllMocks());

  // A characterization test: `openAt` reads whether the menu is open from a ref that is written
  // after each commit, and it behaved the same when the ref was written during render.
  it('closes, and opens afresh a task later, when asked again at a new place while open', async () => {
    const onOpenChange = vi.fn();
    render(
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger>Area</ContextMenuTrigger>
        <ContextMenuContent aria-label="Actions" />
      </ContextMenu>,
    );
    const area = screen.getByText('Area');
    fireEvent.contextMenu(area, { clientX: 10, clientY: 20 });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    onOpenChange.mockClear();
    fireEvent.contextMenu(area, { clientX: 40, clientY: 50 });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    onOpenChange.mockClear();
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('warns once when its content has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ContextMenu>
        <ContextMenuTrigger>Area</ContextMenuTrigger>
        <ContextMenuContent />
      </ContextMenu>,
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/ContextMenuContent.*aria-label or aria-labelledby/);
    warn.mockRestore();
  });

  it('does not warn when its content is named', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ContextMenu>
        <ContextMenuTrigger>Area</ContextMenuTrigger>
        <ContextMenuContent aria-labelledby="heading" />
      </ContextMenu>,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
