import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { expectBorderWhileFocused } from '../../../.storybook/focus-border';
import { realUserEvent } from '../../../.storybook/real-input';
import { Field } from '../field/Field';
import { TagInput } from './TagInput';

const meta = {
  title: 'Components/TagInput',
  component: TagInput,
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { placeSelf: 'start', display: 'grid', gap: 16, width: 280 } as const;
const caption = {
  fontSize: 'var(--flg-text-xs)',
  color: 'var(--flg-text-muted)',
  marginBottom: 6,
} as const;

// The skills of the approved mockup (Ta1): enough chips to wrap in the width of the column.
// A form wide enough that a new chip does not wrap the row: the frame would grow, move the submit button
// under the pointer between its press and its release, and the click would miss it.
const wide = { ...column, width: 420 } as const;

const skills = ['React', 'TypeScript', 'Accessibility', 'CSS'];

const frameOf = (input: HTMLElement) => input.closest<HTMLElement>('.flg-tag-input-box')!;
const removeButtons = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('li button'));
const tagsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('li .flg-tag'), (tag) => tag.firstChild?.textContent);

/** The look of the mockup (Ta1): neutral chips with a ×, and the text input, in one wrapping frame. */
export const Look: Story = {
  render: () => (
    <div style={column}>
      <div>
        <div style={caption}>Resting, the chips wrap</div>
        <TagInput aria-label="Skills, resting" defaultValue={skills} />
      </div>
      <div>
        <div style={caption}>A tag being typed</div>
        <TagInput
          aria-label="Skills, typing"
          defaultValue={skills.slice(0, 2)}
          defaultInputValue="Sv"
        />
      </div>
      <div>
        <div style={caption}>Empty, with a placeholder</div>
        <TagInput aria-label="Skills, empty" placeholder="Add a skill…" />
      </div>
      <div>
        <div style={caption}>Invalid</div>
        <TagInput aria-label="Skills, invalid" defaultValue={skills.slice(0, 2)} invalid />
      </div>
      <div>
        <div style={caption}>Disabled</div>
        <TagInput aria-label="Skills, disabled" defaultValue={skills.slice(0, 2)} disabled />
      </div>
      <div>
        <div style={caption}>Small</div>
        <TagInput aria-label="Skills, small" size="sm" defaultValue={skills.slice(0, 2)} />
      </div>
      <div>
        <div style={caption}>Small, empty</div>
        <TagInput aria-label="Skills, small and empty" size="sm" placeholder="Add a skill…" />
      </div>
      <div>
        <div style={caption}>Large</div>
        <TagInput aria-label="Skills, large" size="lg" defaultValue={skills.slice(0, 2)} />
      </div>
      <Field
        label="Skills"
        description="Press Enter or comma after each."
        error="Add a skill."
        required
      >
        <TagInput name="skills" placeholder="Add a skill…" />
      </Field>
      <Field label="Skills, rejected" description="Press Enter or comma after each.">
        <TagInput defaultValue={skills.slice(0, 2)} defaultInputValue="React" />
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    // A tag that is already there is turned down: its text stays, and the Field shows why. Enter
    // asks for it, and leaving puts the focus ring away from the picture.
    const rejected = canvas.getByRole('textbox', { name: 'Skills, rejected' });
    rejected.focus();
    await userEvent.keyboard('{Enter}');
    rejected.blur();
    await waitFor(() => expect(canvas.getByText('Already added')).toHaveClass('flg-field-error'));
    await expect(rejected).toHaveAttribute('aria-invalid', 'true');
    await expect(rejected).toHaveValue('React');
    await expect(rejected).toHaveAccessibleDescription(
      'Press Enter or comma after each. Already added',
    );

    // The frame is the height of an Input of its size while it holds one row.
    const heights = ['Skills, small and empty', 'Skills, empty', 'Skills, large'].map((name) =>
      Math.round(frameOf(canvas.getByRole('textbox', { name })).getBoundingClientRect().height),
    );
    await expect(heights).toEqual([28, 34, 40]);
    // A small frame with chips is still 28px: its padding is 2px (spec §4.3).
    const small = canvas.getByRole('textbox', { name: 'Skills, small' });
    await expect(Math.round(frameOf(small).getBoundingClientRect().height)).toBe(28);
    // The chips wrap: the last chip is below the first.
    const resting = canvas.getByRole('textbox', { name: 'Skills, resting' });
    const chips = Array.from(frameOf(resting).querySelectorAll('.flg-tag'));
    await expect(chips.at(-1)!.getBoundingClientRect().top).toBeGreaterThan(
      chips[0]!.getBoundingClientRect().top,
    );
    // The list keeps its semantics and takes no box.
    await expect(getComputedStyle(frameOf(resting).querySelector('ul')!).display).toBe('contents');
    // Disabled: the whole frame dims, the input and the buttons are off.
    const disabled = canvas.getByRole('textbox', { name: 'Skills, disabled' });
    await expect(disabled).toBeDisabled();
    await expect(removeButtons(frameOf(disabled))[0]).toBeDisabled();
    await expect(getComputedStyle(frameOf(disabled)).opacity).toBe('0.5');
    // Invalid, by prop and from the Field.
    await expect(canvas.getByRole('textbox', { name: 'Skills, invalid' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(canvas.getByRole('textbox', { name: /^Skills$|^Skills \*/ })).toHaveAttribute(
      'aria-required',
      'true',
    );
    // Focus keeps the danger border on an invalid frame, so the error stays visible while it is fixed.
    const invalid = canvas.getByRole('textbox', { name: 'Skills, invalid' });
    await expectBorderWhileFocused(invalid, frameOf(invalid), 'var(--flg-danger)');
  },
};

function Controlled() {
  const [tags, setTags] = useState(['React']);
  const [text, setText] = useState('');
  return (
    <div style={column}>
      <TagInput
        aria-label="Skills"
        value={tags}
        onValueChange={setTags}
        inputValue={text}
        onInputValueChange={setText}
      />
      <output aria-label="State">{`${JSON.stringify(tags)} / ${text}`}</output>
    </div>
  );
}

/** Real keys: Backspace and ← reach the tags, ← → Home End move along them, Delete removes. */
export const Keyboard: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <TagInput aria-label="Skills" defaultValue={['Ann', 'Bob', 'Cy']} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole('textbox', { name: 'Skills' });
    const names = () => removeButtons(canvasElement).map((button) => button.ariaLabel);
    await expect(names()).toEqual(['Remove Ann', 'Remove Bob', 'Remove Cy']);
    // The buttons are out of the tab order: Tab from the page lands on the text input.
    await user.tab();
    await expect(input).toHaveFocus();

    // Backspace in the empty input reaches the last tag; ← → Home End move along them.
    await user.keyboard('{Backspace}');
    await expect(canvas.getByRole('button', { name: 'Remove Cy' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('button', { name: 'Remove Bob' })).toHaveFocus();
    await user.keyboard('{Home}');
    await expect(canvas.getByRole('button', { name: 'Remove Ann' })).toHaveFocus();
    await user.keyboard('{End}');
    await expect(canvas.getByRole('button', { name: 'Remove Cy' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await expect(input).toHaveFocus();

    // Esc on a button goes back to the input.
    await user.keyboard('{Backspace}{Escape}');
    await expect(input).toHaveFocus();

    // Delete removes the focused tag; the focus goes to the one before when the last was removed.
    await user.keyboard('{Backspace}{Delete}');
    await expect(tagsOf(canvasElement)).toEqual(['Ann', 'Bob']);
    await expect(canvas.getByRole('button', { name: 'Remove Bob' })).toHaveFocus();

    // A printable key on a button is typed into the input.
    await user.keyboard('x');
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('x');

    // ← at the start of the text reaches the tags, and Backspace removes the one focused.
    await user.keyboard('{Home}{ArrowLeft}');
    await expect(canvas.getByRole('button', { name: 'Remove Bob' })).toHaveFocus();
    await user.keyboard('{Backspace}');
    await expect(tagsOf(canvasElement)).toEqual(['Ann']);
    await expect(canvas.getByRole('button', { name: 'Remove Ann' })).toHaveFocus();
    // With none left, the input gets the focus, and its text is still there.
    await user.keyboard('{Delete}');
    await expect(tagsOf(canvasElement)).toEqual([]);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('x');

    // Enter and Space on a button are its click.
    await user.clear(input);
    await user.keyboard('a,b,c,');
    await expect(tagsOf(canvasElement)).toEqual(['a', 'b', 'c']);
    removeButtons(canvasElement)[1]!.focus();
    await user.keyboard('{Enter}');
    await expect(tagsOf(canvasElement)).toEqual(['a', 'c']);
    await expect(canvas.getByRole('button', { name: 'Remove c' })).toHaveFocus();
    await user.keyboard(' ');
    await expect(tagsOf(canvasElement)).toEqual(['a']);
  },
};

/** Typing: a separator ends a tag, Enter too, blank text is no tag, and the live region says it. */
export const Typing: Story = {
  tags: ['no-visual'],
  render: () => <Controlled />,
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole('textbox', { name: 'Skills' });
    const state = canvas.getByLabelText('State');
    await user.click(input);
    await user.keyboard('Vue,Sv');
    await expect(state).toHaveTextContent('["React","Vue"] / Sv');
    await user.keyboard('elte{Enter}');
    await expect(state).toHaveTextContent('["React","Vue","Svelte"] /');
    await user.keyboard('   ,{Enter}');
    await expect(state).toHaveTextContent('["React","Vue","Svelte"] /');
    const live = canvasElement.querySelector('[aria-live]')!;
    await user.keyboard('Solid,');
    await waitFor(() => expect(live).toHaveTextContent('Solid added'));
    await user.keyboard('{Backspace}{Delete}');
    await waitFor(() => expect(live).toHaveTextContent('Solid removed'));
  },
};

/**
 * Text in a textarea, copied with the keyboard and pasted into the TagInput, so that it gets a paste
 * the browser made. WebKit's clipboard is the system's, shared by every browser process that runs: a
 * second run, or the owner's other apps, can replace it between the copy and the paste (the paste
 * then holds another run's text, or nothing). So the paste follows the copy at once, and when it
 * does not show `expected` the text it left behind is cleared and the copy and paste are tried again.
 */
async function copyAndPaste(
  user: NonNullable<Awaited<ReturnType<typeof realUserEvent>>>,
  source: HTMLTextAreaElement,
  input: HTMLInputElement,
  text: string,
  expected: () => Promise<void>,
) {
  for (let attempt = 1; ; attempt += 1) {
    source.value = text;
    source.focus();
    source.select();
    await user.copy();
    input.focus();
    await user.paste();
    try {
      await waitFor(expected, { timeout: 1000 });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      input.select();
      await user.keyboard('{Delete}');
    }
  }
}

/** Paste is split at the separators and at line breaks; text with nothing to split stays text. */
export const Paste: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Controlled />
      <textarea aria-label="Source" />
    </div>
  ),
  play: async ({ canvas }) => {
    // A paste needs the browser's own clipboard, which only trusted input reaches.
    const user = await realUserEvent();
    if (!user) return;
    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Skills' });
    const source = canvas.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
    const state = canvas.getByLabelText('State');
    await copyAndPaste(user, source, input, 'Vue, Svelte\nSolid,, ', () =>
      expect(state).toHaveTextContent('["React","Vue","Svelte","Solid"] /'),
    );
    // Nothing to split at: the browser pastes it as text, to be made a tag by Enter or by leaving.
    await copyAndPaste(user, source, input, 'Qwik', () =>
      expect(state).toHaveTextContent('["React","Vue","Svelte","Solid"] / Qwik'),
    );
    await user.keyboard('{Enter}');
    await expect(state).toHaveTextContent('["React","Vue","Svelte","Solid","Qwik"] /');
  },
};

function SkillsForm({ onSubmit }: { onSubmit: (tags: string[]) => void }) {
  return (
    <form
      aria-label="Profile"
      style={wide}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget).getAll('skills') as string[]);
      }}
    >
      <Field label="Skills">
        <TagInput name="skills" defaultValue={['React', 'Vue']} />
      </Field>
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  );
}

