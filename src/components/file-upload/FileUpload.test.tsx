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

    it('lists a file that is twice in the value twice', () => {
      const a = file('a.pdf');
      render(<FileUpload defaultValue={[a, a]} />);
      expect(rowNames()).toEqual(['a.pdf', 'a.pdf']);
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
