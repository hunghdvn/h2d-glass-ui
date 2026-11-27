/**
 * Offers a text to the user as a file: a `Blob` behind a temporary link that is clicked, which the browser
 * saves under `fileName`. The address of the blob is given back 40 s later, once the browser has read it.
 * Where there is no `document` (the server) it does nothing: a download is the answer to a press.
 */
export function downloadText(text: string, fileName: string, type: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // WebKit/Safari may not have read the blob when the click returns, and revoking at once can cancel the save.
  // 40 s is the delay FileSaver uses for the same reason. The timer belongs to the download, not to a grid,
  // so it still runs after an unmount.
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}
