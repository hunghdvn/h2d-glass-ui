import { render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Skeleton, SkeletonText } from './Skeleton';

const block = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('Skeleton', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('is a hidden pulse rect span by default', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<Skeleton ref={ref} />);
    const skeleton = block(container);
    expect(skeleton.tagName).toBe('SPAN');
    expect(skeleton).toBe(ref.current);
    expect(skeleton).toHaveClass('flg-skeleton');
    expect(skeleton).toHaveAttribute('data-variant', 'pulse');
    expect(skeleton).toHaveAttribute('data-shape', 'rect');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toBeEmptyDOMElement();
  });

  it.each(['pulse', 'shimmer', 'glass'] as const)('reflects variant %s', (variant) => {
    const { container } = render(<Skeleton variant={variant} />);
    expect(block(container)).toHaveAttribute('data-variant', variant);
  });

  it.each(['rect', 'circle', 'text'] as const)('reflects shape %s', (shape) => {
    const { container } = render(<Skeleton shape={shape} />);
    expect(block(container)).toHaveAttribute('data-shape', shape);
  });

  it('is always hidden from assistive technology, whatever the caller passes', () => {
    const { container } = render(<Skeleton aria-hidden={false} />);
    expect(block(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('turns a number into px and keeps a string as the CSS value it is', () => {
    const { container } = render(<Skeleton width={120} height="2rem" />);
    expect(block(container).style.width).toBe('120px');
    expect(block(container).style.height).toBe('2rem');
  });

  it('is 40px square as a circle, and takes `size` for both sides', () => {
    const { container, rerender } = render(<Skeleton shape="circle" />);
    expect(block(container).style.width).toBe('40px');
    expect(block(container).style.height).toBe('40px');
    rerender(<Skeleton shape="circle" size={32} />);
    expect(block(container).style.width).toBe('32px');
    expect(block(container).style.height).toBe('32px');
    rerender(<Skeleton shape="circle" size="2em" />);
    expect(block(container).style.width).toBe('2em');
    expect(block(container).style.height).toBe('2em');
  });

  it('lets `style` win over the size props', () => {
    const { container } = render(<Skeleton width={120} style={{ width: 50 }} />);
    expect(block(container).style.width).toBe('50px');
  });

  it('ignores `size` off a circle, and says so in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Skeleton size={32} />);
    expect(block(container).style.width).toBe('');
    expect(block(container).style.height).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`size` only applies to a circle'));
  });

  it('passes className and other attributes on to the span', () => {
    const { container } = render(<Skeleton className="mine" id="a" />);
    expect(block(container)).toHaveClass('flg-skeleton', 'mine');
    expect(block(container)).toHaveAttribute('id', 'a');
  });
});

describe('SkeletonText', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  const lines = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('.flg-skeleton'));

  it('is three hidden text lines by default, the last one short', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<SkeletonText ref={ref} />);
    const root = block(container);
    expect(root).toBe(ref.current);
    expect(root).toHaveClass('flg-skeleton-text');
    expect(root).toHaveAttribute('data-variant', 'pulse');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    const rows = lines(container);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row).toHaveAttribute('data-shape', 'text');
      expect(row).toHaveAttribute('data-variant', 'pulse');
    }
    expect(rows[0]!.style.width).toBe('');
    expect(rows[1]!.style.width).toBe('');
    expect(rows[2]!.style.width).toBe('64%');
  });

  it('leaves a single line at full width', () => {
    const { container } = render(<SkeletonText lines={1} />);
    expect(lines(container)).toHaveLength(1);
    expect(lines(container)[0]!.style.width).toBe('');
  });

  it('gives every line the variant', () => {
    const { container } = render(<SkeletonText variant="glass" lines={2} />);
    expect(block(container)).toHaveAttribute('data-variant', 'glass');
    for (const row of lines(container)) expect(row).toHaveAttribute('data-variant', 'glass');
  });

  it('is hidden whatever the caller passes', () => {
    const { container } = render(<SkeletonText aria-hidden={false} />);
    expect(block(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([0, -2, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'uses one line for `lines` %s, and says so in development',
    (count) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(<SkeletonText lines={count} />);
      expect(lines(container)).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('`lines` must be a positive integer'),
      );
    },
  );
});
