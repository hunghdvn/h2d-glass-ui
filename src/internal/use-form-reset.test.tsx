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

  describe('with the id of a form', () => {
    function Named({ id, onReset }: { id?: string; onReset: () => void }) {
      const ref = useRef<HTMLDivElement>(null);
      useFormReset(ref, onReset, id);
      return <div ref={ref} />;
    }

    it('listens to a form outside the tree of the element, a div that has no form of its own', async () => {
      const onReset = vi.fn();
      const { getByTestId } = render(
        <>
          <form id="f" data-testid="form" />
          <Named id="f" onReset={onReset} />
        </>,
      );
      (getByTestId('form') as HTMLFormElement).reset();
      await aTask();
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    // A jsdom iframe is a realm of its own: its `<form>` is no `instanceof` the HTMLFormElement of
    // this window, as with a Slider that a portal puts into the iframe of a preview.
    it('finds a form in an iframe, whose HTMLFormElement is not the one of this window', async () => {
      const onReset = vi.fn();
      const frame = document.createElement('iframe');
      document.body.append(frame);
      const doc = frame.contentDocument!;
      const form = doc.createElement('form');
      form.id = 'f';
      doc.body.append(form);
      render(<Named id="f" onReset={onReset} />, {
        container: doc.body.appendChild(doc.createElement('div')),
      });
      expect(form instanceof HTMLFormElement).toBe(false);
      form.reset();
      await aTask();
      expect(onReset).toHaveBeenCalledTimes(1);
      frame.remove();
    });

    it('prefers the id to the form that holds the element', async () => {
      function Inside({ onReset }: { onReset: () => void }) {
        const ref = useRef<HTMLDivElement>(null);
        useFormReset(ref, onReset, 'other');
        return (
          <form data-testid="around">
            <div ref={ref} />
          </form>
        );
      }
      const onReset = vi.fn();
      const { getByTestId } = render(
        <>
          <form id="other" data-testid="other" />
          <Inside onReset={onReset} />
        </>,
      );
      (getByTestId('around') as HTMLFormElement).reset();
      await aTask();
      expect(onReset).not.toHaveBeenCalled();
      (getByTestId('other') as HTMLFormElement).reset();
      await aTask();
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('listens to no form when the id names none, or names an element that is not a form', async () => {
      const onReset = vi.fn();
      const { getByTestId, rerender } = render(
        <form data-testid="around">
          <Named id="missing" onReset={onReset} />
        </form>,
      );
      (getByTestId('around') as HTMLFormElement).reset();
      await aTask();
      rerender(
        <form data-testid="around">
          <div id="notaform" />
          <Named id="notaform" onReset={onReset} />
        </form>,
      );
      (getByTestId('around') as HTMLFormElement).reset();
      await aTask();
      expect(onReset).not.toHaveBeenCalled();
    });

    it('moves to the new form when the id changes, and leaves the old one', async () => {
      const onReset = vi.fn();
      const forms = (
        <>
          <form id="a" data-testid="a" />
          <form id="b" data-testid="b" />
        </>
      );
      const { getByTestId, rerender } = render(
        <>
          {forms}
          <Named id="a" onReset={onReset} />
        </>,
      );
      rerender(
        <>
          {forms}
          <Named id="b" onReset={onReset} />
        </>,
      );
      (getByTestId('a') as HTMLFormElement).reset();
      await aTask();
      expect(onReset).not.toHaveBeenCalled();
      (getByTestId('b') as HTMLFormElement).reset();
      await aTask();
      expect(onReset).toHaveBeenCalledTimes(1);
    });
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
