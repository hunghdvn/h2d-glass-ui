import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { FillFrames, checkFillFrames } from '../../../.storybook/fill-frames';
import { Avatar } from '../avatar/Avatar';
import { Card, CardHeader, CardTitle } from '../card/Card';
import { Skeleton, SkeletonText } from './Skeleton';
import type { SkeletonVariant } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 } as const;
const card = { gap: 12, padding: 16 } as const;

/** A line of the text a Skeleton stands for: the line box of that text, sized as the text is. */
const line = (fontSize: string, lineHeight: number) => ({ fontSize, lineHeight }) as const;

const ACTIVITY = [
  ['MA', 'Minh Anh Nguyen', 'Commented on your post'],
  ['QH', 'Quoc Huy Tran', 'Shared a file'],
  ['PL', 'Ngoc Lan Pham', 'Liked your photo'],
] as const;
const ROWS = [
  { name: '58%', note: '78%' },
  { name: '44%', note: '60%' },
  { name: '52%', note: '70%' },
];

/**
 * The profile card and the list of three rows of the approved mockup (skeleton Sk1-Sk3), loading
 * on the left and the same content loaded on the right, to compare. Each line is a `text` Skeleton
 * in a box with the font size and line height of the text it replaces.
 */
function Loading({ variant }: { variant: SkeletonVariant }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: 680 }}>
      <div style={column}>
        <Card style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Skeleton variant={variant} shape="circle" size={40} />
            <div style={{ flex: 1, ...line('var(--flg-text-md)', 1.3) }}>
              <Skeleton variant={variant} shape="text" width="52%" />
            </div>
          </div>
          <Skeleton variant={variant} height={112} />
          <div style={line('var(--flg-text-sm)', 1.5)}>
            <SkeletonText variant={variant} lines={2} />
          </div>
        </Card>
        <Card style={card}>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ROWS.map((row) => (
              <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Skeleton variant={variant} shape="circle" size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={line('var(--flg-text-sm)', 1.5)}>
                    <Skeleton variant={variant} shape="text" width={row.name} />
                  </div>
                  <div style={line('var(--flg-text-xs)', 1.4)}>
                    <Skeleton variant={variant} shape="text" width={row.note} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={column}>
        <Card style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size="lg" fallback="LT" alt="" />
            <span
              style={{
                flex: 1,
                color: 'var(--flg-text)',
                fontSize: 'var(--flg-text-md)',
                fontWeight: 'var(--flg-weight-semibold)',
                lineHeight: 1.3,
              }}
            >
              Lê Thu Trang
            </span>
          </div>
          <div
            style={{
              height: 112,
              borderRadius: 'var(--flg-radius-md)',
              background:
                'radial-gradient(circle at 74% 30%, #ffe9a8 0 13px, rgba(255,233,168,0) 14px), linear-gradient(170deg, transparent 58%, #3d7a6a 59%), linear-gradient(200deg, transparent 52%, #5f9e8a 53%), linear-gradient(180deg, #8fb8f0, #cfe3f7)',
            }}
          />
          <p
            style={{
              margin: 0,
              color: 'var(--flg-text)',
              fontSize: 'var(--flg-text-sm)',
              lineHeight: 1.5,
            }}
          >
            Redesigning the checkout flow for the mobile app. Likes coffee and houseplants.
          </p>
        </Card>
        <Card style={card}>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ACTIVITY.map(([initials, name, note]) => (
              <div key={initials} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar size="md" fallback={initials} alt="" />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      color: 'var(--flg-text)',
                      fontSize: 'var(--flg-text-sm)',
                      fontWeight: 'var(--flg-weight-medium)',
                      lineHeight: 1.5,
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      color: 'var(--flg-text-muted)',
                      fontSize: 'var(--flg-text-xs)',
                      lineHeight: 1.4,
                    }}
                  >
                    {note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// The tag adds a pass with the motion stopped (tests/visual/stories.visual.ts).
export const Pulse: Story = { tags: ['reduced-motion'], render: () => <Loading variant="pulse" /> };
export const Shimmer: Story = {
  tags: ['reduced-motion'],
  render: () => <Loading variant="shimmer" />,
};
export const Glass: Story = { tags: ['reduced-motion'], render: () => <Loading variant="glass" /> };

/** One block of each look, to read the animations of; they are not a look to compare. */
function Blocks() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 240 }}>
      <Skeleton variant="pulse" height={24} data-look="pulse" />
      <Skeleton variant="shimmer" height={24} data-look="shimmer" />
      <Skeleton variant="glass" height={24} data-look="glass" />
    </div>
  );
}

const blockOf = (root: HTMLElement, look: string) =>
  root.querySelector<HTMLElement>(`[data-look="${look}"]`)!;

/** The animations that run on a block or on its `::after`; the page's list has both. */
const animationsOf = (block: HTMLElement) =>
  document
    .getAnimations()
    .filter((animation) => (animation.effect as KeyframeEffect | null)?.target === block);

