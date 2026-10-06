import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFloating } from './use-floating';

function Harness({ open }: { open: boolean }) {
  const reference = useRef<HTMLButtonElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  useFloating({
    open,
    reference: () => reference.current,
    floating,
    side: 'bottom',
    align: 'start',
    offset: 4,
  });
  return (
    <div data-testid="menu">
      <button ref={reference} type="button">
        Trigger
      </button>
      <div ref={floating} data-testid="floating" />
    </div>
  );
}

/** A running animation that ends, or is cancelled, when the test says so. */
function animation() {
  let end = () => {};
  let cancel = () => {};
  const finished = new Promise<void>((resolve, reject) => {
    end = resolve;
    cancel = () => reject(new DOMException('The animation was cancelled.', 'AbortError'));
  });
  const value = {
    playState: 'running',
    effect: { getComputedTiming: () => ({ endTime: 200 }) },
    finished,
  } as unknown as Animation;
  return { value, end, cancel };
}

/** Lets computePosition, which is async, write its result. */
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

/** Renders it closed, gives the element around the reference `running`, then opens it. */
async function openWhile(running: Animation) {
  const view = render(<Harness open={false} />);
  view.getByTestId('menu').getAnimations = () => [running];
  view.rerender(<Harness open />);
  await flush();
  const floating = view.getByTestId('floating');
  expect(floating.dataset.side).toBe('bottom');
  // Marks the first placement, so a later one shows.
  floating.dataset.side = 'stale';
  return { ...view, floating };
}

describe('useFloating', () => {
  // jsdom has no Web Animations.
  beforeEach(() => {
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      writable: true,
      value: () => [],
    });
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).getAnimations;
  });

  it('places it again once an animation moving the reference has ended', async () => {
    const slide = animation();
    const { floating } = await openWhile(slide.value);
    await flush();
    expect(floating.dataset.side).toBe('stale');
    slide.end();
    await flush();
    expect(floating.dataset.side).toBe('bottom');
  });

  it('places it again when that animation is cancelled instead', async () => {
    const slide = animation();
    const { floating } = await openWhile(slide.value);
    slide.cancel();
    await flush();
    expect(floating.dataset.side).toBe('bottom');
  });

  it('does not measure or place it once it has closed', async () => {
    const slide = animation();
    const { floating, getByRole, rerender } = await openWhile(slide.value);
    rerender(<Harness open={false} />);
    const measure = vi.spyOn(getByRole('button'), 'getBoundingClientRect');
    slide.end();
    await flush();
    expect(measure).not.toHaveBeenCalled();
    expect(floating.dataset.side).toBe('stale');
  });
});
