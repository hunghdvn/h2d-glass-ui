import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { Combobox, ComboboxGroup, ComboboxItem, ComboboxSeparator } from './Combobox';

// jsdom has no Popover API. This stand-in is enough for a Combobox to render, as for a Select.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
  // jsdom does not lay out, so it has no scrollIntoView either.
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  Object.assign(HTMLElement.prototype, original);
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});

const cities = (
  <>
    <ComboboxItem value="hn">Hà Nội</ComboboxItem>
    <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
    <ComboboxItem value="hp">Hải Phòng</ComboboxItem>
    <ComboboxItem value="hue">Huế</ComboboxItem>
  </>
);

const input = () => screen.getByRole<HTMLInputElement>('combobox');
const listbox = () => document.querySelector<HTMLElement>('.flg-select-listbox')!;
const optionTexts = () =>
  Array.from(listbox().querySelectorAll('[role="option"]'), (option) => option.textContent);
const highlighted = () => listbox().querySelector('[data-highlighted]')?.textContent;
const option = (name: string) =>
  Array.from(listbox().querySelectorAll<HTMLElement>('[role="option"]')).find(
    (el) => el.textContent === name,
  )!;
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const key = (name: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(input(), { key: name, ...init });
const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

function Wrapper({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

describe('Combobox', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  describe('markup and ARIA', () => {
    it('renders the text of the chosen item and one native option for it on the server', () => {
      const html = renderToString(
        <Combobox aria-label="City" name="city" defaultValue="hn">
          {cities}
        </Combobox>,
      );
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(doc.querySelector<HTMLInputElement>('input[role="combobox"]')?.value).toBe('Hà Nội');
      const native = doc.querySelector('select[name="city"]');
      expect(Array.from(native?.querySelectorAll('option') ?? [], (o) => o.value)).toEqual([
        '',
        'hn',
      ]);
      expect(native?.querySelector('option[value="hn"]')?.hasAttribute('selected')).toBe(true);
      expect(doc.querySelectorAll('[role="option"]')).toHaveLength(0);
    });

    it('is a list-autocomplete combobox whose options exist only while it is open', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      expect(input()).toHaveAttribute('aria-autocomplete', 'list');
      expect(input()).toHaveAttribute('autocomplete', 'off');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).not.toHaveAttribute('aria-controls');
      expect(optionTexts()).toEqual([]);
      act(() => input().focus());
      key('ArrowDown');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(input()).toHaveAttribute('aria-controls', listbox().id);
      expect(listbox()).toHaveAttribute('role', 'listbox');
      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
      expect(input()).toHaveAttribute('aria-activedescendant', option('Hà Nội').id);
    });

    it('shows a status row, and points aria-controls at nothing, when no option is left', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('xyz');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).not.toHaveAttribute('aria-controls');
      expect(input()).not.toHaveAttribute('aria-activedescendant');
      // A listbox must hold options (axe): with only the status row the panel is none.
      expect(listbox()).not.toHaveAttribute('role');
      expect(listbox()).not.toHaveAttribute('aria-label');
      const status = listbox().querySelector('.flg-combobox-status');
      expect(status).toHaveAttribute('role', 'presentation');
      expect(status).toHaveTextContent('No results');
    });

    it('takes the text of the status row from labels.noResults', () => {
      render(
        <Combobox aria-label="City" labels={{ noResults: 'Không có kết quả' }}>
          {cities}
        </Combobox>,
      );
      type('xyz');
      expect(listbox().querySelector('.flg-combobox-status')).toHaveTextContent('Không có kết quả');
    });

    it('takes its id, name and description from a Field, and names the listbox like the input', () => {
      render(
        <Field label="City" description="Where you live.">
          <Combobox>{cities}</Combobox>
        </Field>,
      );
      expect(screen.getByRole('combobox', { name: 'City' })).toBe(input());
      expect(input()).toHaveAccessibleDescription('Where you live.');
      expect(listbox()).toHaveAttribute('aria-labelledby', screen.getByText('City').id);
    });

    it('gives the listbox the aria-label of the input', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      expect(listbox()).toHaveAttribute('aria-label', 'City');
    });

    it('marks the input invalid and required from a Field, and the frame too', () => {
      render(
        <Field label="City" error="Pick one." required>
          <Combobox>{cities}</Combobox>
        </Field>,
      );
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(input()).toHaveAttribute('aria-required', 'true');
      // The visible input is never natively required: the hidden select carries it.
      expect(input()).not.toHaveAttribute('required');
      expect(input().closest('.flg-combobox')).toHaveAttribute('data-invalid');
      expect(input()).toHaveAccessibleDescription('Pick one.');
    });

    it('puts className and style on the root, and the ref on the input', () => {
      let el: HTMLInputElement | null = null;
      render(
        <Combobox
          aria-label="City"
          className="custom"
          style={{ width: 200 }}
          size="lg"
          ref={(node) => {
            el = node;
          }}
        >
          {cities}
        </Combobox>,
      );
      const root = input().closest('.flg-combobox') as HTMLElement;
      expect(root).toHaveClass('custom');
      expect(root).toHaveStyle({ width: '200px' });
      expect(root).toHaveAttribute('data-size', 'lg');
      expect(el).toBe(input());
    });

    it('names a group by its label, and draws a separator as role none', () => {
      render(
        <Combobox aria-label="City" defaultOpen>
          <ComboboxGroup label="North">
            <ComboboxItem value="hn">Hà Nội</ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
        </Combobox>,
      );
      // The popover is not shown in jsdom, so its group is not in the accessibility tree.
      expect(screen.getByRole('group', { name: 'North', hidden: true })).toBeInTheDocument();
      expect(listbox().querySelector('[role="none"].flg-menu-separator')).not.toBeNull();
    });
  });

  describe('the filter', () => {
    it('matches without case and without diacritics, so "ha noi" finds Hà Nội', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('ha noi');
      expect(optionTexts()).toEqual(['Hà Nội']);
    });

    it('matches đ as d, so "da nang" finds Đà Nẵng', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('da nang');
      expect(optionTexts()).toEqual(['Đà Nẵng']);
    });

    it('matches the textValue of an item, not what it shows', () => {
      render(
        <Combobox aria-label="City">
          <ComboboxItem value="hn" textValue="Hà Nội">
            <b>Capital</b>
          </ComboboxItem>
          <ComboboxItem value="dn" textValue="Đà Nẵng">
            <b>Coast</b>
          </ComboboxItem>
        </Combobox>,
      );
      type('nang');
      expect(optionTexts()).toEqual(['Coast']);
    });

    it('uses a filter function, given the item and what was typed', () => {
      const filter = vi.fn(
        (item: { value: string; textValue: string }, text: string) =>
          item.value.startsWith(text) && item.textValue !== 'Huế',
      );
      render(
        <Combobox aria-label="City" filter={filter}>
          {cities}
        </Combobox>,
      );
      type('h');
      expect(optionTexts()).toEqual(['Hà Nội', 'Hải Phòng']);
      expect(filter).toHaveBeenCalledWith({ value: 'hn', textValue: 'Hà Nội' }, 'h');
    });

    it('shows every item with filter={false}', () => {
      render(
        <Combobox aria-label="City" filter={false}>
          {cities}
        </Combobox>,
      );
      type('xyz');
      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
    });

    it('filters only by what was typed: opening by key or press shows every item', () => {
      render(
        <Combobox aria-label="City" defaultValue="dn">
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveValue('Đà Nẵng');
      act(() => input().focus());
      key('ArrowDown');
      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
      // The chosen one is pointed at.
      expect(highlighted()).toBe('Đà Nẵng');
      key('ArrowUp', { altKey: true });
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      fireEvent.pointerDown(input());
      fireEvent.click(input(), { detail: 1 });
      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
      expect(highlighted()).toBe('Đà Nẵng');
    });

    it('shows every item again after a choice, and when it opens anew', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('hu');
      expect(optionTexts()).toEqual(['Huế']);
      key('ArrowDown');
      key('Enter');
      expect(input()).toHaveValue('Huế');
      key('ArrowDown');
      expect(optionTexts()).toHaveLength(4);
      key('ArrowUp', { altKey: true });
      type('ha');
      key('ArrowUp', { altKey: true });
      key('ArrowDown', { altKey: true });
      expect(optionTexts()).toHaveLength(4);
    });

    it('hides a group with no item left, and a separator that would lead or trail', () => {
      render(
        <Combobox aria-label="Item" defaultOpen>
          <ComboboxItem value="a1">Apple</ComboboxItem>
          <ComboboxSeparator />
          <ComboboxGroup label="Berries">
            <ComboboxItem value="b1">Blueberry</ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup label="Citrus">
            <ComboboxItem value="c1">Cherry</ComboboxItem>
            <ComboboxItem value="c2">Lemon</ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxItem value="d1">Date</ComboboxItem>
        </Combobox>,
      );
      const shape = () =>
        Array.from(listbox().children, (el) =>
          el.getAttribute('role') === 'group'
            ? `group:${el.firstElementChild?.textContent}`
            : el.getAttribute('role') === 'none'
              ? '---'
              : el.textContent,
        );
      expect(shape()).toEqual([
        'Apple',
        '---',
        'group:Berries',
        '---',
        'group:Citrus',
        '---',
        'Date',
      ]);
      // Everything has an "e".
      type('e');
      expect(shape()).toHaveLength(7);
      // Cherry and Date go: the separator after the last group left would trail.
      type('l');
      expect(shape()).toEqual(['Apple', '---', 'group:Berries', '---', 'group:Citrus']);
      // Only Lemon: the separators before it would lead.
      type('lem');
      expect(shape()).toEqual(['group:Citrus']);
      type('dat');
      expect(shape()).toEqual(['Date']);
      type('blu');
      expect(shape()).toEqual(['group:Berries']);
    });

    it('does not let two separators meet when the group between them is hidden', () => {
      render(
        <Combobox aria-label="Item" defaultOpen>
          <ComboboxItem value="a">Apple</ComboboxItem>
          <ComboboxSeparator />
          <ComboboxGroup label="Gone">
            <ComboboxItem value="p">Plum</ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxItem value="d">Date</ComboboxItem>
        </Combobox>,
      );
      expect(listbox().querySelectorAll('[role="none"]')).toHaveLength(2);
      type('a');
      expect(optionTexts()).toEqual(['Apple', 'Date']);
      expect(listbox().querySelectorAll('[role="none"]')).toHaveLength(1);
    });
  });

  describe('the match highlight', () => {
    it('wraps the first match of the default filter, by original characters', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('ha');
      expect(optionTexts()).toEqual(['Hà Nội', 'Hải Phòng']);
      // The span holds the characters of the item, with their diacritics: "ha" matches "Hà".
      expect(option('Hà Nội').querySelector('.flg-combobox-match')).toHaveTextContent('Hà');
      expect(option('Hải Phòng').querySelector('.flg-combobox-match')).toHaveTextContent('Hả');
      expect(option('Hà Nội')).toHaveTextContent('Hà Nội');
    });

    it('marks nothing without something typed', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      key('ArrowDown');
      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
      expect(listbox()).not.toHaveAttribute('data-filtering');
    });

    it('marks the match inside the text, and keeps the text whole', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('noi');
      expect(optionTexts()).toEqual(['Hà Nội']);
      const match = option('Hà Nội').querySelector('.flg-combobox-match');
      expect(match).toHaveTextContent('Nội');
      expect(listbox()).toHaveAttribute('data-filtering');
    });

    it('marks nothing when the children of the item are not plain text', () => {
      render(
        <Combobox aria-label="City">
          <ComboboxItem value="hn" textValue="Hà Nội">
            <b>Hà Nội</b>
          </ComboboxItem>
        </Combobox>,
      );
      type('ha');
      expect(optionTexts()).toEqual(['Hà Nội']);
      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
    });

    it('marks nothing with a filter of its own, or with filter={false}', () => {
      const { rerender } = render(
        <Combobox aria-label="City" filter={() => true}>
          {cities}
        </Combobox>,
      );
      type('ha');
      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
      rerender(
        <Combobox aria-label="City" filter={false}>
          {cities}
        </Combobox>,
      );
      expect(listbox().querySelector('.flg-combobox-match')).toBeNull();
      expect(listbox()).not.toHaveAttribute('data-filtering');
    });
  });

  describe('the keyboard', () => {
    it('opens on ArrowDown at the chosen item, or at the first, and moves without looping', () => {
      const { unmount } = render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      key('ArrowDown');
      expect(highlighted()).toBe('Hà Nội');
      key('ArrowDown');
      expect(highlighted()).toBe('Đà Nẵng');
      key('ArrowDown');
      key('ArrowDown');
      key('ArrowDown');
      expect(highlighted()).toBe('Huế');
      expect(input()).toHaveAttribute('aria-activedescendant', option('Huế').id);
      unmount();
      render(
        <Combobox aria-label="City" defaultValue="hp">
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown');
      expect(highlighted()).toBe('Hải Phòng');
    });

    it('opens on ArrowUp at the chosen item, or at the last, and moves up without looping', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      key('ArrowUp');
      expect(highlighted()).toBe('Huế');
      key('ArrowUp');
      key('ArrowUp');
      key('ArrowUp');
      key('ArrowUp');
      expect(highlighted()).toBe('Hà Nội');
    });

    it('skips a disabled item', () => {
      render(
        <Combobox aria-label="City">
          <ComboboxItem value="a">A</ComboboxItem>
          <ComboboxItem value="b" disabled>
            B
          </ComboboxItem>
          <ComboboxItem value="c">C</ComboboxItem>
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown');
      key('ArrowDown');
      expect(highlighted()).toBe('C');
    });

    it('prevents the default of the arrows, so the caret stays put', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      expect(key('ArrowDown')).toBe(false);
      expect(key('ArrowDown')).toBe(false);
      expect(key('ArrowUp')).toBe(false);
    });

    it('opens on Alt+ArrowDown without pointing at anything, and closes on Alt+ArrowUp', () => {
      render(
        <Combobox aria-label="City" defaultValue="dn">
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown', { altKey: true });
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(highlighted()).toBeUndefined();
      expect(input()).not.toHaveAttribute('aria-activedescendant');
      type('x');
      key('ArrowUp', { altKey: true });
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      // The text stays as it was typed.
      expect(input()).toHaveValue('x');
    });

    it('opens when text is typed, and points at nothing', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      type('h');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(highlighted()).toBeUndefined();
      key('ArrowDown');
      expect(highlighted()).toBe('Hà Nội');
      // Typing again drops the highlight.
      type('hu');
      expect(highlighted()).toBeUndefined();
      expect(input()).not.toHaveAttribute('aria-activedescendant');
    });

    it('does not choose anything by typing', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      type('Huế');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('chooses the pointed item on Enter, takes its text, closes, and never submits', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      type('hu');
      key('ArrowDown');
      expect(key('Enter')).toBe(false);
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hue');
      expect(input()).toHaveValue('Huế');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes on Enter with nothing pointed at, changes nothing, and still never submits', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" defaultValue="hn" onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      type('hu');
      expect(key('Enter')).toBe(false);
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).toHaveValue('hu');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('leaves Enter on a closed listbox to the browser, so the form submits', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      expect(key('Enter')).toBe(true);
    });

    it('does not choose a disabled item on Enter', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" onValueChange={onValueChange}>
          <ComboboxItem value="a" disabled>
            A
          </ComboboxItem>
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown');
      key('Enter');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does not act on keys of an input method composing text', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      key('ArrowDown');
      expect(fireEvent.keyDown(input(), { key: 'Enter', isComposing: true })).toBe(true);
      expect(input()).toHaveAttribute('aria-expanded', 'true');
    });

    it('does not act on the Enter that commits a composition in Safari (keyCode 229)', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown');
      expect(highlighted()).toBe('Hà Nội');
      // Safari ends the composition before this keydown, so `isComposing` is already false.
      expect(fireEvent.keyDown(input(), { key: 'Enter', keyCode: 229 })).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(input()).toHaveAttribute('aria-expanded', 'true');
    });

    it('does not block Esc on an open listbox: the browser closes it', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      type('h');
      expect(key('Escape')).toBe(true);
      expect(input()).toHaveValue('h');
    });

    it('puts the text of the chosen item back on Esc when the listbox is closed', () => {
      const onInputValueChange = vi.fn();
      render(
        <Combobox aria-label="City" defaultValue="hn" onInputValueChange={onInputValueChange}>
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      type('xyz');
      key('ArrowUp', { altKey: true });
      expect(input()).toHaveValue('xyz');
      onInputValueChange.mockClear();
      expect(key('Escape')).toBe(false);
      expect(input()).toHaveValue('Hà Nội');
      expect(onInputValueChange).toHaveBeenCalledExactlyOnceWith('Hà Nội');
    });

    it('clears stray text on Esc when nothing is chosen', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      type('xyz');
      key('ArrowUp', { altKey: true });
      expect(key('Escape')).toBe(false);
      expect(input()).toHaveValue('');
    });

    it('leaves Esc alone when there is nothing to put back, so a Dialog closes', () => {
      render(
        <Combobox aria-label="City" defaultValue="hn">
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      expect(key('Escape')).toBe(true);
    });

    it('closes on Tab and chooses nothing, even with an item pointed at', () => {
      const onValueChange = vi.fn();
      render(
        <>
          <Combobox aria-label="City" onValueChange={onValueChange}>
            {cities}
          </Combobox>
          <button type="button">After</button>
        </>,
      );
      act(() => input().focus());
      key('ArrowDown');
      expect(highlighted()).toBe('Hà Nội');
      // Tab is not prevented: focus goes on.
      expect(key('Tab')).toBe(true);
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(input()).toHaveValue('');
    });

    it('lets the caret keys through and drops the highlight', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      for (const name of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        key('ArrowDown');
        expect(highlighted()).toBeDefined();
        expect(key(name)).toBe(true);
        expect(highlighted()).toBeUndefined();
        expect(input()).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });

  describe('the pointer', () => {
    it('points at the option under a mouse or pen, not under a touch', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      key('ArrowDown', { altKey: true });
      fireEvent.pointerMove(option('Huế'), { pointerType: 'mouse' });
      expect(highlighted()).toBe('Huế');
      fireEvent.pointerMove(option('Đà Nẵng'), { pointerType: 'touch' });
      expect(highlighted()).toBe('Huế');
    });

    it('chooses the clicked option, takes its text, and closes', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      type('h');
      fireEvent.click(option('Huế'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hue');
      expect(input()).toHaveValue('Huế');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not choose a disabled option, nor point at it', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" onValueChange={onValueChange}>
          <ComboboxItem value="a" disabled>
            A
          </ComboboxItem>
          <ComboboxItem value="b">B</ComboboxItem>
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown');
      fireEvent.pointerMove(option('A'), { pointerType: 'mouse' });
      expect(highlighted()).toBe('B');
      fireEvent.click(option('A'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(input()).toHaveAttribute('aria-expanded', 'true');
    });

    it('keeps focus on the input when the listbox is pressed', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      key('ArrowDown');
      expect(fireEvent.mouseDown(option('Huế'))).toBe(false);
      expect(fireEvent.mouseDown(listbox())).toBe(false);
    });

    it('opens on a click of the input and closes on the next, as the trigger of a Select does', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      fireEvent.pointerDown(input());
      fireEvent.click(input(), { detail: 1 });
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(input()).toHaveFocus();
      fireEvent.pointerDown(input());
      fireEvent.click(input(), { detail: 1 });
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles on the chevron too, without taking focus from the input', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      const chevron = input().parentElement!.querySelector('.flg-input-adornment')!;
      expect(chevron).toHaveAttribute('aria-hidden', 'true');
      // A press on the chevron keeps the input focused (no blur), as a press on Input's frame does.
      expect(fireEvent.mouseDown(chevron)).toBe(false);
      fireEvent.pointerDown(chevron);
      fireEvent.click(chevron, { detail: 1 });
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(input()).toHaveFocus();
      fireEvent.pointerDown(chevron);
      fireEvent.click(chevron, { detail: 1 });
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not take a press on the input itself away from the input, so the caret is placed', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      expect(fireEvent.mouseDown(input())).toBe(true);
    });

    it('does nothing for a click when it is disabled', () => {
      render(
        <Combobox aria-label="City" disabled>
          {cities}
        </Combobox>,
      );
      expect(input()).toBeDisabled();
      fireEvent.click(input(), { detail: 1 });
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input().closest('.flg-combobox')).toHaveAttribute('data-disabled');
    });

    it('closes when it becomes disabled while open', () => {
      const { rerender } = render(<Combobox aria-label="City">{cities}</Combobox>);
      act(() => input().focus());
      key('ArrowDown');
      rerender(
        <Combobox aria-label="City" disabled>
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('leaving the input', () => {
    function setup(props: Partial<ComponentProps<typeof Combobox>> = {}) {
      const onValueChange = vi.fn();
      const onInputValueChange = vi.fn();
      render(
        <>
          <Combobox
            aria-label="City"
            defaultValue="hn"
            onValueChange={onValueChange}
            onInputValueChange={onInputValueChange}
            {...props}
          >
            {cities}
          </Combobox>
          <button type="button">After</button>
        </>,
      );
      act(() => input().focus());
      return { onValueChange, onInputValueChange };
    }

    it('closes the listbox', () => {
      setup();
      key('ArrowDown');
      act(() => screen.getByRole('button', { name: 'After' }).focus());
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('puts the text of the chosen item back when the text was changed', () => {
      const { onValueChange } = setup();
      type('xyz');
      act(() => screen.getByRole('button', { name: 'After' }).focus());
      expect(input()).toHaveValue('Hà Nội');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('makes the value null when the text is empty: the way to clear it', () => {
      const { onValueChange } = setup();
      type('');
      act(() => screen.getByRole('button', { name: 'After' }).focus());
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
      expect(input()).toHaveValue('');
      expect(input().closest('.flg-combobox')!.querySelector('select')).toHaveValue('');
    });

    it('puts the text back to nothing when stray text is left and nothing is chosen', () => {
      const { onValueChange } = setup({ defaultValue: undefined });
      type('xyz');
      act(() => screen.getByRole('button', { name: 'After' }).focus());
      expect(input()).toHaveValue('');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps a saved value whose item has not arrived, when the user never touched the text', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Controlled and uncontrolled: the text is empty because the item is missing, not because the
      // user emptied it.
      for (const props of [{ value: 'zz' }, { defaultValue: 'zz' }]) {
        const { onValueChange } = setup(props);
        act(() => screen.getByRole('button', { name: 'After' }).focus());
        expect(onValueChange).not.toHaveBeenCalled();
        cleanup();
      }
    });

    it('keeps the text and the value when focus leaves for another window, but closes the listbox', () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false);
      const { onValueChange } = setup();
      type('hu');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      act(() => input().blur());
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).toHaveValue('hu');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps the typed text of an allowCustomValue Combobox on a window switch', () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false);
      const { onValueChange } = setup({ allowCustomValue: true });
      type('Ha');
      act(() => input().blur());
      expect(input()).toHaveValue('Ha');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does nothing when the text is already the chosen one', () => {
      const { onValueChange, onInputValueChange } = setup();
      act(() => screen.getByRole('button', { name: 'After' }).focus());
      expect(onValueChange).not.toHaveBeenCalled();
      expect(onInputValueChange).not.toHaveBeenCalled();
    });
  });

  describe('the value and the text', () => {
    it('shows the text of defaultValue, and of defaultInputValue when given', () => {
      const { unmount } = render(
        <Combobox aria-label="City" defaultValue="hue">
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveValue('Huế');
      unmount();
      render(
        <Combobox aria-label="City" defaultInputValue="hu">
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveValue('hu');
    });

    it('shows nothing for a null value, and a placeholder', () => {
      render(
        <Combobox aria-label="City" value={null} placeholder="Choose a city">
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveValue('');
      expect(input()).toHaveAttribute('placeholder', 'Choose a city');
    });

    it('reports a choice, and keeps the old value when a controlled parent refuses', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" value="hn" onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown');
      fireEvent.click(option('Huế'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hue');
      // jsdom's document has no focus once the input is blurred, which would read as a window switch.
      vi.spyOn(document, 'hasFocus').mockReturnValue(true);
      // The parent kept "hn": leaving puts its text back.
      act(() => input().blur());
      expect(input()).toHaveValue('Hà Nội');
    });

    it('follows a value that the parent changes, and tells onInputValueChange of the new text', () => {
      const onInputValueChange = vi.fn();
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Combobox
          aria-label="City"
          value="hn"
          onValueChange={onValueChange}
          onInputValueChange={onInputValueChange}
        >
          {cities}
        </Combobox>,
      );
      rerender(
        <Combobox
          aria-label="City"
          value="dn"
          onValueChange={onValueChange}
          onInputValueChange={onInputValueChange}
        >
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveValue('Đà Nẵng');
      expect(onInputValueChange).toHaveBeenCalledExactlyOnceWith('Đà Nẵng');
      // A change by the parent is not the user's: no onValueChange.
      expect(onValueChange).not.toHaveBeenCalled();
      rerender(
        <Combobox aria-label="City" value={null} onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveValue('');
    });

    it('takes the text of an item that arrives after the value', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(
        <Combobox aria-label="City" value="hn">
          {null}
        </Combobox>,
      );
      expect(input()).toHaveValue('');
      rerender(
        <Combobox aria-label="City" value="hn">
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveValue('Hà Nội');
    });

    it('controls the text with inputValue, reporting what is typed and what it changes itself', () => {
      const onInputValueChange = vi.fn();
      function Controlled() {
        const [text, setText] = useState('');
        return (
          <Combobox
            aria-label="City"
            inputValue={text}
            onInputValueChange={(next) => {
              onInputValueChange(next);
              setText(next);
            }}
          >
            {cities}
          </Combobox>
        );
      }
      render(<Controlled />);
      type('hu');
      expect(onInputValueChange).toHaveBeenLastCalledWith('hu');
      key('ArrowDown');
      key('Enter');
      expect(onInputValueChange).toHaveBeenLastCalledWith('Huế');
      expect(input()).toHaveValue('Huế');
    });

    it('lets a parent that keeps inputValue keep it', () => {
      render(
        <Combobox aria-label="City" inputValue="fixed" onInputValueChange={() => {}}>
          {cities}
        </Combobox>,
      );
      type('hu');
      expect(input()).toHaveValue('fixed');
    });

    it('chooses the item that is already chosen again, with the text put back', () => {
      const onValueChange = vi.fn();
      render(
        <Combobox aria-label="City" defaultValue="hn" onValueChange={onValueChange}>
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      type('ha');
      fireEvent.click(option('Hà Nội'));
      expect(input()).toHaveValue('Hà Nội');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('marks the chosen option with aria-selected', () => {
      render(
        <Combobox aria-label="City" defaultValue="dn">
          {cities}
        </Combobox>,
      );
      act(() => input().focus());
      key('ArrowDown');
      expect(option('Đà Nẵng')).toHaveAttribute('aria-selected', 'true');
      expect(option('Hà Nội')).toHaveAttribute('aria-selected', 'false');
      // Only forced colours show the check mark of the chosen one.
      expect(option('Đà Nẵng').querySelector('.flg-combobox-check')).not.toBeNull();
      expect(option('Hà Nội').querySelector('.flg-combobox-check')).toBeNull();
    });

    it('follows a controlled open, and reports the closing a choice asks for', () => {
      const onOpenChange = vi.fn();
      render(
        <Combobox aria-label="City" open onOpenChange={onOpenChange}>
          {cities}
        </Combobox>,
      );
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(optionTexts()).toHaveLength(4);
      fireEvent.click(option('Huế'));
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('forgets the typed text when the parent refuses to open, so the item text can still follow', () => {
      const items = (hn: string) => (
        <>
          <ComboboxItem value="hn">{hn}</ComboboxItem>
          <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
        </>
      );
      const props = { 'aria-label': 'City', value: 'hn', open: false, onOpenChange: () => {} };
      const { rerender } = render(<Combobox {...props}>{items('Hà Nội')}</Combobox>);
      act(() => input().focus());
      // The parent keeps open={false}: the typed text is no query of a list that never opened.
      type('Hà');
      rerender(<Combobox {...props}>{items('Hà Nội 2')}</Combobox>);
      expect(input()).toHaveValue('Hà Nội 2');
    });

    it('filters by the text it already has when it is opened by its parent', () => {
      render(
        <Combobox aria-label="City" open defaultInputValue="hu" onOpenChange={() => {}}>
          {cities}
        </Combobox>,
      );
      expect(optionTexts()).toEqual(['Huế']);
    });
  });

  describe('in a form', () => {
    function FormOf(props: Partial<ComponentProps<typeof Combobox>> = {}) {
      return (
        <form>
          <Combobox aria-label="City" name="city" {...props}>
            {cities}
          </Combobox>
        </form>
      );
    }
    const dataOf = (form: HTMLFormElement) => new FormData(form).get('city');

    it('submits the value through the hidden select, and the empty string when nothing is chosen', () => {
      const { container } = render(<FormOf defaultValue="dn" />);
      const form = container.querySelector('form')!;
      expect(dataOf(form)).toBe('dn');
      const native = form.querySelector('select')!;
      expect(native).toHaveAttribute('aria-hidden', 'true');
      expect(native).toHaveAttribute('tabindex', '-1');
      expect(native).toHaveClass('flg-select-native');
      expect(input()).not.toHaveAttribute('name');
      act(() => input().focus());
      // jsdom's document has no focus once the input is blurred, which would read as a window switch.
      vi.spyOn(document, 'hasFocus').mockReturnValue(true);
      type('');
      act(() => input().blur());
      expect(dataOf(form)).toBe('');
    });

    it('follows a choice made by the user', () => {
      const { container } = render(<FormOf />);
      act(() => input().focus());
      key('ArrowDown');
      key('ArrowDown');
      key('Enter');
      expect(dataOf(container.querySelector('form')!)).toBe('dn');
      expect(container.querySelector('select')!.options).toHaveLength(2);
    });

    it('is left out of FormData when disabled', () => {
      const { container } = render(<FormOf defaultValue="dn" disabled />);
      expect(dataOf(container.querySelector('form')!)).toBeNull();
      expect(container.querySelector('select')).toBeDisabled();
    });

    it('stops the submit while required and empty, on the hidden select, not on the input', () => {
      const { container } = render(<FormOf required />);
      const form = container.querySelector('form')!;
      expect(container.querySelector('select')).toBeRequired();
      expect(input()).not.toHaveAttribute('required');
      expect(form.checkValidity()).toBe(false);
      act(() => input().focus());
      key('ArrowDown');
      key('Enter');
      expect(form.checkValidity()).toBe(true);
    });

    it('does not count stray text as a value', () => {
      const { container } = render(<FormOf required />);
      type('abc');
      expect(container.querySelector('form')!.checkValidity()).toBe(false);
    });

    it('sends focus to the input when the browser focuses the hidden select', () => {
      const { container } = render(<FormOf required />);
      act(() => container.querySelector('select')!.focus());
      expect(input()).toHaveFocus();
    });

    it('resets an uncontrolled value to defaultValue, and the text to that of the item', async () => {
      const { container } = render(<FormOf defaultValue="hn" />);
      const form = container.querySelector('form')!;
      act(() => input().focus());
      key('ArrowDown');
      key('ArrowDown');
      key('Enter');
      expect(input()).toHaveValue('Đà Nẵng');
      expect(dataOf(form)).toBe('dn');
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('Hà Nội');
      expect(dataOf(form)).toBe('hn');
    });

    it('resets typed text that was never chosen back to the text of the default', async () => {
      const { container } = render(<FormOf defaultValue="hn" />);
      act(() => input().focus());
      type('xyz');
      container.querySelector('form')!.reset();
      await aTaskLater();
      expect(input()).toHaveValue('Hà Nội');
    });

    it('resets the text to defaultInputValue, and stops filtering by the typed text', async () => {
      const { container } = render(<FormOf defaultInputValue="Hà" />);
      act(() => input().focus());
      type('hu');
      expect(optionTexts()).toEqual(['Huế']);
      container.querySelector('form')!.reset();
      await aTaskLater();
      expect(input()).toHaveValue('Hà');
      // The listbox may still be open, and it filters by nothing the text now says.
      expect(optionTexts()).toEqual(['Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế']);
    });

    it('keeps its value when the reset is cancelled', async () => {
      let allowReset = false;
      render(
        <form
          onReset={(event) => {
            if (!allowReset) event.preventDefault();
          }}
        >
          <Combobox aria-label="City" name="city" defaultValue="hn">
            {cities}
          </Combobox>
        </form>,
      );
      const form = input().closest('form')!;
      act(() => input().focus());
      key('ArrowDown');
      key('ArrowDown');
      key('Enter');
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('Đà Nẵng');
      expect(dataOf(form)).toBe('dn');
      allowReset = true;
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('Hà Nội');
      expect(dataOf(form)).toBe('hn');
    });

    it('keeps a controlled value on reset, and puts the hidden select back in step with it', async () => {
      const { container } = render(<FormOf value="dn" onValueChange={() => {}} />);
      const form = container.querySelector('form')!;
      form.reset();
      await aTaskLater();
      expect(input()).toHaveValue('Đà Nẵng');
      expect(dataOf(form)).toBe('dn');
    });
  });

  describe('an item that leaves the list', () => {
    const withoutDn = <ComboboxItem value="hue">Huế</ComboboxItem>;
    const withDn = (text: string) => (
      <>
        <ComboboxItem value="dn">{text}</ComboboxItem>
        {withoutDn}
      </>
    );
    function Form({
      items,
      ...props
    }: { items: ReactNode } & Partial<ComponentProps<typeof Combobox>>) {
      return (
        <form>
          <Combobox aria-label="City" name="city" required filter={false} {...props}>
            {items}
          </Combobox>
        </form>
      );
    }
    const expectKept = (container: HTMLElement) => {
      const form = container.querySelector('form')!;
      expect(input()).toHaveValue('xyz');
      expect(new FormData(form).get('city')).toBe('dn');
      expect(form.checkValidity()).toBe(true);
    };

    it('keeps the typed text and the submitted value (uncontrolled)', () => {
      const { container, rerender } = render(<Form items={withDn('Đà Nẵng')} />);
      act(() => input().focus());
      key('ArrowDown');
      key('Enter');
      expect(input()).toHaveValue('Đà Nẵng');
      type('xyz');
      rerender(<Form items={withoutDn} />);
      expectKept(container);
    });

    it('keeps the typed text and the submitted value (controlled)', () => {
      const { container, rerender } = render(
        <Form items={withDn('Đà Nẵng')} value="dn" onValueChange={() => {}} />,
      );
      act(() => input().focus());
      type('xyz');
      rerender(<Form items={withoutDn} value="dn" onValueChange={() => {}} />);
      expectKept(container);
    });

    it('leaves the text being typed alone when the item returns with another text', () => {
      const { rerender } = render(<Form items={withDn('Đà Nẵng')} defaultValue="dn" />);
      act(() => input().focus());
      type('xyz');
      rerender(<Form items={withoutDn} defaultValue="dn" />);
      type('đà n');
      rerender(<Form items={withDn('Đà Nẵng, Việt Nam')} defaultValue="dn" />);
      expect(input()).toHaveValue('đà n');
      // Leaving the field puts the item's text back, as it does for any chosen item.
      fireEvent.blur(input(), { relatedTarget: document.body });
      expect(input()).toHaveValue('Đà Nẵng, Việt Nam');
    });

    it('takes the item back, with its text, when it returns', () => {
      const { rerender } = render(<Form items={withDn('Đà Nẵng')} defaultValue="dn" />);
      rerender(<Form items={withoutDn} defaultValue="dn" />);
      expect(input()).toHaveValue('Đà Nẵng');
      rerender(<Form items={withDn('Đà Nẵng (mới)')} defaultValue="dn" />);
      expect(input()).toHaveValue('Đà Nẵng (mới)');
    });
  });

  describe('dev warnings', () => {
    it('warns about children it cannot read, and skips them', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Combobox aria-label="City" defaultOpen>
          <ComboboxItem value="hn">Hà Nội</ComboboxItem>
          <Wrapper>
            <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
          </Wrapper>
        </Combobox>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/reads only ComboboxItem/));
      expect(optionTexts()).toEqual(['Hà Nội']);
    });

    it('warns about an empty value and about one that is not a string', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Combobox aria-label="City">
          <ComboboxItem value="">Nothing</ComboboxItem>
          <ComboboxItem value={5 as unknown as string}>Five</ComboboxItem>
        </Combobox>,
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/ComboboxItem> needs a value that is not empty/),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/ComboboxItem> needs a value that is a string/),
      );
    });

    it('warns about a value that matches no item', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Combobox aria-label="City" defaultValue="sg">
          {cities}
        </Combobox>,
      );
      expect(warn).toHaveBeenCalledWith(
        '[fl-glass-ui] <Combobox> has a value that matches no ComboboxItem: "sg".',
      );
      expect(input()).toHaveValue('');
    });

    it('warns when a part is rendered outside a Combobox', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <ComboboxItem value="a">A</ComboboxItem>
          <ComboboxGroup label="G" />
          <ComboboxSeparator />
        </>,
      );
      for (const part of ['ComboboxItem', 'ComboboxGroup', 'ComboboxSeparator']) {
        expect(warn).toHaveBeenCalledWith(
          `[fl-glass-ui] <${part}> must be rendered inside a <Combobox>.`,
        );
      }
    });

    it('names the prop that switches between controlled and not', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(
        <Combobox aria-label="City" defaultValue="hn">
          {cities}
        </Combobox>,
      );
      rerender(
        <Combobox
          aria-label="City"
          value="hn"
          inputValue="Hà Nội"
          open={false}
          onValueChange={() => {}}
        >
          {cities}
        </Combobox>,
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/\] Combobox value is changing from/),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/\] Combobox inputValue is changing from/),
      );
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\] Combobox open is changing from/));
    });
  });

  describe('allowCustomValue', () => {
    function setup(props: Partial<ComponentProps<typeof Combobox>> = {}) {
      const onValueChange = vi.fn();
      render(
        <form aria-label="F">
          <Combobox
            aria-label="City"
            name="city"
            allowCustomValue
            onValueChange={onValueChange}
            {...props}
          >
            {cities}
          </Combobox>
          <button type="button">After</button>
        </form>,
      );
      act(() => input().focus());
      return { onValueChange };
    }
    const native = () => document.querySelector<HTMLSelectElement>('select')!;
    const leave = () => act(() => screen.getByRole('button', { name: 'After' }).focus());
    /** A key press whose default can be told apart from a prevented one. */
    const press = (name: string) => {
      const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
      act(() => {
        input().dispatchEvent(event);
      });
      return event;
    };

    it('Enter with no highlighted option commits the typed text, closes, and prevents the submit', () => {
      const { onValueChange } = setup();
      type('Quận 1');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(listbox()).toHaveTextContent('No results');
      const event = press('Enter');
      expect(event.defaultPrevented).toBe(true);
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Quận 1');
      expect(input()).toHaveValue('Quận 1');
      expect(listbox()).not.toHaveTextContent('No results');
    });

    it('Enter on a highlighted option still chooses the option', () => {
      const { onValueChange } = setup();
      type('h');
      key('ArrowDown');
      key('Enter');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hn');
      expect(input()).toHaveValue('Hà Nội');
    });

    it('Enter on a closed listbox commits the text and leaves the event to the form', () => {
      const { onValueChange } = setup({ defaultInputValue: 'Quận 1' });
      const event = press('Enter');
      expect(event.defaultPrevented).toBe(false);
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Quận 1');
    });

    it('writes the hidden select on Enter itself, for the submit that follows the keydown', async () => {
      // The browser submits right after the keydown, perhaps before React has rendered: outside act
      // nothing is rendered when the event returns, so only a direct write is seen here.
      vi.spyOn(console, 'error').mockImplementation(() => {});
      setup({ defaultInputValue: 'Quận 1' });
      input().dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      expect(new FormData(native().form!).get('city')).toBe('Quận 1');
      await aTaskLater();
      expect(new FormData(native().form!).get('city')).toBe('Quận 1');
      expect(Array.from(native().options, (o) => o.value)).toEqual(['', 'Quận 1']);
    });

    it('writes the item value on Enter when the text folds to an item', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      setup({ defaultInputValue: 'ha noi' });
      input().dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      expect(new FormData(native().form!).get('city')).toBe('hn');
      await aTaskLater();
      expect(new FormData(native().form!).get('city')).toBe('hn');
      expect(input()).toHaveValue('Hà Nội');
    });

    it('drops the stand-in option once the submit has read it, when a controlled parent refuses the value', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      setup({ value: 'hn', defaultInputValue: 'typed', onValueChange: () => {} });
      input().dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      // The submit that follows the keydown still posts what was typed.
      expect(new FormData(native().form!).get('city')).toBe('typed');
      await aTaskLater();
      // The parent kept "hn": that is what every later submit sends.
      expect(document.querySelector('option[data-pending]')).toBeNull();
      expect(new FormData(native().form!).get('city')).toBe('hn');
    });

    it('leaving commits the text as the value', () => {
      const { onValueChange } = setup();
      type('Quận 1');
      leave();
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Quận 1');
      expect(input()).toHaveValue('Quận 1');
    });

    it('leaving maps text that folds to an item to its value, and shows the item text', () => {
      const { onValueChange } = setup();
      type('ha noi');
      leave();
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hn');
      expect(input()).toHaveValue('Hà Nội');
    });

    it('leaving with the text of the chosen item changes nothing', () => {
      const { onValueChange } = setup({ defaultValue: 'hn' });
      leave();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('leaving with empty text makes the value null', () => {
      const { onValueChange } = setup({ defaultValue: 'hn' });
      type('');
      leave();
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
    });

    it('shows a custom defaultValue as the text', () => {
      setup({ defaultValue: 'Quận 1' });
      expect(input()).toHaveValue('Quận 1');
    });

    it('Esc on a closed listbox with text clears the text and the value, and prevents the default', () => {
      const { onValueChange } = setup({ defaultValue: 'hn' });
      const event = press('Escape');
      expect(event.defaultPrevented).toBe(true);
      expect(input()).toHaveValue('');
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
    });

    it('Esc on a closed listbox with no text is left alone', () => {
      setup();
      expect(press('Escape').defaultPrevented).toBe(false);
    });

    it('Esc on an open listbox changes nothing: the browser closes it', () => {
      const { onValueChange } = setup({ defaultValue: 'hn' });
      key('ArrowDown');
      expect(press('Escape').defaultPrevented).toBe(false);
      expect(input()).toHaveValue('Hà Nội');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('carries a custom value as the option of the hidden select, and in FormData', () => {
      setup();
      type('Quận 1');
      leave();
      expect(native()).toHaveValue('Quận 1');
      expect(Array.from(native().options, (o) => o.value)).toEqual(['', 'Quận 1']);
      expect(new FormData(native().form!).get('city')).toBe('Quận 1');
    });

    it('submits the item value once the text maps to an item', () => {
      setup();
      type('hue');
      leave();
      expect(new FormData(native().form!).get('city')).toBe('hue');
    });

    it('resets to a custom defaultValue', async () => {
      setup({ defaultValue: 'Quận 1' });
      type('x');
      leave();
      act(() => {
        native().form!.reset();
      });
      await aTaskLater();
      expect(input()).toHaveValue('Quận 1');
      expect(native()).toHaveValue('Quận 1');
    });

    it('does not warn that a custom value matches no item', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setup({ defaultValue: 'Quận 1' });
      expect(warn).not.toHaveBeenCalled();
    });

    it('without allowCustomValue, Enter on text only closes, and the value stays the item', () => {
      setup({ allowCustomValue: false, defaultValue: 'hn' });
      type('Quận 1');
      key('Enter');
      expect(native()).toHaveValue('hn');
      expect(input()).toHaveValue('Quận 1');
    });
  });

  describe('loading', () => {
    it('shows the loading label below the options', () => {
      render(
        <Combobox aria-label="City" loading defaultOpen>
          {cities}
        </Combobox>,
      );
      const status = listbox().querySelector('.flg-combobox-status')!;
      expect(status).toHaveTextContent('Loading…');
      expect(status).toHaveAttribute('role', 'presentation');
      expect(listbox().lastElementChild).toBe(status);
      expect(optionTexts()).toHaveLength(4);
      expect(listbox()).toHaveAttribute('role', 'listbox');
    });

    it('shows it instead of "No results" when nothing is left', () => {
      render(
        <Combobox aria-label="City" loading defaultOpen filter={false}>
          <></>
        </Combobox>,
      );
      expect(listbox().querySelectorAll('.flg-combobox-status')).toHaveLength(1);
      expect(listbox()).toHaveTextContent('Loading…');
      expect(listbox()).not.toHaveTextContent('No results');
    });

    it('takes its words from labels.loading', () => {
      render(
        <Combobox aria-label="City" loading defaultOpen labels={{ loading: 'Đang tải…' }}>
          {cities}
        </Combobox>,
      );
      expect(listbox()).toHaveTextContent('Đang tải…');
    });

    it('shows "No results" again once loading ends', () => {
      const { rerender } = render(
        <Combobox aria-label="City" loading defaultOpen filter={false}>
          <></>
        </Combobox>,
      );
      rerender(
        <Combobox aria-label="City" defaultOpen filter={false}>
          <></>
        </Combobox>,
      );
      expect(listbox()).toHaveTextContent('No results');
    });
  });

  describe('announcements', () => {
    const region = () => document.querySelector<HTMLElement>('[aria-live]')!;
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());
    const advance = (ms: number) =>
      act(() => {
        vi.advanceTimersByTime(ms);
      });

    it('has an empty polite live region in the root from the first render, on the server too', () => {
      expect(renderToString(<Combobox aria-label="City">{cities}</Combobox>)).toContain(
        '<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>',
      );
      render(<Combobox aria-label="City">{cities}</Combobox>);
      expect(region()).toHaveAttribute('aria-live', 'polite');
      expect(region()).toBeEmptyDOMElement();
      expect(region().parentElement).toHaveClass('flg-combobox');
    });

    it('says the number of results 500ms after the last keystroke, not before', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('h');
      advance(300);
      type('ha');
      advance(499);
      expect(region()).toBeEmptyDOMElement();
      advance(1);
      expect(region()).toHaveTextContent('2 results');
    });

    it('says "1 result" for one, and labels.noResults for none', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('hue');
      advance(500);
      expect(region()).toHaveTextContent('1 result');
      type('zzz');
      advance(500);
      expect(region()).toHaveTextContent('No results');
    });

    it('takes its words from labels.results and labels.noResults', () => {
      render(
        <Combobox
          aria-label="City"
          labels={{ results: (n) => `${n} kết quả`, noResults: 'Không có' }}
        >
          {cities}
        </Combobox>,
      );
      type('hue');
      advance(500);
      expect(region()).toHaveTextContent('1 kết quả');
      type('zzz');
      advance(500);
      expect(region()).toHaveTextContent('Không có');
    });

    it('says the same sentence twice by clearing the region first', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('hue');
      advance(500);
      expect(region()).toHaveTextContent('1 result');
      type('huế');
      expect(region()).toBeEmptyDOMElement();
      advance(500);
      expect(region()).toHaveTextContent('1 result');
    });

    it('does not announce results while nothing was typed', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      key('ArrowDown');
      advance(1000);
      expect(region()).toBeEmptyDOMElement();
    });

    it('says labels.loading once when loading turns on while the listbox is open', () => {
      const { rerender } = render(
        <Combobox aria-label="City" defaultOpen>
          {cities}
        </Combobox>,
      );
      rerender(
        <Combobox aria-label="City" defaultOpen loading>
          {cities}
        </Combobox>,
      );
      advance(0);
      expect(region()).toHaveTextContent('Loading…');
      // Still loading after another render: not cleared and set again.
      const node = region().firstChild;
      rerender(
        <Combobox aria-label="City" defaultOpen loading className="x">
          {cities}
        </Combobox>,
      );
      advance(10);
      expect(region().firstChild).toBe(node);
    });

    it('does not say it for a closed listbox', () => {
      render(
        <Combobox aria-label="City" loading>
          {cities}
        </Combobox>,
      );
      advance(1000);
      expect(region()).toBeEmptyDOMElement();
    });

    it('says the count once the results arrive after typing while loading', () => {
      const { rerender } = render(
        <Combobox aria-label="City" filter={false}>
          <></>
        </Combobox>,
      );
      type('h');
      rerender(
        <Combobox aria-label="City" filter={false} loading>
          <></>
        </Combobox>,
      );
      advance(1000);
      expect(region()).toHaveTextContent('Loading…');
      rerender(
        <Combobox aria-label="City" filter={false}>
          {cities}
        </Combobox>,
      );
      advance(500);
      expect(region()).toHaveTextContent('4 results');
    });

    it('stays quiet once the listbox closes', () => {
      render(<Combobox aria-label="City">{cities}</Combobox>);
      type('h');
      key('Tab');
      advance(1000);
      expect(region()).toBeEmptyDOMElement();
    });
  });
});
