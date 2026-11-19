import type { ReactNode } from 'react';

// The library draws no icons for you: these strokes are the fixture's own, on a 24px grid, in the
// colour of the text around them.
const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const HomeIcon = () => (
  <Icon>
    <path d="M3 10.5 12 3l9 7.5V21H3z" />
  </Icon>
);
export const InboxIcon = () => (
  <Icon>
    <path d="M3 13h5l1 3h6l1-3h5" />
    <path d="M5 5h14l2 8v6H3v-6z" />
  </Icon>
);
export const FolderIcon = () => (
  <Icon>
    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
);
export const BellIcon = () => (
  <Icon>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);
