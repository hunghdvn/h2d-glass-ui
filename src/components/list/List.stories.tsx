import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { paintedPixel } from '../../../.storybook/painted-pixel';
import { realUserEvent } from '../../../.storybook/real-input';
import { ChevronIcon, strokeIcon } from '../../internal/icons';
import { Avatar } from '../avatar/Avatar';
import { Badge } from '../badge/Badge';
import { Card, CardTitle } from '../card/Card';
import { Checkbox } from '../checkbox/Checkbox';
import { IconButton } from '../icon-button/IconButton';
import { Select, SelectItem } from '../select/Select';
import { Slider } from '../slider/Slider';
import { Switch } from '../switch/Switch';
import { List, ListItem } from './List';
import type { ListProps } from './List';

const meta = {
  title: 'Components/List',
  component: List,
  // The stories hand each List its rows, so the controls have nothing to drive.
  args: { children: null },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

type Look = Pick<ListProps, 'variant'>;

const chevron = <ChevronIcon direction="right" />;

/** The "…" of the mockup's row menu: the icon is the page's, not the library's. */
const MoreIcon = () => (
  <svg {...strokeIcon}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </svg>
);
const UserIcon = () => (
  <svg {...strokeIcon}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
const BellIcon = () => (
  <svg {...strokeIcon}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const LockIcon = () => (
  <svg {...strokeIcon}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const CardIcon = () => (
  <svg {...strokeIcon}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);

const heading = {
  margin: '0 2px 8px',
  color: 'var(--flg-text)',
  fontSize: 'var(--flg-text-md)',
  fontWeight: 'var(--flg-weight-semibold)',
} as const;

/** The list of people, with the four rows of the mockup: static, hovered, with a button, focused. */
function Members(props: Look) {
  return (
    <List {...props} aria-label="Team members">
      <ListItem
        start={<Avatar alt="" fallback="AL" />}
        title="Ada Lovelace"
        description="ada@example.com"
        end={<Badge variant="accent">Admin</Badge>}
      />
      <ListItem
        data-visual-hover=""
        start={<Avatar alt="" fallback="GH" />}
        title="Grace Hopper"
        description="grace@example.com"
        href="#grace"
        end={
          <>
            <span>2 hours ago</span>
            {chevron}
          </>
        }
      />
      <ListItem
        start={<Avatar alt="" fallback="AT" />}
        title="Alan Turing"
        description="alan@example.com"
        href="#alan"
        end={
          <IconButton variant="ghost" size="sm" aria-label="Options for Alan Turing">
            <MoreIcon />
          </IconButton>
        }
      />
      <ListItem
        start={<Avatar alt="" fallback="KJ" />}
        title="Katherine Johnson"
        description="katherine@example.com"
        href="#katherine"
        end={
          <>
            <span>Yesterday</span>
            {chevron}
          </>
        }
      />
    </List>
  );
}

/** The navigation list, `sm`: the current row, a link, a link with a description, a disabled one. */
function Settings(props: Look) {
  return (
    <List {...props} size="sm" aria-label="Settings">
      <ListItem start={<UserIcon />} title="Profile" href="#profile" current end={chevron} />
      <ListItem start={<BellIcon />} title="Notifications" href="#notifications" end={chevron} />
      <ListItem
        start={<LockIcon />}
        title="Security"
        description="Password, two-step sign-in"
        href="#security"
        end={chevron}
      />
      <ListItem
        start={<CardIcon />}
        title="Billing"
        description="Only the team owner can open it"
        href="#billing"
        disabled
        end={chevron}
      />
    </List>
  );
}

/** A list of the mockup's width, with the heading above it that the mockup draws. */
function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ width: 420 }}>
      <div style={heading}>{title}</div>
      {children}
    </div>
  );
}

/**
 * The states of the approved mockup (list L1-L3): the member list, with a static row that holds a
 * Badge, a link row under the pointer (the harness hovers it, through `data-visual-hover`), a link row
 * with a "…" button and a row with keyboard focus; and the `sm` settings list, with the current row, a
 * link, a link with a description and a disabled link. Tab four times: the first stop is the link under
 * the pointer, the mockup draws the focus on the last row of the members.
 */
