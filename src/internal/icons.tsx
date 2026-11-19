import type { ReactNode, SVGProps } from 'react';

/** What every stroked 24×24 icon of the library shares; hidden, since its control is named. */
export const strokeIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

/** The check of a checked menu item and of a Select's chosen option. */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** The check inside a 16px box: a checked Checkbox, a chosen option of a multiple Select. */
export function BoxCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} viewBox="0 0 12 12" {...props}>
      <path d="M2.5 6.2 5 8.5l4.5-5" />
    </svg>
  );
}

export type StatusIconStatus = 'info' | 'success' | 'warning' | 'error';

const STATUS_GLYPHS: Record<StatusIconStatus, ReactNode> = {
  success: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
};

/** The English word for each status; Alert, Progress and Toaster build their default labels from it. */
export const STATUS_WORDS: Readonly<Record<StatusIconStatus, string>> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
};

/** The "!" inside the mark of a Stepper step that failed, in a 12px box. */
export function ExclamationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} viewBox="0 0 12 12" {...props}>
      <path d="M6 2.75v3.75M6 9.25h.01" />
    </svg>
  );
}

export type ChevronDirection = 'down' | 'up' | 'left' | 'right';

const CHEVRON_PATHS: Record<ChevronDirection, string> = {
  down: 'm6 9 6 6 6-6',
  up: 'm6 15 6-6 6 6',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
};

/** A chevron in any of the four directions; Select, Accordion, Menu, Breadcrumb and Pagination use it. */
export function ChevronIcon({
  direction = 'down',
  ...props
}: { direction?: ChevronDirection } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d={CHEVRON_PATHS[direction]} />
    </svg>
  );
}

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

const ARROW_PATHS: Record<ArrowDirection, readonly [string, string]> = {
  down: ['M12 5v14', 'm19 12-7 7-7-7'],
  up: ['M12 19V5', 'm5 12 7-7 7 7'],
  left: ['M19 12H5', 'm12 19-7-7 7-7'],
  right: ['M5 12h14', 'm12 5 7 7-7 7'],
};

/**
 * An arrow up or down (the sort direction in the heading of a Table column), left (the back button of a
 * SearchField) or right (the "Move right" item of a DataGrid column menu).
 */
export function ArrowIcon({
  direction,
  ...props
}: { direction: ArrowDirection } & SVGProps<SVGSVGElement>) {
  const [stem, head] = ARROW_PATHS[direction];
  return (
    <svg {...strokeIcon} {...props}>
      <path d={stem} />
      <path d={head} />
    </svg>
  );
}

/** Two chevrons, one over the other: a column that can be sorted and is not sorted yet. */
export function ChevronsUpDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

/** The × that dismisses a toast (and any other close affordance). */
export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * The glyph of a status: a circled i, a circled check, a triangle with an exclamation mark and a
 * circled ×. Toaster, Alert and Progress share it. It is hidden like the other icons; a caller
 * that lets it carry the status passes `aria-hidden={undefined}`, `role="img"` and an `aria-label`.
 */
export function StatusIcon({
  status,
  ...props
}: { status: StatusIconStatus } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      {STATUS_GLYPHS[status]}
    </svg>
  );
}

/** A magnifying glass, for a search field. */
export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** A minus sign. */
export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

/** A plus sign. */
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** A calendar grid, for date pickers. */
export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/** An arrow pointing up into a tray, for file uploads. */
export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

/** A document with a folded corner. */
export function FileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

/** Three horizontal bars, for the button that opens a navigation sidebar. */
export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

/** A sun: the light theme of a ThemeSwitch. */
export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

/** A crescent moon: the dark theme of a ThemeSwitch. */
export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/** A screen on a stand: the theme of a ThemeSwitch that follows the system. */
export function MonitorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

/**
 * Six dots in two columns, in an 8x14 box: the grip of a movable Dialog and, later, of a DataGrid
 * row. Filled and not stroked, so it takes the colour of the text around it.
 */
export function GripIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} viewBox="0 0 8 14" fill="currentColor" stroke="none" {...props}>
      <circle cx="1.5" cy="1.5" r="1.4" />
      <circle cx="6.5" cy="1.5" r="1.4" />
      <circle cx="1.5" cy="7" r="1.4" />
      <circle cx="6.5" cy="7" r="1.4" />
      <circle cx="1.5" cy="12.5" r="1.4" />
      <circle cx="6.5" cy="12.5" r="1.4" />
    </svg>
  );
}

/**
 * Six dots in two columns on the 24×24 grid of the stroked icons: the mark of the chip that follows
 * the pointer when a column of a DataGrid is dragged. Filled, so it takes the colour of the text
 * around it (spec phase 6 §4.6).
 */
export function GripVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} fill="currentColor" stroke="none" {...props}>
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

/** Three dots in a column: the button that opens the menu of a DataGrid column (spec phase 6 §4.6). */
export function MoreVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

/** A panel with a rule near its left edge: "Pin to the left" in a DataGrid column menu. */
export function PinLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

/** A panel with a rule near its right edge: "Pin to the right" in a DataGrid column menu. */
export function PinRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

/** The panel of the two pin icons with no rule: "Unpin" in a DataGrid column menu (outside the mockup). */
export function PanelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

/** A line with an arrowhead at each end: "Fit width to content" in a DataGrid column menu. */
export function MoveHorizontalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="m18 8 4 4-4 4" />
      <path d="M2 12h20" />
      <path d="m6 8-4 4 4 4" />
    </svg>
  );
}

/** An eye crossed out: "Hide column" in a DataGrid column menu. */
export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M10.73 5.08A10.74 10.74 0 0 1 21.94 11.65a1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49" />
      <path d="M14.08 14.16a3 3 0 0 1-4.24-4.24" />
      <path d="M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