/** Stops an animation and puts it at a time, to read the frame there. */
const seek = (animation: Animation, time: number) => {
  animation.pause();
  animation.currentTime = time;
};

/**
 * The frames of the animations, which the reference screenshots cannot show: they are taken with
 * animations cancelled, so every block is at its first frame (spec §3.3). Each one is read at the
 * frame of the mockup that the screenshot misses.
 */
export const AnimationFrames: Story = {
  tags: ['no-visual'],
  render: () => <Blocks />,
  play: async ({ canvasElement }) => {
    // `pulse`: opacity 1, then .4 at the middle of 1.6s, then 1.
    const pulse = blockOf(canvasElement, 'pulse');
    const [pulseAnimation, ...pulseOthers] = animationsOf(pulse);
    await expect(pulseOthers).toHaveLength(0);
    const pulseTiming = (pulseAnimation!.effect as KeyframeEffect).getTiming();
    await expect(pulseTiming.duration).toBe(1600);
    await expect(pulseTiming.iterations).toBe(Number.POSITIVE_INFINITY);
    // A start from 0: the negative delay of the mockup only froze its screenshot at a good frame.
    await expect(pulseTiming.delay).toBe(0);
    // The easing of `animation-timing-function` is the one of each keyframe, not of the effect.
    await expect((pulseAnimation!.effect as KeyframeEffect).getKeyframes()[0]!.easing).toBe(
      'ease-in-out',
    );
    seek(pulseAnimation!, 0);
    await expect(Number.parseFloat(getComputedStyle(pulse).opacity)).toBeCloseTo(1, 2);
    seek(pulseAnimation!, 800);
    await expect(Number.parseFloat(getComputedStyle(pulse).opacity)).toBeCloseTo(0.4, 2);

    // `shimmer`: the light of `--flg-skeleton-shine` crosses the block from -100% to 100%, linear.
    const shimmer = blockOf(canvasElement, 'shimmer');
    const [shimmerAnimation, ...shimmerOthers] = animationsOf(shimmer);
    await expect(shimmerOthers).toHaveLength(0);
    const shimmerEffect = shimmerAnimation!.effect as KeyframeEffect;
    await expect(shimmerEffect.pseudoElement).toBe('::after');
    const shimmerTiming = shimmerEffect.getTiming();
    await expect(shimmerTiming.duration).toBe(1600);
    await expect(shimmerTiming.iterations).toBe(Number.POSITIVE_INFINITY);
    await expect(shimmerTiming.delay).toBe(0);
    const width = shimmer.getBoundingClientRect().width;
    const shift = () => new DOMMatrix(getComputedStyle(shimmer, '::after').transform).m41;
    seek(shimmerAnimation!, 0);
    await expect(shift()).toBeCloseTo(-width, 0);
    // Linear: a quarter of the way in, a quarter of the way across.
    seek(shimmerAnimation!, 400);
    await expect(shift()).toBeCloseTo(-width / 2, 0);
    seek(shimmerAnimation!, 800);
    await expect(shift()).toBeCloseTo(0, 0);
    // The light is the token, in a gradient that is clear at both ends.
    const light = getComputedStyle(shimmer, '::after').backgroundImage;
    await expect(light).toContain('linear-gradient(90deg');
    await expect(light).toContain('rgba(255, 255, 255');

    // `glass`: the fill breathes to the accent at 20% over its own colour at the middle of 2s. The
    // two colours are what a probe painted with the same `color-mix` computes to.
    const glass = blockOf(canvasElement, 'glass');
    const [glassAnimation, ...glassOthers] = animationsOf(glass);
    await expect(glassOthers).toHaveLength(0);
    const glassTiming = (glassAnimation!.effect as KeyframeEffect).getTiming();
    await expect(glassTiming.duration).toBe(2000);
    await expect(glassTiming.iterations).toBe(Number.POSITIVE_INFINITY);
    await expect(glassTiming.delay).toBe(0);
    await expect((glassAnimation!.effect as KeyframeEffect).getKeyframes()[0]!.easing).toBe(
      'ease-in-out',
    );
    // The browsers write an animated colour in their own colour space ("oklab(...)", "color(srgb
    // ...)"), so the colours are compared as the four channels they paint, within a step or two.
    const channels = (color: string) => {
      const context = document
        .createElement('canvas')
        .getContext('2d', { willReadFrequently: true })!;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const probe = (color: string) => {
      const element = document.createElement('span');
      element.style.backgroundColor = color;
      glass.after(element);
      const computed = getComputedStyle(element).backgroundColor;
      element.remove();
      return channels(computed);
    };
    const rest = probe('var(--flg-control-bg-secondary)');
    const peak = probe(
      'color-mix(in srgb, var(--flg-accent-solid) 20%, var(--flg-control-bg-secondary))',
    );
    await expect(peak).not.toEqual(rest);
    // Each channel within 2 (of 255): an animated colour is rounded in its own colour space, so the
    // engines differ by a step or two. (`toBeCloseTo` takes a digit count, not a tolerance.)
    const near = (actual: number[], expected: number[]) =>
      actual.forEach((channel, index) =>
        expect(Math.abs(channel - expected[index]!)).toBeLessThanOrEqual(2),
      );
    seek(glassAnimation!, 0);
    near(channels(getComputedStyle(glass).backgroundColor), rest);
    seek(glassAnimation!, 1000);
    near(channels(getComputedStyle(glass).backgroundColor), peak);
  },
};

/**
 * With reduced motion nothing moves: no animation runs on any look, and the light of `shimmer` is
 * gone. The preference is emulated through the protocol, which only Chromium has, and the
 * reduced-motion screenshots are taken in Chromium too: Firefox and WebKit have no automated check of
 * this rule.
 */
export const ReducedMotion: Story = {
  tags: ['no-visual'],
  render: () => <Blocks />,
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const session = cdp();
    const blocks = ['pulse', 'shimmer', 'glass'].map((look) => blockOf(canvasElement, look));
    for (const block of blocks) await expect(animationsOf(block)).toHaveLength(1);
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    try {
      for (const block of blocks) await waitFor(() => expect(animationsOf(block)).toHaveLength(0));
      await expect(getComputedStyle(blocks[0]!).opacity).toBe('1');
      await expect(getComputedStyle(blocks[1]!, '::after').display).toBe('none');
    } finally {
      await session.send('Emulation.setEmulatedMedia', { features: [] });
    }
  },
};

