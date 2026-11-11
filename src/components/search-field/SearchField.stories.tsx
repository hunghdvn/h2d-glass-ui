import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { CSSProperties, ReactNode, SVGProps } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DemoBrand, DemoContent, DemoNav, DemoStyles } from '../../../.storybook/app-shell-demo';
import { BellIcon } from '../../../.storybook/icons';
import { paintedPixels } from '../../../.storybook/painted-pixel';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { withViewport } from '../../../.storybook/viewport';
import { strokeIcon } from '../../internal/icons';
import { isApplePlatform } from '../../internal/platform';
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
import type { AppShellLayout } from '../app-shell/AppShell';
import { Avatar } from '../avatar/Avatar';
import { IconButton } from '../icon-button/IconButton';
import { Surface } from '../surface/Surface';
import { SearchField } from './SearchField';
import type { SearchFieldProps } from './SearchField';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  args: { 'aria-label': 'Search docs', placeholder: 'Search…' },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

// The mockup (phase-5-header) draws ⌘K, and the baselines are shot on Linux, where the hint would read
// "Ctrl K": the stories fix the text, so what is compared is the look.
const APPLE_KEY: SearchFieldProps['labels'] = { shortcut: () => '⌘K' };

/** The widgets of the header of the mockup that the question is not about: drawn neutral, the same in every option. */
function Sun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
function Menu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const WIDGETS = (
  <>
    <IconButton variant="ghost" aria-label="Notifications">
      <BellIcon />
    </IconButton>
    <IconButton variant="ghost" aria-label="Theme">
      <Sun />
    </IconButton>
    <IconButton
      variant="ghost"
      aria-label="Account"
      style={{ borderRadius: 'var(--flg-radius-full)' }}
    >
      <Avatar alt="" fallback="MA" size="sm" />
    </IconButton>
  </>
);

const mark: CSSProperties = {
  flex: 'none',
  width: 22,
  height: 22,
  borderRadius: 'var(--flg-radius-xs)',
  background: 'var(--flg-accent-gradient)',
};

/**
 * A strip like the header strip of the mockup (a glass bar, 56px high, a menu button and the brand
 * at the start, the neutral widgets at the end), one for each state. Several bars cannot be a whole
 * AppShell each, so they are drawn as in the page of the mockup (spec phase 5 §7); the stories that
 * need the real header use an AppShell.
 */
function Strip({
  caption,
  children,
  end,
}: {
  caption: string;
  /** What stands between the brand and the end cluster. */
  children?: ReactNode;
  /** What stands in the end cluster, before the widgets. */
  end?: ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 'var(--flg-text-xs)', color: 'var(--flg-text)' }}>{caption}</span>
      <Surface
        style={
          {
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: 56,
            minWidth: 0,
            padding: '0 10px 0 8px',
            boxSizing: 'border-box',
            '--flg-button-icon': '18px',
          } as CSSProperties
        }
      >
        <IconButton variant="ghost" aria-label="Open navigation">
          <Menu />
        </IconButton>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 10px 0 4px',
            font: 'var(--flg-weight-semibold) var(--flg-text-md)/1 var(--flg-font-sans)',
            color: 'var(--flg-text)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={mark} aria-hidden="true" />
          Lumen
        </span>
        {children}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          {end}
          {WIDGETS}
        </div>
      </Surface>
    </div>
  );
}

const strips = { display: 'grid', gap: 14, width: 640 } as const;
/** The field of H2 in the strip: 280px, 2px off the gap that follows the brand. */
const H2_BOX: CSSProperties = { width: 280, marginLeft: 2 };
/** H3 open: 300px, 6px off the widget that follows. */
const H3_BOX: CSSProperties = { width: 300, margin: '0 6px 0 0' };

/**
 * H2: the field of the library next to the brand, 280px wide. Empty, with the hint of the key; focused,
 * with some text and the button that clears it.
 */
