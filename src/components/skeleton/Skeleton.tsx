import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { devWarn } from '../../internal/warn';

export type SkeletonVariant = 'pulse' | 'shimmer' | 'glass';
export type SkeletonShape = 'rect' | 'circle' | 'text';

export type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  shape?: SkeletonShape;
  variant?: SkeletonVariant;
  /** A number is px, a string is a CSS value. A `rect` is as wide as its container by default. */
  width?: number | string;
  /** A number is px, a string is a CSS value. A `rect` is one line high by default. */
  height?: number | string;
  /** The width and height of a `circle`. Default 40 (in the CSS), the size of a large Avatar. */
  size?: number | string;
};

export type SkeletonTextProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** How many lines. Default 3. */
  lines?: number;
  variant?: SkeletonVariant;
};

/** The width of the last of several lines, the short line of the approved mockup. */
const LAST_LINE_WIDTH = '64%';

const px = (length: number | string) => (typeof length === 'number' ? `${length}px` : length);

/**
 * A grey block that stands where content is still loading, in one of three looks. It is always
 * hidden from assistive technology: saying that something is loading is the job of the container
 * (`aria-busy` and a `Spinner` or hidden text, see the docs), not of every block, which would be
 * one announcement each. A plain `span`, so a block can sit inside a sentence or a table cell. Safe
 * to render in React Server Components.
 */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { shape = 'rect', variant = 'pulse', width, height, size, className, style, ...props },
  ref,
) {
  if (size !== undefined && shape !== 'circle') {
    devWarn(
      'Skeleton: `size` only applies to a circle, so it is ignored. Use `width` and `height`.',
    );
  }
  // The default 40px of a circle is in the CSS, so a `className` can size it; only what the caller
  // gives is written here.
  const side = shape === 'circle' ? size : undefined;
  const wide = width ?? side;
  const high = height ?? side;
  const own: CSSProperties = {
    ...(wide === undefined ? null : { width: px(wide) }),
    ...(high === undefined ? null : { height: px(high) }),
    ...style,
  };
  return (
    <span
      ref={ref}
      className={clsx('flg-skeleton', className)}
      data-variant={variant}
      data-shape={shape}
      style={own}
      {...props}
      aria-hidden="true"
    />
  );
});

/**
 * Lines of text still to come, one `text` block each. Each line is as tall as a line of the text
 * it stands for, so the block takes the room the text will. With more than one line the last is
 * shorter, as the end of a paragraph is.
 */
export const SkeletonText = forwardRef<HTMLSpanElement, SkeletonTextProps>(function SkeletonText(
  { lines = 3, variant = 'pulse', className, ...props },
  ref,
) {
  const valid = Number.isInteger(lines) && lines > 0;
  if (!valid) devWarn(`SkeletonText: \`lines\` must be a positive integer, got ${lines}; using 1.`);
  const count = valid ? lines : 1;
  return (
    <span
      ref={ref}
      className={clsx('flg-skeleton-text', className)}
      data-variant={variant}
      {...props}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="flg-skeleton"
          data-variant={variant}
          data-shape="text"
          style={count > 1 && index === count - 1 ? { width: LAST_LINE_WIDTH } : undefined}
        />
      ))}
    </span>
  );
});
