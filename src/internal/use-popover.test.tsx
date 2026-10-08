import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { usePopover } from './use-popover';
import type { UsePopoverOptions } from './use-popover';
import { resetDevWarnings } from './warn';

function Harness(options: UsePopoverOptions) {
  const ref = useRef<HTMLDivElement>(null);
  usePopover(ref, options);
  return <div ref={ref} data-testid="popover" />;
}

/**
 * Turns `el` into a popover that the browser refuses to show or hide a given number of times, as it
 * does while it is in the middle of showing or hiding another popover.
 */
function stubPopover(el: HTMLElement) {
  const state = { showing: false, refuseShow: 0, refuseHide: 0 };
  const refuse = () => {
    throw new DOMException('Another popover is being shown or hidden.', 'InvalidStateError');
  };
  el.showPopover = vi.fn(() => {
    if (state.refuseShow > 0) {
      state.refuseShow -= 1;
      refuse();
    }
    state.showing = true;
  });
  el.hidePopover = vi.fn(() => {
    if (state.refuseHide > 0) {
      state.refuseHide -= 1;
      refuse();
    }
    state.showing = false;
  });
  const matches = el.matches.bind(el);
  el.matches = ((selector: string) =>
    selector === ':popover-open' ? state.showing : matches(selector)) as typeof el.matches;
  return state;
}

const nextTask = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

// A trigger outside the popover and a control inside it, for the focus-return tests.
function WithTrigger(props: Omit<UsePopoverOptions, 'restoreFocusTo'>) {
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  usePopover(ref, { ...props, restoreFocusTo: () => trigger.current });
  return (
    <>
      <button ref={trigger} type="button">
        Trigger
      </button>
      <div ref={ref} data-testid="popover">
        <button type="button">Inside</button>
      </div>
    </>
  );
}

// The trigger inside a focusable panel, like a menu inside a Dialog.
function InAPanel(props: Omit<UsePopoverOptions, 'restoreFocusTo'>) {
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  usePopover(ref, { ...props, restoreFocusTo: () => trigger.current });
  return (
    <div tabIndex={-1} data-testid="panel">
      <button ref={trigger} type="button">
        Trigger
      </button>
      <div ref={ref} data-testid="popover" />
    </div>
  );
}

const beforeToggle = (el: Element, newState: 'open' | 'closed') =>
  act(() => {
    el.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState }));
  });

