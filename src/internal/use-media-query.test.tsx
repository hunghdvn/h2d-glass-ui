import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './use-media-query';

type Listener = () => void;

/** What the browser keeps for one query: whether it matches, and who is listening. */
interface FakeQuery {
  matches: boolean;
  listeners: Set<Listener>;
  fire: (matches: boolean) => void;
}

/**
 * Installs a `matchMedia` like the browser's: every call returns a fresh list object, but all of
 * them for one query share the state behind it. Returns the state per query.
 */
function stubMatchMedia(initial: (query: string) => boolean) {
  const queries = new Map<string, FakeQuery>();
  const stateOf = (query: string) => {
    let state = queries.get(query);
    if (!state) {
      const created: FakeQuery = {
        matches: initial(query),
        listeners: new Set(),
        fire(matches) {
          created.matches = matches;
          for (const listener of [...created.listeners]) listener();
        },
      };
      state = created;
      queries.set(query, created);
    }
    return state;
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const state = stateOf(query);
      return {
        get matches() {
          return state.matches;
        },
        media: query,
        addEventListener: (_type: string, listener: Listener) => state.listeners.add(listener),
        removeEventListener: (_type: string, listener: Listener) =>
          state.listeners.delete(listener),
      };
    }),
  );
  return stateOf;
}

function Probe({ query }: { query: string }) {
  return <p data-testid="value">{String(useMediaQuery(query))}</p>;
}

const read = (container: HTMLElement) =>
  container.querySelector('[data-testid="value"]')!.textContent;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQuery', () => {
  it('returns what the query matches on the first client render', () => {
    stubMatchMedia((query) => query === '(min-width: 1024px)');
    const yes = render(<Probe query="(min-width: 1024px)" />);
    expect(read(yes.container)).toBe('true');
    const no = render(<Probe query="(min-width: 2000px)" />);
    expect(read(no.container)).toBe('false');
  });

  it('re-renders when the query starts and stops matching', () => {
    const stateOf = stubMatchMedia(() => false);
    const { container } = render(<Probe query="(min-width: 1024px)" />);
    expect(read(container)).toBe('false');
    const state = stateOf('(min-width: 1024px)');
    expect(state.listeners.size).toBe(1);
    act(() => state.fire(true));
    expect(read(container)).toBe('true');
    act(() => state.fire(false));
    expect(read(container)).toBe('false');
  });

  it('unsubscribes when the component unmounts', () => {
    const stateOf = stubMatchMedia(() => false);
    const { unmount } = render(<Probe query="(min-width: 1024px)" />);
    const state = stateOf('(min-width: 1024px)');
    expect(state.listeners.size).toBe(1);
    unmount();
    expect(state.listeners.size).toBe(0);
  });

  it('subscribes to the new query, and drops the old one, when the query changes', () => {
    const stateOf = stubMatchMedia((query) => query === '(min-width: 600px)');
    const { container, rerender } = render(<Probe query="(min-width: 1024px)" />);
    expect(read(container)).toBe('false');
    rerender(<Probe query="(min-width: 600px)" />);
    expect(read(container)).toBe('true');
    expect(stateOf('(min-width: 1024px)').listeners.size).toBe(0);
    expect(stateOf('(min-width: 600px)').listeners.size).toBe(1);
  });

  it('is false on the server, even where the query would match', () => {
    stubMatchMedia(() => true);
    expect(renderToString(<Probe query="(min-width: 1024px)" />)).toContain('false');
  });

  it('is false when there is no matchMedia, as in jsdom', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { container } = render(<Probe query="(min-width: 1024px)" />);
    expect(read(container)).toBe('false');
  });
});