function Lists({ variant }: Look) {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Frame title="Team members">
        <Members variant={variant} />
      </Frame>
      <Frame title="Settings">
        <Settings variant={variant} />
      </Frame>
    </div>
  );
}

/** `plain` sits on a card in the mockup, so the card gives the lists their headings. */
function PlainLists() {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card style={{ gap: 10, width: 420 }}>
        <CardTitle>Team members</CardTitle>
        <Members variant="plain" />
      </Card>
      <Card style={{ gap: 10, width: 420 }}>
        <CardTitle>Settings</CardTitle>
        <Settings variant="plain" />
      </Card>
    </div>
  );
}

// Tab four times: the link under the pointer, the link of the row with the button, the button, and
// the link of the last row, where the mockup draws the focus.
const focusLastMember: Story['play'] = async ({ canvas }) => {
  for (let stop = 0; stop < 4; stop += 1) await userEvent.tab();
  const focused = canvas.getByRole('link', { name: 'Katherine Johnson' });
  await expect(focused).toHaveFocus();
  await expect(focused.matches(':focus-visible')).toBe(true);
};

export const Inset: Story = { render: () => <Lists variant="inset" />, play: focusLastMember };
export const Cards: Story = { render: () => <Lists variant="cards" />, play: focusLastMember };
export const Plain: Story = { render: () => <PlainLists />, play: focusLastMember };

const THREE_VARIANTS = ['inset', 'cards', 'plain'] as const;

/**
 * A press anywhere on a row that can be pressed is a press of its title, which is stretched over the
 * row; a press on the button in the end cell is that button's alone, and does not reach the title. A
 * disabled row does nothing. Real mouse input, because a hit test is what the stretched link is for.
 */
export const PressAnywhere: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 18, width: 420 }}>
      {THREE_VARIANTS.map((variant) => (
        <List key={variant} variant={variant} aria-label={variant}>
          <ListItem
            start={<Avatar alt="" fallback="AL" />}
            title="Ada Lovelace"
            description="ada@example.com"
            onSelect={fn()}
            end={
              <IconButton variant="ghost" size="sm" aria-label="Options for Ada" onClick={fn()}>
                <MoreIcon />
              </IconButton>
            }
          />
          <ListItem
            title="Billing"
            description="Only the owner"
            onSelect={fn()}
            disabled
            end={chevron}
          />
        </List>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    for (const variant of THREE_VARIANTS) {
      const list = canvasElement.querySelector<HTMLElement>(`[aria-label="${variant}"]`)!;
      const [row, disabledRow] = Array.from(list.querySelectorAll<HTMLElement>('li'));
      const title = row!.querySelector<HTMLButtonElement>('.flg-list-item-title')!;
      const optionsButton = row!.querySelector<HTMLButtonElement>('.flg-list-item-end button')!;
      let presses = 0;
      title.addEventListener('click', () => (presses += 1));
      let optionPresses = 0;
      optionsButton.addEventListener('click', () => (optionPresses += 1));

      // Over the start cell, the description, the title and the empty part of the row, as offsets from
      // the corner of the row: a press scrolls the page, so a point on the screen would go stale.
      const corner = row!.getBoundingClientRect();
      const centreOf = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x + rect.width / 2 - corner.x, y: rect.y + rect.height / 2 - corner.y };
      };
      const spots = [
        centreOf(row!.querySelector('.flg-list-item-start')!),
        centreOf(row!.querySelector('.flg-list-item-description')!),
        centreOf(title),
        { x: corner.width * 0.75, y: corner.height / 2 },
      ];
      for (const [index, spot] of spots.entries()) {
        const now = row!.getBoundingClientRect();
        // What lies under the pointer is the title, or something inside it.
        await expect(
          title.contains(document.elementFromPoint(now.x + spot.x, now.y + spot.y)),
        ).toBe(true);
        await real.click(row!, { position: spot });
        await waitFor(() => expect(presses).toBe(index + 1));
      }
      await expect(optionPresses).toBe(0);

      // The button is above the stretched link: a press on it reaches it, and not the title.
      const button = optionsButton.getBoundingClientRect();
      await expect(
        optionsButton.contains(
          document.elementFromPoint(button.x + button.width / 2, button.y + button.height / 2),
        ),
      ).toBe(true);
      await real.click(optionsButton);
      await waitFor(() => expect(optionPresses).toBe(1));
      await expect(presses).toBe(spots.length);

      // A disabled row: the whole row says so, and a press does nothing.
      const disabledTitle = disabledRow!.querySelector<HTMLButtonElement>('.flg-list-item-title')!;
      await expect(disabledTitle).toBeDisabled();
      await expect(getComputedStyle(disabledTitle).cursor).toBe('not-allowed');
      let disabledPresses = 0;
      disabledTitle.addEventListener('click', () => (disabledPresses += 1));
      await real.click(disabledRow!);
      await expect(disabledPresses).toBe(0);
    }
  },
};