export const SearchFieldDefault: Story = {
  render: (args) => (
    <div style={strips}>
      <Strip caption="Empty, with the placeholder and the hint ⌘K">
        <SearchField {...args} shortcut="mod+k" labels={APPLE_KEY} style={H2_BOX} />
      </Strip>
      <Strip caption="Focus, with some text and the button that clears it">
        <SearchField {...args} defaultValue="report" style={H2_BOX} />
      </Strip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const inputs = within(canvasElement).getAllByRole('searchbox');
    inputs[1]!.focus();
    await expect(inputs[1]).toHaveFocus();
  },
};

/** An application with the search in its header. S2 (`header`) keeps the brand in the header at every width. */
const App = ({ search, layout }: { search: ReactNode; layout?: AppShellLayout }) => (
  <>
    <DemoStyles />
    <AppShell brand={<DemoBrand />} layout={layout}>
      <AppShellHeader>{search}</AppShellHeader>
      <AppShellSidebar>
        <DemoNav />
      </AppShellSidebar>
      <AppShellMain>
        <DemoContent />
      </AppShellMain>
    </AppShell>
  </>
);

/** The widgets that follow the search in the header, on the right: a cluster that has no `position`. */
const End = ({ children }: { children?: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
    {children}
    {WIDGETS}
  </div>
);

/** H2 on a phone, in a real AppShell: the field shrinks to the room that is left, with no key hint, and the brand keeps its mark only. */
export const SearchFieldDefaultPhone: Story = {
  tags: ['viewport-360x640'],
  parameters: { stage: 'page' },
  render: (args) => (
    <App
      search={
        <>
          <SearchField {...args} shortcut="mod+k" labels={APPLE_KEY} />
          <End />
        </>
      }
    />
  ),
};

/**
 * H3: a button that rests in the place of the field, with the name of the key in its tooltip; open and
 * empty, with the focus in it; open with some text.
 */
export const SearchFieldCollapsible: Story = {
  render: (args) => (
    <div style={{ ...strips, paddingBottom: 30 }}>
      <Strip
        caption="Collapsed, the pointer on the button: the tooltip has the key"
        end={
          <span data-visual-hover="tooltip" style={{ display: 'inline-flex' }}>
            <SearchField {...args} collapsible shortcut="mod+k" labels={APPLE_KEY} />
          </span>
        }
      />
      <Strip
        caption="Open (a click, or the key), empty, with the focus in it"
        end={
          <SearchField {...args} collapsible shortcut="mod+k" labels={APPLE_KEY} style={H3_BOX} />
        }
      />
      <Strip
        caption="Open, with some text and the button that clears it"
        end={<SearchField {...args} collapsible defaultValue="report" style={H3_BOX} />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button', { name: 'Search' });
    // The three fields rest as buttons; the last two are opened. The one with text is opened first:
    // an empty field closes when the focus leaves it, and the focus ends in the empty one.
    await userEvent.click(buttons[2]!);
    await userEvent.click(buttons[1]!);
    const empty = within(canvasElement)
      .getAllByRole('searchbox')
      .find((input) => !(input as HTMLInputElement).value);
    await expect(empty).toHaveFocus();
  },
};

/** H3 on a phone, in a real AppShell: the button rests among the widgets. */
export const SearchFieldCollapsiblePhone: Story = {
  tags: ['viewport-360x640'],
  parameters: { stage: 'page' },
  render: (args) => (
    <App
      search={
        <End>
          <SearchField {...args} collapsible shortcut="mod+k" labels={APPLE_KEY} />
        </End>
      }
    />
  ),
};

/**
 * H3 on a phone, open: the field covers the row of the header, from the button ← to the edge. It has
 * some text, so it stays open when the focus goes.
 */
export const SearchFieldCollapsiblePhoneOpen: Story = {
  tags: ['viewport-360x640'],
  parameters: { stage: 'page' },
  render: SearchFieldCollapsiblePhone.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await userEvent.type(canvas.getByRole('searchbox'), 'report');
    await expect(canvas.getByRole('searchbox')).toHaveFocus();
  },
};

// ---------------------------------------------------------------------------------------------------
// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it.

/** The key of the platform for `mod+k`, pressed as a user does. */
const modK = isApplePlatform() ? '{Meta>}k{/Meta}' : '{Control>}k{/Control}';

/**
 * "/" focuses the field from the page and types no "/"; typed in a field it is a letter, in this one
 * too. Esc clears, and Esc on an empty field leaves the page its key. `mod+k` opens a collapsed field,
 * and the next Esc clears it, the one after closes it and puts the focus back on the button. Trusted
 * keys: the Storybook UI has none.
 */
export const ShortcutsAndEsc: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={strips}>
      <SearchField {...args} aria-label="Docs" shortcut="/" />
      <SearchField {...args} aria-label="Collapsible" collapsible shortcut="mod+k" />
      <input aria-label="Other" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const canvas = within(canvasElement);
    const docs = canvas.getByRole('searchbox', { name: 'Docs' });
    const other = canvas.getByRole('textbox', { name: 'Other' });

    await real.keyboard('/');
    await expect(docs).toHaveFocus();
    await expect(docs).toHaveValue('');
    await real.keyboard('ab/');
    await expect(docs).toHaveValue('ab/');
    await real.keyboard('{Escape}');
    await expect(docs).toHaveValue('');
    await expect(docs).toHaveFocus();
    // Empty and not collapsible: the key is the page's.
    const seen: boolean[] = [];
    const watch = (event: KeyboardEvent) => seen.push(event.defaultPrevented);
    document.addEventListener('keydown', watch);
    await real.keyboard('{Escape}');
    document.removeEventListener('keydown', watch);
    await expect(seen).toEqual([false]);

    await real.click(other);
    await real.keyboard('/');
    await expect(other).toHaveValue('/');
    await expect(other).toHaveFocus();
    other.blur();

    // Collapsed, its field is out of the page, and so out of the accessibility tree.
    const collapsible = canvas.getByRole('searchbox', { name: 'Collapsible', hidden: true });
    await expect(collapsible).not.toBeVisible();
    await real.keyboard(modK);
    await waitFor(() => expect(collapsible).toHaveFocus());
    await expect(canvas.queryByRole('button', { name: 'Search' })).toBeNull();
    await real.keyboard('xyz');
    await real.keyboard('{Escape}');
    await expect(collapsible).toHaveValue('');
    await expect(collapsible).toBeVisible();
    await real.keyboard('{Escape}');
    const button = await canvas.findByRole('button', { name: 'Search' });
    await expect(button).toHaveFocus();
    await expect(collapsible).not.toBeVisible();
    // The key opens it again, and takes the text back as selected.
    await real.keyboard(modK);
    await waitFor(() => expect(collapsible).toHaveFocus());
  },
};

