import { Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { hasContent } from '../../../internal/has-content';

export type CaptionTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';

const CAPTION_TAGS: readonly CaptionTag[] = ['h2', 'h3', 'h4', 'h5', 'h6', 'div'];

// A value outside the union is `h3`, as a CardTitle; the list narrows it without a cast.
export const resolveCaptionTag = (value: unknown): CaptionTag =>
  CAPTION_TAGS.find((tag) => tag === value) ?? 'h3';

export interface ToolbarProps {
  caption: ReactNode;
  description: ReactNode;
  captionAs: CaptionTag;
  captionId: string;
  descriptionId: string;
  /** The items after the caption: the spacer, the buttons, what a `toolbar` function drew. */
  children?: ReactNode;
}

/** The flexible gap that pushes the items after it to the end of the row: no item of its own. */
export function ToolbarSpacer() {
  return <span className="flg-data-grid-toolbar-spacer" aria-hidden="true" />;
}

/** Whether a node holds an item: what `hasContent` says, with the spacer, which is only a gap, not one. */
function hasItems(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasItems);
  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (node.type === ToolbarSpacer) return false;
    if (node.type === Fragment) return hasItems(node.props.children);
  }
  return hasContent(node);
}

/**
 * The row above the grid (spec phase 6 §3.6, §4.3 G1): the caption block, drawn with the classes of a
 * Card header, where the caption names the grid and the description describes it, then the items the
 * grid puts after it (`children`). Without a caption, a description and an item (the spacer is none)
 * there is no toolbar at all, and the caption block is drawn only for a caption or a description, so that an empty one does
 * not take the room of the row.
 */
export function Toolbar({
  caption,
  description,
  captionAs: Title,
  captionId,
  descriptionId,
  children,
}: ToolbarProps) {
  const hasCaption = hasContent(caption);
  const hasDescription = hasContent(description);
  if (!hasCaption && !hasDescription && !hasItems(children)) return null;
  return (
    <div className="flg-data-grid-toolbar">
      {hasCaption || hasDescription ? (
        <div className="flg-card-header flg-data-grid-caption">
          {hasCaption && (
            <Title id={captionId} className="flg-card-title">
              {caption}
            </Title>
          )}
          {hasDescription && (
            <div id={descriptionId} className="flg-card-description">
              {description}
            </div>
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
}
