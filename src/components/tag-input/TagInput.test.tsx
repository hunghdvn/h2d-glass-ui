import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { TagInput } from './TagInput';

const input = () => screen.getByRole<HTMLInputElement>('textbox');
const removeButtons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('li button'));
const tagTexts = () =>
  Array.from(document.querySelectorAll('li .flg-tag'), (tag) => tag.firstChild?.textContent);
const hidden = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>('input[type="hidden"]'), (el) => el.value);
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const key = (name: string, init: Partial<KeyboardEventInit> = {}, target: Element = input()) =>
  fireEvent.keyDown(target, { key: name, ...init });
const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const paste = (text: string) =>
  fireEvent.paste(input(), { clipboardData: { getData: () => text } });

describe('TagInput', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  describe('markup and ARIA', () => {
    it('renders a root, a framed list of chips, the text input and one hidden input per tag', () => {
      render(<TagInput aria-label="Skills" name="skills" defaultValue={['React', 'Vue']} />);
      const root = document.querySelector('.flg-tag-input')!;
      expect(root).toHaveAttribute('data-size', 'md');
      const box = root.querySelector('.flg-input.flg-tag-input-box')!;
      expect(box.querySelector(':scope > ul.flg-tag-input-list')).not.toBeNull();
      expect(box.querySelector(':scope > input[type="text"]')).toBe(input());
      expect(tagTexts()).toEqual(['React', 'Vue']);
      expect(document.querySelectorAll('li .flg-badge[data-variant="neutral"]')).toHaveLength(2);
      expect(hidden()).toEqual(['React', 'Vue']);
      expect(root.querySelectorAll('input[type="hidden"][name="skills"]')).toHaveLength(2);
    });

    it('exposes the tags as a list, and names each remove button from labels.remove', () => {
      render(
        <TagInput
          aria-label="Skills"
          defaultValue={['React', 'Vue']}
          labels={{ remove: (tag) => `Xoá ${tag}` }}
        />,
      );
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Xoá React' })).toBeInTheDocument();
    });

    it('names a remove button "Remove <tag>" by default and keeps it out of the tab order', () => {
      render(<TagInput aria-label="Skills" defaultValue={['React']} />);
      const button = screen.getByRole('button', { name: 'Remove React' });
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('puts className and style on the root, the ref and the other props on the text input', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(
        <TagInput
          ref={ref}
          aria-label="Skills"
          className="mine"
          style={{ width: 300 }}
          placeholder="Add"
          id="skills"
          autoComplete="off"
        />,
      );
      const root = document.querySelector('.flg-tag-input')!;
      expect(root).toHaveClass('mine');
      expect(root).toHaveStyle({ width: '300px' });
      expect(ref.current).toBe(input());
      expect(input()).toHaveAttribute('placeholder', 'Add');
      expect(input()).toHaveAttribute('id', 'skills');
      expect(input()).toHaveAttribute('autocomplete', 'off');
      expect(input()).not.toHaveAttribute('name');
    });

    it('takes its id, label, description and state from a Field', () => {
      render(
        <Field label="Skills" description="What you know." error="Add one." required>
          <TagInput name="skills" />
        </Field>,
      );
      expect(screen.getByRole('textbox', { name: /Skills/ })).toBe(input());
      expect(input()).toHaveAccessibleDescription('What you know. Add one.');
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(input()).toBeRequired();
      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-invalid');
      expect(document.querySelector('.flg-tag-input-box')).toHaveAttribute('data-invalid');
    });

    it('marks itself invalid with the invalid prop, disabled and read-only on the root', () => {
      const { rerender } = render(<TagInput aria-label="Skills" invalid />);
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      rerender(<TagInput aria-label="Skills" disabled value={['a']} />);
      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-disabled');
      expect(input()).toBeDisabled();
      expect(removeButtons()[0]).toBeDisabled();
      rerender(<TagInput aria-label="Skills" readOnly value={['a']} />);
      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-readonly');
      expect(input()).toHaveAttribute('readonly');
      expect(removeButtons()[0]).toBeDisabled();
    });

    it('takes the three sizes', () => {
      const { rerender } = render(<TagInput aria-label="Skills" size="sm" />);
      expect(document.querySelector('.flg-tag-input')).toHaveAttribute('data-size', 'sm');
      expect(document.querySelector('.flg-tag-input-box')).toHaveAttribute('data-size', 'sm');
      rerender(<TagInput aria-label="Skills" size="lg" />);
      expect(document.querySelector('.flg-tag-input-box')).toHaveAttribute('data-size', 'lg');
    });

    it('focuses the text input when the frame, but not a chip or a button, is pressed', () => {
      render(<TagInput aria-label="Skills" defaultValue={['React']} />);
      const box = document.querySelector<HTMLElement>('.flg-tag-input-box')!;
      fireEvent.mouseDown(box);
      expect(input()).toHaveFocus();
      input().blur();
      const pressed = fireEvent.mouseDown(removeButtons()[0]!);
      expect(pressed).toBe(true);
      expect(input()).not.toHaveFocus();
    });

    it('renders on the server with its tags, hidden inputs and an empty live region', () => {
      const html = renderToString(
        <TagInput aria-label="Skills" name="skills" defaultValue={['React']} />,
      );
      expect(html).toContain('<input type="hidden" name="skills" value="React"/>');
      expect(html).toContain(
        '<div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>',
      );
    });
  });

  describe('adding tags by typing', () => {
    it('turns the text before a comma into a tag and keeps what follows it typed', () => {
      render(<TagInput aria-label="Skills" />);
      type('React,');
      expect(tagTexts()).toEqual(['React']);
      expect(input()).toHaveValue('');
      type('Vue,Sv');
      expect(tagTexts()).toEqual(['React', 'Vue']);
      expect(input()).toHaveValue('Sv');
    });

    it('trims the text and ignores empty text', () => {
      render(<TagInput aria-label="Skills" />);
      type('  React  ,');
      type(' ,');
      type(',');
      expect(tagTexts()).toEqual(['React']);
    });

    it('adds on Enter when "Enter" is a separator and the input has text, and stops the form', () => {
      render(<TagInput aria-label="Skills" />);
      type('React');
      const notPrevented = key('Enter');
      expect(notPrevented).toBe(false);
      expect(tagTexts()).toEqual(['React']);
      expect(input()).toHaveValue('');
    });

    it('leaves Enter alone on an empty input, so the form submits', () => {
      render(<TagInput aria-label="Skills" defaultValue={['React']} />);
      expect(key('Enter')).toBe(true);
      type('   ');
      expect(key('Enter')).toBe(true);
      expect(tagTexts()).toEqual(['React']);
    });

    it('does not add on Enter when "Enter" is not a separator', () => {
      render(<TagInput aria-label="Skills" separators={[',']} />);
      type('React');
      expect(key('Enter')).toBe(true);
      expect(tagTexts()).toEqual([]);
      expect(input()).toHaveValue('React');
    });

    it('splits at the separators it is given and at no other', () => {
      render(<TagInput aria-label="Skills" separators={[';', 'Enter']} />);
      type('a,b');
      expect(tagTexts()).toEqual([]);
      type('a,b;');
      expect(tagTexts()).toEqual(['a,b']);
    });

    it('keeps duplicates in this task: every non-empty text becomes a tag', () => {
      render(<TagInput aria-label="Skills" />);
      type('a,');
      type('a,');
      expect(tagTexts()).toEqual(['a', 'a']);
    });

    it('leaves text that is being composed alone, and splits it at the next input event', () => {
      render(<TagInput aria-label="Skills" />);
      type('xin');
      // Enter, and a key with the IME's keyCode 229, belong to the input method.
      expect(key('Enter', { isComposing: true })).toBe(true);
      expect(key('Enter', { keyCode: 229 })).toBe(true);
      expect(tagTexts()).toEqual([]);
      // An input event during composition changes the text and splits nothing.
      fireEvent.compositionStart(input());
      fireEvent.change(input(), { target: { value: 'xin,' } });
      expect(tagTexts()).toEqual([]);
      expect(input()).toHaveValue('xin,');
      fireEvent.compositionEnd(input());
      expect(tagTexts()).toEqual([]);
      // The input event after it, or leaving, takes the text.
      fireEvent.change(input(), { target: { value: 'xin,c' } });
      expect(tagTexts()).toEqual(['xin']);
      expect(input()).toHaveValue('c');
    });

    it('splits the separators still in text that was composed when focus leaves', () => {
      render(<TagInput aria-label="Skills" />);
      fireEvent.compositionStart(input());
      fireEvent.change(input(), { target: { value: 'xin,chào' } });
      fireEvent.compositionEnd(input());
      fireEvent.blur(input(), { relatedTarget: document.body });
      expect(tagTexts()).toEqual(['xin', 'chào']);
    });

    it('does not let Backspace or ← move into the tags during composition', () => {
      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
      key('Backspace', { isComposing: true });
      key('ArrowLeft', { keyCode: 229 });
      expect(removeButtons()[0]).not.toHaveFocus();
    });

    it('adds nothing when read-only or disabled', () => {
      render(<TagInput aria-label="Skills" readOnly />);
      type('a,');
      key('Enter');
      paste('a,b');
      expect(tagTexts()).toEqual([]);
    });
  });

  describe('paste', () => {
    it('splits what is pasted at the separators and at line breaks', () => {
      render(<TagInput aria-label="Skills" />);
      input().focus();
      const proceeded = paste('React, Vue\nSvelte,, ');
      expect(proceeded).toBe(false);
      expect(tagTexts()).toEqual(['React', 'Vue', 'Svelte']);
      expect(input()).toHaveValue('');
    });

    it('joins the pasted text to the text around the caret before it splits', () => {
      render(<TagInput aria-label="Skills" defaultInputValue="ab" />);
      input().focus();
      input().setSelectionRange(1, 1);
      paste('X,Y');
      expect(tagTexts()).toEqual(['aX', 'Yb']);
    });

    it('leaves a paste with nothing to split to the browser, as text in the input', () => {
      render(<TagInput aria-label="Skills" />);
      expect(paste('React')).toBe(true);
      expect(tagTexts()).toEqual([]);
    });

    it('does not split at a line break when "Enter" is not a separator', () => {
      render(<TagInput aria-label="Skills" separators={[',']} />);
      expect(paste('a\nb')).toBe(true);
      expect(tagTexts()).toEqual([]);
    });
  });

  describe('leaving with text pending', () => {
    it('adds the pending text as a tag when focus leaves the TagInput', () => {
      render(
        <>
          <TagInput aria-label="Skills" />
          <button>Elsewhere</button>
        </>,
      );
      type('React');
      fireEvent.blur(input(), { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });
      expect(tagTexts()).toEqual(['React']);
      expect(input()).toHaveValue('');
    });

    it('puts the pending text in the hidden inputs before the click that follows the blur', () => {
      // A form's submit button is pressed: the blur adds the tag, and the submit that follows the
      // press must already carry it (spec §3.1).
      render(
        <form>
          <TagInput aria-label="Skills" name="skills" defaultValue={['a']} />
          <button type="submit">Save</button>
        </form>,
      );
      type('React');
      fireEvent.blur(input(), { relatedTarget: screen.getByRole('button', { name: 'Save' }) });
      const form = document.querySelector('form')!;
      expect(new FormData(form).getAll('skills')).toEqual(['a', 'React']);
    });

    it('does not add it when focus moves to the remove button of its own tag', () => {
      render(<TagInput aria-label="Skills" defaultValue={['a']} />);
      type('React');
      fireEvent.blur(input(), { relatedTarget: removeButtons()[0] });
      expect(tagTexts()).toEqual(['a']);
      expect(input()).toHaveValue('React');
    });

    it('adds it when focus leaves from a remove button to outside', () => {
      render(
        <>
          <TagInput aria-label="Skills" defaultValue={['a']} />
          <button>Elsewhere</button>
        </>,
      );
      type('React');
      fireEvent.blur(removeButtons()[0]!, {
        relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }),
      });
      expect(tagTexts()).toEqual(['a', 'React']);
    });

    it('adds nothing for empty text, and nothing when read-only', () => {
      const { rerender } = render(<TagInput aria-label="Skills" />);
      type('  ');
      fireEvent.blur(input());
      expect(tagTexts()).toEqual([]);
      rerender(<TagInput aria-label="Skills" readOnly defaultInputValue="x" />);
      fireEvent.blur(input());
      expect(tagTexts()).toEqual([]);
    });
  });

  describe('keyboard on the tags', () => {
    const three = () => render(<TagInput aria-label="Skills" defaultValue={['a', 'b', 'c']} />);

    it('moves to the last tag with Backspace on an empty input, and with ← at the start', () => {
      three();
      expect(key('Backspace')).toBe(false);
      expect(removeButtons()[2]).toHaveFocus();
      input().focus();
      type('xy');
      input().setSelectionRange(0, 0);
      key('ArrowLeft');
      expect(removeButtons()[2]).toHaveFocus();
    });

    it('leaves Backspace and ← alone when the input has text to act on', () => {
      three();
      type('xy');
      input().setSelectionRange(1, 1);
      expect(key('Backspace')).toBe(true);
      expect(key('ArrowLeft')).toBe(true);
      expect(removeButtons().some((button) => button === document.activeElement)).toBe(false);
    });

    it('leaves keys with Alt, Ctrl or Meta to the browser, and a held key to the input', () => {
      three();
      key('ArrowLeft', { ctrlKey: true });
      key('Backspace', { altKey: true });
      key('Backspace', { repeat: true });
      expect(removeButtons().some((button) => button === document.activeElement)).toBe(false);
    });

    it('removes the tag with Backspace or Delete and focuses the next one', () => {
      three();
      removeButtons()[0]!.focus();
      key('Backspace', {}, removeButtons()[0]!);
      expect(tagTexts()).toEqual(['b', 'c']);
      expect(removeButtons()[0]).toHaveFocus();
      key('Delete', {}, removeButtons()[0]!);
      expect(tagTexts()).toEqual(['c']);
      expect(removeButtons()[0]).toHaveFocus();
    });

    it('focuses the tag before when the last one is removed, and the input when none is left', () => {
      three();
      removeButtons()[2]!.focus();
      key('Delete', {}, removeButtons()[2]!);
      expect(tagTexts()).toEqual(['a', 'b']);
      expect(removeButtons()[1]).toHaveFocus();
      key('Delete', {}, removeButtons()[1]!);
      key('Delete', {}, removeButtons()[0]!);
      expect(tagTexts()).toEqual([]);
      expect(input()).toHaveFocus();
    });

    it('removes a tag with the native click of Enter and Space, keeping the keyboard focus rule', () => {
      three();
      removeButtons()[1]!.focus();
      // A keyboard click has detail 0.
      fireEvent.click(removeButtons()[1]!, { detail: 0 });
      expect(tagTexts()).toEqual(['a', 'c']);
      expect(removeButtons()[1]).toHaveFocus();
    });

    it('puts focus in the input after a pointer click removes a tag', () => {
      three();
      fireEvent.click(removeButtons()[0]!, { detail: 1 });
      expect(tagTexts()).toEqual(['b', 'c']);
      expect(input()).toHaveFocus();
    });

    it('moves between the buttons with ← and →, and to the input past the last', () => {
      three();
      removeButtons()[1]!.focus();
      key('ArrowLeft', {}, removeButtons()[1]!);
      expect(removeButtons()[0]).toHaveFocus();
      key('ArrowLeft', {}, removeButtons()[0]!);
      expect(removeButtons()[0]).toHaveFocus();
      key('ArrowRight', {}, removeButtons()[0]!);
      key('ArrowRight', {}, removeButtons()[1]!);
      expect(removeButtons()[2]).toHaveFocus();
      key('ArrowRight', {}, removeButtons()[2]!);
      expect(input()).toHaveFocus();
    });

    it('goes to the first and the last tag with Home and End', () => {
      three();
      removeButtons()[1]!.focus();
      key('End', {}, removeButtons()[1]!);
      expect(removeButtons()[2]).toHaveFocus();
      key('Home', {}, removeButtons()[2]!);
      expect(removeButtons()[0]).toHaveFocus();
    });

    it('goes back to the input with Esc, and keeps the Esc from a Dialog around it', () => {
      const onKeyDown = vi.fn();
      render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onKeyDown={onKeyDown}>
          <TagInput aria-label="Skills" defaultValue={['a']} />
        </div>,
      );
      removeButtons()[0]!.focus();
      key('Escape', {}, removeButtons()[0]!);
      expect(input()).toHaveFocus();
      expect(onKeyDown).not.toHaveBeenCalled();
    });

    it('sends a printable key from a button to the input, as typed text', () => {
      three();
      type('x');
      removeButtons()[0]!.focus();
      const notDefault = key('y', {}, removeButtons()[0]!);
      expect(notDefault).toBe(false);
      expect(input()).toHaveFocus();
      expect(input()).toHaveValue('xy');
    });

    it('splits a typed separator coming from a button like any other', () => {
      three();
      type('x');
      removeButtons()[0]!.focus();
      key(',', {}, removeButtons()[0]!);
      expect(tagTexts()).toEqual(['a', 'b', 'c', 'x']);
      expect(input()).toHaveFocus();
    });

    it('does not take Space, Enter, Tab, a held key, or a key with a modifier as typing', () => {
      three();
      const button = removeButtons()[0]!;
      button.focus();
      for (const init of [
        { key: ' ' },
        { key: 'Enter' },
        { key: 'Tab' },
        { key: 'a', ctrlKey: true },
        { key: 'a', metaKey: true },
        { key: 'a', isComposing: true },
        { key: 'a', keyCode: 229 },
      ]) {
        fireEvent.keyDown(button, init);
      }
      expect(button).toHaveFocus();
      expect(input()).toHaveValue('');
    });

    it('ignores a held Backspace on a button, so one press cannot delete the row', () => {
      three();
      removeButtons()[2]!.focus();
      key('Backspace', { repeat: true }, removeButtons()[2]!);
      expect(tagTexts()).toEqual(['a', 'b', 'c']);
    });

    it('cannot remove or move to a tag when read-only', () => {
      render(<TagInput aria-label="Skills" readOnly defaultValue={['a']} />);
      key('Backspace');
      expect(tagTexts()).toEqual(['a']);
      expect(removeButtons()[0]).not.toHaveFocus();
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

    it('has an empty polite live region in the root from the first render', () => {
      render(<TagInput aria-label="Skills" />);
      expect(region()).toHaveAttribute('aria-live', 'polite');
      expect(region()).toBeEmptyDOMElement();
      expect(region().parentElement).toHaveClass('flg-tag-input');
    });

    it('says labels.added for a tag that is added, and labels.removed for one that is removed', () => {
      render(<TagInput aria-label="Skills" />);
      type('React,');
      advance(1);
      expect(region()).toHaveTextContent('React added');
      removeButtons()[0]!.focus();
      key('Delete', {}, removeButtons()[0]!);
      advance(1);
      expect(region()).toHaveTextContent('React removed');
    });

    it('takes its words from labels and says every tag of a paste', () => {
      render(
        <TagInput
          aria-label="Skills"
          labels={{ added: (tag) => `Đã thêm ${tag}`, removed: (tag) => `Đã xoá ${tag}` }}
        />,
      );
      paste('a,b');
      advance(1);
      expect(region()).toHaveTextContent('Đã thêm a. Đã thêm b');
    });

    it('does not announce what the parent changes', () => {
      const { rerender } = render(<TagInput aria-label="Skills" value={['a']} />);
      rerender(<TagInput aria-label="Skills" value={['a', 'b']} />);
      advance(1);
      expect(region()).toBeEmptyDOMElement();
    });
  });

  describe('value and text', () => {
    it('starts from defaultValue and defaultInputValue', () => {
      render(<TagInput aria-label="Skills" defaultValue={['a']} defaultInputValue="xy" />);
      expect(tagTexts()).toEqual(['a']);
      expect(input()).toHaveValue('xy');
    });

    it('reports every change of the tags, whole, and of the text', () => {
      const onValueChange = vi.fn();
      const onInputValueChange = vi.fn();
      render(
        <TagInput
          aria-label="Skills"
          defaultValue={['a']}
          onValueChange={onValueChange}
          onInputValueChange={onInputValueChange}
        />,
      );
      type('b,c');
      expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b']);
      expect(onInputValueChange).toHaveBeenCalledWith('c');
      removeButtons()[0]!.focus();
      key('Delete', {}, removeButtons()[0]!);
      expect(onValueChange).toHaveBeenLastCalledWith(['b']);
    });

    it('keeps the tags of a controlled value that the parent does not change', () => {
      const onValueChange = vi.fn();
      render(<TagInput aria-label="Skills" value={['a']} onValueChange={onValueChange} />);
      type('b,');
      expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
      expect(tagTexts()).toEqual(['a']);
    });

    it('follows a controlled value and text', () => {
      function Controlled() {
        const [tags, setTags] = useState(['a']);
        const [text, setText] = useState('');
        return (
          <TagInput
            aria-label="Skills"
            value={tags}
            onValueChange={setTags}
            inputValue={text}
            onInputValueChange={setText}
          />
        );
      }
      render(<Controlled />);
      type('b,c');
      expect(tagTexts()).toEqual(['a', 'b']);
      expect(input()).toHaveValue('c');
    });

    it('adds two tags of one paste in a controlled TagInput without losing the first', () => {
      const onValueChange = vi.fn();
      render(<TagInput aria-label="Skills" value={['a']} onValueChange={onValueChange} />);
      paste('b,c');
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(['a', 'b', 'c']);
    });
  });

  describe('forms', () => {
    const form = () => document.querySelector('form')!;

    it('submits one value per tag under one name', () => {
      render(
        <form>
          <TagInput aria-label="Skills" name="skills" defaultValue={['React', 'Vue']} />
        </form>,
      );
      expect(new FormData(form()).getAll('skills')).toEqual(['React', 'Vue']);
      type('Svelte,');
      expect(new FormData(form()).getAll('skills')).toEqual(['React', 'Vue', 'Svelte']);
    });

    it('submits nothing for the text input, and has no hidden input without a name', () => {
      const { container } = render(
        <form>
          <TagInput aria-label="Skills" defaultValue={['a']} defaultInputValue="pending" />
        </form>,
      );
      expect(Array.from(new FormData(form()).keys())).toEqual([]);
      expect(container.querySelector('input[type="hidden"]')).toBeNull();
    });

    it('does not submit the hidden inputs of a disabled TagInput', () => {
      render(
        <form>
          <TagInput aria-label="Skills" name="skills" defaultValue={['a']} disabled />
        </form>,
      );
      expect(new FormData(form()).getAll('skills')).toEqual([]);
    });

    it('gives the hidden inputs the form attribute of the TagInput', () => {
      render(
        <>
          <form id="f" />
          <TagInput aria-label="Skills" name="skills" form="f" defaultValue={['a']} />
        </>,
      );
      expect(new FormData(document.querySelector('form')!).getAll('skills')).toEqual(['a']);
    });

    it('requires the text input only while there is no tag', () => {
      render(
        <form>
          <TagInput aria-label="Skills" name="skills" required />
        </form>,
      );
      expect(input().required).toBe(true);
      expect(form().checkValidity()).toBe(false);
      type('a,');
      expect(input().required).toBe(false);
      expect(input()).toHaveAttribute('aria-required', 'true');
      expect(form().checkValidity()).toBe(true);
      removeButtons()[0]!.focus();
      key('Delete', {}, removeButtons()[0]!);
      expect(input().required).toBe(true);
    });

    it('resets an uncontrolled value and text to their defaults', async () => {
      render(
        <form>
          <TagInput
            aria-label="Skills"
            name="skills"
            defaultValue={['a']}
            defaultInputValue="pending"
          />
        </form>,
      );
      type('b,');
      type('typed');
      form().reset();
      await aTaskLater();
      expect(tagTexts()).toEqual(['a']);
      expect(input()).toHaveValue('pending');
      expect(new FormData(form()).getAll('skills')).toEqual(['a']);
    });

    it('resets to no tags and no text without defaults', async () => {
      render(
        <form>
          <TagInput aria-label="Skills" name="skills" />
        </form>,
      );
      type('b,c');
      form().reset();
      await aTaskLater();
      expect(tagTexts()).toEqual([]);
      expect(input()).toHaveValue('');
    });

    it('keeps its tags when the reset is cancelled', async () => {
      render(
        <form onReset={(event) => event.preventDefault()}>
          <TagInput aria-label="Skills" name="skills" defaultValue={['a']} />
        </form>,
      );
      type('b,');
      form().reset();
      await aTaskLater();
      expect(tagTexts()).toEqual(['a', 'b']);
    });

    it('keeps the tags and the text of a controlled TagInput on reset', async () => {
      render(
        <form>
          <TagInput
            aria-label="Skills"
            name="skills"
            value={['a', 'b']}
            inputValue="kept"
            defaultValue={['z']}
          />
        </form>,
      );
      form().reset();
      await aTaskLater();
      expect(tagTexts()).toEqual(['a', 'b']);
      expect(input()).toHaveValue('kept');
      expect(new FormData(form()).getAll('skills')).toEqual(['a', 'b']);
    });
  });

  describe('development warnings', () => {
    it('warns about a separator longer than one character other than "Enter", once', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<TagInput aria-label="Skills" separators={['Enter', ', ', 'Tab']} />);
      const messages = warn.mock.calls.map((call) => String(call[0]));
      expect(messages.filter((m) => m.includes('separators'))).toHaveLength(1);
      expect(messages.join()).toContain('", "');
    });

    it('does not warn about "Enter" or one-character separators', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<TagInput aria-label="Skills" separators={['Enter', ',', ';']} />);
      expect(warn).not.toHaveBeenCalled();
    });

    it('names TagInput value and TagInput inputValue when they switch to controlled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(<TagInput aria-label="Skills" />);
      rerender(<TagInput aria-label="Skills" value={['a']} inputValue="x" />);
      const messages = warn.mock.calls.map((call) => String(call[0])).join('\n');
      expect(messages).toContain('TagInput value is changing from uncontrolled to controlled');
      expect(messages).toContain('TagInput inputValue is changing from uncontrolled to controlled');
    });
  });
});
