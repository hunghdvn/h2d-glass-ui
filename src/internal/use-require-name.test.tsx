import { render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRequireName } from './use-require-name';
import type { RequireNameOptions } from './use-require-name';
import { resetDevWarnings } from './warn';

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
      '[fl-glass-ui] <ThingContent> needs a name: pass aria-label or aria-labelledby.',
    );
  });

  it('stays quiet with either of them, empty or not', () => {
    render(<Part aria-label="Menu" />);
    render(<Part aria-labelledby="heading" />);
    render(<Part aria-label="" />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays quiet while not active, and warns once it is', () => {
    const { rerender } = render(<Part options={{ active: false }} />);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Part options={{ active: true }} />);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('names the other way to get a name, until something has taken it', () => {
    const ref = createRef<string>() as { current: string | undefined };
    ref.current = undefined;
    const otherName = { description: 'render a DialogTitle inside it', ref };
    render(<Part part="DialogContent" options={{ otherName }} />);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] <DialogContent> needs a name: render a DialogTitle inside it, or pass ' +
        'aria-label or aria-labelledby.',
    );
    warn.mockClear();
    resetDevWarnings();
    ref.current = 'title-id';
    render(<Part part="DialogContent" options={{ otherName }} />);
    expect(warn).not.toHaveBeenCalled();
  });
});
