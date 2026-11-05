'use client';

import { clsx } from 'clsx';
import { forwardRef, useId, useMemo, useReducer, useRef } from 'react';
import type { ChangeEvent, CSSProperties, MouseEvent, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
import { CloseIcon, FileIcon, UploadIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useAnnounce } from '../../internal/use-announce';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFormReset } from '../../internal/use-form-reset';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn, isProduction } from '../../internal/warn';
import { IconButton } from '../icon-button/IconButton';
import { formatFileSize } from './accept';

/** A file that was turned down, and every reason why. */
export interface FileRejection {
  file: File;
  errors: { code: 'type' | 'size' | 'count' | 'custom'; message: string }[];
}

/** The words the FileUpload says and labels its buttons with; translate them with the page. */
export interface FileUploadLabels {
  /** The text before the browse word; end it with a space. Default `"Drag and drop files here or "`. */
  prompt?: string;
  /** The word that opens the file dialog, and the name of the input outside a Field. Default `"browse"`. */
  browse?: string;
  /** What the zone says while files are dragged over it. Default `"Drop files to upload"`. */
  dropHere?: string;
  /** The name of a row's remove button. Default `(name) => "Remove <name>"`. */
  remove?: (name: string) => string;
  /** Why a file of the wrong type is turned down. Default `"File type not supported"`. */
  type?: string;
  /** Why a file that is too large is turned down. Default `(max) => "File is larger than <max>"`. */
  size?: (max: string) => string;
  /** Why a file over `maxFiles` is turned down. Default `"Only 1 file"` for 1, else `"Up to <n> files"`. */
  count?: (max: number) => string;
  /** What is said when files are added. Default `"1 file added"` or `"<n> files added"`. */
  added?: (count: number) => string;
  /** What is said when files are turned down. Default `"1 file rejected"` or `"<n> files rejected"`. */
  rejected?: (count: number) => string;
}

export interface FileUploadProps {
  /** The files. Pass it with `onValueChange` to control them. */
  value?: File[];
  /** The files at first, when `value` is not controlled. */
  defaultValue?: File[];
  /** Called with all the files whenever the user adds or removes some. */
  onValueChange?: (files: File[]) => void;
  /** Which files the file dialog offers, as the native attribute: `"image/*"`, `".pdf,.docx"`. */
  accept?: string;
  /** Whether more than one file can be held. Default `true`. With `false` a new pick replaces the file. */
  multiple?: boolean;
  /** The largest size of a file, in bytes. */
  maxSize?: number;
  /** The most files that can be held. */
  maxFiles?: number;
  /** Decides about a file: a string turns it down with that sentence, `null` accepts it. */
  validate?: (file: File) => string | null;
  /** Called once for every addition that had files turned down. */
  onReject?: (rejections: FileRejection[]) => void;
  disabled?: boolean;
  /** The form must hold a file to be submitted; the browser's own check stops an empty submit. */
  required?: boolean;
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** The name of the file input in the form data. */
  name?: string;
  /** The id of the form the input belongs to, when it is not inside it. */
  form?: string;
  /** BCP 47 locale of the file sizes. Default `"en-US"`. */
  locale?: string;
  /** A line under the prompt, such as the types and sizes that are accepted. */
  hint?: ReactNode;
  /** On the file input, which is where a Field's label points. */
  id?: string;
  /** On the element around the zone and the list. */
  className?: string;
  /** On the element around the zone and the list. */
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** The words the FileUpload says. */
  labels?: FileUploadLabels;
}

const NO_FILES: File[] = [];

const DEFAULT_LABELS = {
  prompt: 'Drag and drop files here or ',
  browse: 'browse',
  dropHere: 'Drop files to upload',
  remove: (name: string) => `Remove ${name}`,
  type: 'File type not supported',
  size: (max: string) => `File is larger than ${max}`,
  count: (max: number) => (max === 1 ? 'Only 1 file' : `Up to ${max} files`),
  added: (count: number) => (count === 1 ? '1 file added' : `${count} files added`),
  rejected: (count: number) => (count === 1 ? '1 file rejected' : `${count} files rejected`),
};

// A row keeps its key for as long as it holds the same File, whichever place in the list that is.
const keys = new WeakMap<File, string>();
let lastKey = 0;
const keyOf = (file: File): string => {
  let key = keys.get(file);
  if (key === undefined) {
    lastKey += 1;
    key = String(lastKey);
    keys.set(file, key);
  }
  return key;
};

const isFile = (item: unknown): item is File => typeof File !== 'undefined' && item instanceof File;

const sameFile = (a: File, b: File) =>
  a === b ||
  (a.name === b.name &&
    a.size === b.size &&
    a.type === b.type &&
    a.lastModified === b.lastModified);

/**
 * Puts `files` into `input.files`, unless it holds them already. A file input takes a `FileList`, and
 * only a `DataTransfer` makes one. Where there is none (jsdom, old engines) the input stays as the
 * browser set it, which after a second pick is that pick alone: the list on the screen is then the
 * library's, and a form sends only the last pick.
 */
