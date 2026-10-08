import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
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
    await act(async () => {
      hydrateRoot(container, <Faq onValueChange={onValueChange} />);
    });
    expect(onValueChange).toHaveBeenCalledWith('plans');
    expect(details.open).toBe(true);
    expect(error).not.toHaveBeenCalled();
    container.remove();
  });

  it('warns when a part is rendered outside its parent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <AccordionItem value="lost">
        <AccordionTrigger>Lost</AccordionTrigger>
      </AccordionItem>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <AccordionItem> must be rendered inside an <Accordion>.',
    );
    render(<AccordionTrigger>Alone</AccordionTrigger>);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <AccordionTrigger> must be rendered inside an <AccordionItem>.',
    );
  });
});
