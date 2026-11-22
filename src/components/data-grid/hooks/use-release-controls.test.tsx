import { act, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useReleaseControls } from './use-release-controls';

/** A heading cell that draws a control of its own, with no render of the table that holds it. */
function Cell() {
  const [shown, setShown] = useState(false);
  return (
    <th>
      <button type="button" onClick={() => setShown(true)}>
        add
      </button>
      {shown ? <input aria-label="added" /> : null}
    </th>
  );
}

function Table({ inBodies }: { inBodies: boolean }) {
  const ref = useRef<HTMLTableElement>(null);
  useReleaseControls(ref, inBodies);
  return (
    <table ref={ref} role="grid">
      <thead>
        <tr>
          <Cell />
        </tr>
      </thead>
      <tbody>
        <tr>
          <td />
        </tr>
      </tbody>
    </table>
  );
}

describe('useReleaseControls', () => {
  it.each([false, true])(
    'releases a control that a cell of the heading adds by its own render (inBodies %s)',
    async (inBodies) => {
      render(<Table inBodies={inBodies} />);
      await act(async () => {
        screen.getByRole('button', { name: 'add' }).click();
      });
      // The observer's records are delivered in a microtask after the commit.
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByLabelText('added')).toHaveAttribute('tabindex', '-1');
    },
  );
});
