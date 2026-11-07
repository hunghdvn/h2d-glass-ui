// What the browser painted at one point, for the facts of paint order that no hit test can show: an
// outline or a shadow takes no pointer, so `elementFromPoint` never finds it. It takes a screenshot
// of the element through Vitest browser mode, which only runs under `pnpm test:stories`; in the
// Storybook UI it returns null, and play functions skip the steps that need it.

/** The red, green and blue of the pixel at (x, y), in CSS pixels from the element's top left. */
export async function paintedPixel(
  element: Element,
  x: number,
  y: number,
): Promise<[number, number, number] | null> {
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
  const [red, green, blue] = context.getImageData(
    Math.floor(x * scale),
    Math.floor(y * scale),
    1,
    1,
  ).data;
  return [red!, green!, blue!];
}
