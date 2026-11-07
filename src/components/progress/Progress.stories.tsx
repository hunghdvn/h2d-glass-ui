import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { FillFrames, checkFillFrames } from '../../../.storybook/fill-frames';
import { CloseIcon, FileIcon } from '../../internal/icons';
import { Button } from '../button/Button';
import { Card, CardHeader, CardTitle } from '../card/Card';
import { IconButton } from '../icon-button/IconButton';
import { Progress } from './Progress';
import type { ProgressProps } from './Progress';

const meta = {
  title: 'Components/Progress',
  component: Progress,
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The states of the approved mockup (progress P1-P3), in a card as there: a value with its label,
 * 0%, a finished upload, a failed one, an indeterminate one, and a small bar under a file row with
 * no label of its own.
 */
function Upload({ variant }: Pick<ProgressProps, 'variant'>) {
  return (
    <Card style={{ gap: 12, width: 400 }}>
      <CardHeader>
        <CardTitle>Upload documents</CardTitle>
      </CardHeader>
      <Progress variant={variant} label="Uploading contract.pdf" value={45} showValue />
      <Progress variant={variant} label="Waiting for quote.xlsx" value={0} showValue />
      <Progress
        variant={variant}
        label="Uploaded invoice.pdf"
        value={100}
        showValue
        status="success"
      />
      <Progress
        variant={variant}
        label="Upload failed · id-scan.png"
        value={62}
        showValue
        status="error"
      />
      <Progress variant={variant} label="Processing photos.zip" showValue />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 6px 8px 10px',
          border: '1px solid var(--flg-control-border)',
          borderRadius: 'var(--flg-radius-md)',
          background: 'var(--flg-control-bg)',
        }}
      >
        <span style={{ display: 'inline-flex', color: 'var(--flg-text-muted)' }}>
          <FileIcon width={18} height={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 'var(--flg-text-sm)', color: 'var(--flg-text)' }}>
              meeting-minutes.docx
            </span>
            <span
              style={{
                fontSize: 'var(--flg-text-xs)',
                color: 'var(--flg-text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              1.2 MB · 70%
            </span>
          </div>
          <Progress
            variant={variant}
            size="sm"
            value={70}
            aria-label="Upload of meeting-minutes.docx"
          />
        </div>
        <IconButton variant="ghost" size="sm" aria-label="Cancel the upload">
          <CloseIcon />
        </IconButton>
      </div>
    </Card>
  );
}

// The tag adds a pass with the motion stopped (tests/visual/stories.visual.ts).
export const Thin: Story = { tags: ['reduced-motion'], render: () => <Upload variant="thin" /> };
export const Glow: Story = { tags: ['reduced-motion'], render: () => <Upload variant="glow" /> };
export const Inline: Story = {
  tags: ['reduced-motion'],
  render: () => <Upload variant="inline" />,
};

/** Work that advances: the attributes of the bar follow the value. */
function Advancing() {
  const [value, setValue] = useState(20);
  return (
    <div style={{ display: 'grid', gap: 12, width: 400 }}>
      <Progress
        label="Uploading"
        value={value}
        showValue
        status={value >= 100 ? 'success' : 'default'}
        getValueText={(current, max) => `${current} of ${max} MB`}
      />
      <Button
        variant="secondary"
        onClick={() => setValue((current) => Math.min(100, current + 40))}
      >
        Advance
      </Button>
    </div>
  );
}

export const ValueChange: Story = {
  tags: ['no-visual'],
  render: () => <Advancing />,
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Uploading' });
    await expect(bar).toHaveAttribute('aria-valuenow', '20');
    await expect(bar).toHaveAttribute('aria-valuetext', '20 of 100 MB');
    await userEvent.click(canvas.getByRole('button', { name: 'Advance' }));
    await expect(bar).toHaveAttribute('aria-valuenow', '60');
    await expect(bar).toHaveAttribute('aria-valuetext', '60 of 100 MB');
    await userEvent.click(canvas.getByRole('button', { name: 'Advance' }));
    await waitFor(() => expect(bar).toHaveAttribute('aria-valuetext', '100 of 100 MB, Success'));
    await expect(bar).toHaveAttribute('aria-valuenow', '100');
  },
};

/**
 * The frames of the indeterminate animation, which the reference screenshots cannot show: they are
 * taken with animations cancelled, so the segment is always at its start (spec §3.3). It is 35% of
 * the track wide, and slides to 65 / 35 of its own width on `translate`.
 */
