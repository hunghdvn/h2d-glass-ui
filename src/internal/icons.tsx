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

export type ArrowDirection = 'up' | 'down' | 'left';

const ARROW_PATHS: Record<ArrowDirection, readonly [string, string]> = {
  down: ['M12 5v14', 'm19 12-7 7-7-7'],
  up: ['M12 19V5', 'm5 12 7-7 7 7'],
  left: ['M19 12H5', 'm12 19-7-7 7-7'],
};

/** An arrow up or down (the sort direction in the heading of a Table column) or left (the back button of a SearchField). */
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