/**
 * Only a row that can be pressed carries `data-interactive`, and only such a row reacts to the
 * pointer: the link row takes the hover background, the static row stays as it is. The hover is a
 * real mouse move, since `:hover` cannot be turned on from a play function otherwise.
 */
export const HoverOnlyOnPressableRows: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 18, width: 420 }}>
      <List variant="inset" aria-label="Rows">
        <ListItem title="Static" description="Cannot be pressed" />
        <ListItem title="Link" description="Can be pressed" href="#link" />
        <ListItem title="Disabled" href="#disabled" disabled />
      </List>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [staticRow, linkRow, disabledRow] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('li'),
    );
    await expect(
      [staticRow, linkRow, disabledRow].map((row) => row!.hasAttribute('data-interactive')),
    ).toEqual([false, true, false]);
    const real = await realUserEvent();
    if (!real) return;
    const transparent = 'rgba(0, 0, 0, 0)';
    const background = (row: HTMLElement | undefined) => getComputedStyle(row!).backgroundColor;
    await real.hover(linkRow!);
    await waitFor(() => expect(background(linkRow)).not.toBe(transparent));
    await real.hover(staticRow!);
    await expect(background(staticRow)).toBe(transparent);
    await real.hover(disabledRow!);
    await expect(background(disabledRow)).toBe(transparent);
    await expect(background(linkRow)).toBe(transparent);
  },
};

/**
 * Plain colours for the focus ring and for what the next row paints, so that one pixel tells which
 * is on top: the ring red, with no glow; the current background green; the hover background blue;
 * and in `cards` a solid shadow of those colours that reaches into the 6px gap, as a soft one does.
 * Motion is off, so the hovered card has lifted when the pixel is read.
 */
const ringProbe = {
  '--flg-focus-outline-color': 'rgb(255, 0, 0)',
  '--flg-focus-ring': 'none',
  '--flg-selected-bg': 'rgb(0, 160, 0)',
  '--flg-control-track': 'rgb(0, 0, 255)',
  '--flg-list-card-hover-bg': 'rgb(0, 0, 255)',
  '--flg-list-card-shadow': '0 0 0 4px rgb(0, 160, 0)',
  '--flg-list-card-shadow-hover': '0 0 0 4px rgb(0, 0, 255)',
  '--flg-duration-fast': '0ms',
  padding: 12,
  width: 420,
} as CSSProperties;

const RING_CASES = ['hovered', 'current'] as const;

/** A focused row above a row under the pointer, and above the current row, in one look. */
function RingFrames({ variant }: { variant: 'plain' | 'cards' }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {RING_CASES.map((next) => (
        <div key={next} data-case={next} style={ringProbe}>
          <List variant={variant} aria-label={`${variant}, ${next}`}>
            <ListItem title="Focused" description="Above the next row" href={`#${next}-1`} />
            <ListItem
              title={next === 'current' ? 'Current' : 'Hovered'}
              description="The next row"
              href={`#${next}-2`}
              current={next === 'current'}
            />
          </List>
        </div>
      ))}
    </div>
  );
}

/**
 * The focus ring of a row reaches 4px beyond it: into the next row in `plain` (2px apart), and into
 * the shadow of the next card in `cards`. Every look raises the focused row, so the ring stays whole
 * above the row below it, when that row is under the pointer and when it is the current one. Read
 * from the painted pixels, since a ring takes no pointer and no hit test can find it. The row under
 * the pointer comes first: Playwright's wait for an element to be stable before it hovers it does
 * not end after a screenshot in this runner, although nothing moves.
 */
