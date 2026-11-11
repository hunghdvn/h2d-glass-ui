import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect } from 'storybook/test';
import { paintedPixels } from '../../../.storybook/painted-pixel';
import { BellIcon, GearIcon } from '../../../.storybook/icons';
import { Avatar } from '../avatar/Avatar';
import { IconButton } from '../icon-button/IconButton';
import { Surface } from '../surface/Surface';
import { Indicator as IndicatorComponent } from './Indicator';
import type { IndicatorProps } from './Indicator';

const meta = {
  title: 'Components/Indicator',
  component: IndicatorComponent,
  args: { children: <BellIcon width={18} height={18} /> },
} satisfies Meta<typeof IndicatorComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bell of a header, as the mockup draws it: a ghost icon button with the mark on its corner. */
function Bell({
  name = 'Notifications',
  ...props
}: Omit<IndicatorProps, 'children'> & { name?: string }) {
  return (
    <IndicatorComponent {...props}>
      <IconButton variant="ghost" aria-label={name}>
        <BellIcon />
      </IconButton>
    </IndicatorComponent>
  );
}

/**
 * A strip like the header strip of the mockup (a glass bar, 56px high, the widgets at the end), one
 * for each state. Several bars cannot be a whole AppShell each, so they are drawn as in the page of
 * the mockup (spec phase 5 §7).
 */
function Strip({ caption, children }: { caption: string; children: ReactNode }) {
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
        <span style={{ flex: 1 }} />
        {children}
        <IconButton variant="ghost" aria-label="Settings">
          <GearIcon />
        </IconButton>
        <Avatar alt="Mia Anders" fallback="MA" />
      </Surface>
    </div>
  );
}

/**
 * The two looks of the mockup on the bell (B1: a red number, `danger`; B3: an accent number,
 * `accent`), the dot, a count past the largest number written out, and the four statuses.
 */
export const Indicator: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 14, width: 360 }}>
      <Strip caption="Danger, 2 unread">
        <Bell status="danger" count={2} name="Notifications, 2 unread" />
      </Strip>
      <Strip caption="Accent, 2 unread">
        <Bell status="accent" count={2} name="Notifications, 2 unread" />
      </Strip>
      <Strip caption="Dot">
        <Bell dot name="Notifications, some unread" />
      </Strip>
      <Strip caption="99+">
        <Bell status="danger" count={120} name="Notifications, more than 99 unread" />
      </Strip>
      <Strip caption="Accent, danger, success, warning">
        <Bell status="accent" count={4} name="Accent" />
        <Bell status="danger" count={4} name="Danger" />
        <Bell status="success" count={4} name="Success" />
        <Bell status="warning" count={4} name="Warning" />
      </Strip>
    </div>
  ),
};

const STATUSES = ['accent', 'danger', 'success', 'warning'] as const;

/** Where the mark of a wrapper is, relative to the wrapper: how far its top is below the wrapper's top, and its right is outside the wrapper's right. */
function offsets(wrapper: Element) {
  const box = wrapper.getBoundingClientRect();
  const mark = wrapper.querySelector('.flg-indicator-mark')!.getBoundingClientRect();
  return {
    top: mark.top - box.top,
    right: mark.right - box.right,
    width: mark.width,
    height: mark.height,
  };
}

/**
 * The mark of each status is where its mockup puts it: the red number in the corner (B1), the others
 * a little outside it (B3); the dot is the same for all. Measured in each engine, because the
 * position is arithmetic of the engine and an absolutely placed box in an inline flex box has been
 * different between them.
 */
