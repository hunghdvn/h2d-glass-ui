'use client';

import { forwardRef } from 'react';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';

export type IconButtonProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby'> &
  ({ 'aria-label': string } | { 'aria-labelledby': string });

/** A square button holding only an icon. TypeScript requires an accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(props, ref) {
    const name = props as { 'aria-label'?: string; 'aria-labelledby'?: string };
    if (!name['aria-label']?.trim() && !name['aria-labelledby']?.trim()) {
      devWarn('IconButton needs an accessible name: pass `aria-label` or `aria-labelledby`.');
    }
    return <Button ref={ref} data-icon-only="" {...props} />;
  },
);
