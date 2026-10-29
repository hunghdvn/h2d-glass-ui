import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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
});
