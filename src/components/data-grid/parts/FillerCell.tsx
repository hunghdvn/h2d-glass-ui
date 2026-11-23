/**
 * A cell of the filler column: the last column of a grid whose columns all have a width, which
 * takes what the frame has beyond them (spec phase 6 §3.7). It is drawn only where it has room to
 * carry the end of a row: until the frame is measured (the server, the first render, a hidden
 * grid), and then while the frame has at least 1px beyond the columns, and at least the round of a
 * row's end (8px in `striped`). With less the last real cell ends the row and keeps Table's rules
 * for that end, which a cell of 0px or 2px would take out of sight.
 *
 * It is no column of the grid: it holds nothing, is hidden from what reads the page and has no
 * `tabindex`; no key reaches it, and a press on it does nothing (the table's `mousedown` handler
 * cancels it, so the focus stays where it is). It has the classes of a Table cell, so it carries
 * what its row draws across its width (the rule of `lined`, the hover and the chosen wash, the
 * stripe and the right corners of `striped`, the band of the heading) to the edge of the frame, and
 * the pointer over it is over its row.
 */
export function FillerCell({ head = false }: { head?: boolean }) {
  return head ? (
    <th className="flg-table-head flg-data-grid-filler" aria-hidden="true" />
  ) : (
    <td className="flg-table-cell flg-data-grid-filler" aria-hidden="true" />
  );
}
