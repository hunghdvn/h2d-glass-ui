import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, fn, waitFor } from 'storybook/test';
import { SearchIcon } from '../../../.storybook/icons';
import { onPlatform } from '../../../.storybook/platform';
import { settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Card } from '../card/Card';
import { IconButton } from '../icon-button/IconButton';
import { SearchField } from '../search-field/SearchField';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/Tooltip';
import { Kbd } from './Kbd';

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  args: { keys: 'mod+k' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reads the platform of the reader's own machine, as a page does. */
export const Default: Story = { tags: ['no-visual'] };

/** One key, as text. */
export const OneKey: Story = {
  tags: ['no-visual'],
  render: () => <Kbd>Esc</Kbd>,
};

// ---------------------------------------------------------------------------------------------------
// Looks (mockup K1, option k1 of phase-6-kbd-dialog.html). Each story is the part of the card of the
// mockup that its name says, on the platform that its name says, so its shot can be put beside
// `.superpowers/mockups/shots/k1.png`. The baselines are shot on Linux, and a story on "Apple" says so
// itself (.storybook/platform.ts).

const CARD: CSSProperties = { gap: 12, padding: '14px 16px 16px', minWidth: 300 };
const HEAD: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 10 };
const TITLE: CSSProperties = {
  fontWeight: 'var(--flg-weight-semibold)',
  fontSize: 'var(--flg-text-md)',
};
const TAG: CSSProperties = {
  color: 'var(--flg-text-muted)',
  fontSize: 'var(--flg-text-2xs)',
  fontWeight: 'var(--flg-weight-medium)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};
const PROSE: CSSProperties = {
  margin: 0,
  fontSize: 'var(--flg-text-sm)',
  lineHeight: 1.6,
};

/** The head of a card of the mockup: the platform and how its keys are written. */
function Head({ apple }: { apple: boolean }) {
  return (
    <div style={HEAD}>
      <span style={TITLE}>{apple ? 'macOS, iOS' : 'Windows, Linux'}</span>
      <span style={TAG}>{apple ? '⌘ ⇧ ⌥ ⌃, no spaces' : 'Ctrl, Shift, Alt as words'}</span>
    </div>
  );
}

/** A caption over a state of the mockup. */
function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={TAG}>{label}</span>
      {children}
    </div>
  );
}

/** (a), (e) and the SearchField beside them: a key in a sentence and on a solid Button. */
function InText({ apple }: { apple: boolean }) {
  return (
    <Card style={CARD}>
      <Head apple={apple} />
      <Part label="In a sentence · text-sm">
        <p style={PROSE}>
          Press <Kbd>Esc</Kbd> to close, or <Kbd keys="mod+k" /> to search.
        </p>
      </Part>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <Part label="On a primary Button">
          <div>
            <Button variant="primary" aria-keyshortcuts={apple ? 'Meta+S' : 'Control+S'}>
              Save
              <Kbd keys="mod+s" />
            </Button>
          </div>
        </Part>
        <Part label="SearchField · approved, unchanged">
          <SearchField
            aria-label="Search docs"
            placeholder="Search…"
            shortcut="mod+k"
            style={{ width: 184 }}
          />
        </Part>
      </div>
    </Card>
  );
}

/** (b): the tooltip of an icon button, open, with the key after the words. */
function InTooltip({ apple }: { apple: boolean }) {
  return (
    <Card style={{ ...CARD, minWidth: 260 }}>
      <Head apple={apple} />
      <Part label="In a tooltip">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip defaultOpen>
            <TooltipTrigger>
              <IconButton
                aria-label="Search"
                variant="secondary"
                aria-keyshortcuts={apple ? 'Meta+K' : 'Control+K'}
              >
                <SearchIcon width={16} height={16} />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              Search
              <Kbd keys="mod+k" />
            </TooltipContent>
          </Tooltip>
        </div>
      </Part>
    </Card>
  );
}

/** K1 (a) and (e) on a Mac: ⌘ with the symbols close together; the key on the Button is an outline. */
export const KbdInTextApple: Story = {
  beforeEach: onPlatform('apple'),
  render: () => <InText apple />,
};

/** K1 (a) and (e) on Windows and Linux: Ctrl as a word, set apart from the letter. */
export const KbdInTextOther: Story = {
  beforeEach: onPlatform('other'),
  render: () => <InText apple={false} />,
};

