import { render, screen } from '@testing-library/react';
import { useState, version } from 'react';
import { version as domVersion } from 'react-dom';
import { describe, expect, inject, it } from 'vitest';
import { IS_REACT_19 } from './react-version';

declare module 'vitest' {
  export interface ProvidedContext {
    /** The React major a Vitest project is meant to load (`provide` in vitest.config.ts). */
    reactMajor: number;
  }
}

// Runs in both `unit` (React 19) and `unit-react18`, so neither project can silently load the
// other React.
describe('the React under test', () => {
  const major = inject('reactMajor');

  it('is the major this Vitest project targets, for react and react-dom alike', () => {
    expect(version.split('.')[0]).toBe(String(major));
    expect(domVersion.split('.')[0]).toBe(String(major));
    expect(IS_REACT_19).toBe(major >= 19);
  });

  it('is the single copy Testing Library renders with', () => {
    function Count() {
      const [count] = useState(1);
      return <output>{count}</output>;
    }
    render(<Count />);
    expect(screen.getByRole('status')).toHaveTextContent('1');
  });
});