export const IndeterminateMotion: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 400 }}>
      <Progress label="Processing photos.zip" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fill = canvasElement.querySelector<HTMLElement>('.flg-progress-fill')!;
    const track = canvasElement.querySelector<HTMLElement>('.flg-progress-track')!;
    const [animation, ...others] = fill.getAnimations();
    await expect(others).toHaveLength(0);
    const effect = animation!.effect as KeyframeEffect;
    const timing = effect.getTiming();
    await expect(timing.duration).toBe(1400);
    await expect(timing.iterations).toBe(Number.POSITIVE_INFINITY);
    await expect(timing.direction).toBe('alternate');
    // A start from 0: the negative delay of the mockup only froze its screenshot at a good frame.
    await expect(timing.delay).toBe(0);
    const keyframes = effect.getKeyframes();
    await expect(keyframes).toHaveLength(2);
    // `animation-timing-function` is the easing of each keyframe, not of the effect as a whole.
    await expect(keyframes[0]!.easing).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
    await expect(Number.parseFloat(String(keyframes[0]!.translate))).toBe(0);
    await expect(keyframes[1]!.translate).toBe('185.714%');
    await expect(
      fill.getBoundingClientRect().width / track.getBoundingClientRect().width,
    ).toBeCloseTo(0.35, 2);
  },
};

/**
 * With reduced motion there is no animation left, and the segment covers the track in stripes. The
 * preference is emulated through the protocol, which only Chromium has, and the reduced-motion
 * screenshots are taken in Chromium too: Firefox and WebKit have no automated check of this rule.
 */
export const ReducedMotion: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 400 }}>
      <Progress label="Processing photos.zip" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { cdp, server } = await import('vitest/browser');
    if (server.browser !== 'chromium') return;
    const session = cdp();
    const fill = canvasElement.querySelector<HTMLElement>('.flg-progress-fill')!;
    const track = canvasElement.querySelector<HTMLElement>('.flg-progress-track')!;
    await expect(fill.getAnimations()).toHaveLength(1);
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    try {
      await waitFor(() => expect(fill.getAnimations()).toHaveLength(0));
      await expect(getComputedStyle(fill).maskImage).toContain('repeating-linear-gradient');
      await expect(fill.getBoundingClientRect().width).toBeCloseTo(
        track.getBoundingClientRect().width,
        0,
      );
    } finally {
      await session.send('Emulation.setEmulatedMedia', { features: [] });
    }
  },
};

/**
 * A Progress fills the row it is in, also as an item of a flex row beside a short text: its root is
 * a column with no width of its own, so without a width that fills the row it would be as wide as
 * its label, or 0px with no label. A label too long for the row is cut by the row, not the other
 * way round: only a real layout can show either.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <div data-row style={{ display: 'flex', alignItems: 'center', gap: 12, width: 400 }}>
        <span data-text>Photos</span>
        <Progress aria-label="Upload" value={45} />
      </div>
      <div data-long-row style={{ display: 'flex', alignItems: 'center', gap: 12, width: 400 }}>
        <span data-box style={{ flex: 'none', width: 24, height: 24 }} />
        <Progress
          aria-label="Upload"
          label="a-very-long-file-name-without-any-break-in-it-for-the-quarterly-report-2026.pdf"
          value={40}
        />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const longRow = canvasElement.querySelector<HTMLElement>('[data-long-row]')!;
    const longBar = longRow.querySelector<HTMLElement>('.flg-progress')!;
    await expect(
      Math.abs(longBar.getBoundingClientRect().right - longRow.getBoundingClientRect().right),
    ).toBeLessThanOrEqual(1);
    const longLabel = longBar.querySelector<HTMLElement>('.flg-progress-label')!;
    await expect(longLabel.scrollWidth).toBeGreaterThan(longLabel.clientWidth);
    const row = canvasElement.querySelector<HTMLElement>('[data-row]')!;
    const text = canvasElement.querySelector<HTMLElement>('[data-text]')!;
    const bar = canvasElement.querySelector<HTMLElement>('.flg-progress')!;
    // The rest of the row: the row less the text and the 12px gap.
    const rest = row.getBoundingClientRect().width - text.getBoundingClientRect().width - 12;
    await expect(Math.abs(bar.getBoundingClientRect().width - rest)).toBeLessThanOrEqual(1);
  },
};

/**
 * The margin, padding and border of a Progress come out of its width: with `margin: 0 16px` or
 * `padding: 8px`, in a 400px block and in a flex row beside a box, it stays inside its parent and
 * still fills what the parent leaves it.
 */
export const MarginAndPadding: Story = {
  tags: ['no-visual'],
  render: () => (
    <FillFrames
      name="progress"
      render={(style) => <Progress aria-label="Upload" value={45} style={style} />}
    />
  ),
  play: async ({ canvasElement }) => checkFillFrames(canvasElement, 'progress'),
};