describe('usePopover', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('returns focus to the trigger before the browser hides it (Esc, light dismiss)', () => {
    const { getByTestId, getByRole, rerender } = render(
      <WithTrigger open={false} onOpenChange={() => {}} />,
    );
    stubPopover(getByTestId('popover'));
    rerender(<WithTrigger open onOpenChange={() => {}} />);
    getByRole('button', { name: 'Inside' }).focus();
    // The browser's own hide: `beforetoggle` comes while the popover is still showing and focused.
    beforeToggle(getByTestId('popover'), 'closed');
    expect(getByRole('button', { name: 'Trigger' })).toHaveFocus();
  });

  it('leaves focus alone on beforetoggle for its own hide and for opening', () => {
    const { getByTestId, getByRole, rerender } = render(
      <WithTrigger open={false} onOpenChange={() => {}} />,
    );
    const el = getByTestId('popover');
    stubPopover(el);
    rerender(<WithTrigger open onOpenChange={() => {}} />);
    const inside = getByRole('button', { name: 'Inside' });
    inside.focus();
    beforeToggle(el, 'open');
    expect(inside).toHaveFocus();
    // The library's own hide already moved focus out before hiding; its beforetoggle does nothing.
    rerender(<WithTrigger open={false} onOpenChange={() => {}} />);
    inside.focus();
    beforeToggle(el, 'closed');
    expect(inside).toHaveFocus();
  });

  it('returns focus to the trigger that was pressed to close it, while the press left focus on or around it', () => {
    const { getByTestId, getByRole, rerender } = render(
      <InAPanel open={false} onOpenChange={() => {}} />,
    );
    stubPopover(getByTestId('popover'));
    rerender(<InAPanel open onOpenChange={() => {}} />);
    const trigger = getByRole('button', { name: 'Trigger' });
    // Safari does not focus a pressed button: it focuses the nearest focusable element around it.
    act(() => {
      trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    });
    getByTestId('panel').focus();
    rerender(<InAPanel open={false} onOpenChange={() => {}} />);
    expect(trigger).toHaveFocus();
  });

  it('leaves focus that the user moved elsewhere after a press on the trigger that closed nothing', () => {
    const { getByTestId, getByRole, rerender } = render(
      <>
        <WithTrigger open={false} onOpenChange={() => {}} />
        <button type="button">Outside</button>
      </>,
    );
    stubPopover(getByTestId('popover'));
    rerender(
      <>
        <WithTrigger open onOpenChange={() => {}} />
        <button type="button">Outside</button>
      </>,
    );
    // A press on the trigger that leaves the popover open (a submenu shown again), then the user
    // moves focus to another control.
    act(() => {
      getByRole('button', { name: 'Trigger' }).dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true }),
      );
    });
    const outside = getByRole('button', { name: 'Outside' });
    outside.focus();
    rerender(
      <>
        <WithTrigger open={false} onOpenChange={() => {}} />
        <button type="button">Outside</button>
      </>,
    );
    expect(outside).toHaveFocus();
  });

  it('calls onShown once the popover really shows', () => {
    const onShown = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness open={false} onOpenChange={() => {}} onShown={onShown} />,
    );
    const popover = stubPopover(getByTestId('popover'));
    rerender(<Harness open onOpenChange={() => {}} onShown={onShown} />);
    expect(popover.showing).toBe(true);
    expect(onShown).toHaveBeenCalledOnce();
  });

  it('does not call onShown when it shows again for a parent that keeps it open', () => {
    const onOpenChange = vi.fn();
    const onShown = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness open={false} onOpenChange={onOpenChange} onShown={onShown} />,
    );
    const el = getByTestId('popover');
    const popover = stubPopover(el);
    rerender(<Harness open onOpenChange={onOpenChange} onShown={onShown} />);
    expect(onShown).toHaveBeenCalledOnce();
    // A light dismiss: the browser hides it and fires `toggle`. The parent keeps `open` true.
    popover.showing = false;
    act(() => {
      el.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(popover.showing).toBe(true);
    // Shown again to stay in step, not opened: focus is not moved into it.
    expect(onShown).toHaveBeenCalledOnce();
  });

  it('forgets a press on another control once a refused dismiss has shown it again', () => {
    const trigger = document.body.appendChild(document.createElement('button'));
    const other = document.body.appendChild(document.createElement('button'));
    onTestFinished(() => {
      trigger.remove();
      other.remove();
    });
    const options = { onOpenChange: vi.fn(), restoreFocusTo: () => trigger };
    const { getByTestId, rerender } = render(<Harness open={false} {...options} />);
    const el = getByTestId('popover');
    const popover = stubPopover(el);
    rerender(<Harness open {...options} />);
    // A press on another control light-dismisses it, and the parent keeps it open.
    other.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    popover.showing = false;
    act(() => {
      el.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'closed' }));
    });
    expect(popover.showing).toBe(true);
    // Later the parent closes it while focus is on <body>: focus goes back to the trigger.
    rerender(<Harness open={false} {...options} />);
    expect(trigger).toHaveFocus();
  });

  it.each([
    ['released inside the popover', 'pointerup', (el: HTMLElement) => el],
    ['cancelled', 'pointercancel', () => document.body],
  ] as const)(
    'forgets a press on another control that is %s, which closes nothing',
    (_, release, releaseTarget) => {
      const trigger = document.body.appendChild(document.createElement('button'));
      const other = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => {
        trigger.remove();
        other.remove();
      });
      const options = { onOpenChange: vi.fn(), restoreFocusTo: () => trigger };
      const { getByTestId, rerender } = render(<Harness open={false} {...options} />);
      const el = getByTestId('popover');
      stubPopover(el);
      rerender(<Harness open {...options} />);
      other.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      releaseTarget(el).dispatchEvent(new Event(release, { bubbles: true }));
      // The parent closes it later, with focus on <body>: focus goes back to the trigger.
      rerender(<Harness open={false} {...options} />);
      expect(trigger).toHaveFocus();
    },
  );

  it('shows the popover on the next task when the browser refuses the first try', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const onShown = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness open={false} onOpenChange={onOpenChange} onShown={onShown} />,
    );
    const popover = stubPopover(getByTestId('popover'));
    popover.refuseShow = 1;
    rerender(<Harness open onOpenChange={onOpenChange} onShown={onShown} />);
    expect(popover.showing).toBe(false);
    expect(onShown).not.toHaveBeenCalled();
    await nextTask();
    expect(popover.showing).toBe(true);
    // Focus can move in only now that it shows.
    expect(onShown).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once and reports it closed when the browser refuses to show it twice', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const onShown = vi.fn();
    const { getByTestId, rerender } = render(
      <Harness open={false} onOpenChange={onOpenChange} onShown={onShown} />,
    );
    const el = getByTestId('popover');
    const popover = stubPopover(el);
    popover.refuseShow = 2;
    rerender(<Harness open onOpenChange={onOpenChange} onShown={onShown} />);
    await nextTask();
    await nextTask();
    expect(el.showPopover).toHaveBeenCalledTimes(2);
    expect(popover.showing).toBe(false);
    expect(onShown).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/another popover/);
    // So the trigger's aria-expanded does not say open while nothing shows.
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('warns once and reports it open when the browser refuses to hide it twice', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const { getByTestId, rerender } = render(<Harness open={false} onOpenChange={onOpenChange} />);
    const el = getByTestId('popover');
    const popover = stubPopover(el);
    rerender(<Harness open onOpenChange={onOpenChange} />);
    expect(popover.showing).toBe(true);
    popover.refuseHide = 2;
    rerender(<Harness open={false} onOpenChange={onOpenChange} />);
    await nextTask();
    await nextTask();
    expect(el.hidePopover).toHaveBeenCalledTimes(2);
    expect(popover.showing).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
