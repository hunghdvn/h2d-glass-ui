import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWPORT, viewportFromTags } from './viewport-tag';

describe('viewportFromTags', () => {
  it('reads the size from a viewport-<width>x<height> tag', () => {
    expect(viewportFromTags(['viewport-390x844'])).toEqual({ width: 390, height: 844 });
  });

  it('finds the tag among others', () => {
    expect(viewportFromTags(['autodocs', 'viewport-360x640', 'reduced-motion'])).toEqual({
      width: 360,
      height: 640,
    });
  });

  it('keeps 1280x720 for a story without the tag, or with no tags at all', () => {
    expect(DEFAULT_VIEWPORT).toEqual({ width: 1280, height: 720 });
    expect(viewportFromTags(['autodocs'])).toEqual(DEFAULT_VIEWPORT);
    expect(viewportFromTags(undefined)).toEqual(DEFAULT_VIEWPORT);
  });

  it.each([
    'viewport-390',
    'viewport-x844',
    'viewport-0x844',
    'viewport-390x0',
    'viewport-1e3x5',
    'Viewport-390x844',
    'viewport-390x844px',
  ])('ignores the malformed tag %s', (tag) => {
    expect(viewportFromTags([tag])).toEqual(DEFAULT_VIEWPORT);
  });
});