export const Position: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24, padding: 12 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        {STATUSES.map((status) => (
          <Bell key={status} status={status} count={7} name={`${status} count`} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {STATUSES.map((status) => (
          <Bell key={status} status={status} dot name={`${status} dot`} />
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const wrappers = [...canvasElement.querySelectorAll('.flg-indicator')];
    await expect(wrappers).toHaveLength(8);
    wrappers.forEach((wrapper, index) => {
      const status = STATUSES[index % 4]!;
      const dot = index >= 4;
      const found = offsets(wrapper);
      if (dot) {
        expect(found.width, `${status} dot width`).toBeCloseTo(8, 0);
        expect(found.height, `${status} dot height`).toBeCloseTo(8, 0);
        expect(found.top, `${status} dot top`).toBeCloseTo(7, 0);
        expect(found.right, `${status} dot right`).toBeCloseTo(-7, 0);
      } else {
        expect(found.height, `${status} height`).toBeCloseTo(17, 0);
        expect(found.width, `${status} width`).toBeGreaterThanOrEqual(17);
        // `danger` is in the corner; the others stick out by 3px above and 4px to the right.
        expect(found.top, `${status} top`).toBeCloseTo(status === 'danger' ? 0 : -3, 0);
        expect(found.right, `${status} right`).toBeCloseTo(status === 'danger' ? 0 : 4, 0);
      }
    });
  },
};

/**
 * `--flg-indicator-top` and `--flg-indicator-right` move the mark, from the wrapper or from any
 * element above it, for a number and for a dot, whatever the status.
 */
export const PositionOverride: Story = {
  tags: ['no-visual'],
  render: () => (
    <div
      style={
        {
          display: 'flex',
          gap: 24,
          padding: 16,
          '--flg-indicator-top': '10px',
          '--flg-indicator-right': '12px',
        } as CSSProperties
      }
    >
      <Bell status="danger" count={7} name="danger count" />
      <Bell status="accent" count={7} name="accent count" />
      <Bell dot name="dot" />
      <Bell
        status="danger"
        count={7}
        name="its own"
        style={{ '--flg-indicator-top': '-2px', '--flg-indicator-right': '3px' } as CSSProperties}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const wrappers = [...canvasElement.querySelectorAll('.flg-indicator')];
    await expect(wrappers).toHaveLength(4);
    for (const wrapper of wrappers.slice(0, 3)) {
      const found = offsets(wrapper);
      await expect(found.top).toBeCloseTo(10, 0);
      await expect(found.right).toBeCloseTo(-12, 0);
    }
    // The nearest value wins: the wrapper's own beats the one set above it.
    const own = offsets(wrappers[3]!);
    await expect(own.top).toBeCloseTo(-2, 0);
    await expect(own.right).toBeCloseTo(-3, 0);
  },
};

/** Parses `rgb(…)` or `rgba(…)` as the browser writes it, the first four numbers of it. */
function channels(color: string): [number, number, number, number] {
  const [r = 0, g = 0, b = 0, a = 1] = color.match(/[\d.]+/g)?.map(Number) ?? [];
  return [r, g, b, a];
}

/** A colour of any opacity laid over a grey of one value, as the engine paints it. */
function overGrey([r, g, b, a]: [number, number, number, number], grey: number) {
  return [r, g, b].map((channel) => channel * a + grey * (1 - a));
}

const GREY = 128;

/**
 * The 2px ring of the tint of the glass around the mark is what sets it apart from the icon, so it
 * must be painted where the mark's edge is, and not wider. A dot has no text in its middle: its
 * middle is the colour of the fill, a pixel just outside it is the ring, and one a little further is
 * what is behind. Read from painted pixels, since neither a hit test nor a computed style shows a
 * shadow. The grey behind makes the ring's colour known whatever the stage is.
 */
export const Ring: Story = {
  tags: ['no-visual'],
  render: () => (
    <div
      data-testid="ground"
      style={{
        width: 120,
        height: 80,
        display: 'grid',
        placeItems: 'center',
        background: `rgb(${GREY} ${GREY} ${GREY})`,
      }}
    >
      {/* Nothing under the mark but the grey: an icon would be in the way of the pixels read. */}
      <IndicatorComponent status="danger" dot>
        <span style={{ display: 'block', width: 34, height: 34 }} />
      </IndicatorComponent>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const ground = canvasElement.querySelector<HTMLElement>('[data-testid="ground"]')!;
    const mark = ground.querySelector<HTMLElement>('.flg-indicator-mark')!;
    const markBox = mark.getBoundingClientRect();
    const groundBox = ground.getBoundingClientRect();
    const x = markBox.left + markBox.width / 2 - groundBox.left;
    const y = markBox.top + markBox.height / 2 - groundBox.top;
    // The dot is 8px wide and the ring 2px: the pixel at 4.5px from the middle is the first one of the
    // ring (at 5.5px the curve of the edge is only part covered), and 7.5px is past it.
    const pixels = await paintedPixels(ground, [
      [x, y],
      [x + 4.5, y],
      [x + 7.5, y],
    ]);
    // Without a browser to take the screenshot (the Storybook UI) only the declaration is checked.
    await expect(getComputedStyle(mark).boxShadow).toContain('2px');
    if (!pixels) return;
    const near = (found: readonly number[], wanted: readonly number[]) =>
      found.forEach((channel, i) => expect(Math.abs(channel - wanted[i]!)).toBeLessThanOrEqual(4));
    near(pixels[0]!, overGrey(channels(getComputedStyle(mark).backgroundColor), GREY));
    near(pixels[1]!, overGrey(channels(getComputedStyle(mark).boxShadow), GREY));
    near(pixels[2]!, [GREY, GREY, GREY]);
  },
};

/** The mark takes no pointer: a press on it, where it overlaps the button, is a press on the button. */
export const PressThrough: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ padding: 16 }}>
      <Bell status="danger" count={7} />
      <Bell status="accent" count={7} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const marks = [...canvasElement.querySelectorAll('.flg-indicator-mark')];
    await expect(marks).toHaveLength(2);
    for (const mark of marks) {
      const box = mark.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      await expect(hit?.closest('button')).toBe(
        mark.closest('.flg-indicator')!.querySelector('button'),
      );
    }
  },
};
