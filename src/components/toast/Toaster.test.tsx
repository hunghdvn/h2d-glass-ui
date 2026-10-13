import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { toast } from './toast';
import { Toaster } from './Toaster';
import type { ToasterProps } from './Toaster';

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

describe('Toaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDevWarnings();
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
    expect(assertive).toHaveAttribute('aria-atomic', 'true');
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
    act(() => region().focus());
    expect(fireEvent.keyDown(region(), { key: 'Escape' })).toBe(true);
    expect(items()).toHaveLength(1);
    // An open Tooltip takes Esc in the capture phase.
    const take = (event: Event) => event.preventDefault();
    document.addEventListener('keydown', take, true);
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
});