const submissions: string[][] = [];

/** Leaving with text pending adds it as a tag, and the submit that the leave leads to carries it. */
export const LeavingWithText: Story = {
  tags: ['no-visual'],
  render: () => <SkillsForm onSubmit={(tags) => submissions.push(tags)} />,
  play: async ({ canvas, canvasElement }) => {
    submissions.length = 0;
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole('textbox', { name: 'Skills' });

    // The pending text becomes a tag when focus leaves with Tab.
    await user.click(input);
    await user.keyboard('Svelte');
    await user.tab();
    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte']);
    await expect(input).toHaveValue('');

    // The submit button pressed without Enter: the blur adds the tag, the submit carries it.
    await user.click(input);
    await user.keyboard('Solid');
    await user.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(submissions).toHaveLength(1));
    await expect(submissions[0]).toEqual(['React', 'Vue', 'Svelte', 'Solid']);

    // Moving to the TagInput's own remove button is not leaving.
    await user.click(input);
    await user.keyboard('Qwik{Home}{ArrowLeft}');
    await expect(removeButtons(canvasElement).at(-1)).toHaveFocus();
    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte', 'Solid']);
    await expect(input).toHaveValue('Qwik');
  },
};

/** FormData: several values under one name; Enter on empty text submits them; reset. */
export const InAForm: Story = {
  tags: ['no-visual'],
  render: () => <SkillsForm onSubmit={(tags) => submissions.push(tags)} />,
  play: async ({ canvas, canvasElement }) => {
    submissions.length = 0;
    const user = (await realUserEvent()) ?? userEvent;
    const form = canvasElement.querySelector('form')!;
    const input = canvas.getByRole('textbox', { name: 'Skills' });
    await expect(new FormData(form).getAll('skills')).toEqual(['React', 'Vue']);

    // Enter with text adds the tag and does not submit; on empty text it submits, with every tag.
    await user.click(input);
    await user.keyboard('Svelte{Enter}');
    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte']);
    await expect(submissions).toEqual([]);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(submissions).toEqual([['React', 'Vue', 'Svelte']]));

    // A tag typed a moment ago is in what the next Enter submits (Firefox submits at once).
    await user.keyboard('Solid,{Enter}');
    await waitFor(() => expect(submissions).toHaveLength(2));
    await expect(submissions[1]).toEqual(['React', 'Vue', 'Svelte', 'Solid']);

    // Reset: the tags and the text go back to their defaults.
    await user.keyboard('typed');
    await user.click(canvas.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(tagsOf(canvasElement)).toEqual(['React', 'Vue']));
    await expect(input).toHaveValue('');
    await expect(new FormData(form).getAll('skills')).toEqual(['React', 'Vue']);
  },
};

