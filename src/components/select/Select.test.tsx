import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { Select, SelectGroup, SelectItem, SelectSeparator } from './Select';

// jsdom has no Popover API. This stand-in is enough for a Select to render.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

function Wrapper({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

describe('Select', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders the chosen option and every native option on the server', () => {
    const html = renderToString(
      <Select aria-label="Frequency" name="frequency" defaultValue="weekly">
        <SelectGroup label="Frequency">
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
        </SelectGroup>
      </Select>,
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('[role="combobox"]')?.textContent).toBe('Weekly');
    const native = doc.querySelector('select[name="frequency"]');
    expect(Array.from(native?.querySelectorAll('option') ?? [], (o) => o.value)).toEqual([
      '',
      'daily',
      'weekly',
    ]);
    expect(native?.querySelector('option[value="weekly"]')?.hasAttribute('selected')).toBe(true);
  });

  it('warns about children it cannot read, and skips them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Select aria-label="Sort">
        <SelectItem value="name">Name</SelectItem>
        <Wrapper>
          <SelectItem value="size">Size</SelectItem>
        </Wrapper>
      </Select>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/reads only SelectItem/));
    expect(screen.getAllByRole('option', { hidden: true }).map((o) => o.textContent)).toEqual([
      // The native <select>'s empty option, its "Name", and the listbox's "Name".
      '',
      'Name',
      'Name',
    ]);
  });

  it('warns about an empty value and about a value that matches no item', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Select aria-label="Sort" defaultValue="price">
        <SelectItem value="">Nothing</SelectItem>
        <SelectItem value="name">Name</SelectItem>
      </Select>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/needs a value that is not empty/));
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <Select> has a value that matches no SelectItem: "price".',
    );
  });

  it('warns when a part is rendered outside a Select', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <SelectItem value="a">A</SelectItem>
        <SelectGroup label="G" />
        <SelectSeparator />
      </>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <SelectItem> must be rendered inside a <Select>.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <SelectGroup> must be rendered inside a <Select>.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <SelectSeparator> must be rendered inside a <Select>.',
    );
  });

  it('takes its id, name and description from a Field, and gives the listbox the same name', () => {
    render(
      <Field label="Frequency" description="How often.">
        <Select>
          <SelectItem value="daily">Daily</SelectItem>
        </Select>
      </Field>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Frequency' });
    expect(trigger).toHaveAccessibleDescription('How often.');
    // The listbox is named by the same label (its accessible name is checked in the browser stories).
    const labelledBy = trigger.getAttribute('aria-labelledby');
    expect(labelledBy).toBe(screen.getByText('Frequency').id);
    expect(document.querySelector('.flg-select-listbox')).toHaveAttribute(
      'aria-labelledby',
      labelledBy,
    );
  });

  it('puts className and style on the element around the trigger, and the ref on the trigger', () => {
    let trigger: HTMLButtonElement | null = null;
    render(
      <Select
        aria-label="Sort"
        className="custom"
        style={{ width: 200 }}
        ref={(el) => {
          trigger = el;
        }}
      >
        <SelectItem value="name">Name</SelectItem>
      </Select>,
    );
    const combobox = screen.getByRole('combobox', { name: 'Sort' });
    expect(trigger).toBe(combobox);
    expect(combobox.parentElement).toHaveClass('flg-select', 'custom');
    expect(combobox.parentElement).toHaveStyle({ width: '200px' });
  });
});
