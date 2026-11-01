import { render } from '@testing-library/react';
import { Suspense, useLayoutEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useWriteOnCommit } from './use-write-on-commit';

describe('useWriteOnCommit', () => {
  it('has written before the layout effects of the commit, those of a child too', () => {
    const seen: string[] = [];
    function Parent({ value }: { value: string }) {
      const latest = useRef(value);
      useWriteOnCommit(() => {
        latest.current = value;
      });
      // The child's effect runs before any layout effect of its parent.
      return <Child latest={latest} />;
    }
    function Child({ latest }: { latest: { current: string } }) {
      useLayoutEffect(() => {
        seen.push(latest.current);
      });
      return null;
    }
    const { rerender } = render(<Parent value="a" />);
    rerender(<Parent value="b" />);
    expect(seen).toEqual(['a', 'b']);
  });

  it('does not run on the server', () => {
    let ran = false;
    function Component() {
      useWriteOnCommit(() => {
        ran = true;
      });
      return null;
    }
    renderToString(
      <Suspense>
        <Component />
      </Suspense>,
    );
    expect(ran).toBe(false);
  });
});
