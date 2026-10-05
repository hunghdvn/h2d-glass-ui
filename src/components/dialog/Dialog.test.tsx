import { act, render } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { getTopModal } from '../../internal/modal-stack';
import { Dialog, DialogContent, DialogTitle } from './Dialog';

// jsdom has no showModal(). This stand-in is just enough for the state logic: it toggles `open` and,
// like a browser, fires `close` in a later task rather than at once.
const original = {
  showModal: HTMLDialogElement.prototype.showModal,
  close: HTMLDialogElement.prototype.close,
};
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    setTimeout(() => this.dispatchEvent(new Event('close')), 0);
  };
});
afterAll(() => Object.assign(HTMLDialogElement.prototype, original));

describe('Dialog', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('stays open when StrictMode mounts it twice', async () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <StrictMode>
        <Dialog defaultOpen onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
      </StrictMode>,
    );
    // The late `close` event of StrictMode's first, simulated unmount must not close it again.
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(container.querySelector('dialog')).toHaveAttribute('open');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('warns when it has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Dialog defaultOpen>
        <DialogContent>Unnamed</DialogContent>
      </Dialog>,
    );
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] <DialogContent> needs a name: render a DialogTitle inside it, or pass ' +
        'aria-label or aria-labelledby.',
    );
  });

  it('does not warn when a title or aria-label names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByRole } = render(
      <>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
        <Dialog defaultOpen>
          <DialogContent aria-label="Share">Link</DialogContent>
        </Dialog>
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
    expect(getByRole('dialog', { name: 'Edit profile' })).toBeInTheDocument();
  });

  it('closes for good when it closes natively and React renders before the close event', async () => {
    let renderAgain: () => void = () => {};
    function Page() {
      const [count, setCount] = useState(0);
      renderAgain = () => setCount((n) => n + 1);
      return (
        <Dialog defaultOpen>
          <DialogContent data-count={count}>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
      );
    }
    const { container } = render(<Page />);
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    // A `<form method="dialog">` closed it, and a re-render lands before its `close` event.
    act(() => {
      dialog.close();
      renderAgain();
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(dialog).not.toHaveAttribute('open');
    expect(document.documentElement.style.overflow).toBe('');
    expect(getTopModal()).toBeUndefined();
  });

  it('opens again, once, when a controlled parent refuses a native close', async () => {
    const onOpenChange = vi.fn();
    let renderAgain: () => void = () => {};
    function Page() {
      const [count, setCount] = useState(0);
      renderAgain = () => setCount((n) => n + 1);
      return (
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent data-count={count}>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
      );
    }
    const { container, unmount } = render(<Page />);
    const dialog = container.querySelector('dialog') as HTMLDialogElement;
    act(() => {
      dialog.close();
      renderAgain();
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(dialog).toHaveAttribute('open');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    unmount();
    expect(document.documentElement.style.overflow).toBe('');
    expect(getTopModal()).toBeUndefined();
  });
});