/** K1 (b) on a Mac. */
export const KbdInTooltipApple: Story = {
  beforeEach: onPlatform('apple'),
  render: () => <InTooltip apple />,
};

/** K1 (b) on Windows and Linux. */
export const KbdInTooltipOther: Story = {
  beforeEach: onPlatform('other'),
  render: () => <InTooltip apple={false} />,
};

// ---------------------------------------------------------------------------------------------------
// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it.

/** The keys of a combination as a sighted person reads them: the glyph, or the text of the key. */
const visible = (outer: Element) =>
  Array.from(outer.querySelectorAll(':scope > kbd')).map(
    (cell) => cell.querySelector('[aria-hidden="true"]')?.textContent ?? cell.textContent,
  );

/** The first element in the page that matches, as an element of its own kind. */
function find<T extends Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`nothing matches ${selector}`);
  return found;
}

/** The box a combination is drawn in must be what its visible parts take, with nothing for the "+". */
function expectNoRoomForSeparators(outer: HTMLElement) {
  const cells = Array.from(outer.querySelectorAll<HTMLElement>(':scope > kbd'));
  expect(cells.length).toBeGreaterThan(1);
  // The separators are there, one between each two keys, and out of the flow.
  const separators = Array.from(
    outer.querySelectorAll<HTMLElement>(':scope > .flg-visually-hidden'),
  );
  expect(separators).toHaveLength(cells.length - 1);
  for (const separator of separators) {
    expect(getComputedStyle(separator).position).toBe('absolute');
  }
  const style = getComputedStyle(outer);
  const sides = ['borderLeftWidth', 'paddingLeft', 'paddingRight', 'borderRightWidth'] as const;
  const frame = sides.reduce((total, side) => total + Number.parseFloat(style[side]), 0);
  const gaps = (cells.length - 1) * Number.parseFloat(style.columnGap);
  const parts = cells.reduce((total, cell) => total + cell.getBoundingClientRect().width, 0);
  expect(outer.getBoundingClientRect().width).toBeCloseTo(frame + gaps + parts, 0);
}

/**
 * The box is 20px high at `--flg-text-sm`, as the key hint of a SearchField, for a combination and
 * for a single key, and 16px in a tooltip, where it is 6px after the words.
 */
export const KbdBoxHeights: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => (
    <div>
      <p style={PROSE} data-testid="sentence">
        Press <Kbd>Esc</Kbd> to close, or <Kbd keys="mod+shift+f" /> to find.
      </p>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          <IconButton aria-label="Search" variant="secondary">
            <SearchIcon width={16} height={16} />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="right">
          Search
          <Kbd keys="mod+k" />
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvas }) => {
    const sentence = canvas.getByTestId('sentence');
    for (const box of Array.from(sentence.querySelectorAll<HTMLElement>('.flg-kbd'))) {
      await expect(box.getBoundingClientRect().height).toBeCloseTo(20, 0);
    }
    const tip = await waitFor(() => {
      const open = document.querySelector<HTMLElement>('.flg-tooltip:popover-open');
      if (!open) throw new Error('the tooltip is not open');
      return open;
    });
    await settled(tip);
    const box = find<HTMLElement>(tip, '.flg-kbd');
    await expect(box.getBoundingClientRect().height).toBeCloseTo(16, 0);
    // 6px between the end of the words and the cell. A selector cannot see the text node, so the rule
    // is on the Kbd whatever comes before it; the Range measures the text itself.
    const words = Array.from(tip.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (!words) throw new Error('the tooltip has no text');
    const range = document.createRange();
    range.selectNodeContents(words);
    await expect(
      box.getBoundingClientRect().left - range.getBoundingClientRect().right,
    ).toBeCloseTo(6, 0);
  },
};

