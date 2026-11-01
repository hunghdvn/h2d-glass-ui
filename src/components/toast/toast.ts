'use client';

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

/**
 * Options are a plain object. Anything else is the title: an element or a portal (plain objects
 * that carry a `$$typeof`), an iterable such as a `Set`, or a promise, which React 19 accepts as a
 * node.
 */
function isOptions(input: Input): input is ToastOptions {
  if (typeof input !== 'object' || input === null || '$$typeof' in input) return false;
  const proto: unknown = Object.getPrototypeOf(input);
  return proto === Object.prototype || proto === null;
}

function show(input: Input, status?: ToastStatus): string {
  const options: ToastOptions = isOptions(input) ? input : { title: input };
  if (isOptions(input) && !('title' in input)) {
    devWarn(
      'toast() was given an options object with no `title`. Treating it as options; the toast has ' +
        'no title.',
    );
  }
  const id =
    options.id ??
    (() => {
      count += 1;
      return `flg-toast-${count}`;
    })();
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
