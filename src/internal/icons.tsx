import type { SVGProps } from 'react';

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