const requiredSent: string[][] = [];

/** `required` is a validity message on the text input while there is no tag: the native check blocks the submit. */
export const Required: Story = {
  tags: ['no-visual'],
  render: () => (
    <form
      aria-label="Profile"
      style={column}
      onSubmit={(event) => {
        event.preventDefault();
        requiredSent.push(new FormData(event.currentTarget).getAll('skills') as string[]);
      }}
    >
      <Field label="Skills" required>
        <TagInput name="skills" />
      </Field>
      <button type="submit">Save</button>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    requiredSent.length = 0;
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: /^Skills/ });
    await expect(input).toHaveAttribute('aria-required', 'true');
    await user.click(canvas.getByRole('button', { name: 'Save' }));
    // The browser stops the submit, and shows its message on the text input.
    await expect(input.validity.customError).toBe(true);
    await expect(input.validationMessage).toBe('Add at least one tag.');
    await waitFor(() => expect(input).toHaveFocus());
    await expect(requiredSent).toEqual([]);
    // Once a tag is there, the text input no longer says a tag is missing.
    await user.keyboard('React,');
    await expect(input.validity.valid).toBe(true);
    await user.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(requiredSent).toEqual([['React']]));
    // Removing the last tag brings the requirement back.
    await user.click(input);
    await user.keyboard('{Backspace}{Delete}');
    await expect(tagsOf(canvasElement)).toEqual([]);
    await expect(input.validity.customError).toBe(true);
  },
};

