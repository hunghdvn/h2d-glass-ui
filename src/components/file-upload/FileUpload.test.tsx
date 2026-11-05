import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { FileUpload } from './FileUpload';
import type { FileUploadProps } from './FileUpload';

// jsdom has no DataTransfer, and its `input.files` takes only a FileList, which nothing in a test can
// make. So the tests stand in for both: a DataTransfer that collects files into a list, and an
// `input.files` that holds whatever list it is given. A real browser does the same through its own
// classes; the stories check that.
type FileListLike = File[] & { item: (index: number) => File | null };
const listOf = (files: File[]): FileListLike =>
  Object.assign([...files], { item: (index: number) => files[index] ?? null });

class FakeDataTransfer {
  private readonly collected: File[] = [];
  items = { add: (file: File) => void this.collected.push(file) };
  get files() {
    return listOf(this.collected);
  }
}

const held = new WeakMap<HTMLInputElement, FileListLike>();
const nativeFiles = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')!;

const file = (name: string, size = 3, type = 'text/plain') =>
  new File([new Uint8Array(size)], name, { type });
const input = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
const names = (list: ArrayLike<File> | null) => Array.from(list ?? [], (item) => item.name);
const rowNames = () =>
  Array.from(document.querySelectorAll('.flg-file-upload-file-name'), (el) => el.textContent);
const removeButtons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('li button'));
/** What the browser does when the user picks: the input holds the pick alone, then `change`. */
const pick = (...files: File[]) => {
  held.set(input(), listOf(files));
  fireEvent.change(input());
};
const zone = () => document.querySelector<HTMLElement>('.flg-file-upload-zone')!;
/** What a drag carries: the types, the files, and the items with which of them are folders. */
const dataOf = (files: File[], folders: string[] = []) => ({
  types: ['Files'],
  files: listOf(files),
  items: files.map((one) => ({
    kind: 'file',
    getAsFile: () => one,
    webkitGetAsEntry: () => ({ isDirectory: folders.includes(one.name) }),
  })),
});
/**
 * An event that carries `data` as it is. `fireEvent` would copy the data into a `DataTransfer`,
 * which here is the stub above, with read-only properties.
 */
const dragEvent = (type: 'dragOver' | 'drop', target: Element, data: object) => {
  const event = createEvent[type](target);
  Object.defineProperty(event, 'dataTransfer', { value: data });
  return event;
};
const aTaskLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const live = () => document.querySelector('[aria-live="polite"]')!;