function checkRingAboveTheNextRow(variant: 'plain' | 'cards'): Story['play'] {
  return async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    for (const next of RING_CASES) {
      const label = `${variant}, above the ${next} row`;
      const frame = canvasElement.querySelector<HTMLElement>(`[data-case="${next}"]`)!;
      const [row, below] = Array.from(frame.querySelectorAll<HTMLElement>('li'));
      if (next === 'hovered') {
        await real.hover(below!);
        await expect(below!.matches(':hover'), `${label}: it is under the pointer`).toBe(true);
      }
      // The ring is drawn for a focus given by script after a key press (Chromium, WebKit) or one
      // that asks for it (Firefox), also after the real presses of the stories before.
      const title = row!.querySelector<HTMLElement>('.flg-list-item-title')!;
      await real.keyboard('{Escape}');
      title.focus({ focusVisible: true });
      await expect(title).toHaveFocus();
      await expect(title.matches(':focus-visible'), `${label}: the ring is drawn`).toBe(true);
      // The middle of the outline below the row: 2px out, 2px wide.
      const outer = frame.getBoundingClientRect();
      const box = row!.getBoundingClientRect();
      const pixel = (await paintedPixel(
        frame,
        box.x + box.width / 2 - outer.x,
        box.bottom + 3 - outer.y,
      ))!;
      const [red, green, blue] = pixel;
      await expect(
        red > 200 && green < 60 && blue < 60,
        `${label}: the ring below the focused row is on top (rgb ${pixel.join(', ')})`,
      ).toBe(true);
      title.blur();
    }
  };
}

// The tags are written here, not in a helper: the Storybook indexer reads them without running the
// file, and the visual harness skips a story only when the index says `no-visual`.
export const FocusRingInPlain: Story = {
  tags: ['no-visual'],
  render: () => <RingFrames variant="plain" />,
  play: checkRingAboveTheNextRow('plain'),
};
export const FocusRingInCards: Story = {
  tags: ['no-visual'],
  render: () => <RingFrames variant="cards" />,
  play: checkRingAboveTheNextRow('cards'),
};

/**
 * A long title and description in a 320px frame are cut short with an ellipsis, and the end cell keeps
 * its place and its width, in each look: in a block, and as an item of a flex row beside a box, where a
 * list that did not shrink would push the row wider than the frame.
 */
export const LongText: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {THREE_VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: 12 }}>
          <div data-frame={`${variant}-block`} style={{ width: 320 }}>
            <LongRow variant={variant} />
          </div>
          <div
            data-frame={`${variant}-flex`}
            style={{ display: 'flex', alignItems: 'start', gap: 12, width: 320 }}
          >
            <span style={{ flex: 'none', width: 40, height: 40 }} />
            <LongRow variant={variant} />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const variant of THREE_VARIANTS) {
      for (const kind of ['block', 'flex']) {
        const frame = canvasElement.querySelector<HTMLElement>(
          `[data-frame="${variant}-${kind}"]`,
        )!;
        const list = frame.querySelector<HTMLElement>('.flg-list')!;
        const row = list.querySelector<HTMLElement>('li')!;
        const title = row.querySelector<HTMLElement>('.flg-list-item-title')!;
        const description = row.querySelector<HTMLElement>('.flg-list-item-description')!;
        const end = row.querySelector<HTMLElement>('.flg-list-item-end')!;
        const label = `${variant} ${kind}`;
        const frameBox = frame.getBoundingClientRect();
        // Inside the frame, the end cell inside the row, and the words cut short.
        // `plain` runs 8px beyond the frame on each side, by design (spec phase 4 §4.3).
        const bleed = variant === 'plain' ? 8 : 0;
        await expect(row.getBoundingClientRect().right, label).toBeLessThanOrEqual(
          frameBox.right + bleed + 0.5,
        );
        await expect(end.getBoundingClientRect().right, label).toBeLessThanOrEqual(
          row.getBoundingClientRect().right + 0.5,
        );
        await expect(end.getBoundingClientRect().width, label).toBeGreaterThan(20);
        await expect(title.scrollWidth, label).toBeGreaterThan(title.clientWidth);
        await expect(description.scrollWidth, label).toBeGreaterThan(description.clientWidth);
        await expect(getComputedStyle(title).textOverflow, label).toBe('ellipsis');
      }
    }
  },
};

