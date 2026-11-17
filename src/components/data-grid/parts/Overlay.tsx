import type { CSSProperties } from 'react';
import { Spinner } from '../../spinner/Spinner';
import type { TableVariant } from '../../table/Table';

interface OverlayProps {
  variant: TableVariant;
  /** The words of the spinner, which no one hears: the layer is hidden, and the grid says it itself. */
  label: string;
  /** Where the layer starts, in pixels, once the heading is measured. */
  top: number | undefined;
}

/**
 * The layer over the rows of a grid that loads again, from the bottom of the heading to the bottom of
 * the frame, with a spinner in the middle of what is seen. It is decorative: `aria-hidden`, and the
 * state is said by `aria-busy` and the live region. It is in the main part and not in the frame, so
 * it stays put when the rows scroll; it takes no pointer (`pointer-events: none`), so what is under it
 * is reached, and it does not reach the heading, the caption or the bar of the pages.
 */
export function Overlay({ variant, label, top }: OverlayProps) {
  const style: CSSProperties | undefined = top === undefined ? undefined : { top };
  return (
    <div className="flg-data-grid-overlay" data-variant={variant} aria-hidden="true" style={style}>
      <Spinner size="md" label={label} />
    </div>
  );
}
