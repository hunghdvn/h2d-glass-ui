import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Field } from '../field/Field';
import { FileUpload } from './FileUpload';

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

// A plain grid track: a long file name is cut by its row and does not widen the column.
const column = {
  placeSelf: 'start',
  display: 'grid',
  gap: 16,
  width: 360,
} as const;
const caption = {
  fontSize: 'var(--flg-text-xs)',
  color: 'var(--flg-text-muted)',
  marginBottom: 6,
} as const;

/** A file of `size` bytes with nothing in it but zeros. */
const file = (name: string, size: number, type: string) =>
  new File([new Uint8Array(size)], name, { type });

const hint = 'PDF, PNG · up to 10 MB each · up to 3 files';
const attached = [
  file(
    'Annual report 2026 with the figures of every quarter, the notes and the signed annex.pdf',
    2_411_724,
    'application/pdf',
  ),
  file('floor-plan.png', 318_000, 'image/png'),
];

/** The look of the mockup (F1): the dashed zone, and the list of files under it. */
export const Look: Story = {
  render: () => (
    <div style={column}>
      <div>
        <div style={caption}>Empty, with a hint</div>
        <FileUpload aria-label="Attachments, empty" hint={hint} />
      </div>
      <div>
        <div style={caption}>With two files</div>
        <FileUpload aria-label="Attachments, with files" hint={hint} defaultValue={attached} />
      </div>
      <div>
        <div style={caption}>Invalid</div>
        <FileUpload aria-label="Attachments, invalid" hint={hint} invalid />
      </div>
      <div>
        <div style={caption}>Disabled</div>
        <FileUpload aria-label="Attachments, disabled" hint={hint} disabled />
      </div>
      <Field label="Attachments" description="Add the documents of the claim.">
        <FileUpload hint={hint} />
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const zones = Array.from(canvasElement.querySelectorAll<HTMLElement>('.flg-file-upload-zone'));
    const [empty, filled, invalid, disabled] = zones as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    // The zone is 140px tall when empty, and a strip when it has files under it (spec §4.3).
    await expect(Math.round(empty.getBoundingClientRect().height)).toBeGreaterThanOrEqual(140);
    await expect(getComputedStyle(empty).borderTopStyle).toBe('dashed');
    await expect(getComputedStyle(filled).minHeight).toBe('0px');
    await expect(getComputedStyle(filled).paddingTop).toBe('12px');
    // The edge of an invalid zone is the danger colour; the others have the dropzone token.
    await expect(getComputedStyle(invalid).borderTopColor).not.toBe(
      getComputedStyle(empty).borderTopColor,
    );
    await expect(getComputedStyle(disabled).opacity).toBe('0.5');
    await expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
    // The input lies over the browse word, invisible, and is as big as it.
    const input = canvas.getByLabelText('Attachments, empty');
    const word = input.parentElement!;
    await expect(getComputedStyle(input).opacity).toBe('0');
    await expect(input.getBoundingClientRect().width).toBeCloseTo(
      word.getBoundingClientRect().width,
      0,
    );
    // A long name ends with an ellipsis on one line, and the size stays on its own line.
    const name = canvasElement.querySelector<HTMLElement>('.flg-file-upload-file-name')!;
    await expect(getComputedStyle(name).textOverflow).toBe('ellipsis');
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(canvas.getByRole('button', { name: 'Remove floor-plan.png' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /^Remove Annual report/ })).toBeEnabled();
    await expect(canvasElement.querySelectorAll('.flg-file-upload-file-size')[1]).toHaveTextContent(
      '318 kB',
    );
    // Disabled: the input and the buttons are off.
    await expect(canvas.getByLabelText('Attachments, disabled')).toBeDisabled();
    await expect(canvas.getByLabelText('Attachments, invalid')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

/**
 * Gives the input files the way a dialog does: through Playwright's file chooser when the runner has
 * it, and else by assigning the input a `DataTransfer` and firing `change`, which is what a browser
 * does on its own (the Storybook UI has no chooser).
 */
async function choose(input: HTMLInputElement, ...files: File[]) {
  const user = await realUserEvent();
  if (user) {
    await user.upload(input, files);
    return;
  }
  const transfer = new DataTransfer();
  files.forEach((one) => transfer.items.add(one));
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

const heldBy = (input: HTMLInputElement) => Array.from(input.files ?? [], (one) => one.name);
const rowsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('.flg-file-upload-file-name'), (el) => el.textContent);

/** A pick adds rows; a second pick adds to them; `input.files` holds all of them. */
export const Picking: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <FileUpload aria-label="Attachments" hint={hint} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByLabelText<HTMLInputElement>('Attachments');
    await choose(input, file('a.pdf', 1500, 'application/pdf'));
    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['a.pdf']));
    await expect(heldBy(input)).toEqual(['a.pdf']);
    await choose(input, file('b.png', 2_500_000, 'image/png'), file('c.png', 10, 'image/png'));
    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['a.pdf', 'b.png', 'c.png']));
    // The browser replaced input.files with the second pick, and the library put the first back.
    await expect(heldBy(input)).toEqual(['a.pdf', 'b.png', 'c.png']);
    await expect(canvasElement.querySelectorAll('.flg-file-upload-file-size')[1]).toHaveTextContent(
      '2.5 MB',
    );
    // The live region says what was added.
    await waitFor(() =>
      expect(canvasElement.querySelector('[aria-live="polite"]')).toHaveTextContent(
        '2 files added',
      ),
    );
  },
};