function LongRow({ variant }: Look) {
  return (
    <List variant={variant} aria-label={`Long ${variant}`}>
      <ListItem
        start={<Avatar alt="" fallback="LT" />}
        title="A title that is much too long to fit in a column of this width, however it is set"
        description="A description that runs on and on, well past the end of the line it is given"
        href="#long"
        end={<Badge variant="accent">Admin</Badge>}
      />
    </List>
  );
}

const endControls = {
  switch: <Switch aria-label="Notifications" />,
  checkbox: <Checkbox aria-label="Selected" />,
  select: (
    <Select aria-label="Frequency" defaultValue="daily">
      <SelectItem value="daily">Daily</SelectItem>
      <SelectItem value="weekly">Weekly</SelectItem>
    </Select>
  ),
} as const;

/**
 * The end cell is a layer above the stretched link of the title, and what can be pressed in it takes
 * the pointer: a press on its plain text falls through to the title. The controls of the library
 * there are the same size and shape as on their own, and keep their own stacking: the parts a
 * component lays over its own visual (the invisible input over a Switch, the native `<select>` over
 * a Select trigger) stay where they are, and the focused thumb of a range Slider is above the other.
 * A press on a Slider's track moves a thumb, a plain `<label>` is pressable, and a plain button and an
 * `IconButton` are above the stretched link. A press on the empty part of the row, and on the words
 * "2 hours ago", still reaches the title.
 */
