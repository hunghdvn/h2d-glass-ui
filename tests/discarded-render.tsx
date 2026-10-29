import { act, render } from '@testing-library/react';
import { Suspense, startTransition, useState } from 'react';
import type { ReactNode } from 'react';

// A promise that never settles: a child that throws it keeps its Suspense boundary waiting.
const never = new Promise<never>(() => {});

function Hang({ when }: { when: boolean }) {
  if (when) throw never;
  return null;
}

/**
 * Test helper: renders `ui(false)`, and lets a test make React render `ui(true)` and throw that
 * render away. The new render runs in a transition and ends in a child that suspends, so React keeps
 * what is on screen and never commits it, as it does for a transition that is abandoned. `ui` is
 * called with `true` for the render that is thrown away, so a test can give it different props.
 *
 * A component that wrote a ref during render keeps what that render gave it. After the discarded
 * render, an event reads the ref: a hook that is right finds the values of the last commit.
 */
export function renderDiscardable(ui: (discarded: boolean) => ReactNode) {
  let attempt = () => {};
  function Host() {
    const [discarded, setDiscarded] = useState(false);
    attempt = () => startTransition(() => setDiscarded(true));
    return (
      <Suspense fallback={null}>
        {ui(discarded)}
        <Hang when={discarded} />
      </Suspense>
    );
  }
  const result = render(<Host />);
  return {
    ...result,
    /** Renders `ui(true)` and throws the render away. */
    discard: () => act(() => attempt()),
  };
}
