import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { renderDiscardable } from '../../../tests/discarded-render';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
import type { AccordionProps } from './Accordion';

function Faq(props: AccordionProps) {
  return (
    <Accordion {...props}>
      <AccordionItem value="trial">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>Yes, 14 days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans?</AccordionTrigger>
        <AccordionContent>At any time.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="legacy" disabled>
        <AccordionTrigger>Legacy plans</AccordionTrigger>
        <AccordionContent>No longer sold.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const item = (title: string) => screen.getByText(title).closest('details') as HTMLDetailsElement;
const toggle = (title: string) => fireEvent.click(screen.getByText(title));

describe('Accordion', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders the open items on the server, and groups a single Accordion by name', () => {
    const doc = new DOMParser().parseFromString(
      renderToString(<Faq defaultValue="plans" />),
      'text/html',
    );
    const items = Array.from(doc.querySelectorAll('details'));
    expect(items.map((details) => details.hasAttribute('open'))).toEqual([false, true, false]);
    const names = new Set(items.map((details) => details.getAttribute('name')));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();
    const multiple = new DOMParser().parseFromString(
      renderToString(<Faq type="multiple" defaultValue={['trial', 'plans']} />),
      'text/html',
    );
    const open = Array.from(multiple.querySelectorAll('details[open]'));
    expect(open).toHaveLength(2);
    expect(multiple.querySelector('details[name]')).toBeNull();
  });

  it('reports the item that opens, and null once it closes again', async () => {
    const onValueChange = vi.fn();
    render(<Faq onValueChange={onValueChange} />);
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('plans'));
    expect(item('Can I change plans?').open).toBe(true);
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(null));
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('reports every open item of a multiple Accordion, in order', async () => {
    const onValueChange = vi.fn();
    render(<Faq type="multiple" defaultValue={['plans']} onValueChange={onValueChange} />);
    toggle('Is there a free trial?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(['trial', 'plans']));
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(['trial']));
  });

  it('puts an item back when a controlled parent refuses the change', async () => {
    const onValueChange = vi.fn();
    render(<Faq value="trial" onValueChange={onValueChange} />);
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('plans'));
    await waitFor(() => expect(item('Can I change plans?').open).toBe(false));
    expect(item('Is there a free trial?').open).toBe(true);
  });

  it('opens nothing on a click until a controlled parent commits the change', async () => {
    const onValueChange = vi.fn();
    function Late() {
      const [value, setValue] = useState<string | null>('trial');
      return (
        <Faq
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setTimeout(() => setValue(next), 30);
          }}
        />
      );
    }
    render(<Late />);
    toggle('Can I change plans?');
    // The click only asked: the items stay as they are until the parent says otherwise.
    expect(item('Can I change plans?').open).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(item('Can I change plans?').open).toBe(false);
    expect(item('Is there a free trial?').open).toBe(true);
    await waitFor(() => expect(item('Can I change plans?').open).toBe(true));
    expect(item('Is there a free trial?').open).toBe(false);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('plans');
  });

  it('puts back an item the browser opened, when a controlled parent refuses it', async () => {
    const onValueChange = vi.fn();
    render(<Faq value="trial" onValueChange={onValueChange} />);
    // As find-in-page does: the browser opens the item that holds a match.
    item('Can I change plans?').open = true;
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('plans'));
    await waitFor(() => expect(item('Can I change plans?').open).toBe(false));
    expect(item('Is there a free trial?').open).toBe(true);
  });

  it('reports once for the two toggles of one change, before React renders', async () => {
    const onValueChange = vi.fn();
    function Parent() {
      const [value, setValue] = useState<string | null>('trial');
      return (
        <Faq
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Parent />);
    const trial = item('Is there a free trial?');
    const plans = item('Can I change plans?');
    // The browser opens one item of the name group and closes the other (find-in-page): two
    // toggle events. React 18 can render after both, so the second still sees the old value.
    plans.open = true;
    trial.open = false;
    plans.dispatchEvent(new Event('toggle'));
    trial.dispatchEvent(new Event('toggle'));
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('plans'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(plans.open).toBe(true);
  });

  it('puts the items of a multiple Accordion back when a controlled parent refuses', async () => {
    const onValueChange = vi.fn();
    render(<Faq type="multiple" value={['trial']} onValueChange={onValueChange} />);
    item('Is there a free trial?').open = false;
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith([]));
    await waitFor(() => expect(item('Is there a free trial?').open).toBe(true));
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it('opens what a controlled parent asks for', () => {
    const { rerender } = render(<Faq value="trial" onValueChange={() => {}} />);
    rerender(<Faq value="plans" onValueChange={() => {}} />);
    expect(item('Can I change plans?').open).toBe(true);
    expect(item('Is there a free trial?').open).toBe(false);
    rerender(<Faq value={null} onValueChange={() => {}} />);
    expect(item('Can I change plans?').open).toBe(false);
  });

  it('leaves the items of an Accordion nested in one of its items to that Accordion', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <Accordion defaultValue="billing" onValueChange={outer}>
        <AccordionItem value="billing">
          <AccordionTrigger>Billing</AccordionTrigger>
          <AccordionContent>
            <Accordion onValueChange={inner}>
              <AccordionItem value="invoices">
                <AccordionTrigger>Invoices</AccordionTrigger>
                <AccordionContent>Monthly.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="plans">
          <AccordionTrigger>Plans</AccordionTrigger>
          <AccordionContent>Three.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    toggle('Invoices');
    await waitFor(() => expect(inner).toHaveBeenLastCalledWith('invoices'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(outer).not.toHaveBeenCalled();
    expect(item('Billing').open).toBe(true);
    toggle('Plans');
    await waitFor(() => expect(outer).toHaveBeenLastCalledWith('plans'));
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('leaves a click on a control inside the trigger to that control', async () => {
    const onValueChange = vi.fn();
    render(
      <Accordion onValueChange={onValueChange}>
        <AccordionItem value="plans">
          <AccordionTrigger>
            Can I change plans? <input type="checkbox" aria-label="Pin" />
          </AccordionTrigger>
          <AccordionContent>At any time.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const pin = screen.getByRole('checkbox', { name: 'Pin' });
    fireEvent.click(pin);
    // As with a native <details>: the checkbox is ticked, and the item stays as it was.
    expect(pin).toBeChecked();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(pin.closest('details')?.open).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a disabled item as it is', async () => {
    const onValueChange = vi.fn();
    render(<Faq onValueChange={onValueChange} />);
    const trigger = screen.getByText('Legacy plans');
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    toggle('Legacy plans');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(item('Legacy plans').open).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps an item the user opened before hydration, and reports it', async () => {
    const onValueChange = vi.fn();
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Faq />);
    document.body.append(container);
    const details = container.querySelectorAll('details')[1] as HTMLDetailsElement;
    details.open = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    // Cleaned up even when an assertion fails, or the next tests find this FAQ twice.
    onTestFinished(() => {
      act(() => root?.unmount());
      container.remove();
    });
    await act(async () => {
      root = hydrateRoot(container, <Faq onValueChange={onValueChange} />);
    });
    expect(onValueChange).toHaveBeenCalledWith('plans');
    expect(details.open).toBe(true);
    expect(error).not.toHaveBeenCalled();
  });

  it('reads only the items that have hydrated, so a value never holds undefined', async () => {
    // Item X sits in a Suspense boundary whose content suspends on the client: its <details> is in
    // the DOM, open, while React has not hydrated it yet.
    let hydrated = true;
    let release = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    function Gate({ children }: { children: ReactNode }) {
      if (!hydrated) throw pending;
      return children;
    }
    function Streamed(props: { onValueChange?: (value: string[]) => void }) {
      return (
        <Accordion type="multiple" defaultValue={['x']} {...props}>
          <AccordionItem value="a">
            <AccordionTrigger>Item A</AccordionTrigger>
            <AccordionContent>A body.</AccordionContent>
          </AccordionItem>
          <Suspense fallback={null}>
            <Gate>
              <AccordionItem value="x">
                <AccordionTrigger>Item X</AccordionTrigger>
                <AccordionContent>X body.</AccordionContent>
              </AccordionItem>
            </Gate>
          </Suspense>
        </Accordion>
      );
    }
    const onValueChange = vi.fn();
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Streamed />);
    document.body.append(container);
    hydrated = false;
    let root: ReturnType<typeof hydrateRoot> | undefined;
    onTestFinished(() => {
      act(() => root?.unmount());
      container.remove();
    });
    await act(async () => {
      root = hydrateRoot(container, <Streamed onValueChange={onValueChange} />);
    });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(item('Item X').open).toBe(true);
    await act(async () => {
      hydrated = true;
      release();
      await pending;
    });
    toggle('Item A');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(['a', 'x']));
    for (const [value] of onValueChange.mock.calls) expect(value).not.toContain(undefined);
  });

  it('warns when a part is rendered outside its parent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <AccordionItem value="lost">
        <AccordionTrigger>Lost</AccordionTrigger>
      </AccordionItem>,
    );
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <AccordionItem> must be rendered inside an <Accordion>.',
    );
    render(<AccordionTrigger>Alone</AccordionTrigger>);
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <AccordionTrigger> must be rendered inside an <AccordionItem>.',
    );
  });

  describe('a value whose item is not rendered yet', () => {
    function Late(props: AccordionProps & { show: boolean }) {
      const { show, ...rest } = props;
      return (
        <Accordion {...rest}>
          {show && (
            <AccordionItem value="a">
              <AccordionTrigger>Item A</AccordionTrigger>
              <AccordionContent>A body.</AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="c">
            <AccordionTrigger>Item C</AccordionTrigger>
            <AccordionContent>C body.</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }
    const wait = () => new Promise((resolve) => setTimeout(resolve, 20));

    it('keeps an uncontrolled defaultValue until the item renders', async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Late type="single" defaultValue="a" onValueChange={onValueChange} show={false} />,
      );
      await wait();
      rerender(<Late type="single" defaultValue="a" onValueChange={onValueChange} show />);
      await wait();
      expect(onValueChange).not.toHaveBeenCalled();
      expect(item('Item A').open).toBe(true);
    });

    it('does not report a controlled value whose item is not rendered yet', async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Late type="single" value="a" onValueChange={onValueChange} show={false} />,
      );
      await wait();
      rerender(<Late type="single" value="a" onValueChange={onValueChange} show />);
      await wait();
      expect(onValueChange).not.toHaveBeenCalled();
      expect(item('Item A').open).toBe(true);
    });

    it('keeps the absent values of a multiple Accordion when another item toggles', async () => {
      const onValueChange = vi.fn();
      render(
        <Late
          type="multiple"
          defaultValue={['a', 'b']}
          onValueChange={onValueChange}
          show={false}
        />,
      );
      toggle('Item C');
      await waitFor(() => expect(onValueChange).toHaveBeenCalled());
      const next = onValueChange.mock.calls.at(-1)?.[0] as string[];
      expect([...next].sort()).toEqual(['a', 'b', 'c']);
    });
  });

  it('asks for the change from the value of the last commit, not of a render React threw away', () => {
    const onValueChange = vi.fn();
    const view = renderDiscardable((discarded) => (
      <Faq value={discarded ? 'plans' : 'trial'} onValueChange={onValueChange} />
    ));
    view.discard();
    // On screen 'trial' is open, so the click closes it. Judged by the discarded 'plans', it would
    // have opened it, and reported 'trial' again.
    toggle('Is there a free trial?');
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
  });
});