/** Read-only: the tags stay, and cannot be added to or removed. */
export const ReadOnly: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <TagInput aria-label="Skills" readOnly defaultValue={['Ann', 'Bob']} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole('textbox', { name: 'Skills' });
    await user.click(input);
    await user.keyboard('x,');
    await expect(tagsOf(canvasElement)).toEqual(['Ann', 'Bob']);
    await expect(removeButtons(canvasElement)[0]).toBeDisabled();
  },
};

const rejectionSent: string[][] = [];

/** A tag that is turned down blocks the submit; fixing the text lets it through. */
export const Rejection: Story = {
  tags: ['no-visual'],
  render: () => (
    <form
      aria-label="Profile"
      style={wide}
      onSubmit={(event) => {
        event.preventDefault();
        rejectionSent.push(new FormData(event.currentTarget).getAll('skills') as string[]);
      }}
    >
      <Field label="Skills">
        <TagInput name="skills" defaultValue={['React']} maxTags={3} />
      </Field>
      <button type="submit">Save</button>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    rejectionSent.length = 0;
    const user = (await realUserEvent()) ?? userEvent;
    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Skills' });
    const error = () => canvasElement.querySelector('.flg-field-error');

    // A duplicate stays in the input, the Field says why, and the browser will not submit.
    await user.click(input);
    await user.keyboard('React,');
    await expect(tagsOf(canvasElement)).toEqual(['React']);
    await expect(input).toHaveValue('React');
    await waitFor(() => expect(error()).toHaveTextContent('Already added'));
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input.validity.customError).toBe(true);
    await user.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(rejectionSent).toEqual([]);

    // Changing the text takes the message away; a new tag goes through, and the submit with it.
    await user.clear(input);
    await waitFor(() => expect(error()).toBeNull());
    await expect(input.validity.valid).toBe(true);
    await user.keyboard('Vue,');
    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue']);
    await user.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(rejectionSent).toEqual([['React', 'Vue']]));

    // maxTags: the fourth is turned down, and a removal makes room.
    await user.click(input);
    await user.keyboard('Svelte,Solid,');
    await expect(tagsOf(canvasElement)).toEqual(['React', 'Vue', 'Svelte']);
    await waitFor(() => expect(error()).toHaveTextContent('Up to 3 tags'));
    await user.keyboard('{Home}{ArrowLeft}{Delete}');
    await waitFor(() => expect(error()).toBeNull());
  },
};
