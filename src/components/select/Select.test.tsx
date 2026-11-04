import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDiscardable } from '../../../tests/discarded-render';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
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
  // jsdom does not lay out, so it has no scrollIntoView either.
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  Object.assign(HTMLElement.prototype, original);
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});

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
      WARN_PREFIX + ' <Select> has a value that matches no SelectItem: "price".',
    );
  });

  it('tells an empty SelectItem value from one that is not a string', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Select aria-label="Sort">
        <SelectItem value="">Nothing</SelectItem>
        <SelectItem value={5 as unknown as string}>Five</SelectItem>
      </Select>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/needs a value that is not empty/));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/needs a value that is a string/));
  });

  it('names the prop that switches between controlled and not', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <Select aria-label="Sort" defaultValue="a" onValueChange={() => {}}>
        <SelectItem value="a">A</SelectItem>
      </Select>,
    );
    rerender(
      <Select aria-label="Sort" value="a" open={false} onValueChange={() => {}}>
        <SelectItem value="a">A</SelectItem>
      </Select>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\] Select value is changing from/));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\] Select open is changing from/));
  });

  describe('a multiple Select whose value has no item', () => {
    const items = (
      <>
        <SelectItem value="a">A</SelectItem>
        <SelectItem value="b">B</SelectItem>
      </>
    );
    // The listbox's option: the native <select> has one of the same name, and no id.
    const option = (name: string) =>
      screen.getAllByRole('option', { name, hidden: true }).find((o) => o.id !== '')!;

    it('keeps the value where it was when another option is turned on', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onValueChange = vi.fn();
      render(
        <Select multiple aria-label="Tags" value={['gone', 'a']} onValueChange={onValueChange}>
          {items}
        </Select>,
      );
      fireEvent.click(option('B'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['gone', 'a', 'b']);
    });

    it('keeps the value where it was when another option is turned off', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onValueChange = vi.fn();
      render(
        <Select multiple aria-label="Tags" value={['gone', 'a']} onValueChange={onValueChange}>
          {items}
        </Select>,
      );
      fireEvent.click(option('A'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['gone']);
    });

    it('never emits undefined or a repeated value when the value repeats', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onValueChange = vi.fn();
      render(
        <Select multiple aria-label="Tags" value={['a', 'a']} onValueChange={onValueChange}>
          {items}
        </Select>,
      );
      fireEvent.click(option('B'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['a', 'b']);
    });

    it('lets a click on any option toggle it when two items share a value', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onValueChange = vi.fn();
      render(
        <Select multiple aria-label="Tags" value={['a']} onValueChange={onValueChange}>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="a">A again</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </Select>,
      );
      fireEvent.click(option('B'));
      expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b']);
      fireEvent.click(option('A again'));
      expect(onValueChange).toHaveBeenLastCalledWith([]);
    });

    it('keeps the matched values in list order, and it in its place', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onValueChange = vi.fn();
      render(
        <Select multiple aria-label="Tags" value={['b', 'gone']} onValueChange={onValueChange}>
          {items}
        </Select>,
      );
      fireEvent.click(option('A'));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['a', 'gone', 'b']);
    });

    it('warns, and shows and submits only the items it has', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Select
          multiple
          aria-label="Tags"
          name="tags"
          value={['gone', 'a']}
          onValueChange={() => {}}
        >
          {items}
        </Select>,
      );
      expect(warn).toHaveBeenCalledWith(
        WARN_PREFIX + ' <Select> has a value that matches no SelectItem: "gone".',
      );
      const trigger = screen.getByRole('combobox', { name: 'Tags' });
      expect(trigger).toHaveTextContent('A');
      expect(trigger).not.toHaveTextContent('gone');
      const native = document.querySelector<HTMLSelectElement>('select[name="tags"]')!;
      expect(Array.from(native.selectedOptions, (o) => o.value)).toEqual(['a']);
    });
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
      WARN_PREFIX + ' <SelectItem> must be rendered inside a <Select>.',
    );
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <SelectGroup> must be rendered inside a <Select>.',
    );
    expect(warn).toHaveBeenCalledWith(
      WARN_PREFIX + ' <SelectSeparator> must be rendered inside a <Select>.',
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

  it('names a group by its label even when the caller key has whitespace', () => {
    const { container } = render(
      <Select aria-label="Region">
        <SelectGroup key="North America" label="North America">
          <SelectItem value="us">US</SelectItem>
        </SelectGroup>
      </Select>,
    );
    const group = container.querySelector('[role="group"]');
    const labelId = group?.getAttribute('aria-labelledby') ?? '';
    expect(labelId).not.toMatch(/\s/);
    expect(document.getElementById(labelId)?.textContent).toBe('North America');
  });

  it('gives every group its own label id and key when two mapped arrays reuse keys', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const first = ['x', 'y'].map((v) => (
      <SelectGroup key="a" label={`First ${v}`}>
        <SelectItem value={`f-${v}`}>F{v}</SelectItem>
      </SelectGroup>
    ));
    const second = ['x'].map((v) => (
      <SelectGroup key="a" label={`Second ${v}`}>
        <SelectItem value={`s-${v}`}>S{v}</SelectItem>
      </SelectGroup>
    ));
    const { container } = render(
      <Select aria-label="Region">
        {first}
        {second}
      </Select>,
    );
    const groups = Array.from(container.querySelectorAll('[role="group"]'));
    const ids = groups.map((g) => g.getAttribute('aria-labelledby'));
    expect(groups).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids.map((id) => document.getElementById(id ?? '')?.textContent)).toEqual([
      'First x',
      'First y',
      'Second x',
    ]);
    expect(error).not.toHaveBeenCalled();
  });

  describe('a highlight that outlives its option', () => {
    const activeId = (trigger: HTMLElement) => trigger.getAttribute('aria-activedescendant');
    const expectActiveIsUsable = (trigger: HTMLElement) => {
      const id = activeId(trigger);
      if (id === null) return;
      const option = document.getElementById(id);
      expect(option).not.toBeNull();
      expect(option?.getAttribute('aria-disabled')).toBeNull();
    };

    it('does not clear the value on Tab when the options shrink past the highlight', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Select aria-label="Sort" defaultValue="a" onValueChange={onValueChange}>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
          <SelectItem value="c">C</SelectItem>
          <SelectItem value="d">D</SelectItem>
        </Select>,
      );
      const trigger = screen.getByRole('combobox');
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      fireEvent.keyDown(trigger, { key: 'End' });
      expect(activeId(trigger)).toMatch(/option-3$/);
      rerender(
        <Select aria-label="Sort" defaultValue="a" onValueChange={onValueChange}>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </Select>,
      );
      expectActiveIsUsable(trigger);
      fireEvent.keyDown(trigger, { key: 'Tab' });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(trigger.textContent).toBe('A');
    });

    it('does not choose a disabled option on Tab when the highlight lands on one', () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <Select aria-label="Sort" defaultValue="a" onValueChange={onValueChange}>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
          <SelectItem value="c">C</SelectItem>
        </Select>,
      );
      const trigger = screen.getByRole('combobox');
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      fireEvent.keyDown(trigger, { key: 'End' });
      expect(activeId(trigger)).toMatch(/option-2$/);
      rerender(
        <Select aria-label="Sort" defaultValue="a" onValueChange={onValueChange}>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
          <SelectItem value="c" disabled>
            C
          </SelectItem>
        </Select>,
      );
      expectActiveIsUsable(trigger);
      fireEvent.keyDown(trigger, { key: 'Tab' });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(trigger.textContent).toBe('A');
    });

    it('closes once on Tab when a controlled open Select chooses the highlighted option', () => {
      const onOpenChange = vi.fn();
      const onValueChange = vi.fn();
      render(
        <>
          <Select aria-label="Sort" open onOpenChange={onOpenChange} onValueChange={onValueChange}>
            <SelectItem value="a">A</SelectItem>
            <SelectItem value="b">B</SelectItem>
          </Select>
          <input aria-label="Next" />
        </>,
      );
      const trigger = screen.getByRole('combobox');
      act(() => trigger.focus());
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      fireEvent.keyDown(trigger, { key: 'Tab' });
      // The browser then moves focus on, which the trigger's blur must not report again.
      act(() => screen.getByRole('textbox', { name: 'Next' }).focus());
      expect(onValueChange).toHaveBeenCalledWith('b');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('leaves the native options alone while only the highlight moves', () => {
    render(
      <Select aria-label="Sort" defaultValue="a">
        <SelectItem value="a">A</SelectItem>
        <SelectItem value="b">B</SelectItem>
        <SelectItem value="c">C</SelectItem>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const selected = vi.spyOn(HTMLOptionElement.prototype, 'selected', 'set');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'End' });
    expect(selected).not.toHaveBeenCalled();
    // A choice does sync them.
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(selected).toHaveBeenCalled();
    expect(trigger.closest('.flg-select')?.querySelector('select')?.value).toBe('c');
  });

  it('closes when focus leaves the trigger, which holds all of its keyboard', () => {
    const onOpenChange = vi.fn();
    render(
      <>
        <Select aria-label="Sort" onOpenChange={onOpenChange}>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </Select>
        <input aria-label="Other" />
      </>,
    );
    const trigger = screen.getByRole('combobox');
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // App code moves focus (a form library's setFocus, a shortcut handler).
    act(() => screen.getByRole('textbox', { name: 'Other' }).focus());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('treats a space inside a typed search as a character on a closed single Select', () => {
    render(
      <Select aria-label="City">
        <SelectItem value="ny">New York</SelectItem>
        <SelectItem value="nj">New Jersey</SelectItem>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    for (const key of ['n', 'e', 'w', ' ', 'j']) fireEvent.keyDown(trigger, { key });
    expect(trigger.textContent).toBe('New Jersey');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the placeholder, and no warning, for value="" on a single Select', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Select aria-label="Sort" value="" placeholder="Pick one" onValueChange={() => {}}>
        <SelectItem value="a">A</SelectItem>
      </Select>,
    );
    expect(screen.getByRole('combobox').textContent).toBe('Pick one');
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps its value when the form reset is cancelled, and resets a task later otherwise', async () => {
    let allowReset = false;
    render(
      <form
        onReset={(event) => {
          if (!allowReset) event.preventDefault();
        }}
      >
        <Select aria-label="Sort" name="sort" defaultValue="a">
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </Select>
      </form>,
    );
    const trigger = screen.getByRole('combobox');
    const form = trigger.closest('form')!;
    const native = form.querySelector('select')!;
    fireEvent.keyDown(trigger, { key: 'b' });
    expect(trigger.textContent).toBe('B');
    const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    form.reset();
    await aTaskLater();
    expect(trigger.textContent).toBe('B');
    expect(native.value).toBe('b');

    allowReset = true;
    form.reset();
    await aTaskLater();
    expect(trigger.textContent).toBe('A');
    expect(native.value).toBe('a');
  });

  it('closes when it becomes disabled while open, and ignores option clicks', () => {
    const onOpenChange = vi.fn();
    const onValueChange = vi.fn();
    const items = [
      <SelectItem key="a" value="a">
        A
      </SelectItem>,
      <SelectItem key="b" value="b">
        B
      </SelectItem>,
    ];
    const { rerender } = render(
      <Select aria-label="Sort" open onOpenChange={onOpenChange} onValueChange={onValueChange}>
        {items}
      </Select>,
    );
    rerender(
      <Select
        aria-label="Sort"
        open
        disabled
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      >
        {items}
      </Select>,
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getAllByRole('option', { name: 'B', hidden: true }).at(-1)!);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  describe('when React throws a render away', () => {
    const fruit = (...values: string[]) =>
      values.map((value) => (
        <SelectItem key={value} value={value}>
          {value}
        </SelectItem>
      ));

    it('picks the option that a typed letter matches from the options of the last commit', () => {
      const onValueChange = vi.fn();
      const view = renderDiscardable((discarded) => (
        <Select aria-label="Fruit" onValueChange={onValueChange}>
          {fruit('apple', discarded ? 'blueberry' : 'banana')}
        </Select>
      ));
      view.discard();
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'b' });
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('banana');
    });

    it('chooses with a typed letter while it is closed on screen, not open in the discarded render', () => {
      const onValueChange = vi.fn();
      const view = renderDiscardable((discarded) => (
        <Select aria-label="Fruit" open={discarded} onValueChange={onValueChange}>
          {fruit('apple', 'banana')}
        </Select>
      ));
      view.discard();
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'b' });
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('banana');
    });

    it('resets to the default value of the last commit', async () => {
      const view = renderDiscardable((discarded) => (
        <form>
          <Select aria-label="Fruit" name="fruit" defaultValue={discarded ? 'banana' : 'apple'}>
            {fruit('apple', 'banana')}
          </Select>
        </form>
      ));
      view.discard();
      const trigger = screen.getByRole('combobox');
      fireEvent.keyDown(trigger, { key: 'b' });
      expect(trigger.textContent).toBe('banana');
      trigger.closest('form')!.reset();
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
      expect(trigger.textContent).toBe('apple');
    });
  });
});
