// What the browser painted at one point, for the facts of paint order that no hit test can show: an
// outline or a shadow takes no pointer, so `elementFromPoint` never finds it. It takes a screenshot
// of the element through Vitest browser mode, which only runs under `pnpm test:stories`; in the
// Storybook UI it returns null, and play functions skip the steps that need it.

export type Rgb = [number, number, number];

/**
 * The red, green and blue of the pixels at each (x, y), in CSS pixels from the element's top left,
 * from one screenshot. Use it where a point is not exact: a screenshot starts at a whole device pixel
 * and the element may not, so a ring that is 2px wide is found by looking at a few points across it.
 */
export async function paintedPixels(
  element: Element,
  points: ReadonlyArray<readonly [number, number]>,
): Promise<Rgb[] | null> {
  if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return null;
  const { page } = await import('vitest/browser');
  const base64 = await page.screenshot({ element, save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  // The screenshot is in device pixels.
  const scale = image.naturalWidth / element.getBoundingClientRect().width;
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  return points.map(([x, y]) => {
    const [red, green, blue] = context.getImageData(
      Math.floor(x * scale),
      Math.floor(y * scale),
      1,
      1,
    ).data;
    return [red!, green!, blue!];
  });
}

/** The red, green and blue of the pixel at (x, y), in CSS pixels from the element's top left. */
export async function paintedPixel(element: Element, x: number, y: number): Promise<Rgb | null> {
  const pixels = await paintedPixels(element, [[x, y]]);
  return pixels ? pixels[0]! : null;
}
