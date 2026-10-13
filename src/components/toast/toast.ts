'use client';

import { isValidElement } from 'react';
import type { ReactNode } from 'react';
import { devWarn } from '../../internal/warn';
import { toastStore } from './store';
import type { ToastOptions, ToastStatus } from './store';

type Input = ReactNode | ToastOptions;
type StatusInput = ReactNode | Omit<ToastOptions, 'status'>;

export interface ToastFunction {
  /** Shows a toast, by default an `info` one, and returns its id. */
  (input: Input): string;
  success(input: StatusInput): string;
  error(input: StatusInput): string;
  warning(input: StatusInput): string;
  info(input: StatusInput): string;
  /** Closes the toast with this id, or every toast without one. */
  dismiss(id?: string): void;
}

let count = 0;

/** Options are a plain object with a `title`; anything else is the title itself. */
function isOptions(input: Input): input is ToastOptions {
  return (
    typeof input === 'object' &&
    input !== null &&
    !Array.isArray(input) &&
    !isValidElement(input) &&
    'title' in input
  );
}

function show(input: Input, status?: ToastStatus): string {
  const options: ToastOptions = isOptions(input) ? input : { title: input };
  count += 1;
  const id = options.id ?? `flg-toast-${count}`;
  // A store on the server would carry toasts from one request into the next.
  if (typeof window === 'undefined') {
    devWarn(
      'toast() was called on the server, where it does nothing. Call it from code that runs in ' +
        'the browser, such as an event handler or an effect.',
    );
    return id;
  }
  toastStore.add({
    id,
    title: options.title,
    description: options.description,
    status: status ?? options.status ?? 'info',
    action: options.action,
    duration: options.duration,
  });
  return id;
}

/**
 * Shows a toast from anywhere in client code. A `<Toaster />`, placed once in the app, shows them;
 * toasts shown before it mounts wait for it.
 */
export const toast: ToastFunction = Object.assign((input: Input) => show(input), {
  success: (input: StatusInput) => show(input, 'success'),
  error: (input: StatusInput) => show(input, 'error'),
  warning: (input: StatusInput) => show(input, 'warning'),
  info: (input: StatusInput) => show(input, 'info'),
  dismiss: (id?: string) => toastStore.dismiss(id),
});