describe('FileUpload', () => {
  beforeEach(() => {
    resetDevWarnings();
    vi.stubGlobal('DataTransfer', FakeDataTransfer);
    Object.defineProperty(HTMLInputElement.prototype, 'files', {
      configurable: true,
      get(this: HTMLInputElement) {
        return held.get(this) ?? nativeFiles.get!.call(this);
      },
      set(this: HTMLInputElement, list: FileListLike) {
        held.set(this, list);
      },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.defineProperty(HTMLInputElement.prototype, 'files', nativeFiles);
  });

  describe('markup and names', () => {
    it('renders the zone with the icon, the prompt, the browse word and the file input over it', () => {
      render(<FileUpload />);
      const root = document.querySelector('.flg-file-upload')!;
      const zone = root.querySelector(':scope > .flg-file-upload-zone')!;
      expect(zone.querySelector(':scope > .flg-file-upload-icon svg')).not.toBeNull();
      const prompt = zone.querySelector(':scope > p.flg-file-upload-prompt')!;
      expect(prompt.firstChild?.textContent).toBe('Drag and drop files here or ');
      const browse = prompt.querySelector(':scope > .flg-file-upload-browse')!;
      expect(browse.querySelector(':scope > span[aria-hidden="true"]')).toHaveTextContent('browse');
      expect(browse.querySelector(':scope > input[type="file"]')).toBe(input());
      expect(input()).toHaveAttribute('title', '');
      expect(root.querySelector('ul')).toBeNull();
      expect(root.querySelector('.flg-file-upload-hint')).toBeNull();
      expect(live()).toHaveClass('flg-visually-hidden');
      expect(live()).toHaveAttribute('aria-atomic', 'true');
      expect(live()).toBeEmptyDOMElement();
    });

    it('names the input from labels.browse outside a Field', () => {
      render(<FileUpload />);
      expect(input()).toHaveAccessibleName('browse');
      expect(input()).toHaveAttribute('aria-label', 'browse');
    });

    it('takes the prompt and the browse word from labels', () => {
      render(<FileUpload labels={{ prompt: 'Kéo thả tệp vào đây hoặc ', browse: 'chọn tệp' }} />);
      expect(document.querySelector('.flg-file-upload-prompt')).toHaveTextContent(
        'Kéo thả tệp vào đây hoặc chọn tệp',
      );
      expect(input()).toHaveAccessibleName('chọn tệp');
    });

    it('is named by a label of its own, and gets no fallback aria-label that would beat it', () => {
      const { unmount } = render(
        <>
          <label htmlFor="cv">Résumé</label>
          <FileUpload id="cv" />
        </>,
      );
      expect(input()).toHaveAccessibleName('Résumé');
      expect(input()).not.toHaveAttribute('aria-label');
      unmount();
      render(
        // The FileUpload is the control inside it, which the rule cannot see.
        // eslint-disable-next-line jsx-a11y/label-has-associated-control
        <label>
          Photos
          <FileUpload />
        </label>,
      );
      expect(input()).toHaveAccessibleName(expect.stringContaining('Photos'));
      expect(input()).not.toHaveAttribute('aria-label');
    });

    it('still has the fallback aria-label in the server HTML, so hydration matches', () => {
      expect(renderToString(<FileUpload />)).toContain('aria-label="browse"');
    });

    it('keeps the labels.browse name when aria-label is present but undefined', () => {
      render(<FileUpload aria-label={undefined} />);
      expect(input()).toHaveAccessibleName('browse');
    });

    it('lets aria-label and aria-labelledby name the input instead', () => {
      const { unmount } = render(<FileUpload aria-label="Résumé" />);
      expect(input()).toHaveAccessibleName('Résumé');
      unmount();
      render(
        <>
          <span id="title">Attachments</span>
          <FileUpload aria-labelledby="title" />
        </>,
      );
      expect(input()).toHaveAccessibleName('Attachments');
      expect(input()).not.toHaveAttribute('aria-label');
    });

    it('is named by the label of a Field, which points at the input', () => {
      render(
        <Field label="Attachments" description="PDF only">
          <FileUpload />
        </Field>,
      );
      expect(screen.getByLabelText('Attachments')).toBe(input());
      expect(input()).not.toHaveAttribute('aria-label');
      expect(input()).toHaveAccessibleDescription('PDF only');
    });

    it('puts the props of a native control on the input and the style on the root', () => {
      render(
        <FileUpload
          id="cv"
          name="cv"
          accept=".pdf"
          required
          form="apply"
          aria-label="CV"
          aria-describedby="extra"
          className="mine"
          style={{ width: 300 }}
        />,
      );
      expect(input()).toHaveAttribute('id', 'cv');
      expect(input()).toHaveAttribute('name', 'cv');
      expect(input()).toHaveAttribute('accept', '.pdf');
      expect(input()).toHaveAttribute('form', 'apply');
      expect(input()).toBeRequired();
      expect(input()).toHaveAttribute('aria-describedby', 'extra');
      expect(input()).toHaveAttribute('multiple');
      const root = document.querySelector('.flg-file-upload')!;
      expect(root).toHaveClass('mine');
      expect(root).toHaveStyle({ width: '300px' });
      expect(input()).not.toHaveClass('mine');
    });

    it('takes one file only with multiple={false}', () => {
      render(<FileUpload multiple={false} />);
      expect(input()).not.toHaveAttribute('multiple');
    });

    it('shows the hint under the prompt and adds it to aria-describedby, after the Field ids', () => {
      render(
        <Field label="Attachments" description="Optional">
          <FileUpload hint="PDF, up to 10 MB" aria-describedby="extra" />
        </Field>,
      );
      const hint = document.querySelector<HTMLElement>('p.flg-file-upload-hint')!;
      expect(hint).toHaveTextContent('PDF, up to 10 MB');
      expect(hint.id).not.toBe('');
      const ids = input().getAttribute('aria-describedby')!.split(' ');
      expect(ids).toHaveLength(3);
      expect(ids.slice(1)).toEqual(['extra', hint.id]);
    });

    it('has no describedby when there is nothing to describe it', () => {
      render(<FileUpload />);
      expect(input()).not.toHaveAttribute('aria-describedby');
    });

    it('forwards ref to the file input', () => {
      const ref = createRef<HTMLInputElement>();
      render(<FileUpload ref={ref} />);
      expect(ref.current).toBe(input());
    });

    it('renders on the server with the zone and the input', () => {
      const html = renderToString(<FileUpload name="cv" hint="Hint" />);
      expect(html).toContain('type="file"');
      expect(html).toContain('flg-file-upload-zone');
      expect(html).toContain('aria-live="polite"');
    });
  });

  describe('picking files', () => {
    it('lists a pick with its name and size, and tells onValueChange', () => {
      const onValueChange = vi.fn();
      render(<FileUpload onValueChange={onValueChange} />);
      const a = file('a.pdf', 1500);
      pick(a);
      expect(rowNames()).toEqual(['a.pdf']);
      expect(document.querySelector('.flg-file-upload-file-size')).toHaveTextContent('1.5 kB');
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith([a]);
    });

    it('adds a second pick to the first, and gives onValueChange the whole list', () => {
      const onValueChange = vi.fn();
      render(<FileUpload onValueChange={onValueChange} />);
      const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
      pick(a);
      pick(b, c);
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueChange).toHaveBeenLastCalledWith([a, b, c]);
    });

    it('writes the whole list into input.files after every pick, not the last pick alone', () => {
      render(<FileUpload />);
      pick(file('a.pdf'));
      pick(file('b.pdf'));
      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
    });

    it('replaces the list with the pick when multiple is off', () => {
      const onValueChange = vi.fn();
      render(<FileUpload multiple={false} onValueChange={onValueChange} />);
      pick(file('a.pdf'));
      const b = file('b.pdf');
      pick(b);
      expect(rowNames()).toEqual(['b.pdf']);
      expect(names(input().files)).toEqual(['b.pdf']);
      expect(onValueChange).toHaveBeenLastCalledWith([b]);
    });

    it('keeps the list when the input comes back empty, as when the dialog was cancelled', () => {
      const onValueChange = vi.fn();
      render(<FileUpload defaultValue={[file('a.pdf')]} onValueChange={onValueChange} />);
      pick();
      expect(rowNames()).toEqual(['a.pdf']);
      expect(names(input().files)).toEqual(['a.pdf']);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(live()).toBeEmptyDOMElement();
    });

    it('announces how many files were added', async () => {
      render(<FileUpload />);
      pick(file('a.pdf'));
      await waitFor(() => expect(live()).toHaveTextContent('1 file added'));
      pick(file('b.pdf'), file('c.pdf'));
      await waitFor(() => expect(live()).toHaveTextContent('2 files added'));
    });

    it('announces in the words of labels.added', async () => {
      render(<FileUpload labels={{ added: (count) => `Đã thêm ${count} tệp` }} />);
      pick(file('a.pdf'), file('b.pdf'));
      await waitFor(() => expect(live()).toHaveTextContent('Đã thêm 2 tệp'));
    });

    it('does not report the files of defaultValue as added', () => {
      render(<FileUpload defaultValue={[file('a.pdf')]} />);
      expect(rowNames()).toEqual(['a.pdf']);
      expect(live()).toBeEmptyDOMElement();
    });

    it('keeps its list and leaves the input as the browser set it where there is no DataTransfer', () => {
      vi.stubGlobal('DataTransfer', undefined);
      render(<FileUpload />);
      pick(file('a.pdf'));
      const second = file('b.pdf');
      pick(second);
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
      expect(names(input().files)).toEqual(['b.pdf']);
    });
  });

  describe('the list', () => {
    it('writes one row per file: the icon, the name, the size and the remove button', () => {
      render(<FileUpload defaultValue={[file('a.pdf', 1500), file('b.png', 2_500_000)]} />);
      const rows = document.querySelectorAll('ul.flg-file-upload-list > li.flg-file-upload-file');
      expect(rows).toHaveLength(2);
      const first = rows[0]!;
      expect(first.querySelector('.flg-file-upload-file-icon svg')).not.toBeNull();
      expect(first.querySelector('.flg-file-upload-file-name')).toHaveTextContent('a.pdf');
      expect(first.querySelector('.flg-file-upload-file-size')).toHaveTextContent('1.5 kB');
      expect(rows[1]!.querySelector('.flg-file-upload-file-size')).toHaveTextContent('2.5 MB');
      const button = first.querySelector('button')!;
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAccessibleName('Remove a.pdf');
      expect(button).toHaveAttribute('data-variant', 'ghost');
      expect(button).toHaveAttribute('data-size', 'sm');
    });

    it('names the remove button from labels.remove', () => {
      render(
        <FileUpload defaultValue={[file('a.pdf')]} labels={{ remove: (name) => `Xoá ${name}` }} />,
      );
      expect(screen.getByRole('button', { name: 'Xoá a.pdf' })).toBeInTheDocument();
    });

    it('writes the sizes in the locale', () => {
      render(<FileUpload locale="de-DE" defaultValue={[file('a.pdf', 1500)]} />);
      expect(document.querySelector('.flg-file-upload-file-size')?.textContent).toMatch(
        /^1,5\skB$/,
      );
    });

    it('keeps the row of a file when another is added or removed', () => {
      render(<FileUpload defaultValue={[file('a.pdf'), file('b.pdf')]} />);
      const rowOfB = document.querySelectorAll('li')[1]!;
      pick(file('c.pdf'));
      expect(document.querySelectorAll('li')[1]).toBe(rowOfB);
      fireEvent.click(removeButtons()[0]!);
      expect(document.querySelectorAll('li')[0]).toBe(rowOfB);
    });

    it('lists a file that is twice in the value twice, with no React warning', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const a = file('a.pdf');
        render(<FileUpload defaultValue={[a, a]} />);
        expect(rowNames()).toEqual(['a.pdf', 'a.pdf']);
        expect(error).not.toHaveBeenCalled();
      } finally {
        error.mockRestore();
      }
    });

    it('removes the second of two identical rows and keeps the DOM node of the first', () => {
      const a = file('a.pdf');
      render(<FileUpload defaultValue={[a, a]} />);
      const [first] = document.querySelectorAll('li');
      fireEvent.click(removeButtons()[1]!);
      expect(rowNames()).toEqual(['a.pdf']);
      expect(document.querySelectorAll('li')[0]).toBe(first);
    });
  });

  describe('removing a file', () => {
    it('removes the row, tells onValueChange the rest and writes the rest into input.files', () => {
      const onValueChange = vi.fn();
      const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
      render(<FileUpload defaultValue={[a, b, c]} onValueChange={onValueChange} />);
      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.pdf' }));
      expect(rowNames()).toEqual(['a.pdf', 'c.pdf']);
      expect(onValueChange).toHaveBeenCalledWith([a, c]);
      expect(names(input().files)).toEqual(['a.pdf', 'c.pdf']);
    });

    it('moves focus to the remove button of the next row', () => {
      render(<FileUpload defaultValue={[file('a.pdf'), file('b.pdf'), file('c.pdf')]} />);
      fireEvent.click(removeButtons()[1]!);
      expect(screen.getByRole('button', { name: 'Remove c.pdf' })).toHaveFocus();
      fireEvent.click(removeButtons()[0]!);
      expect(screen.getByRole('button', { name: 'Remove c.pdf' })).toHaveFocus();
    });

    it('moves focus to the previous row when the last one is removed', () => {
      render(<FileUpload defaultValue={[file('a.pdf'), file('b.pdf')]} />);
      fireEvent.click(removeButtons()[1]!);
      expect(screen.getByRole('button', { name: 'Remove a.pdf' })).toHaveFocus();
    });

    it('moves focus to the input when no row is left', () => {
      render(<FileUpload defaultValue={[file('a.pdf')]} />);
      fireEvent.click(removeButtons()[0]!);
      expect(document.querySelector('ul')).toBeNull();
      expect(input()).toHaveFocus();
      expect(names(input().files)).toEqual([]);
    });

    it('does not move focus when a controlled parent keeps the file', () => {
      render(<FileUpload value={[file('a.pdf'), file('b.pdf')]} onValueChange={() => {}} />);
      removeButtons()[0]!.focus();
      fireEvent.click(removeButtons()[0]!);
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
      expect(removeButtons()[0]).toHaveFocus();
    });
  });

  describe('controlled value', () => {
    it('shows value and writes it into input.files', () => {
      render(<FileUpload value={[file('a.pdf'), file('b.pdf')]} />);
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
    });

    it('writes a new value into input.files, and an emptied one', () => {
      const { rerender } = render(<FileUpload value={[file('a.pdf')]} />);
      rerender(<FileUpload value={[file('b.pdf'), file('c.pdf')]} />);
      expect(names(input().files)).toEqual(['b.pdf', 'c.pdf']);
      rerender(<FileUpload value={[]} />);
      expect(names(input().files)).toEqual([]);
    });

    it('puts value back into input.files when the parent turns a pick down', () => {
      const onValueChange = vi.fn();
      render(<FileUpload value={[file('a.pdf')]} onValueChange={onValueChange} />);
      pick(file('b.pdf'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(rowNames()).toEqual(['a.pdf']);
      expect(names(input().files)).toEqual(['a.pdf']);
    });

    it('follows a parent that accepts the pick', () => {
      function Parent() {
        const [files, setFiles] = useState<File[]>([]);
        return <FileUpload value={files} onValueChange={setFiles} />;
      }
      render(<Parent />);
      pick(file('a.pdf'));
      pick(file('b.pdf'));
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
      fireEvent.click(removeButtons()[0]!);
      expect(rowNames()).toEqual(['b.pdf']);
      expect(names(input().files)).toEqual(['b.pdf']);
    });

    it('warns once when it turns from uncontrolled to controlled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(<FileUpload />);
      rerender(<FileUpload value={[]} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('FileUpload value'));
    });
  });

  describe('clicking the zone', () => {
    it('opens the file dialog from a press on the empty zone, the icon or the hint', () => {
      render(<FileUpload hint="Hint" />);
      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
      fireEvent.click(document.querySelector('.flg-file-upload-zone')!);
      fireEvent.click(document.querySelector('.flg-file-upload-icon')!);
      fireEvent.click(document.querySelector('.flg-file-upload-hint')!);
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('leaves a press on the input, on a row and on a remove button alone', () => {
      render(<FileUpload defaultValue={[file('a.pdf')]} />);
      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
      fireEvent.click(input());
      fireEvent.click(document.querySelector('li')!);
      fireEvent.click(removeButtons()[0]!);
      expect(spy).not.toHaveBeenCalled();
    });

    it('leaves a press of another button than the primary alone', () => {
      render(<FileUpload />);
      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
      fireEvent(
        document.querySelector('.flg-file-upload-zone')!,
        createEvent.click(document.querySelector('.flg-file-upload-zone')!, { button: 2 }),
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('opens nothing when disabled', () => {
      render(<FileUpload disabled />);
      const spy = vi.spyOn(input(), 'click').mockImplementation(() => {});
      fireEvent.click(document.querySelector('.flg-file-upload-zone')!);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('states', () => {
    it('disables the input and the remove buttons, and marks the root', () => {
      render(<FileUpload disabled defaultValue={[file('a.pdf')]} />);
      expect(input()).toBeDisabled();
      expect(removeButtons()[0]).toBeDisabled();
      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-disabled');
    });

    it('is disabled by a disabled Field', () => {
      render(
        <Field label="Attachments" disabled>
          <FileUpload />
        </Field>,
      );
      expect(input()).toBeDisabled();
      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-disabled');
    });

    it('marks the input and the root invalid', () => {
      render(<FileUpload invalid />);
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-invalid');
    });

    it('is invalid in a Field with an error, and required in a required Field', () => {
      render(
        <Field label="Attachments" error="Add a file" required>
          <FileUpload />
        </Field>,
      );
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(input()).toBeRequired();
      expect(document.querySelector('.flg-file-upload')).toHaveAttribute('data-invalid');
      expect(input()).toHaveAccessibleDescription('Add a file');
    });

    it('has no state attributes at rest', () => {
      render(<FileUpload />);
      const root = document.querySelector('.flg-file-upload')!;
      expect(root).not.toHaveAttribute('data-disabled');
      expect(root).not.toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-dragging');
    });
  });

  describe('in a form', () => {
    it('belongs to the form named by form, whatever the markup', () => {
      render(
        <>
          <form id="apply" aria-label="Apply" />
          <FileUpload name="cv" form="apply" />
        </>,
      );
      expect(input().form).toBe(screen.getByRole('form'));
    });

    it('puts an uncontrolled FileUpload back to defaultValue when the form is reset', async () => {
      const onValueChange = vi.fn();
      const start = file('start.pdf');
      render(
        <form aria-label="Apply">
          <FileUpload name="cv" defaultValue={[start]} onValueChange={onValueChange} />
        </form>,
      );
      pick(file('a.pdf'));
      expect(rowNames()).toEqual(['start.pdf', 'a.pdf']);
      onValueChange.mockClear();
      // The browser empties the input on a reset, then the library puts the files back.
      held.set(input(), listOf([]));
      fireEvent.reset(screen.getByRole('form'));
      await aTaskLater();
      expect(rowNames()).toEqual(['start.pdf']);
      expect(names(input().files)).toEqual(['start.pdf']);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('empties an uncontrolled FileUpload without a default when the form is reset', async () => {
      render(
        <form aria-label="Apply">
          <FileUpload name="cv" />
        </form>,
      );
      pick(file('a.pdf'));
      held.set(input(), listOf([]));
      fireEvent.reset(screen.getByRole('form'));
      await aTaskLater();
      expect(document.querySelector('ul')).toBeNull();
      expect(names(input().files)).toEqual([]);
    });

    it('keeps the files of a controlled FileUpload when the form is reset, and writes them back', async () => {
      render(
        <form aria-label="Apply">
          <FileUpload name="cv" value={[file('a.pdf')]} onValueChange={() => {}} />
        </form>,
      );
      held.set(input(), listOf([]));
      fireEvent.reset(screen.getByRole('form'));
      await aTaskLater();
      expect(rowNames()).toEqual(['a.pdf']);
      expect(names(input().files)).toEqual(['a.pdf']);
    });

    it('does nothing when the reset is cancelled', async () => {
      render(
        <form aria-label="Apply" onReset={(event) => event.preventDefault()}>
          <FileUpload name="cv" defaultValue={[file('start.pdf')]} />
        </form>,
      );
      pick(file('a.pdf'));
      fireEvent.reset(screen.getByRole('form'));
      await aTaskLater();
      expect(rowNames()).toEqual(['start.pdf', 'a.pdf']);
    });
  });

  describe('checks', () => {
    it('turns down a file of the wrong type with code type and labels.type', () => {
      const onReject = vi.fn();
      render(<FileUpload accept=".pdf" onReject={onReject} />);
      const bad = file('a.png', 3, 'image/png');
      pick(bad);
      expect(onReject).toHaveBeenCalledWith([
        { file: bad, errors: [{ code: 'type', message: 'File type not supported' }] },
      ]);
      expect(rowNames()).toEqual(['a.png']);
    });

    it('turns down a file over maxSize with the size written in the locale', () => {
      const onReject = vi.fn();
      render(<FileUpload maxSize={1500} locale="de-DE" onReject={onReject} />);
      pick(file('a.pdf', 1501));
      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
        { code: 'size', message: 'File is larger than 1,5 kB' },
      ]);
    });

    it('accepts a file of exactly maxSize', () => {
      const onReject = vi.fn();
      render(<FileUpload maxSize={1500} onReject={onReject} />);
      pick(file('a.pdf', 1500));
      expect(onReject).not.toHaveBeenCalled();
      expect(rowNames()).toEqual(['a.pdf']);
    });

    it("accepts a file when validate returns an empty string, as setCustomValidity('') does", () => {
      const onReject = vi.fn();
      render(<FileUpload validate={() => ''} onReject={onReject} />);
      pick(file('a.pdf'));
      expect(onReject).not.toHaveBeenCalled();
      expect(rowNames()).toEqual(['a.pdf']);
    });

    it('turns down what validate refuses with its sentence, and accepts on null', () => {
      const onReject = vi.fn();
      render(
        <FileUpload
          validate={(one) => (one.name.startsWith('x') ? 'No x files' : null)}
          onReject={onReject}
        />,
      );
      pick(file('xa.pdf'), file('b.pdf'));
      expect(onReject.mock.calls[0]![0]).toHaveLength(1);
      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
        { code: 'custom', message: 'No x files' },
      ]);
      expect(rowNames()).toEqual(['b.pdf', 'xa.pdf']);
    });

    it('counts the files held and those added earlier in the same turn against maxFiles', () => {
      const onReject = vi.fn();
      const onValueChange = vi.fn();
      render(<FileUpload maxFiles={3} onReject={onReject} onValueChange={onValueChange} />);
      pick(file('a.pdf'), file('b.pdf'));
      pick(file('c.pdf'), file('d.pdf'), file('e.pdf'));
      expect(onValueChange.mock.lastCall![0].map((one: File) => one.name)).toEqual([
        'a.pdf',
        'b.pdf',
        'c.pdf',
      ]);
      expect(onReject).toHaveBeenCalledTimes(1);
      expect(onReject.mock.calls[0]![0].map((r: { file: File }) => r.file.name)).toEqual([
        'd.pdf',
        'e.pdf',
      ]);
      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
        { code: 'count', message: 'Up to 3 files' },
      ]);
    });

    it('does not count a file that was turned down for another reason', () => {
      render(<FileUpload accept=".pdf" maxFiles={1} />);
      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
      expect(rowNames()).toEqual(['b.pdf', 'a.png']);
      expect(document.querySelectorAll('[data-rejected]')).toHaveLength(1);
    });

    it('gives a file every error it has, in the order type, size, custom, count', () => {
      const onReject = vi.fn();
      render(
        <FileUpload
          accept=".pdf"
          maxSize={1}
          maxFiles={1}
          validate={() => 'Nope'}
          defaultValue={[file('held.pdf')]}
          onReject={onReject}
        />,
      );
      pick(file('a.png', 5, 'image/png'));
      expect(onReject.mock.calls[0]![0][0].errors.map((e: { code: string }) => e.code)).toEqual([
        'type',
        'size',
        'custom',
        'count',
      ]);
    });

    it('shows the first error of a file in its row, instead of the size', () => {
      render(<FileUpload accept=".pdf" maxSize={1} />);
      pick(file('a.png', 5, 'image/png'));
      const row = document.querySelector('[data-rejected]')!;
      expect(row.querySelector('.flg-file-upload-file-error')).toHaveTextContent(
        'File type not supported',
      );
      expect(row.querySelector('.flg-file-upload-file-size')).toBeNull();
      expect(row.querySelector('.flg-file-upload-file-name')).toHaveTextContent('a.png');
    });

    it('reads the messages from labels', () => {
      const onReject = vi.fn();
      render(
        <FileUpload
          accept=".pdf"
          maxFiles={1}
          defaultValue={[file('held.pdf')]}
          labels={{ type: 'Sai loại', count: (max) => `Tối đa ${max}` }}
          onReject={onReject}
        />,
      );
      pick(file('a.png', 3, 'image/png'));
      expect(onReject.mock.calls[0]![0][0].errors).toEqual([
        { code: 'type', message: 'Sai loại' },
        { code: 'count', message: 'Tối đa 1' },
      ]);
    });

    it('judges a dropped file with no type by its extension against accept', () => {
      const onReject = vi.fn();
      render(<FileUpload accept=".pdf,image/*" onReject={onReject} />);
      act(() => {
        fireEvent.drop(zone(), { dataTransfer: dataOf([file('a.pdf', 3, ''), file('b', 3, '')]) });
      });
      expect(onReject.mock.calls[0]![0].map((r: { file: File }) => r.file.name)).toEqual(['b']);
      expect(rowNames()).toEqual(['a.pdf', 'b']);
    });

    it('with multiple off judges the first file as usual and turns down the others with count', () => {
      const onReject = vi.fn();
      const onValueChange = vi.fn();
      render(
        <FileUpload
          multiple={false}
          defaultValue={[file('old.pdf')]}
          onReject={onReject}
          onValueChange={onValueChange}
        />,
      );
      const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
      act(() => {
        fireEvent.drop(zone(), { dataTransfer: dataOf([a, b, c]) });
      });
      expect(onValueChange).toHaveBeenCalledWith([a]);
      expect(onReject.mock.calls[0]![0]).toEqual([
        { file: b, errors: [{ code: 'count', message: 'Only 1 file' }] },
        { file: c, errors: [{ code: 'count', message: 'Only 1 file' }] },
      ]);
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    });

    it('with multiple off keeps the old file when the first of the turn is turned down', () => {
      const onValueChange = vi.fn();
      render(
        <FileUpload
          multiple={false}
          accept=".pdf"
          defaultValue={[file('old.pdf')]}
          onValueChange={onValueChange}
        />,
      );
      act(() => {
        fireEvent.drop(zone(), {
          dataTransfer: dataOf([file('a.png', 3, 'image/png'), file('b.pdf')]),
        });
      });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(rowNames()).toEqual(['old.pdf', 'a.png', 'b.pdf']);
      expect(document.querySelectorAll('[data-rejected]')).toHaveLength(2);
    });

    it('calls onValueChange only when something is accepted, and onReject only when something is turned down', () => {
      const onValueChange = vi.fn();
      const onReject = vi.fn();
      render(<FileUpload accept=".pdf" onValueChange={onValueChange} onReject={onReject} />);
      pick(file('a.png', 3, 'image/png'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(onReject).toHaveBeenCalledTimes(1);
      pick(file('b.pdf'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onReject).toHaveBeenCalledTimes(1);
    });
  });

  describe('rejected rows', () => {
    it('keeps them out of value and out of input.files, after the accepted rows in order', () => {
      const onValueChange = vi.fn();
      render(<FileUpload accept=".pdf" onValueChange={onValueChange} />);
      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
      pick(file('c.png', 3, 'image/png'));
      pick(file('d.pdf'));
      expect(rowNames()).toEqual(['b.pdf', 'd.pdf', 'a.png', 'c.png']);
      expect(names(input().files)).toEqual(['b.pdf', 'd.pdf']);
      expect(onValueChange.mock.lastCall![0].map((f: File) => f.name)).toEqual(['b.pdf', 'd.pdf']);
      const rows = document.querySelectorAll('.flg-file-upload-file');
      expect(rows[0]).not.toHaveAttribute('data-rejected');
      expect(rows[2]).toHaveAttribute('data-rejected');
    });

    it('shows them under a controlled value that does not hold them', () => {
      render(<FileUpload accept=".pdf" value={[file('a.pdf')]} onValueChange={() => {}} />);
      pick(file('b.png', 3, 'image/png'));
      expect(rowNames()).toEqual(['a.pdf', 'b.png']);
      expect(names(input().files)).toEqual(['a.pdf']);
    });

    it('describes the remove button of a rejected row by its reason, and no other', () => {
      render(<FileUpload accept=".pdf" />);
      pick(file('a.pdf'), file('b.png', 3, 'image/png'), file('c.gif', 3, 'image/gif'));
      const [accepted, ...turnedDown] = removeButtons();
      expect(accepted).not.toHaveAttribute('aria-describedby');
      expect(turnedDown).toHaveLength(2);
      for (const button of turnedDown) {
        expect(button).toHaveAccessibleDescription('File type not supported');
      }
      const ids = turnedDown.map((button) => button.getAttribute('aria-describedby'));
      expect(new Set(ids).size).toBe(2);
    });

    it('lists a file turned down twice as two rows', () => {
      render(<FileUpload accept=".pdf" />);
      const bad = file('a.png', 3, 'image/png');
      pick(bad);
      pick(bad);
      expect(rowNames()).toEqual(['a.png', 'a.png']);
    });

    it('removes only that row, and moves focus to the button that takes its place', () => {
      const onValueChange = vi.fn();
      render(<FileUpload accept=".pdf" onValueChange={onValueChange} />);
      pick(file('ok.pdf'));
      pick(
        file('a.png', 3, 'image/png'),
        file('b.png', 3, 'image/png'),
        file('c.png', 3, 'image/png'),
      );
      onValueChange.mockClear();
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.png' }));
      expect(rowNames()).toEqual(['ok.pdf', 'a.png', 'c.png']);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(names(input().files)).toEqual(['ok.pdf']);
      expect(screen.getByRole('button', { name: 'Remove c.png' })).toHaveFocus();
      fireEvent.click(screen.getByRole('button', { name: 'Remove c.png' }));
      expect(screen.getByRole('button', { name: 'Remove a.png' })).toHaveFocus();
    });

    it('moves focus from a removed accepted row to the first rejected row after it', () => {
      render(<FileUpload accept=".pdf" />);
      pick(file('ok.pdf'), file('a.png', 3, 'image/png'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove ok.pdf' }));
      expect(screen.getByRole('button', { name: 'Remove a.png' })).toHaveFocus();
    });

    it('moves focus to the input when the last rejected row goes', () => {
      render(<FileUpload accept=".pdf" />);
      pick(file('a.png', 3, 'image/png'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
      expect(document.querySelector('ul')).toBeNull();
      expect(input()).toHaveFocus();
    });

    it('clears them when the form is reset', async () => {
      render(
        <form aria-label="Apply">
          <FileUpload accept=".pdf" name="cv" />
        </form>,
      );
      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
      held.set(input(), listOf([]));
      fireEvent.reset(screen.getByRole('form'));
      await aTaskLater();
      expect(rowNames()).toEqual([]);
    });

    it('disables their remove buttons with the rest', () => {
      const { rerender } = render(<FileUpload accept=".pdf" />);
      pick(file('a.png', 3, 'image/png'));
      rerender(<FileUpload accept=".pdf" disabled />);
      expect(screen.getByRole('button', { name: 'Remove a.png' })).toBeDisabled();
    });
  });

  describe('announcements of additions and rejections', () => {
    it('says only what was added when nothing was turned down', async () => {
      render(<FileUpload />);
      pick(file('a.pdf'));
      await waitFor(() => expect(live().textContent).toBe('1 file added'));
    });

    it('says only what was rejected when nothing was added', async () => {
      render(<FileUpload accept=".pdf" />);
      pick(file('a.png', 3, 'image/png'), file('b.png', 3, 'image/png'));
      await waitFor(() => expect(live().textContent).toBe('2 files rejected'));
    });

    it('says both in one sentence joined by a full stop', async () => {
      render(<FileUpload accept=".pdf" />);
      pick(file('a.png', 3, 'image/png'), file('b.pdf'), file('c.pdf'));
      await waitFor(() => expect(live().textContent).toBe('2 files added. 1 file rejected'));
    });

    it('says it in the words of labels', async () => {
      render(
        <FileUpload
          accept=".pdf"
          labels={{ added: (n) => `Thêm ${n}`, rejected: (n) => `Từ chối ${n}` }}
        />,
      );
      pick(file('a.png', 3, 'image/png'), file('b.pdf'));
      await waitFor(() => expect(live().textContent).toBe('Thêm 1. Từ chối 1'));
    });
  });

  describe('drag and drop', () => {
    const over = (types: string[] = ['Files']) => ({ dataTransfer: { types } });

    it('marks the root while files are dragged over, and shows labels.dropHere for the prompt', () => {
      render(<FileUpload />);
      const root = document.querySelector('.flg-file-upload')!;
      fireEvent.dragEnter(zone(), over());
      expect(root).toHaveAttribute('data-dragging');
      expect(zone().querySelector('.flg-file-upload-drop-message')).toHaveTextContent(
        'Drop files to upload',
      );
      expect(zone()).not.toHaveTextContent('Drag and drop');
      fireEvent.dragLeave(zone(), over());
      expect(root).not.toHaveAttribute('data-dragging');
      expect(zone()).toHaveTextContent('Drag and drop files here or');
    });

    it('reads the drop message from labels', () => {
      render(<FileUpload labels={{ dropHere: 'Thả tệp' }} />);
      fireEvent.dragEnter(zone(), over());
      expect(zone()).toHaveTextContent('Thả tệp');
    });

    it('stays dragging when the drag goes from the zone onto a child, and ends on the last leave', () => {
      render(<FileUpload />);
      const root = document.querySelector('.flg-file-upload')!;
      const icon = zone().querySelector('.flg-file-upload-icon')!;
      fireEvent.dragEnter(zone(), over());
      fireEvent.dragEnter(icon, over());
      fireEvent.dragLeave(zone(), over());
      expect(root).toHaveAttribute('data-dragging');
      fireEvent.dragLeave(icon, over());
      expect(root).not.toHaveAttribute('data-dragging');
    });

    it('is not dragging for a drag that carries no files', () => {
      render(<FileUpload />);
      fireEvent.dragEnter(zone(), over(['text/plain']));
      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
      const event = createEvent.dragOver(zone(), over(['text/plain']));
      fireEvent(zone(), event);
      expect(event.defaultPrevented).toBe(false);
    });

    it('allows the drop with a copy effect on dragover', () => {
      render(<FileUpload />);
      const data = { types: ['Files'], dropEffect: 'none' };
      const event = dragEvent('dragOver', zone(), data);
      fireEvent(zone(), event);
      expect(event.defaultPrevented).toBe(true);
      expect(data.dropEffect).toBe('copy');
    });

    it('answers dragover with the effect none when disabled, and shows no dragging', () => {
      render(<FileUpload disabled />);
      const data = { types: ['Files'], dropEffect: 'copy' };
      fireEvent.dragEnter(zone(), { dataTransfer: data });
      fireEvent(zone(), dragEvent('dragOver', zone(), data));
      expect(data.dropEffect).toBe('none');
      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
    });

    it('adds the dropped files, ends the dragging and tells once', async () => {
      const onValueChange = vi.fn();
      render(<FileUpload onValueChange={onValueChange} />);
      const [a, b] = [file('a.pdf'), file('b.pdf')];
      fireEvent.dragEnter(zone(), over());
      act(() => {
        fireEvent.drop(zone(), { dataTransfer: dataOf([a, b]) });
      });
      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith([a, b]);
      await waitFor(() => expect(live()).toHaveTextContent('2 files added'));
    });

    it('resets the count on a drop, so the next drag starts from nothing', () => {
      render(<FileUpload />);
      const icon = zone().querySelector('.flg-file-upload-icon')!;
      fireEvent.dragEnter(zone(), over());
      fireEvent.dragEnter(icon, over());
      fireEvent.drop(icon, { dataTransfer: dataOf([file('a.pdf')]) });
      fireEvent.dragEnter(zone(), over());
      fireEvent.dragLeave(zone(), over());
      expect(document.querySelector('.flg-file-upload')).not.toHaveAttribute('data-dragging');
    });

    it('stops the browser from taking a file dropped on the input itself', () => {
      render(<FileUpload />);
      const event = createEvent.drop(input(), { dataTransfer: dataOf([file('a.pdf')]) });
      act(() => {
        fireEvent(input(), event);
      });
      expect(event.defaultPrevented).toBe(true);
      expect(rowNames()).toEqual(['a.pdf']);
    });

    it('skips a dropped folder', () => {
      render(<FileUpload />);
      act(() => {
        fireEvent.drop(zone(), {
          dataTransfer: dataOf([file('docs', 0, ''), file('a.pdf')], ['docs']),
        });
      });
      expect(rowNames()).toEqual(['a.pdf']);
    });

    it('uses dataTransfer.files where there are no items', () => {
      render(<FileUpload />);
      act(() => {
        fireEvent(
          zone(),
          dragEvent('drop', zone(), { types: ['Files'], files: listOf([file('a.pdf')]) }),
        );
      });
      expect(rowNames()).toEqual(['a.pdf']);
    });

    it('adds no file, and still takes the drop from the browser, when the event has no dataTransfer', () => {
      const onValueChange = vi.fn();
      render(<FileUpload onValueChange={onValueChange} />);
      const event = createEvent.drop(zone());
      expect(() => fireEvent(zone(), event)).not.toThrow();
      expect(event.defaultPrevented).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(document.querySelector('ul')).toBeNull();
    });

    it('adds nothing when disabled, and still takes the drop from the browser', () => {
      const onValueChange = vi.fn();
      render(<FileUpload disabled onValueChange={onValueChange} />);
      const event = createEvent.drop(zone(), { dataTransfer: dataOf([file('a.pdf')]) });
      fireEvent(zone(), event);
      expect(event.defaultPrevented).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(document.querySelector('ul')).toBeNull();
    });

    it('puts the rejected files of a drop in rows and tells onReject', () => {
      const onReject = vi.fn();
      render(<FileUpload accept=".pdf" onReject={onReject} />);
      act(() => {
        fireEvent.drop(zone(), { dataTransfer: dataOf([file('a.png', 3, 'image/png')]) });
      });
      expect(onReject).toHaveBeenCalledTimes(1);
      expect(document.querySelectorAll('[data-rejected]')).toHaveLength(1);
    });
  });

  describe('warnings', () => {
    it('warns about an entry of value that is not a File, and leaves it out', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<FileUpload value={[file('a.pdf'), { name: 'b.pdf' } as unknown as File]} />);
      expect(rowNames()).toEqual(['a.pdf']);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]![0]).toContain(WARN_PREFIX);
      expect(warn.mock.calls[0]![0]).toContain('not File objects');
    });

    it('warns about more than one file with multiple off, and shows the first', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<FileUpload multiple={false} defaultValue={[file('a.pdf'), file('b.pdf')]} />);
      expect(rowNames()).toEqual(['a.pdf']);
      expect(names(input().files)).toEqual(['a.pdf']);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]![0]).toContain('multiple is off');
    });

    it('does not warn about a value that is right', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<FileUpload defaultValue={[file('a.pdf')]} />);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  // The library never throws on misuse (spec §4.3 and the library rules).
  describe('props and events that are wrong', () => {
    it('keeps the default of a label that is undefined, and does not throw', async () => {
      render(
        <FileUpload
          labels={{ remove: undefined, added: undefined, prompt: undefined }}
          defaultValue={[file('a.pdf')]}
        />,
      );
      expect(screen.getByRole('button', { name: 'Remove a.pdf' })).toBeInTheDocument();
      expect(zone()).toHaveTextContent('Drag and drop files here or');
      pick(file('b.pdf'));
      await waitFor(() => expect(live()).toHaveTextContent('1 file added'));
    });
  });

  describe('a value that is not an array', () => {
    it('is no files for null, with a warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<FileUpload value={null as unknown as File[]} />);
      expect(document.querySelector('ul')).toBeNull();
      expect(names(input().files)).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('value is null'));
    });

    it('is copied into an array for a FileList, with a warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const [a, b] = [file('a.pdf'), file('b.pdf')];
      const fileList = { length: 2, 0: a, 1: b, item: (at: number) => [a, b][at] ?? null };
      render(<FileUpload value={fileList as unknown as File[]} />);
      expect(rowNames()).toEqual(['a.pdf', 'b.pdf']);
      expect(names(input().files)).toEqual(['a.pdf', 'b.pdf']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('value is not an array'));
    });

    it('resets to a defaultValue that is a FileList-like without throwing', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const a = file('a.pdf');
      const fileList = { length: 1, 0: a, item: () => a };
      render(
        <form aria-label="Apply">
          <FileUpload defaultValue={fileList as unknown as File[]} />
        </form>,
      );
      pick(file('b.pdf'));
      held.set(input(), listOf([]));
      fireEvent.reset(screen.getByRole('form'));
      await aTaskLater();
      expect(rowNames()).toEqual(['a.pdf']);
      expect(names(input().files)).toEqual(['a.pdf']);
    });

    it('is no files for anything else, with a warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<FileUpload value={3 as unknown as File[]} />);
      expect(document.querySelector('ul')).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('value is a number'));
    });
  });

  it('accepts the props of the whole API', () => {
    const props: FileUploadProps = {
      accept: 'image/*',
      maxSize: 1000,
      maxFiles: 2,
      validate: () => null,
      onReject: () => {},
    };
    render(<FileUpload {...props} />);
    expect(input()).toHaveAttribute('accept', 'image/*');
    expect(input()).not.toHaveAttribute('maxsize');
    expect(input()).not.toHaveAttribute('maxfiles');
  });
});
