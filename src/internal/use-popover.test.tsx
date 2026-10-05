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

describe('usePopover', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

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
