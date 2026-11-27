import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadText } from './download';

/** The text of a blob with its byte order mark: `Blob.text()` decodes as UTF-8 and drops it. */
const blobText = async (blob: Blob) =>
  new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());

const BOM = String.fromCharCode(0xfeff);

describe('downloadText', () => {
  let created: Blob[];
  let revoked: string[];
  let clicked: HTMLAnchorElement[];
  let present: boolean[];

  beforeEach(() => {
    vi.useFakeTimers();
    created = [];
    revoked = [];
    clicked = [];
    present = [];
    // jsdom has neither function: they are stubbed here and taken away again in `afterEach`.
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      created.push(blob as Blob);
      return 'blob:csv-1';
    });
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
      present.push(document.body.contains(this));
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (URL as { createObjectURL?: unknown }).createObjectURL;
    delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
  });

  it('clicks one anchor with the name and the address of the blob, which is in the page then', () => {
    downloadText('a,b', 'orders.csv', 'text/csv;charset=utf-8');
    expect(clicked).toHaveLength(1);
    expect(clicked[0]!.getAttribute('href')).toBe('blob:csv-1');
    expect(clicked[0]!.getAttribute('download')).toBe('orders.csv');
    expect(clicked[0]!.hidden).toBe(true);
    expect(present).toEqual([true]);
  });

  it('removes the anchor at once', () => {
    downloadText('a', 'x.csv', 'text/csv');
    expect(document.body.contains(clicked[0]!)).toBe(false);
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('makes the blob of the text and the type it is given', async () => {
    downloadText(`${BOM}a,b\r\n`, 'x.csv', 'text/csv;charset=utf-8');
    expect(created).toHaveLength(1);
    expect(created[0]!.type).toBe('text/csv;charset=utf-8');
    expect(await blobText(created[0]!)).toBe(`${BOM}a,b\r\n`);
  });

  it('gives the address back in a later task, and not before', () => {
    downloadText('a', 'x.csv', 'text/csv');
    expect(revoked).toEqual([]);
    vi.runAllTimers();
    expect(revoked).toEqual(['blob:csv-1']);
  });

  it('does nothing and does not throw where there is no document', () => {
    vi.stubGlobal('document', undefined);
    expect(() => downloadText('a', 'x.csv', 'text/csv')).not.toThrow();
    expect(created).toEqual([]);
    expect(clicked).toEqual([]);
  });
});
