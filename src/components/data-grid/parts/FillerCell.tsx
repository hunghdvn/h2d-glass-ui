/**
 * A cell of the filler column: the last column of a grid whose columns all have a width, which takes
 * what the frame has beyond them (spec phase 6 §3.7). It is no column of the grid: it holds nothing,
 * is hidden from what reads the page, has no `tabindex` and takes no pointer, so no key and no press
 * reaches it. It has the classes of a Table cell, so it carries what its row draws across its width
 * (the rule of `lined`, the hover and the chosen wash, the stripe and the right corners of
 * `striped`, the band of the heading) to the edge of the frame.
 */
export function FillerCell({ head = false }: { head?: boolean }) {
  return head ? (
    <th className="flg-table-head flg-data-grid-filler" aria-hidden="true" />
  ) : (
    <td className="flg-table-cell flg-data-grid-filler" aria-hidden="true" />
  );
}