/** One file: a second pick replaces the first. */
export const SingleFile: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <FileUpload aria-label="Avatar" multiple={false} accept="image/*" />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByLabelText<HTMLInputElement>('Avatar');
    await expect(input.multiple).toBe(false);
    await choose(input, file('a.png', 100, 'image/png'));
    await choose(input, file('b.png', 100, 'image/png'));
    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['b.png']));
    await expect(heldBy(input)).toEqual(['b.png']);
  },
};

/** Removing: the row goes, `input.files` follows, and focus lands on the next row, the previous, the input. */
export const Removing: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <FileUpload
        aria-label="Attachments"
        defaultValue={[
          file('a.pdf', 10, 'application/pdf'),
          file('b.pdf', 10, 'application/pdf'),
          file('c.pdf', 10, 'application/pdf'),
        ]}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByLabelText<HTMLInputElement>('Attachments');
    await expect(heldBy(input)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    await user.click(canvas.getByRole('button', { name: 'Remove b.pdf' }));
    await expect(rowsOf(canvasElement)).toEqual(['a.pdf', 'c.pdf']);
    await expect(heldBy(input)).toEqual(['a.pdf', 'c.pdf']);
    await expect(canvas.getByRole('button', { name: 'Remove c.pdf' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await expect(canvas.getByRole('button', { name: 'Remove a.pdf' })).toHaveFocus();
    await user.keyboard(' ');
    await expect(canvasElement.querySelector('ul')).toBeNull();
    await expect(input).toHaveFocus();
    await expect(heldBy(input)).toEqual([]);
  },
};

function Controlled() {
  const [files, setFiles] = useState<File[]>([file('first.pdf', 2000, 'application/pdf')]);
  return (
    <div style={column}>
      <FileUpload aria-label="Attachments" value={files} onValueChange={setFiles} />
      <button type="button" onClick={() => setFiles([])}>
        Clear
      </button>
      <output aria-label="State">{files.map((one) => one.name).join(', ')}</output>
    </div>
  );
}

/** The parent owns the files: it can empty the list, and the input follows. */
export const ControlledList: Story = {
  tags: ['no-visual'],
  render: () => <Controlled />,
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByLabelText<HTMLInputElement>('Attachments');
    await choose(input, file('second.pdf', 10, 'application/pdf'));
    await waitFor(() =>
      expect(canvas.getByLabelText('State')).toHaveTextContent('first.pdf, second.pdf'),
    );
    await expect(heldBy(input)).toEqual(['first.pdf', 'second.pdf']);
    await user.click(canvas.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(rowsOf(canvasElement)).toEqual([]));
    await expect(heldBy(input)).toEqual([]);
  },
};

const submissions: string[][] = [];

/** The form sends the files of every pick, and a reset goes back to the default. */
export const InAForm: Story = {
  tags: ['no-visual'],
  render: () => (
    <form
      aria-label="Claim"
      style={column}
      onSubmit={(event) => {
        event.preventDefault();
        const sent = new FormData(event.currentTarget).getAll('documents') as File[];
        submissions.push(sent.map((one) => one.name));
      }}
    >
      <Field label="Documents">
        <FileUpload name="documents" defaultValue={[file('start.pdf', 10, 'application/pdf')]} />
      </Field>
      <button type="submit">Send</button>
      <button type="reset">Reset</button>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    submissions.length = 0;
    const user = (await realUserEvent()) ?? userEvent;
    const form = canvasElement.querySelector('form')!;
    const input = canvas.getByLabelText<HTMLInputElement>('Documents');
    await expect((new FormData(form).getAll('documents') as File[]).map((one) => one.name)).toEqual(
      ['start.pdf'],
    );
    await choose(input, file('a.pdf', 10, 'application/pdf'));
    await choose(input, file('b.pdf', 10, 'application/pdf'));
    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['start.pdf', 'a.pdf', 'b.pdf']));
    await user.click(canvas.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(submissions).toEqual([['start.pdf', 'a.pdf', 'b.pdf']]));
    // A removed file is not sent.
    await user.click(canvas.getByRole('button', { name: 'Remove a.pdf' }));
    await user.click(canvas.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(submissions.at(-1)).toEqual(['start.pdf', 'b.pdf']));
    // Reset: the browser empties the input, and the library puts the default back.
    await user.click(canvas.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['start.pdf']));
    await expect(heldBy(input)).toEqual(['start.pdf']);
  },
};

const requiredSent: string[][] = [];

/** `required` is the browser's: the empty form does not submit, and one with a file does. */
export const Required: Story = {
  tags: ['no-visual'],
  render: () => (
    <form
      aria-label="Claim"
      style={column}
      onSubmit={(event) => {
        event.preventDefault();
        const sent = new FormData(event.currentTarget).getAll('documents') as File[];
        requiredSent.push(sent.map((one) => one.name));
      }}
    >
      <Field label="Documents" required>
        <FileUpload name="documents" />
      </Field>
      <button type="submit">Send</button>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    requiredSent.length = 0;
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByLabelText<HTMLInputElement>(/^Documents/);
    await expect(input).toBeRequired();
    await user.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(input.validity.valueMissing).toBe(true);
    await expect(requiredSent).toEqual([]);
    await choose(input, file('a.pdf', 10, 'application/pdf'));
    await waitFor(() => expect(rowsOf(canvasElement)).toEqual(['a.pdf']));
    await expect(input.validity.valid).toBe(true);
    await user.click(canvas.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(requiredSent).toEqual([['a.pdf']]));
    // Removing the file brings the requirement back.
    await user.click(canvas.getByRole('button', { name: 'Remove a.pdf' }));
    await expect(input.validity.valueMissing).toBe(true);
  },
};
