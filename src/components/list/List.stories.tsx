import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { ChevronIcon, strokeIcon } from '../../internal/icons';
import { Avatar } from '../avatar/Avatar';
import { Badge } from '../badge/Badge';
import { Card, CardTitle } from '../card/Card';
import { IconButton } from '../icon-button/IconButton';
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
