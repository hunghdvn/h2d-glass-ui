'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { devWarn } from '../../internal/warn';

type Status = 'loading' | 'loaded' | 'error';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Who the avatar shows. Pass `alt=""` when the name is written next to it: the avatar is then hidden. */
  alt?: string;
  /** Shown until the image loads, or instead of it. Usually initials. */
  fallback?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

/** A person's picture, with initials or an icon until (or instead of) the image. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, fallback, size = 'md', className, ...props },
  ref,
) {
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'error');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    // An image that finished before React attached onLoad (cache, SSR hydration) never fires it.
    const image = imageRef.current;
    setStatus(image?.complete && image.naturalWidth > 0 ? 'loaded' : 'loading');
  }, [src]);

  if (src && alt === undefined) {
    devWarn('Avatar has `src` but no `alt`; screen readers cannot tell who it shows.');
  }

  const showFallback = status !== 'loaded';
  const named = showFallback && Boolean(alt);
  // Without a name there is nothing to announce: hide the root so initials and the icon stay silent too.
  const decorative = !alt && !props['aria-label'] && !props['aria-labelledby'];
  return (
    <span
      ref={ref}
      className={clsx('flg-avatar', className)}
      data-size={size}
      data-status={status}
      role={named ? 'img' : undefined}
      aria-label={named ? alt : undefined}
      aria-hidden={decorative ? true : undefined}
      {...props}
    >
      {src ? (
        <img
          ref={imageRef}
          src={src}
          // Only the visible element carries the name: the hidden image stays unnamed until it loads.
          alt={status === 'loaded' ? (alt ?? '') : ''}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      ) : null}
      {showFallback ? (fallback ?? <PersonIcon />) : null}
    </span>
  );
});
