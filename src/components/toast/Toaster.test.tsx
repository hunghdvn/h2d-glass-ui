import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerModal } from '../../internal/modal-stack';
import { Dialog, DialogContent, DialogTitle } from '../dialog/Dialog';
import { resetDevWarnings } from '../../internal/warn';
import { toast } from './toast';
import { Toaster } from './Toaster';
import type { ToasterProps } from './Toaster';

// jsdom has no showModal(). This stand-in toggles `open` and fires `close` in a later task, like a
// browser, which is enough for the library's own Dialog.
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

/** Renders a Toaster and lets the task pass after which it shows the toasts. */
function mount(props: ToasterProps = {}) {
  const result = render(<Toaster {...props} />);
  act(() => {
    vi.advanceTimersByTime(0);
  });
  return result;
}
const show = (fn: () => unknown) =>
  act(() => {
    fn();
  });
// jsdom hides a [popover] that it cannot show, so every role query takes hidden elements.
const region = () => screen.getByRole('region', { hidden: true });
const items = () => within(region()).queryAllByRole('listitem', { hidden: true });

// jsdom matches `:focus-visible` for no element, so a test says whether the focus it gives is
// keyboard focus; by default it is, as focus from a script is.
let keyboard = true;
let supported = true;

describe('Toaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDevWarnings();
    keyboard = true;
    supported = true;
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      if (selector !== ':focus-visible') return matches.call(this, selector);
      if (!supported) throw new SyntaxError('unsupported');
      return keyboard;
    });
    // jsdom has no window focus; a blur with no `relatedTarget` is a move within the page here.
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });
  afterEach(() => {
    act(() => toast.dismiss());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing on the server', () => {
    expect(renderToString(<Toaster />)).toBe('');
  });

  it('names its region with the hotkey, with both live regions there before any toast', () => {
    mount();
    const section = region();
    // jsdom names no hidden element, so the label is read off the attribute.
    expect(section).toHaveAttribute('aria-label', 'Notifications (F8)');
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveAttribute('tabindex', '-1');
    expect(section).toHaveAttribute('popover', 'manual');
    expect(section).toHaveAttribute('data-position', 'bottom-center');
    expect(section.querySelector('ol')).toHaveAttribute('aria-live', 'polite');
    const assertive = section.querySelector('[aria-live="assertive"]');
    expect(assertive).not.toHaveAttribute('aria-atomic');
    expect(assertive).toHaveClass('flg-visually-hidden');
    expect(items()).toHaveLength(0);
  });

  it('shows the toasts given before it mounted a task after its empty region is in the page', () => {
    toast('Queued');
    render(<Toaster />);
    expect(items()).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('Queued');
  });

  it('shows a named status icon, the title and description, an action and a close button', () => {
    const onClick = vi.fn();
    mount();
    show(() =>
      toast.success({
        title: 'Saved',
        description: 'All changes are stored.',
        action: { label: 'Undo', onClick },
      }),
    );
    const [item] = items();
    if (!item) throw new Error('no toast');
    expect(item).toHaveClass('flg-surface', 'flg-toast');
    expect(item).toHaveAttribute('data-status', 'success');
    expect(within(item).getByRole('img', { hidden: true, name: 'Success' })).toBeInTheDocument();
    expect(within(item).getByText('Saved')).toHaveClass('flg-toast-title');
    expect(within(item).getByText('All changes are stored.')).toHaveClass('flg-toast-description');
    // The action runs, then the toast closes.
    fireEvent.click(within(item).getByRole('button', { hidden: true, name: 'Undo' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(items()).toHaveLength(0);
    show(() => toast('Plain'));
    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Dismiss notification' }));
    expect(items()).toHaveLength(0);
  });

  it('closes a toast after its time, and takes `duration` and `max`', () => {
    mount({ duration: 1000, max: 2 });
    show(() => {
      toast('a');
      toast('b');
      toast('c');
    });
    expect(items().map((item) => item.textContent)).toEqual(['a', 'b']);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(items().map((item) => item.textContent)).toEqual(['c']);
  });

  it('reads an error from the assertive region, and drops the copy when it closes', () => {
    mount();
    show(() => toast.error({ title: 'Not sent', description: 'Check the connection.' }));
    const [item] = items();
    expect(item).toHaveAttribute('aria-live', 'off');
    const assertive = region().querySelector('[aria-live="assertive"]');
    expect(assertive).toHaveTextContent('Error: Not sent');
    expect(assertive).toHaveTextContent('Check the connection.');
    // One wrapper per error, read whole when it is updated; a new error announces only itself.
    const copies = assertive?.children ?? [];
    expect(copies).toHaveLength(1);
    expect(copies[0]).toHaveAttribute('aria-atomic', 'true');
    expect(copies[0]).toHaveTextContent('Error: Not sentCheck the connection.');
    show(() => toast.dismiss());
    expect(assertive).toBeEmptyDOMElement();
    // Other toasts are read from the polite list.
    show(() => toast.warning('Low space'));
    expect(items()[0]).not.toHaveAttribute('aria-live');
    expect(assertive).toBeEmptyDOMElement();
  });

  it('stops the time under the pointer, in focus and on a hidden page', () => {
    mount({ duration: 1000 });
    show(() => toast('Saved'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerEnter(region());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.pointerLeave(region());
    const close = screen.getByRole('button', { hidden: true, name: 'Dismiss notification' });
    act(() => close.focus());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => close.blur());
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(items()).toHaveLength(1);
    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(items()).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(items()).toHaveLength(0);
  });

  it('moves focus to the region with its hotkey, only while a toast shows', () => {
    mount({ hotkey: 'F6' });
    fireEvent.keyDown(document.body, { key: 'F6' });
    expect(region()).not.toHaveFocus();
    show(() => toast('Saved'));
    fireEvent.keyDown(document.body, { key: 'F6', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'F8' });
    expect(region()).not.toHaveFocus();
    expect(fireEvent.keyDown(document.body, { key: 'F6' })).toBe(false);
    expect(region()).toHaveFocus();
  });

  it('closes the toast that holds focus on Esc, and hands focus on: next, before, then back', () => {
    render(<button type="button">Save</button>);
    mount();
    show(() => {
      toast('a');
      toast('b');
      toast('c');
    });
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => save.focus());
    fireEvent.keyDown(save, { key: 'F8' });
    expect(region()).toHaveFocus();
    const b = items()[1];
    if (!b) throw new Error('no toast b');
    act(() =>
      within(b).getByRole('button', { hidden: true, name: 'Dismiss notification' }).focus(),
    );
    // Prevented, so a Dialog around the region stays open.
    expect(fireEvent.keyDown(document.activeElement ?? b, { key: 'Escape' })).toBe(false);
    expect(items().map((item) => item.textContent)).toEqual(['a', 'c']);
    // The toast that took its place.
    expect(items()[1]).toHaveFocus();
    fireEvent.keyDown(items()[1] ?? b, { key: 'Escape' });
    // None after it: the one before.
    expect(items()[0]).toHaveFocus();
    fireEvent.keyDown(items()[0] ?? b, { key: 'Escape' });
    // None left: back to where focus was before it came into the region.
    expect(items()).toHaveLength(0);
    expect(save).toHaveFocus();
  });

  it('leaves focus where the user moved it, and on the body when its old place is gone', () => {
    const { rerender } = render(<button type="button">Save</button>);
    mount();
    show(() => toast('a'));
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => save.focus());
    fireEvent.keyDown(save, { key: 'F8' });
    act(() => items()[0]?.focus());
    rerender(<span />);
    fireEvent.keyDown(items()[0] ?? region(), { key: 'Escape' });
    expect(document.body).toHaveFocus();
    // Focus that the user moved out stays there when a toast closes.
    show(() => toast('b'));
    act(() => items()[0]?.focus());
    const other = document.createElement('button');
    document.body.append(other);
    act(() => other.focus());
    show(() => toast.dismiss());
    expect(other).toHaveFocus();
    other.remove();
  });

  it('leaves an Esc outside a toast, or one that something else took', () => {
    mount();
    show(() => toast('a'));
    // Esc on the region itself, after F8, hands focus back and is prevented, so a Dialog around the
    // region stays open.
    const before = document.createElement('button');
    document.body.append(before);
    act(() => before.focus());
    fireEvent.keyDown(before, { key: 'F8' });
    expect(region()).toHaveFocus();
    expect(fireEvent.keyDown(region(), { key: 'Escape' })).toBe(false);
    expect(before).toHaveFocus();
    expect(items()).toHaveLength(1);
    before.remove();
    // An open Tooltip takes Esc in the capture phase.
    const take = (event: Event) => event.preventDefault();
    document.addEventListener('keydown', take, true);
    act(() => region().focus());
    fireEvent.keyDown(region(), { key: 'Escape' });
    expect(region()).toHaveFocus();
    act(() => items()[0]?.focus());
    fireEvent.keyDown(items()[0] ?? region(), { key: 'Escape' });
    document.removeEventListener('keydown', take, true);
    expect(items()).toHaveLength(1);
  });

  it('runs the time again once focus has left with the toast that held it', () => {
    render(<button type="button">Save</button>);
    mount({ duration: 1000 });
    show(() => toast('a'));
    act(() => items()[0]?.focus());
    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Dismiss notification' }));
    show(() => toast('b'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(items()).toHaveLength(0);
  });

  it('moves the region into the host of the modal on top, and back to the page', () => {
    mount();
    show(() => toast({ title: 'Saved', duration: Infinity }));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const dialog = document.createElement('dialog');
    const host = document.createElement('div');
    dialog.append(host);
    document.body.append(dialog);
    let unregister = () => {};
    act(() => {
      unregister = registerModal({ dialog, host });
    });
    // Inside the modal's top layer, a plain element; the toast that shows comes with it.
    expect(host).toContainElement(region());
    expect(region()).not.toHaveAttribute('popover');
    expect(items()[0]).toHaveTextContent('Saved');
    act(() => unregister());
    expect(host).toBeEmptyDOMElement();
    expect(region()).toHaveAttribute('popover', 'manual');
    expect(items()[0]).toHaveTextContent('Saved');
    dialog.remove();
  });

  describe('when the region moves', () => {
    function modal() {
      const dialog = document.createElement('dialog');
      const host = document.createElement('div');
      dialog.append(host);
      document.body.append(dialog);
      return { dialog, host };
    }
    const hostItems = (host: HTMLElement) =>
      within(host).queryAllByRole('listitem', { hidden: true });

    it('lets a toast shown as the region moves in a task after it', () => {
      mount();
      const { dialog, host } = modal();
      let unregister = () => {};
      act(() => {
        unregister = registerModal({ dialog, host });
      });
      act(() => {
        toast('Saved');
        unregister();
      });
      expect(items()).toHaveLength(0);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(items()).toHaveLength(1);
      expect(items()[0]).toHaveTextContent('Saved');
      act(() => {
        vi.advanceTimersByTime(0);
      });
      // The mirror case: a toast shown as a modal opens.
      act(() => {
        toast('Opened');
        unregister = registerModal({ dialog, host });
      });
      expect(hostItems(host)).toHaveLength(1);
      expect(hostItems(host)[0]).toHaveTextContent('Saved');
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(hostItems(host)).toHaveLength(2);
      act(() => unregister());
      dialog.remove();
    });

    it('holds the assertive copy of an error shown as the region moves', () => {
      mount();
      const { dialog, host } = modal();
      let unregister = () => {};
      act(() => {
        unregister = registerModal({ dialog, host });
      });
      act(() => {
        toast.error('Not sent');
        unregister();
      });
      const assertive = () => region().querySelector('[aria-live="assertive"]');
      expect(assertive()).toBeEmptyDOMElement();
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(assertive()).toHaveTextContent('Error: Not sent');
      dialog.remove();
    });

    it('moves a toast that was already shown at once, without a slide-in', () => {
      mount();
      const { dialog, host } = modal();
      show(() => toast({ title: 'Saved', duration: Infinity }));
      act(() => {
        vi.advanceTimersByTime(0);
      });
      let unregister = () => {};
      act(() => {
        unregister = registerModal({ dialog, host });
      });
      act(() => unregister());
      // No timer has passed: the toast that showed is in the new region, marked as moved.
      expect(items()).toHaveLength(1);
      expect(items()[0]).toHaveTextContent('Saved');
      expect(items()[0]).toHaveAttribute('data-moved');
      show(() => toast({ title: 'Later', duration: Infinity }));
      expect(items()).toHaveLength(1);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(items()).toHaveLength(2);
      expect(items()[1]).not.toHaveAttribute('data-moved');
      dialog.remove();
    });

    // The library's own Dialog leaves and enters the modal stack in a layout effect, after the
    // commit that changes `open`, so a toast shown in that handler is already in the old region.
    function Host({ startOpen, label }: { startOpen: boolean; label: string }) {
      const [open, setOpen] = useState(startOpen);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              toast(label);
              setOpen(!startOpen);
            }}
          >
            Go
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Title</DialogTitle>
              <button
                type="button"
                onClick={() => {
                  toast(label);
                  setOpen(false);
                }}
              >
                Go inside
              </button>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    const labelled = () => screen.getAllByRole('button', { hidden: true, name: 'Go inside' })[0];

    it('holds a toast shown as the library Dialog closes, for a task', () => {
      mount();
      render(<Host startOpen label="Saved" />);
      expect(region().closest('dialog')).not.toBeNull();
      // Let the region settle in the dialog, as it has by the time a user clicks.
      act(() => {
        vi.advanceTimersByTime(0);
      });
      fireEvent.click(labelled() as HTMLElement);
      expect(region().closest('dialog')).toBeNull();
      expect(items()).toHaveLength(0);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(items()).toHaveLength(1);
      expect(items()[0]).toHaveTextContent('Saved');
      expect(items()[0]).not.toHaveAttribute('data-moved');
    });

    it('holds a toast shown as the library Dialog opens, for a task', () => {
      mount();
      render(<Host startOpen={false} label="Opened" />);
      fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Go' }));
      expect(region().closest('dialog')).not.toBeNull();
      expect(items()).toHaveLength(0);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(items()).toHaveLength(1);
      expect(items()[0]).not.toHaveAttribute('data-moved');
    });

    it('moves at once a toast that sat a task in the region before the Dialog closed', () => {
      mount();
      render(<Host startOpen label="Saved" />);
      show(() => toast({ title: 'Old', duration: Infinity }));
      act(() => {
        vi.advanceTimersByTime(0);
      });
      // The region moved in with the Dialog just now: one task puts the toast in, one more settles it.
      act(() => {
        vi.advanceTimersByTime(0);
      });
      fireEvent.click(labelled() as HTMLElement);
      expect(items().map((item) => item.textContent)).toEqual(['Old']);
      expect(items()[0]).toHaveAttribute('data-moved');
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(items()).toHaveLength(2);
    });

    it('lets go of the focus pause too, so a toast closes after its time', () => {
      mount({ duration: 1000 });
      const { dialog, host } = modal();
      show(() => toast('Saved'));
      act(() => screen.getByRole('button', { hidden: true, name: 'Dismiss notification' }).focus());
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(items()).toHaveLength(1);
      let unregister = () => {};
      act(() => {
        unregister = registerModal({ dialog, host });
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(hostItems(host)).toHaveLength(0);
      act(() => unregister());
      dialog.remove();
    });

    it('lets go of the hover pause, so a toast closes after its time', () => {
      mount({ duration: 1000 });
      const { dialog, host } = modal();
      show(() => toast('Saved'));
      fireEvent.pointerEnter(region());
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(items()).toHaveLength(1);
      let unregister = () => {};
      act(() => {
        unregister = registerModal({ dialog, host });
      });
      expect(hostItems(host)).toHaveLength(1);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(hostItems(host)).toHaveLength(0);
      act(() => unregister());
      dialog.remove();
    });
  });

  it('gives focus back when the last toast closes while the region itself holds it', () => {
    render(<button type="button">Save</button>);
    mount();
    show(() => toast('a'));
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => save.focus());
    fireEvent.keyDown(save, { key: 'F8' });
    expect(region()).toHaveFocus();
    show(() => toast.dismiss());
    expect(save).toHaveFocus();
  });

  it('falls back to the body when the region has nowhere to hand focus back to', () => {
    mount();
    show(() => toast('a'));
    fireEvent.keyDown(document.body, { key: 'F8' });
    expect(region()).toHaveFocus();
    fireEvent.keyDown(region(), { key: 'Escape' });
    expect(document.body).toHaveFocus();
    fireEvent.keyDown(document.body, { key: 'F8' });
    expect(region()).toHaveFocus();
    show(() => toast.dismiss());
    expect(document.body).toHaveFocus();
  });

  it('keeps where focus came from when the window loses focus and gets it back', () => {
    render(<button type="button">Save</button>);
    mount();
    show(() => toast('a'));
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => save.focus());
    fireEvent.keyDown(save, { key: 'F8' });
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    // A blur with no relatedTarget, then the focus coming back with none either.
    fireEvent.blur(region(), { relatedTarget: null });
    hasFocus.mockReturnValue(true);
    fireEvent.focus(region(), { relatedTarget: null });
    show(() => toast.dismiss());
    expect(save).toHaveFocus();
  });

  it('copies an error with a block-level title without a nesting error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    show(() => toast.error({ title: <div>Not sent</div>, description: <div>Try again</div> }));
    expect(error).not.toHaveBeenCalled();
  });

  it('keeps the same item when `duration` or `max` changes', () => {
    const { rerender } = render(<Toaster duration={5000} />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    show(() => toast('Saved'));
    const item = items()[0];
    rerender(<Toaster duration={8000} max={5} />);
    expect(items()[0]).toBe(item);
  });

  it('takes its labels, position and class', () => {
    mount({
      position: 'top-right',
      hotkey: 'F6',
      className: 'mine',
      labels: { region: 'Thông báo', dismiss: 'Đóng', success: 'Thành công' },
    });
    show(() => toast.success('Đã lưu'));
    const section = region();
    // jsdom names no hidden element, so the label is read off the attribute.
    expect(section).toHaveAttribute('aria-label', 'Thông báo (F6)');
    expect(section).toHaveAttribute('data-position', 'top-right');
    expect(section).toHaveClass('flg-toaster', 'mine');
    expect(
      within(section).getByRole('img', { hidden: true, name: 'Thành công' }),
    ).toBeInTheDocument();
    expect(within(section).getByRole('button', { hidden: true, name: 'Đóng' })).toBeInTheDocument();
  });

  it('lets only the first Toaster show the toasts; another warns and renders nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Toaster />
        <Toaster position="top-left" />
      </>,
    );
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getAllByRole('region', { hidden: true })).toHaveLength(1);
    expect(region()).toHaveAttribute('data-position', 'bottom-center');
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] More than one <Toaster> is mounted. Only the first shows toasts; this one ' +
        'renders nothing.',
    );
  });

  it('keeps the configuration of the Toaster that shows, whatever a later Toaster asks for', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Toaster max={5} duration={8000} />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    rerender(
      <>
        <Toaster max={5} duration={8000} />
        <Toaster />
      </>,
    );
    act(() => {
      vi.advanceTimersByTime(0);
    });
    show(() => {
      for (let n = 1; n <= 5; n += 1) toast(`t${n}`);
    });
    expect(items()).toHaveLength(5);
    act(() => {
      vi.advanceTimersByTime(7999);
    });
    expect(items()).toHaveLength(5);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(items()).toHaveLength(0);
  });

  it('holds the time only for keyboard focus, not for focus that a click gave', () => {
    mount({ duration: 1000 });
    show(() => toast('a'));
    keyboard = false;
    // A click into the toast: focus that is not `:focus-visible` does not hold the time.
    act(() => items()[0]?.focus());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(items()).toHaveLength(0);
    // Keyboard focus does.
    keyboard = true;
    show(() => toast('b'));
    act(() => items()[0]?.focus());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(items()).toHaveLength(1);
    // Focus that a click then gives to another control in the region lets the time run again.
    keyboard = false;
    act(() => screen.getByRole('button', { hidden: true, name: 'Dismiss notification' }).focus());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(items()).toHaveLength(0);
  });

  it('treats focus as keyboard focus where `:focus-visible` is not supported', () => {
    mount({ duration: 1000 });
    show(() => toast('a'));
    keyboard = false;
    supported = false;
    act(() => items()[0]?.focus());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(items()).toHaveLength(1);
  });

  it('leaves a toast that its action updated by id, or that its action kept open', () => {
    mount();
    show(() =>
      toast({
        id: 'send',
        title: 'Not sent',
        action: {
          label: 'Retry',
          onClick: () => {
            toast({ id: 'send', title: 'Retrying…', duration: Infinity });
          },
        },
      }),
    );
    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Retry' }));
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('Retrying…');
    show(() => toast.dismiss());
    show(() =>
      toast({
        title: 'Kept',
        action: { label: 'Look', onClick: (event) => event.preventDefault() },
      }),
    );
    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Look' }));
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('Kept');
  });

  it('hands the toasts to a Toaster that waited when the one that showed them unmounts', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <>
        <Toaster key="a" position="top-left" />
        <Toaster key="b" position="top-right" />
      </>,
    );
    act(() => {
      vi.advanceTimersByTime(0);
    });
    show(() => toast({ title: 'Saved', duration: Infinity }));
    expect(region()).toHaveAttribute('data-position', 'top-left');
    // The key keeps B mounted while A goes.
    rerender(
      <>
        <Toaster key="b" position="top-right" />
      </>,
    );
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getAllByRole('region', { hidden: true })).toHaveLength(1);
    expect(region()).toHaveAttribute('data-position', 'top-right');
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('Saved');
  });

  it('forgets the toast that held focus once focus left without a blur', () => {
    mount();
    show(() => {
      toast({ id: 'a', title: 'A', duration: 1000, action: { label: 'Go', onClick: () => {} } });
      toast({ title: 'B', duration: 3000 });
    });
    act(() => screen.getByRole('button', { hidden: true, name: 'Go' }).focus());
    // The button goes with the update, and focus drops to the body with no `focusout`.
    show(() => toast({ id: 'a', title: 'A again', duration: 1000 }));
    expect(document.body).toHaveFocus();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(items().map((item) => item.textContent)).toEqual(['B']);
    // Focus does not follow a toast that no longer held it, and the other toast's time runs.
    expect(document.body).toHaveFocus();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(items()).toHaveLength(0);
  });
});