/** On a Mac the combination is drawn with symbols, named for a screen reader, and marked as Apple. */
export const KbdDrawsAppleSymbols: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  render: () => (
    <p style={PROSE} data-testid="sentence">
      <Kbd keys="mod+shift+f" /> and <Kbd keys="mod+k" /> and <Kbd keys="up" />
    </p>
  ),
  play: async ({ canvas }) => {
    const [combo, search, up] = Array.from(
      canvas.getByTestId('sentence').querySelectorAll<HTMLElement>(':scope > .flg-kbd'),
    );
    for (const box of [combo!, search!, up!]) {
      await expect(box).toHaveAttribute('data-platform', 'apple');
    }
    await expect(visible(combo!)).toEqual(['⌘', '⇧', 'F']);
    await expect(visible(search!)).toEqual(['⌘', 'K']);
    await expect(visible(up!)).toEqual(['↑']);
    await expect(combo!.querySelector('.flg-visually-hidden')?.textContent).toBe('Command');
    // The gap is the tight one of Apple: .05em of the font of the box.
    const style = getComputedStyle(combo!);
    await expect(Number.parseFloat(style.columnGap)).toBeCloseTo(
      0.05 * Number.parseFloat(style.fontSize),
      1,
    );
  },
};

/** Elsewhere the same combination is drawn with words, and the gap is wider. */
export const KbdDrawsWords: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => (
    <p style={PROSE} data-testid="sentence">
      <Kbd keys="mod+shift+f" /> and <Kbd keys="mod+k" /> and <Kbd keys="up" />
    </p>
  ),
  play: async ({ canvas }) => {
    const [combo, search, up] = Array.from(
      canvas.getByTestId('sentence').querySelectorAll<HTMLElement>(':scope > .flg-kbd'),
    );
    for (const box of [combo!, search!, up!]) {
      await expect(box).not.toHaveAttribute('data-platform');
    }
    await expect(visible(combo!)).toEqual(['Ctrl', 'Shift', 'F']);
    await expect(visible(search!)).toEqual(['Ctrl', 'K']);
    // The arrow is a symbol everywhere, and has its name.
    await expect(visible(up!)).toEqual(['↑']);
    await expect(up!.querySelector('.flg-visually-hidden')?.textContent).toBe('Up Arrow');
    const style = getComputedStyle(combo!);
    await expect(Number.parseFloat(style.columnGap)).toBeCloseTo(
      0.3 * Number.parseFloat(style.fontSize),
      1,
    );
  },
};

/** The hidden "+" is not a flex item: the box is what the keys take, and the gaps between them. */
export const KbdSeparatorsTakeNoRoom: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => (
    <p style={PROSE} data-testid="sentence">
      <Kbd keys="mod+shift+f" />
    </p>
  ),
  play: async ({ canvas }) => {
    expectNoRoomForSeparators(find<HTMLElement>(canvas.getByTestId('sentence'), '.flg-kbd'));
  },
};

/** The same on a Mac, where the gap is the tight one. */
export const KbdSeparatorsTakeNoRoomApple: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  render: KbdSeparatorsTakeNoRoom.render,
  play: KbdSeparatorsTakeNoRoom.play,
};

/** A button that holds a Kbd is named by the keys joined with the separator: never "CtrlK". */
export const KbdNamesAButtonOther: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('other'),
  render: () => (
    <Button variant="secondary">
      Search
      <Kbd keys="mod+k" />
    </Button>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /Search\s*Ctrl\s*\+\s*K/ })).toBeVisible();
  },
};

/** On a Mac the symbol is hidden and its name is read: "Command plus K", not "⌘K". */
export const KbdNamesAButtonApple: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  render: KbdNamesAButtonOther.render,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /Search\s*Command\s*\+\s*K/ })).toBeVisible();
  },
};

/**
 * The HTML a server makes has no platform, so it is the form for other systems; once the page has
 * hydrated it, a Mac gets its symbols, without a hydration error.
 */
export const KbdHydratesToTheApplePlatform: Story = {
  tags: ['no-visual'],
  beforeEach: onPlatform('apple'),
  render: () => <div data-testid="host" />,
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('host');
    const server = renderToString(<Kbd keys="mod+k" />);
    host.innerHTML = server;
    const outer = find<HTMLElement>(host, '.flg-kbd');
    await expect(outer).not.toHaveAttribute('data-platform');
    await expect(visible(outer)).toEqual(['Ctrl', 'K']);
    const recoverable = fn();
    let root: Root | undefined;
    try {
      root = hydrateRoot(host, <Kbd keys="mod+k" />, { onRecoverableError: recoverable });
      await waitFor(() => expect(outer).toHaveAttribute('data-platform', 'apple'));
      await expect(visible(outer)).toEqual(['⌘', 'K']);
      // The element the server made is the one that was kept.
      await expect(find(host, '.flg-kbd')).toBe(outer);
      await expect(recoverable).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
    }
  },
};
