import { render, screen } from '@testing-library/react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { takesOwnPress } from './controls';

/** A press on `target` as `currentTarget` hears it. */
const pressOn = (target: EventTarget, currentTarget: Element) =>
  takesOwnPress({ target, currentTarget });

/** What the tests put in the document themselves, for `afterEach` to take out. */
const added: Element[] = [];

/**
 * A handle that holds a title and `html`, in the document. The element marked `data-target` is what
 * is pressed: the control itself, or something inside it.
 */
function handleWith(html: string) {
  const handle = document.createElement('div');
  handle.innerHTML = `<span>Edit order</span>${html}`;
  document.body.append(handle);
  added.push(handle);
  return { handle, target: handle.querySelector('[data-target]') as Element };
}

describe('takesOwnPress', () => {
  afterEach(() => added.splice(0).forEach((element) => element.remove()));

  it.each([
    ['a button', '<button type="button"><b data-target>Help</b></button>'],
    ['a link', '<a href="#top"><b data-target>Top</b></a>'],
    ['an input', '<input data-target>'],
    ['a select', '<select data-target><option>New</option></select>'],
    ['a textarea', '<textarea data-target></textarea>'],
    ['a label', '<label><b data-target>Label</b></label>'],
    ['a summary', '<details><summary><b data-target>More</b></summary></details>'],
    ['an iframe', '<iframe data-target title="Map"></iframe>'],
    ['audio with controls', '<audio controls data-target></audio>'],
    ['video with controls', '<video controls data-target></video>'],
    ['contenteditable', '<div contenteditable="true"><b data-target>Note</b></div>'],
    ['contenteditable with no value', '<div contenteditable=""><b data-target>Note</b></div>'],
    [
      'plain-text contenteditable',
      '<div contenteditable="plaintext-only"><b data-target>N</b></div>',
    ],
    ['a tab stop', '<span tabindex="0"><b data-target>Focusable</b></span>'],
    ...[
      'button',
      'link',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'option',
      'tab',
      'checkbox',
      'radio',
      'switch',
      'slider',
      'spinbutton',
      'textbox',
      'combobox',
      'treeitem',
    ].map((role): [string, string] => [
      // As a roving item: out of the tab order, found by its role.
      `a roving ${role}`,
      `<div role="${role}" tabindex="-1"><b data-target>Item</b></div>`,
    ]),
    ['anything in a popover', '<div popover><p><b data-target>Text</b></p></div>'],
    ['anything in a dialog', '<dialog open><p><b data-target>Delete it?</b></p></dialog>'],
  ])('is true for %s inside the element', (_name, html) => {
    const { handle, target } = handleWith(html);
    expect(pressOn(target, handle)).toBe(true);
  });

  it.each([
    ['plain text', '<span><b data-target>DH-1028</b></span>'],
    [
      'a heading that a dialog focuses on opening',
      '<h2 tabindex="-1"><b data-target>Edit</b></h2>',
    ],
    ['an anchor with no href', '<a><b data-target>Anchor</b></a>'],
    ['audio with no controls', '<audio data-target></audio>'],
    ['video with no controls', '<video data-target></video>'],
    ['contenteditable="false"', '<div contenteditable="false"><b data-target>Fixed</b></div>'],
  ])('is false for %s', (_name, html) => {
    const { handle, target } = handleWith(html);
    expect(pressOn(target, handle)).toBe(false);
  });

  it('is false for the element itself, even when it is a control, and for a control around it', () => {
    render(
      <button type="button">
        <span data-testid="handle" role="columnheader" tabIndex={0}>
          Order <span>DH-1028</span>
        </span>
      </button>,
    );
    const handle = screen.getByTestId('handle');
    expect(pressOn(handle, handle)).toBe(false);
    expect(pressOn(screen.getByText('DH-1028'), handle)).toBe(false);
  });

  it('is false for the element in a popover or a dialog of its own', () => {
    const { handle } = handleWith('');
    const popover = document.createElement('div');
    popover.setAttribute('popover', '');
    const dialog = document.createElement('dialog');
    for (const around of [popover, dialog]) {
      document.body.append(around);
      added.push(around);
      around.append(handle);
      expect(pressOn(handle.firstElementChild as Element, handle)).toBe(false);
    }
  });

  it('is true for what is not inside the element in the DOM: a portal under it, the document', () => {
    render(
      <div data-testid="handle">
        Edit order
        {createPortal(<span>In a portal</span>, document.body)}
      </div>,
    );
    const handle = screen.getByTestId('handle');
    expect(pressOn(screen.getByText('In a portal'), handle)).toBe(true);
    expect(pressOn(document, handle)).toBe(true);
  });
});