function writeFiles(input: HTMLInputElement, files: File[]): void {
  if (typeof DataTransfer === 'undefined') return;
  const held = input.files;
  if (
    held &&
    held.length === files.length &&
    files.every((file, at) => sameFile(file, held[at]!))
  ) {
    return;
  }
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

/**
 * A zone with a native file input, and the list of the files held. The input is the control: it sits
 * over the word "browse", so its click, its keyboard, its `required` check and its place in a form are
 * the browser's; the library keeps the files of all the picks in `input.files`. `ref` is the input;
 * `className` and `style` go on the element around the zone and the list.
 */
export const FileUpload = markAsFieldControl(
  forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(props, ref) {
    const {
      value,
      defaultValue,
      onValueChange,
      accept,
      multiple = true,
      locale = 'en-US',
      invalid: invalidProp,
      name,
      form,
      hint,
      className,
      style,
      labels,
      // Not attributes of the input: they must stay out of what is spread onto it.
      maxSize,
      maxFiles,
      validate,
      onReject,
      ...rest
    } = props;
    void [maxSize, maxFiles, validate, onReject];
    const field = useFieldContext();
    const hintId = useId();
    const { invalid, required, disabled, ...inputProps } = useFieldProps({
      ...rest,
      invalid: invalidProp,
      'aria-describedby':
        [rest['aria-describedby'], hint ? hintId : undefined].filter(Boolean).join(' ') ||
        undefined,
    });
    const words = { ...DEFAULT_LABELS, ...labels };
    const { announce, region } = useAnnounce();

    const [held, setHeld, resetHeld] = useControllableState<File[]>({
      value,
      defaultValue: defaultValue ?? NO_FILES,
      onChange: onValueChange,
      name: 'FileUpload value',
    });
    // What is shown and written: only Files, and one at most when the input takes one. The list the
    // parent passed is never changed.
    const files = useMemo(() => {
      const only = held.filter(isFile);
      return multiple ? only : only.slice(0, 1);
    }, [held, multiple]);
    // The checks below only feed warnings, so production skips them: they run on every render.
    if (!isProduction()) {
      if (held.some((item) => !isFile(item))) {
        devWarn('<FileUpload> value has entries that are not File objects. They are ignored.');
      }
      if (!multiple && held.filter(isFile).length > 1) {
        devWarn(
          '<FileUpload> has more than one file in value and multiple is off. Only the first is shown and sent.',
        );
      }
    }

    const inputRef = useRef<HTMLInputElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
    const listRef = useRef<HTMLUListElement>(null);

    // A change of the user makes a commit even where it changes no state (a pick that was
    // cancelled, a parent that kept its value): the browser has changed `input.files` on its own,
    // and the commit puts it back.
    const [, commit] = useReducer((count: number) => count + 1, 0);
    // A removal moves focus once the rows are rendered: to the button that takes the removed one's
    // place, which is only known then. `from` tells this commit from one that left the files as they
    // were (a controlled parent that said no).
    const focusAfter = useRef<{ from: File[]; index: number } | null>(null);
    useIsoLayoutEffect(() => {
      const input = inputRef.current;
      if (input) writeFiles(input, files);
      const pending = focusAfter.current;
      if (!pending) return;
      focusAfter.current = null;
      if (pending.from === files) return;
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button');
      (buttons?.[Math.min(pending.index, files.length - 1)] ?? input)?.focus();
    });

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(event.currentTarget.files ?? []);
      // Some engines empty the input when the dialog is cancelled: the files held stay.
      if (picked.length > 0) {
        setHeld(multiple ? [...files, ...picked] : picked.slice(0, 1));
        announce(words.added(picked.length));
      }
      commit();
    };
    const removeAt = (index: number) => {
      focusAfter.current = { from: files, index };
      setHeld(files.filter((_, at) => at !== index));
      commit();
    };

    // The browser has emptied the input. The files of an uncontrolled FileUpload go back to the
    // default and a controlled one keeps its value; the commit writes them into the input.
    useFormReset(inputRef, () => {
      resetHeld(defaultValue ?? NO_FILES);
      commit();
    });

    // The zone is a pointer's convenience: a press anywhere that is no control opens the dialog.
    // Keyboard users have the input.
    const handleZoneClick = (event: MouseEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0) return;
      if ((event.target as Element).closest('a[href], button, input, select, textarea, label')) {
        return;
      }
      inputRef.current?.click();
    };

    return (
      <div
        className={clsx('flg-file-upload', className)}
        style={style}
        data-disabled={dataAttr(disabled)}
        data-invalid={dataAttr(invalid)}
      >
        {/* Only forwards a press to the input, which keyboard users reach directly. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="flg-file-upload-zone" onClick={handleZoneClick}>
          <span className="flg-file-upload-icon" aria-hidden="true">
            <UploadIcon width={24} height={24} />
          </span>
          <p className="flg-file-upload-prompt">
            {words.prompt}
            <span className="flg-file-upload-browse">
              <span aria-hidden="true">{words.browse}</span>
              <input
                aria-label={
                  !field && !rest['aria-label'] && !rest['aria-labelledby']
                    ? words.browse
                    : undefined
                }
                {...inputProps}
                ref={mergedRef}
                type="file"
                // Chromium would show "No file chosen" as a tooltip.
                title=""
                name={name}
                form={form}
                accept={accept}
                multiple={multiple}
                required={required}
                disabled={disabled}
                onChange={handleChange}
              />
            </span>
          </p>
          {hint ? (
            <p id={hintId} className="flg-file-upload-hint">
              {hint}
            </p>
          ) : null}
        </div>
        {files.length > 0 ? (
          <ul ref={listRef} className="flg-file-upload-list">
            {files.map((file, index) => (
              <li key={keyOf(file)} className="flg-file-upload-file">
                <span className="flg-file-upload-file-icon" aria-hidden="true">
                  <FileIcon width={16} height={16} />
                </span>
                <span className="flg-file-upload-file-main">
                  <span className="flg-file-upload-file-name">{file.name}</span>
                  <span className="flg-file-upload-file-size">
                    {formatFileSize(file.size, locale)}
                  </span>
                </span>
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={words.remove(file.name)}
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                >
                  <CloseIcon width={14} height={14} aria-hidden="true" />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : null}
        {region}
      </div>
    );
  }),
);
