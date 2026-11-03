import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFormReset } from './use-form-reset';

function Probe({
  onReset,
  onFormReset,
}: {
  onReset: () => void;
  onFormReset?: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useFormReset(ref, onReset);
  return (
    <form data-testid="form" onReset={onFormReset}>
      <input ref={ref} defaultValue="a" />
    </form>
  );
}

// The listener runs before React's `onReset`, so the hook waits a task before it looks.
const aTask = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe('useFormReset', () => {
  it('does not listen to the enclosing form when the control names a form that does not exist', async () => {
    const onReset = vi.fn();
    function Missing() {
      const ref = useRef<HTMLInputElement>(null);
      useFormReset(ref, onReset);
      return (
        <form data-testid="form">
          <input ref={ref} form="missing" defaultValue="a" />
        </form>
      );
    }
    const { getByTestId } = render(<Missing />);
    (getByTestId('form') as HTMLFormElement).reset();
    await aTask();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('calls onReset a task after the form is reset, not before', async () => {
    const onReset = vi.fn();
    const { getByTestId } = render(<Probe onReset={onReset} />);
    (getByTestId('form') as HTMLFormElement).reset();
    expect(onReset).not.toHaveBeenCalled();
    await aTask();
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('does not call onReset when the reset is cancelled', async () => {
    const onReset = vi.fn();
    const { getByTestId } = render(
      <Probe onReset={onReset} onFormReset={(event) => event.preventDefault()} />,
    );
    (getByTestId('form') as HTMLFormElement).reset();
    await aTask();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('calls the latest onReset, not the one from the first render', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { getByTestId, rerender } = render(<Probe onReset={first} />);
    rerender(<Probe onReset={second} />);
    (getByTestId('form') as HTMLFormElement).reset();
    await aTask();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops listening on unmount, and a pending reset does not call onReset', async () => {
    const onReset = vi.fn();
    const { getByTestId, unmount } = render(<Probe onReset={onReset} />);
    const form = getByTestId('form') as HTMLFormElement;
    form.reset();
    unmount();
    await aTask();
    form.reset();
    await aTask();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('finds the form of an element that is not a form control, through closest', async () => {
    function Plain({ onReset }: { onReset: () => void }) {
      const ref = useRef<HTMLDivElement>(null);
      useFormReset(ref, onReset);
      return (
        <form data-testid="form">
          <div ref={ref} />
        </form>
      );
    }
    const onReset = vi.fn();
    const { getByTestId } = render(<Plain onReset={onReset} />);
    (getByTestId('form') as HTMLFormElement).reset();
    await aTask();
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('does nothing for an element outside a form', async () => {
    function Alone({ onReset }: { onReset: () => void }) {
      const ref = useRef<HTMLInputElement>(null);
      useFormReset(ref, onReset);
      return <input ref={ref} />;
    }
    const onReset = vi.fn();
    expect(() => render(<Alone onReset={onReset} />)).not.toThrow();
    await aTask();
    expect(onReset).not.toHaveBeenCalled();
  });
});
