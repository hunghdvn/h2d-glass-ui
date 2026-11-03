import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnnounce } from './use-announce';

type Announce = ReturnType<typeof useAnnounce>['announce'];
let announce: Announce;

function Probe() {
  const live = useAnnounce();
  announce = live.announce;
  return (
    <div data-testid="root">
      <button type="button">x</button>
      {live.region}
    </div>
  );
}

const region = (container: HTMLElement) => container.querySelector('[aria-live]') as HTMLElement;

describe('useAnnounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders an empty polite live region from the first render, on the server too', () => {
    expect(renderToString(<Probe />)).toContain(
      '<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>',
    );
    const { container } = render(<Probe />);
    expect(region(container)).toHaveClass('flg-visually-hidden');
    expect(region(container)).toHaveAttribute('aria-live', 'polite');
    expect(region(container)).toHaveAttribute('aria-atomic', 'true');
    expect(region(container).textContent).toBe('');
  });

  it('sets the text a task later', () => {
    const { container } = render(<Probe />);
    act(() => announce('5 results'));
    expect(region(container).textContent).toBe('');
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(region(container).textContent).toBe('5 results');
  });

  it('clears the old text first, so the same sentence said again is a new change', () => {
    const { container } = render(<Probe />);
    act(() => announce('No results'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    act(() => announce('No results'));
    expect(region(container).textContent).toBe('');
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(region(container).textContent).toBe('No results');
  });

  it('with a delay, joins calls made in a row and says only the last', () => {
    const { container } = render(<Probe />);
    act(() => announce('1 result', { delay: 500 }));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => announce('2 results', { delay: 500 }));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(region(container).textContent).toBe('');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(region(container).textContent).toBe('2 results');
  });

  it('an empty text clears the region and drops a pending announcement', () => {
    const { container } = render(<Probe />);
    act(() => announce('Loading…'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    act(() => announce('later', { delay: 500 }));
    act(() => announce(''));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(region(container).textContent).toBe('');
  });

  it('drops a waiting announcement when it unmounts', () => {
    // React no longer warns about a state update after unmount, so the check is the timer itself.
    const { unmount } = render(<Probe />);
    act(() => announce('bye', { delay: 100 }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps each instance to its own region', () => {
    const { container } = render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    const regions = container.querySelectorAll<HTMLElement>('[aria-live]');
    expect(regions).toHaveLength(2);
    // `announce` is the one of the last instance rendered, the second.
    act(() => announce('only here'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(regions[1]!.textContent).toBe('only here');
    expect(regions[0]!.textContent).toBe('');
  });

  it('is read inside a modal dialog', () => {
    // The region sits beside the control, so it is inside the dialog, not in the inert page behind.
    const { container } = render(
      <dialog open>
        <Probe />
      </dialog>,
    );
    const dialog = container.querySelector('dialog') as HTMLElement;
    expect(dialog.contains(region(container))).toBe(true);
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1);
  });
});