/** Enter in a field of a `<form role="search">` submits it, with the name and the text, in every engine. */
export const EnterSubmitsTheForm: Story = {
  tags: ['no-visual'],
  render: (args) => {
    function Form() {
      const [sent, setSent] = useState('');
      return (
        <form
          role="search"
          style={{ width: 320 }}
          onSubmit={(event) => {
            event.preventDefault();
            setSent(String(new FormData(event.currentTarget).get('q')));
          }}
        >
          <SearchField {...args} name="q" />
          <output aria-label="Sent">{sent}</output>
        </form>
      );
    }
    return <Form />;
  },
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const canvas = within(canvasElement);
    await real.click(canvas.getByRole('searchbox'));
    await real.keyboard('glass{Enter}');
    await expect(canvas.getByLabelText('Sent')).toHaveTextContent('glass');
  },
};

/**
 * The clear button is in the Tab order after the field and takes the text away with the focus back in
 * the field; a collapsed field closes when it is empty and the page is clicked, and does not close
 * while it has text (WebKit does not focus a button that is clicked, so the focus leaves by a different
 * road there). Real presses and clicks.
 */
export const ClearAndClose: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, width: 360 }}>
      <SearchField {...args} aria-label="Plain" defaultValue="abc" />
      <SearchField {...args} aria-label="Collapsible" collapsible />
      <p data-page="">Somewhere on the page</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    const canvas = within(canvasElement);
    const plain = canvas.getByRole('searchbox', { name: 'Plain' });
    await real.click(plain);
    await real.keyboard('{Tab}');
    const clear = canvas.getByRole('button', { name: 'Clear search' });
    await expect(clear).toHaveFocus();
    await real.click(clear);
    await expect(plain).toHaveValue('');
    await expect(plain).toHaveFocus();

    const page = canvasElement.querySelector<HTMLElement>('[data-page]')!;
    await real.click(canvas.getByRole('button', { name: 'Search' }));
    const collapsible = canvas.getByRole('searchbox', { name: 'Collapsible' });
    await expect(collapsible).toHaveFocus();
    await real.click(page);
    await waitFor(() => expect(collapsible).not.toBeVisible());
    await real.click(canvas.getByRole('button', { name: 'Search' }));
    await real.keyboard('a');
    await real.click(page);
    await expect(collapsible).toBeVisible();
    await expect(collapsible).toHaveValue('a');
    await real.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(collapsible).toHaveValue('');
    await expect(collapsible).toHaveFocus();
  },
};

