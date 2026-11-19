import { act } from '@testing-library/react';
import { vi } from 'vitest';

// jsdom has no `matchMedia`, so a test says what the window is: wide when the query of the
// breakpoint matches, and a call to `resize` is the user dragging the window across it.
let wide = false;
const listeners = new Set<() => void>();

/** Stands in for the window; undo it with `vi.unstubAllGlobals()`. */
export function stubWindow(initiallyWide: boolean) {
  wide = initiallyWide;
  listeners.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return wide && query.startsWith('(min-width:');
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    })),
  );
}

export function resize(toWide: boolean) {
  wide = toWide;
  act(() => {
    for (const listener of [...listeners]) listener();
  });
}
