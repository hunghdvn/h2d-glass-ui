/**
 * Offers a text to the user as a file: a `Blob` behind a temporary link that is clicked, which the browser
 * saves under `fileName`. The address of the blob is given back in a later task, after the click has been taken.
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
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
