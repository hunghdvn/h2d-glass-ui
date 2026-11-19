export interface Viewport {
  width: number;
  height: number;
}

/** What every story is shot at unless it says otherwise. */
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 720 };

const TAG = /^viewport-([1-9]\d*)x([1-9]\d*)$/;

/**
 * The window size a story asks for with a `viewport-<width>x<height>` tag, such as
 * `viewport-390x844`. A story without such a tag, or with a malformed one, keeps the default size.
 */
export function viewportFromTags(tags: readonly string[] | undefined): Viewport {
  for (const tag of tags ?? []) {
    const match = TAG.exec(tag);
    if (match) return { width: Number(match[1]), height: Number(match[2]) };
  }
  return DEFAULT_VIEWPORT;
}