const rect = (el: Element) => el.getBoundingClientRect();
const header = (root: ParentNode) => root.querySelector<HTMLElement>('.flg-app-shell-header')!;
const shown = (el: Element) => getComputedStyle(el).display !== 'none';
const hidden = (el: Element) => getComputedStyle(el).visibility === 'hidden';

/**
 * In the header of a real AppShell, at the width of a phone and wider. H2: wide, 280px, brand with
 * its name, hint of the key; below 768px the field takes what is left, the name of the brand is
 * hidden to its mark and there is no hint. H3: wide, the open field is 300px beside the widgets, 6px
 * off the next one; below 768px it covers the row of the header, the rest of it is out of sight, out of
 * the Tab order, and the button ← closes it and keeps the text; the page never scrolls sideways.
 */
export const InTheHeader: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'page' },
  render: (args) => (
    <App
      layout="header"
      search={
        <>
          <SearchField {...args} aria-label="Docs" shortcut="/" />
          <End>
            <SearchField {...args} aria-label="Quick" collapsible shortcut="mod+k" />
          </End>
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      const bar = () => header(canvasElement);
      // Found by their attributes, not by role and name: what is out of sight (`display: none`,
      // `visibility: hidden`) has no name in the accessibility tree, and the story is about it.
      const button = (name: string) =>
        bar().querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
      const field = (name: string) =>
        canvasElement.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`)!;
      const docs = () => field('Docs');
      const quick = () => field('Quick');
      const docsKbd = () =>
        docs().closest('.flg-search-field')!.querySelector('.flg-search-field-kbd')!;
      const brandName = () => bar().querySelector<HTMLElement>('.flg-app-shell-brand-name')!;
      const noSideScroll = () =>
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
          document.documentElement.clientWidth,
        );

      // Wide: H2 is 280px, the brand is written out, the hint of the key shows.
      await viewport.set(1280, 720);
      const root = docs().closest<HTMLElement>('.flg-search-field')!;
      await expect(rect(root).width).toBeCloseTo(280, 0);
      await expect(rect(brandName()).width).toBeGreaterThan(20);
      await expect(shown(docsKbd().parentElement!)).toBe(true);
      await noSideScroll();
      // H3 opens beside the widgets, 300px wide, 6px and the gap off the next one, and the button ←
      // is not drawn.
      await real.click(button('Search'));
      const quickRoot = quick().closest<HTMLElement>('.flg-search-field')!;
      await expect(quick()).toHaveFocus();
      await expect(rect(quickRoot).width).toBeCloseTo(300, 0);
      await expect(getComputedStyle(quickRoot).position).not.toBe('absolute');
      await expect(shown(button('Close search'))).toBe(false);
      await expect(hidden(button('Theme'))).toBe(false);
      await expect(rect(button('Notifications')).left - rect(quickRoot).right).toBeCloseTo(10, 0);
      quick().blur();
      await waitFor(() => expect(quick()).not.toBeVisible());

      // Narrow: H2 fills the row, the name of the brand is only its mark, no hint of the key.
      await viewport.set(360, 640);
      await expect(rect(brandName()).width).toBeLessThanOrEqual(1);
      // It takes the room that is left: 4px of its margin and the gap of the header off the widgets.
      const end = bar().lastElementChild!;
      await expect(rect(end).left - rect(root).right).toBeCloseTo(8, 0);
      await expect(rect(root).width).toBeGreaterThan(100);
      await expect(shown(docsKbd().parentElement!)).toBe(false);
      await noSideScroll();

      // Narrow, H3 open: it covers the header.
      await real.click(button('Search'));
      await expect(quick()).toHaveFocus();
      const cover = quick().closest<HTMLElement>('.flg-search-field')!;
      await expect(getComputedStyle(cover).position).toBe('absolute');
      // It covers what the header has inside its border: the padding box, which is where an element
      // placed with `inset: 0` is.
      const barBox = rect(bar());
      const inside = [
        barBox.left + bar().clientLeft,
        barBox.top + bar().clientTop,
        barBox.left + bar().clientLeft + bar().clientWidth,
        barBox.top + bar().clientTop + bar().clientHeight,
      ];
      const coverBox = rect(cover);
      await expect(
        [coverBox.left, coverBox.top, coverBox.right, coverBox.bottom].map(Math.round),
      ).toEqual(inside.map(Math.round));
      const back = button('Close search');
      await expect(shown(back)).toBe(true);
      await expect(rect(back).left - barBox.left).toBeCloseTo(10, 0);
      for (const name of ['Notifications', 'Theme', 'Account', 'Open navigation']) {
        await expect(hidden(button(name)), name).toBe(true);
      }
      await expect(hidden(brandName())).toBe(true);
      await expect(hidden(docs())).toBe(true);
      await noSideScroll();

      // The Tab order has the field and its buttons, and nothing of the rest of the header.
      await real.keyboard('x');
      await real.keyboard('{Tab}');
      await expect(button('Clear search')).toHaveFocus();
      await real.keyboard('{Tab}');
      await expect(bar().contains(document.activeElement)).toBe(false);
      await expect(quick()).toHaveValue('x');
      quick().focus();
      await real.keyboard('{Shift>}{Tab}{/Shift}');
      await expect(back).toHaveFocus();

      // ← closes it with the text kept, and the header is back.
      await real.click(back);
      await expect(button('Search')).toHaveFocus();
      await expect(quick()).not.toBeVisible();
      for (const name of ['Notifications', 'Theme', 'Account']) {
        await expect(hidden(button(name)), name).toBe(false);
      }
      await expect(hidden(docs())).toBe(false);
      await real.click(button('Search'));
      await expect(quick()).toHaveValue('x');

      // The width of the window decides, not the state: opened on a phone, it is a field of 300px again.
      await viewport.set(1280, 720);
      await expect(getComputedStyle(cover).position).not.toBe('absolute');
      await expect(rect(cover).width).toBeCloseTo(300, 0);
      await expect(hidden(button('Theme'))).toBe(false);
      await expect(shown(button('Close search'))).toBe(false);
    });
  },
};

/**
 * The ring of the focus, read from the pixels: the frame of the field, the button that clears it and
 * the button ← at the left edge of the header of a phone. Each is drawn, and nothing clips it. The
 * header is photographed before and after the focus, and the pixels where the ring is must differ.
 */
export const FocusRings: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'page' },
  render: (args) => (
    <App
      search={
        <>
          <SearchField {...args} aria-label="Docs" defaultValue="abc" />
          <End>
            <SearchField {...args} aria-label="Quick" collapsible defaultValue="abc" />
          </End>
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await withViewport(async (viewport) => {
      const canvas = within(canvasElement);
      const bar = () => header(canvasElement);
      type Side = 'left' | 'top' | 'bottom';
      /** Whether focusing `control` paints something 2.5 to 3.5px outside the edges of `box`, where its 2px outline, offset by 2px, is. */
      const drawsRing = async (control: HTMLElement, box: HTMLElement, sides: Side[]) => {
        const outer = rect(bar());
        const at = () => {
          const edge = rect(box);
          return sides.flatMap((side) =>
            [2.5, 3, 3.5].map((depth): [number, number] => {
              const x = side === 'left' ? edge.left - depth : edge.left + edge.width / 2;
              const y =
                side === 'top'
                  ? edge.top - depth
                  : side === 'bottom'
                    ? edge.bottom + depth
                    : edge.top + edge.height / 2;
              return [x - outer.x, y - outer.y];
            }),
          );
        };
        (document.activeElement as HTMLElement | null)?.blur();
        // The ring fades in and out: the screenshots are taken once it has.
        await settled(bar());
        const before = (await paintedPixels(bar(), at()))!;
        control.focus({ focusVisible: true });
        await expect(control).toHaveFocus();
        await settled(bar());
        const after = (await paintedPixels(bar(), at()))!;
        control.blur();
        return after.some((pixel, point) =>
          pixel.some((channel, index) => Math.abs(channel - before[point]![index]!) > 4),
        );
      };

      await viewport.set(1280, 720);
      const docs = canvas.getByRole('searchbox', { name: 'Docs' });
      await expect(
        await drawsRing(docs, docs.parentElement!, ['left', 'top', 'bottom']),
        'frame',
      ).toBe(true);
      const clear = canvas.getByRole('button', { name: 'Clear search' });
      await expect(await drawsRing(clear, clear, ['left', 'top', 'bottom']), 'clear button').toBe(
        true,
      );

      await viewport.set(360, 640);
      await real.click(canvas.getByRole('button', { name: 'Search' }));
      const back = canvas.getByRole('button', { name: 'Close search' });
      await expect(await drawsRing(back, back, ['left', 'top', 'bottom']), '← button').toBe(true);
    });
  },
};

/**
 * Forced colours (emulated through the protocol, which only Chromium has): the key hint has the border
 * and the text of the system, and the clear button the colour of a button.
 */
export const ForcedColors: Story = {
  tags: ['no-visual'],
  render: (args) => <SearchField {...args} shortcut="/" style={{ width: 300 }} />,
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const session = cdp();
    const colorOf = (name: string) => {
      const probe = document.createElement('div');
      probe.style.color = name;
      canvasElement.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const canvas = within(canvasElement);
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    try {
      await waitFor(() => expect(matchMedia('(forced-colors: active)').matches).toBe(true));
      const kbd = canvasElement.querySelector<HTMLElement>('.flg-search-field-kbd')!;
      await expect(getComputedStyle(kbd).color).toBe(colorOf('CanvasText'));
      await expect(getComputedStyle(kbd).borderTopColor).toBe(colorOf('CanvasText'));
      await userEvent.type(canvas.getByRole('searchbox'), 'a');
      const clear = await canvas.findByRole('button', { name: 'Clear search' });
      await expect(getComputedStyle(clear).color).toBe(colorOf('ButtonText'));
    } finally {
      await session.send('Emulation.setEmulatedMedia', { features: [] });
    }
  },
};
