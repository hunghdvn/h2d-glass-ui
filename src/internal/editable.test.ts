import { afterEach, describe, expect, it } from 'vitest';
import { isEditable } from './editable';

function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

describe('isEditable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is true for the controls the user types into', () => {
    const host = mount(
      '<input id="a"><input id="b" type="search"><input id="c" type="EMAIL"><textarea id="d"></textarea><select id="e"></select>',
    );
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(isEditable(host.querySelector(`#${id}`)!), id).toBe(true);
    }
  });

  it('is true for a contenteditable element and for a descendant of one', () => {
    const host = mount('<div id="a" contenteditable="true"><b id="b">x</b></div>');
    expect(isEditable(host.querySelector('#a')!)).toBe(true);
    expect(isEditable(host.querySelector('#b')!)).toBe(true);
  });

  it('is false for an input that takes no text, and for contenteditable="false"', () => {
    const host = mount(
      '<input id="a" type="checkbox"><input id="b" type="BUTTON"><input id="c" type="range"><div id="d" contenteditable="false"></div><button id="e"></button>',
    );
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(isEditable(host.querySelector(`#${id}`)!), id).toBe(false);
    }
  });

  it('is false for a target that is not an element', () => {
    expect(isEditable(undefined)).toBe(false);
    expect(isEditable(document)).toBe(false);
    expect(isEditable(window)).toBe(false);
  });
});
