import { render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRequireName } from './use-require-name';
import type { RequireNameOptions } from './use-require-name';
import { WARN_PREFIX, resetDevWarnings } from './warn';

function Part({
  part = 'Thing',
  options,
  ...props
}: {
  part?: string;
  options?: RequireNameOptions;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}) {
  useRequireName(props, part, options);
  return null;
}

describe('useRequireName', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    resetDevWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('warns, naming the part, when there is no aria-label nor aria-labelledby', () => {
    render(<Part part="ThingContent" />);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      WARN_PREFIX + ' <ThingContent> needs a name: pass aria-label or aria-labelledby.',
    );
  });

  it('stays quiet with an aria-label that has text, or an aria-labelledby that is not empty', () => {
    render(<Part aria-label="Menu" />);
    render(<Part aria-labelledby="heading" />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not take an aria-label of spaces, or an empty aria-labelledby, for a name', () => {
    for (const props of [
      { 'aria-label': '' },
      { 'aria-label': '  ' },
      { 'aria-labelledby': ' ' },
    ]) {
      resetDevWarnings();
      warn.mockClear();
      const { unmount } = render(<Part {...props} />);
      expect(warn, JSON.stringify(props)).toHaveBeenCalledOnce();
      unmount();
    }
  });

  it('stays quiet while not active, and warns once it is', () => {
    const { rerender } = render(<Part options={{ active: false }} />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Part options={{ active: true }} />);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('names the other way to get a name, until something has taken it', () => {
    const title: { current: string | undefined } = { current: undefined };
    const otherName = {
      description: 'render a DialogTitle inside it',
      given: () => title.current !== undefined,
    };
    render(<Part part="DialogContent" options={{ otherName }} />);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      WARN_PREFIX +
        ' <DialogContent> needs a name: render a DialogTitle inside it, or pass ' +
        'aria-label or aria-labelledby.',
    );
    warn.mockClear();
    resetDevWarnings();
    title.current = 'title-id';
    render(<Part part="DialogContent" options={{ otherName }} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('asks the other way once the part is in the DOM, with the function of the latest render, and not on every render', () => {
    function Labelled({ active, given }: { active: boolean; given: () => boolean }) {
      const input = useRef<HTMLInputElement>(null);
      // `given` is reached only once the input is there: a check that ran in render would not.
      useRequireName({}, 'Field', {
        active,
        otherName: { description: 'label it', given: () => input.current !== null && given() },
      });
      return <input ref={input} />;
    }
    const first = vi.fn(() => true);
    const latest = vi.fn(() => true);
    const { rerender } = render(<Labelled active given={first} />);
    expect(first).toHaveBeenCalledOnce();
    rerender(<Labelled active given={latest} />);
    expect(latest).not.toHaveBeenCalled();
    rerender(<Labelled active={false} given={latest} />);
    rerender(<Labelled active given={latest} />);
    expect(latest).toHaveBeenCalledOnce();
    expect(first).toHaveBeenCalledOnce();
    expect(warn).not.toHaveBeenCalled();
  });
});