export const ControlsInTheEndCell: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 18, width: 420 }}>
      <div data-frame="alone" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        {Object.entries(endControls).map(([name, control]) => (
          <span key={name} data-control={name} style={{ display: 'inline-flex' }}>
            {control}
          </span>
        ))}
        <span data-control="slider" style={{ display: 'inline-flex' }}>
          <Slider aria-label="Volume" defaultValue={40} />
        </span>
      </div>
      <List variant="inset" aria-label="Controls">
        {Object.entries(endControls).map(([name, control]) => (
          <ListItem key={name} title={name} href={`#${name}`} end={control} />
        ))}
        <ListItem
          title="slider"
          href="#slider"
          end={<Slider aria-label="Volume" defaultValue={40} />}
        />
        <ListItem
          title="range"
          onSelect={fn()}
          end={<Slider aria-label="Range" defaultValue={[20, 22]} style={{ width: 160 }} />}
        />
        <ListItem
          title="label"
          onSelect={fn()}
          end={
            <label data-label="">
              <input type="checkbox" /> Pin
            </label>
          }
        />
        <ListItem
          title="text"
          onSelect={fn()}
          end={
            <>
              <span data-words="">2 hours ago</span>
              {chevron}
            </>
          }
        />
        <ListItem
          title="buttons"
          onSelect={fn()}
          end={
            <>
              <button type="button" data-raw="">
                Raw
              </button>
              <IconButton variant="ghost" size="sm" aria-label="Options">
                <MoreIcon />
              </IconButton>
            </>
          }
        />
      </List>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const alone = (name: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-frame="alone"] [data-control="${name}"]`)!;
    const row = (title: string) =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>('.flg-list li')).find(
        (li) => li.querySelector('.flg-list-item-title')?.textContent === title,
      )!;
    const width = (element: Element) => element.getBoundingClientRect().width;
    // What lies under a point of the element, `x` of the way along it.
    const hit = (element: Element, x = 0.5) => {
      const box = element.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width * x, box.y + box.height / 2);
    };

    // The thumb of a range that has the focus is above the other, where they overlap.
    const [low, high] = Array.from(row('range').querySelectorAll<HTMLElement>('.flg-slider-thumb'));
    const lowBox = low!.getBoundingClientRect();
    const highBox = high!.getBoundingClientRect();
    await expect(highBox.left, 'the thumbs overlap').toBeLessThan(lowBox.right);
    const overlap = {
      x: (highBox.left + lowBox.right) / 2,
      y: lowBox.y + lowBox.height / 2,
    };
    for (const thumb of [low!, high!, low!]) {
      thumb.focus();
      await expect(
        thumb.contains(document.elementFromPoint(overlap.x, overlap.y)),
        `the thumb at ${thumb.getAttribute('aria-valuenow')} is on top while it has the focus`,
      ).toBe(true);
    }

    // Each control is as wide as it is on its own.
    for (const [name, selector] of [
      ['switch', '.flg-switch'],
      ['checkbox', '.flg-checkbox'],
      ['select', '.flg-select-trigger'],
    ] as const) {
      await expect(
        width(row(name).querySelector(`.flg-list-item-end ${selector}`)!),
        name,
      ).toBeCloseTo(width(alone(name).querySelector(selector)!), 0);
    }
    // The native parts that a component lays over its own visual stay out of the flow.
    for (const [name, selector] of [
      ['switch', '.flg-switch-input'],
      ['checkbox', '.flg-checkbox-input'],
      ['select', '.flg-select-native'],
    ] as const) {
      await expect(getComputedStyle(row(name).querySelector(selector)!).position, name).toBe(
        'absolute',
      );
    }
    await expect(getComputedStyle(row('slider').querySelector('.flg-slider-thumb')!).position).toBe(
      getComputedStyle(alone('slider').querySelector('.flg-slider-thumb')!).position,
    );

    // A press at the Switch track lands on its input.
    await expect(hit(row('switch').querySelector('.flg-switch-track')!)).toBe(
      row('switch').querySelector('.flg-switch-input'),
    );

    // A plain button, an IconButton and a plain label are above the stretched link; the words in
    // the end cell are not, so a press there is a press of the title.
    const buttons = row('buttons');
    const raw = buttons.querySelector<HTMLElement>('[data-raw]')!;
    const iconButton = buttons.querySelector<HTMLElement>('.flg-list-item-end .flg-button')!;
    for (const button of [raw, iconButton]) {
      await expect(button.contains(hit(button))).toBe(true);
    }
    const label = row('label').querySelector<HTMLElement>('[data-label]')!;
    await expect(hit(label, 0.85), 'the words of the label').toBe(label);
    const words = row('text').querySelector<HTMLElement>('[data-words]')!;
    await expect(row('text').querySelector('.flg-list-item-title')!.contains(hit(words))).toBe(
      true,
    );

    const real = await realUserEvent();
    if (!real) return;
    // Counts the presses that reach the title of a row.
    const presses = (title: string) => {
      const counter = { count: 0 };
      row(title)
        .querySelector('.flg-list-item-title')!
        .addEventListener('click', () => (counter.count += 1));
      return counter;
    };
    const buttonsTitle = presses('buttons');
    let rawPresses = 0;
    raw.addEventListener('click', () => (rawPresses += 1));
    await real.click(raw);
    await waitFor(() => expect(rawPresses).toBe(1));
    await expect(buttonsTitle.count).toBe(0);
    const corner = buttons.getBoundingClientRect();
    await real.click(buttons, { position: { x: corner.width * 0.5, y: corner.height / 2 } });
    await waitFor(() => expect(buttonsTitle.count).toBe(1));

    // A press on the track of the range moves the nearer thumb there, and not the row.
    const rangeTitle = presses('range');
    const control = row('range').querySelector<HTMLElement>('.flg-slider-control')!;
    const track = control.getBoundingClientRect();
    await real.click(control, { position: { x: track.width * 0.8, y: track.height / 2 } });
    await waitFor(() => expect(Number(high!.getAttribute('aria-valuenow'))).toBeGreaterThan(60));
    await expect(rangeTitle.count).toBe(0);

    // A press on the words of the label checks its box, and not the row.
    const labelTitle = presses('label');
    const box = label.querySelector('input')!;
    await real.click(label, { position: { x: width(label) * 0.85, y: label.offsetHeight / 2 } });
    await waitFor(() => expect(box).toBeChecked());
    await expect(labelTitle.count).toBe(0);

    // A press on the words in the end cell is a press of the title. The press is aimed at the row,
    // since the words themselves do not take the pointer.
    const textTitle = presses('text');
    const textRow = row('text').getBoundingClientRect();
    const wordsBox = words.getBoundingClientRect();
    await real.click(row('text'), {
      position: {
        x: wordsBox.x + wordsBox.width / 2 - textRow.x,
        y: wordsBox.y + wordsBox.height / 2 - textRow.y,
      },
    });
    await waitFor(() => expect(textTitle.count).toBe(1));
  },
};
