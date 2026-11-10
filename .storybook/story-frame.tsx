// A story in a frame of its own on a docs page, for the stories that need a whole window: an AppShell
// is a page, and its layout follows the width of the window, which a story drawn in the docs page
// does not have. The frame loads the story in the theme the docs page is in (the `theme` global of
// the toolbar), and loads it again when the reader changes it.
import { DocsContext } from '@storybook/addon-docs/blocks';
import { useContext, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';

type Theme = 'light' | 'dark';
const toTheme = (value: unknown): Theme => (value === 'dark' ? 'dark' : 'light');

/** The theme of the docs page, followed while it is open. */
function useDocsTheme(): Theme {
  const context = useContext(DocsContext);
  const [theme, setTheme] = useState<Theme>(() => {
    // The page knows its globals through the story it is attached to; a page with none is light.
    try {
      return toTheme(context.getStoryContext(context.storyById()).globals.theme);
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    const follow = ({ globals }: { globals: Record<string, unknown> }) =>
      setTheme(toTheme(globals.theme));
    context.channel.on(GLOBALS_UPDATED, follow);
    return () => context.channel.off(GLOBALS_UPDATED, follow);
  }, [context]);
  return theme;
}

const frame: CSSProperties = {
  display: 'block',
  height: 640,
  border: '1px solid #8884',
  borderRadius: 12,
};

export interface StoryFrameProps {
  /** The id of the story, as in its URL. */
  id: string;
  /** The name of the frame, for assistive technology. */
  title: string;
  /** A phone's width (390px) instead of the width of the page, at least 1100px. */
  phone?: boolean;
}

/** A frame that loads the story at the width it is drawn for, scrolling sideways when it must. */
export function StoryFrame({ id, title, phone = false }: StoryFrameProps) {
  const theme = useDocsTheme();
  const src = `iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`;
  if (phone) {
    return (
      <iframe
        title={title}
        src={src}
        loading="lazy"
        style={{ ...frame, width: 390, maxWidth: '100%' }}
      />
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <iframe
        title={title}
        src={src}
        loading="lazy"
        style={{ ...frame, width: '100%', minWidth: 1100 }}
      />
    </div>
  );
}