/**
 * A `text` Skeleton takes the room of one line of the text it stands for (spec §4.3): two of them
 * one under the other are as high as two lines of that text, in the line height of the place, and
 * a `SkeletonText` of two lines is the same. The margins of two blocks would collapse into one,
 * which is why the shape is an inline-block.
 */
export const TextLines: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 240, fontSize: 14, lineHeight: '21px' }}>
      <div data-box="stacked">
        <Skeleton shape="text" />
        <Skeleton shape="text" />
      </div>
      <div data-box="lines">
        <SkeletonText lines={2} />
      </div>
      <div data-box="sentence">
        <Skeleton shape="text" width="40%" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const height = (box: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-box="${box}"]`)!.getBoundingClientRect()
        .height;
    await expect(height('stacked')).toBeCloseTo(42, 1);
    await expect(height('lines')).toBeCloseTo(42, 1);
    await expect(height('sentence')).toBeCloseTo(21, 1);
    const bar = canvasElement.querySelector<HTMLElement>('[data-box="sentence"] > .flg-skeleton')!;
    // 70% of 14px, in the middle of the 21px line.
    await expect(bar.getBoundingClientRect().height).toBeCloseTo(9.8, 1);
  },
};

/**
 * A `rect` and a `SkeletonText` fill the row they are in, also as items of a flex row: an empty
 * `span` has no content width, so without a width of their own they would collapse to nothing next
 * to an avatar circle, the most common layout of a skeleton. Only a real layout can show it.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual'],
  render: () => {
    const row = { display: 'flex', alignItems: 'flex-start', gap: 12, width: 400 } as const;
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div data-row="rect" style={row}>
          <Skeleton shape="circle" />
          <Skeleton data-fill />
        </div>
        <div data-row="text" style={{ ...row, fontSize: 14, lineHeight: '21px' }}>
          <Skeleton shape="circle" />
          <SkeletonText lines={2} data-fill />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const rect = (row: string, selector: string) =>
      canvasElement
        .querySelector<HTMLElement>(`[data-row="${row}"] ${selector}`)!
        .getBoundingClientRect();
    // A circle with no size is 40px square, from the CSS.
    const circle = rect('rect', '[data-shape="circle"]');
    await expect([circle.width, circle.height]).toEqual([40, 40]);
    // The rest of the row: 400px less the 40px circle and the 12px gap.
    await expect(Math.abs(rect('rect', '[data-fill]').width - 348)).toBeLessThanOrEqual(1);
    await expect(Math.abs(rect('text', '[data-fill]').width - 348)).toBeLessThanOrEqual(1);
    // Two lines of the 21px line height, as `TextLines` measures.
    await expect(Math.abs(rect('text', '[data-fill]').height - 42)).toBeLessThanOrEqual(1);
  },
};

/**
 * The margin, padding and border of a `rect`, of a `text` line and of a `SkeletonText` come out of
 * their width: with `margin: 0 16px` or `padding: 8px`, in a 400px block and in a flex row beside a
 * box, each stays inside its parent and still fills what the parent leaves it.
 */
export const MarginAndPadding: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <FillFrames name="rect" render={(style) => <Skeleton style={style} />} />
      <FillFrames name="line" render={(style) => <Skeleton shape="text" style={style} />} />
      <FillFrames name="text" render={(style) => <SkeletonText lines={2} style={style} />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const name of ['rect', 'line', 'text']) await checkFillFrames(canvasElement, name);
  },
};
