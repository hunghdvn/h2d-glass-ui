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
}

/**
 * The row above the grid. Only the caption block is in it for now, drawn with the classes of a
 * Card header (spec 4.3): the caption names the grid and the description describes it. Without
 * either there is no toolbar at all.
 */
export function Toolbar({
  caption,
  description,
  captionAs: Title,
  captionId,
  descriptionId,
}: ToolbarProps) {
  const hasCaption = hasContent(caption);
  const hasDescription = hasContent(description);
  if (!hasCaption && !hasDescription) return null;
  return (
    <div className="flg-data-grid-toolbar">
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
    </div>
  );
}
