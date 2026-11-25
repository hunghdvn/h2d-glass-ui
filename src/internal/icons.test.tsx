import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ArrowIcon,
  BoxCheckIcon,
  CalendarIcon,
  CheckIcon,
  ChevronIcon,
  ChevronsUpDownIcon,
  CloseIcon,
  ColumnsIcon,
  ExclamationIcon,
  FileIcon,
  FunnelIcon,
  FunnelXIcon,
  GripIcon,
  GroupIcon,
  GripVerticalIcon,
  EyeOffIcon,
  MenuIcon,
  MoreVerticalIcon,
  MoveHorizontalIcon,
  MinusIcon,
  LockIcon,
  MonitorIcon,
  OperatorIcon,
  MoonIcon,
  PanelIcon,
  PencilIcon,
  PinLeftIcon,
  PinRightIcon,
  PlusIcon,
  SearchIcon,
  StatusIcon,
  SunIcon,
  UploadIcon,
  strokeIcon,
} from './icons';

describe('shared icons', () => {
  it('strokeIcon is hidden and stroked at width 2 on a 24x24 viewBox', () => {
    const { container } = render(<svg {...strokeIcon} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('stroke-width')).toBe('2');
  });

  it('CheckIcon pins its path', () => {
    const { container } = render(<CheckIcon />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M20 6 9 17l-5-5');
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('BoxCheckIcon uses a 12x12 viewBox', () => {
    const { container } = render(<BoxCheckIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 12 12');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M2.5 6.2 5 8.5l4.5-5');
  });

  it('ExclamationIcon uses a 12x12 viewBox and the stroke of the other icons', () => {
    const { container } = render(<ExclamationIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 12 12');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('stroke-width')).toBe('2');
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M6 2.75v3.75M6 9.25h.01');
  });

  it('ChevronIcon defaults to down', () => {
    const { container } = render(<ChevronIcon />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('m6 9 6 6 6-6');
  });

  it.each([
    ['down', 'm6 9 6 6 6-6'],
    ['up', 'm6 15 6-6 6 6'],
    ['left', 'm15 18-6-6 6-6'],
    ['right', 'm9 18 6-6-6-6'],
  ])('ChevronIcon direction %s pins its path', (direction, path) => {
    const { container } = render(<ChevronIcon direction={direction as 'down'} />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe(path);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it.each([
    ['down', ['M12 5v14', 'm19 12-7 7-7-7']],
    ['up', ['M12 19V5', 'm5 12 7-7 7 7']],
    ['left', ['M19 12H5', 'm12 19-7-7 7-7']],
    ['right', ['M5 12h14', 'm12 5 7 7-7 7']],
  ] as const)('ArrowIcon direction %s pins its paths', (direction, paths) => {
    const { container } = render(<ArrowIcon direction={direction} />);
    expect(Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual(
      paths,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('stroke-width')).toBe('2');
  });

  it('ChevronsUpDownIcon pins its paths: the lower chevron first, as the mockup draws them', () => {
    const { container } = render(<ChevronsUpDownIcon width={14} />);
    expect(Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual([
      'm7 15 5 5 5-5',
      'm7 9 5-5 5 5',
    ]);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('width')).toBe('14');
  });

  it('CloseIcon pins its path', () => {
    const { container } = render(<CloseIcon />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M18 6 6 18M6 6l12 12');
  });

  it('SearchIcon pins its shapes: a circle and the handle', () => {
    const { container } = render(<SearchIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const circle = container.querySelector('circle')!;
    expect([
      circle.getAttribute('cx'),
      circle.getAttribute('cy'),
      circle.getAttribute('r'),
    ]).toEqual(['11', '11', '7']);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('m20 20-3.5-3.5');
  });

  it('SunIcon pins its disc and its eight rays', () => {
    const { container } = render(<SunIcon />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    const circle = container.querySelector('circle')!;
    expect([
      circle.getAttribute('cx'),
      circle.getAttribute('cy'),
      circle.getAttribute('r'),
    ]).toEqual(['12', '12', '4']);
    expect(container.querySelector('path')?.getAttribute('d')).toBe(
      'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
    );
  });

  it('MoonIcon pins its path', () => {
    const { container } = render(<MoonIcon />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('path')?.getAttribute('d')).toBe(
      'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
    );
  });

  it('MonitorIcon pins its screen and its stand', () => {
    const { container } = render(<MonitorIcon />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    const rect = container.querySelector('rect')!;
    expect(['x', 'y', 'width', 'height', 'rx'].map((name) => rect.getAttribute(name))).toEqual([
      '2',
      '3',
      '20',
      '14',
      '2',
    ]);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M8 21h8M12 17v4');
  });

  it('MinusIcon pins its path', () => {
    const { container } = render(<MinusIcon />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M5 12h14');
  });

  it('PlusIcon pins its path', () => {
    const { container } = render(<PlusIcon />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M12 5v14M5 12h14');
  });

  it('CalendarIcon pins its shapes', () => {
    const { container } = render(<CalendarIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('rect')?.getAttribute('x')).toBe('3');
    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
    expect(paths).toEqual(['M16 2v4M8 2v4M3 10h18']);
  });

  it('UploadIcon pins its paths', () => {
    const { container } = render(<UploadIcon />);
    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
    expect(paths).toEqual([
      'M12 16V4',
      'm7 9 5-5 5 5',
      'M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
    ]);
  });

  it('MenuIcon pins its path and is a hidden stroked icon', () => {
    const { container } = render(<MenuIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
    expect(paths).toEqual(['M4 6h16M4 12h16M4 18h16']);
  });

  it('FileIcon pins its paths', () => {
    const { container } = render(<FileIcon />);
    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
    expect(paths).toEqual([
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
      'M14 2v6h6',
    ]);
  });

  it.each([
    ['info', ['M12 16v-4M12 8h.01'], 1],
    ['success', ['m9 12 2 2 4-4'], 1],
    [
      'warning',
      [
        'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
        'M12 9v4M12 17h.01',
      ],
      0,
    ],
    ['error', ['m15 9-6 6M9 9l6 6'], 1],
  ] as const)('StatusIcon %s draws its glyph', (status, paths, circles) => {
    const { container } = render(<StatusIcon status={status} />);
    expect(Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual(
      paths,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(circles);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('stroke-width')).toBe('2');
  });

  it('StatusIcon is hidden by default and lets a caller name it', () => {
    const { container, rerender } = render(<StatusIcon status="info" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    rerender(<StatusIcon status="info" aria-hidden={undefined} role="img" aria-label="Info" />);
    const svg = container.querySelector('svg')!;
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Info');
  });

  it('StatusIcon forwards size and className', () => {
    const { container } = render(
      <StatusIcon status="error" width={14} height={14} className="x" />,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('14');
    expect(svg.getAttribute('height')).toBe('14');
    expect(svg.getAttribute('class')).toBe('x');
  });

  it('GripIcon draws six filled dots in an 8x14 box and is hidden', () => {
    const { container } = render(<GripIcon className="flg-dialog-grip" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 8 14');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('class')).toBe('flg-dialog-grip');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('stroke')).toBe('none');
    const dots = [...container.querySelectorAll('circle')];
    expect(dots.map((dot) => [dot.getAttribute('cx'), dot.getAttribute('cy')])).toEqual([
      ['1.5', '1.5'],
      ['6.5', '1.5'],
      ['1.5', '7'],
      ['6.5', '7'],
      ['1.5', '12.5'],
      ['6.5', '12.5'],
    ]);
    expect(dots.every((dot) => dot.getAttribute('r') === '1.4')).toBe(true);
  });

  it('GripVerticalIcon draws six filled dots on the 24x24 grid and is hidden', () => {
    const { container } = render(<GripVerticalIcon className="flg-chip-grip" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('class')).toBe('flg-chip-grip');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('stroke')).toBe('none');
    const dots = [...container.querySelectorAll('circle')];
    expect(dots.map((dot) => [dot.getAttribute('cx'), dot.getAttribute('cy')])).toEqual([
      ['9', '5'],
      ['9', '12'],
      ['9', '19'],
      ['15', '5'],
      ['15', '12'],
      ['15', '19'],
    ]);
    expect(dots.every((dot) => dot.getAttribute('r') === '1')).toBe(true);
  });

  it('forwards extra props such as className', () => {
    const { container } = render(<ChevronIcon direction="down" className="flg-select-chevron" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('flg-select-chevron');
  });

  // The icons of the column menu of a DataGrid (spec phase 6 §4.6): stroked, on the 24x24 grid, hidden.
  const stroked = (container: HTMLElement) => {
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('2');
  };
  const paths = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('path'), (path) => path.getAttribute('d'));
  const PANEL = ['3', '3', '18', '18', '2'];
  const panelOf = (container: HTMLElement) => {
    const rect = container.querySelector('rect')!;
    return ['x', 'y', 'width', 'height', 'rx'].map((name) => rect.getAttribute(name));
  };

  it('MoreVerticalIcon draws three dots in a column', () => {
    const { container } = render(<MoreVerticalIcon />);
    stroked(container);
    const dots = Array.from(container.querySelectorAll('circle'), (dot) => [
      dot.getAttribute('cx'),
      dot.getAttribute('cy'),
      dot.getAttribute('r'),
    ]);
    expect(dots).toEqual([
      ['12', '5', '1'],
      ['12', '12', '1'],
      ['12', '19', '1'],
    ]);
  });

  it('PinLeftIcon is the panel with its left rule, and PinRightIcon the panel with its right rule', () => {
    const left = render(<PinLeftIcon />);
    stroked(left.container);
    expect(panelOf(left.container)).toEqual(PANEL);
    expect(paths(left.container)).toEqual(['M9 3v18']);
    const right = render(<PinRightIcon />);
    stroked(right.container);
    expect(panelOf(right.container)).toEqual(PANEL);
    expect(paths(right.container)).toEqual(['M15 3v18']);
  });

  it('PanelIcon is the panel alone: what a column that is not pinned looks like', () => {
    const { container } = render(<PanelIcon />);
    stroked(container);
    expect(panelOf(container)).toEqual(PANEL);
    expect(container.querySelectorAll('path')).toHaveLength(0);
  });

  it('MoveHorizontalIcon draws the line with an arrowhead at each end', () => {
    const { container } = render(<MoveHorizontalIcon />);
    stroked(container);
    expect(paths(container)).toEqual(['m18 8 4 4-4 4', 'M2 12h20', 'm6 8-4 4 4 4']);
  });

  it('EyeOffIcon draws the eye and the stroke through it', () => {
    const { container } = render(<EyeOffIcon />);
    stroked(container);
    expect(paths(container)).toEqual([
      'M10.73 5.08A10.74 10.74 0 0 1 21.94 11.65a1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49',
      'M14.08 14.16a3 3 0 0 1-4.24-4.24',
      'M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14',
      'm2 2 20 20',
    ]);
  });

  it('ColumnsIcon is the panel with a rule at each third: the column chooser', () => {
    const { container } = render(<ColumnsIcon />);
    stroked(container);
    expect(panelOf(container)).toEqual(PANEL);
    expect(paths(container)).toEqual(['M9 3v18M15 3v18']);
  });

  it('LockIcon is a closed padlock: a column that cannot be hidden', () => {
    const { container } = render(<LockIcon />);
    stroked(container);
    const rect = container.querySelector('rect')!;
    expect(['x', 'y', 'width', 'height', 'rx'].map((name) => rect.getAttribute(name))).toEqual([
      '4',
      '11',
      '16',
      '10',
      '2',
    ]);
    expect(paths(container)).toEqual(['M8 11V7a4 4 0 0 1 8 0v4']);
  });

  it('passes its props to the svg', () => {
    const { container } = render(<MoreVerticalIcon width={13} className="x" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('13');
    expect(svg.getAttribute('class')).toBe('x');
  });

  it('FunnelIcon is the funnel of the title of a column that lists its values', () => {
    const { container } = render(<FunnelIcon />);
    stroked(container);
    expect(paths(container)).toEqual(['M22 3H2l8 9.46V19l4 2v-8.54z']);
  });

  it('GroupIcon is two nested rows with a bracket: the grouping of a DataGrid', () => {
    const { container } = render(<GroupIcon />);
    stroked(container);
    expect(paths(container)).toEqual([
      'M21 12h-8',
      'M21 6H8',
      'M21 18h-8',
      'M3 6v4c0 1.1.9 2 2 2h3',
      'M3 10v6c0 1.1.9 2 2 2h3',
    ]);
  });

  it('FunnelXIcon is a funnel with its right side cut away and a cross beside it', () => {
    const { container } = render(<FunnelXIcon />);
    stroked(container);
    expect(paths(container)).toEqual([
      'M12.5 3H2l8 9.46V19l4 2v-8.54l1.2-1.4',
      'm22 3-5 5M17 3l5 5',
    ]);
  });

  // The eleven operators of the filter row (spec phase 6 §4.6): the three of the mockup, the others
  // after them. Each pins its paths, and `contains` and `notContains` the circle of their lens.
  it.each([
    ['contains', ['M21 6H3M10 12H3M10 18H3', 'm21 19-1.9-1.9']],
    ['notContains', ['M21 6H3M10 12H3M10 18H3', 'm21 19-1.9-1.9', 'm3 3 18 18']],
    ['startsWith', ['M4 5v14M9 9h11M9 15h7']],
    ['endsWith', ['M20 5v14M4 9h11M8 15h7']],
    ['=', ['M5 9h14M5 15h14']],
    ['<>', ['M5 9h14M5 15h14', 'M16 4 8 20']],
    ['<', ['m17 6-10 6 10 6']],
    ['>', ['m7 6 10 6-10 6']],
    ['<=', ['m17 4-10 5 10 5M7 19h10']],
    ['>=', ['m7 4 10 5-10 5M7 19h10']],
    ['between', ['M4 12h16M4 8v8M20 8v8']],
  ] as const)('OperatorIcon %s pins its paths', (operator, expected) => {
    const { container } = render(<OperatorIcon operator={operator} />);
    stroked(container);
    expect(paths(container)).toEqual(expected);
    const circles = Array.from(container.querySelectorAll('circle'), (circle) =>
      ['cx', 'cy', 'r'].map((name) => circle.getAttribute(name)),
    );
    expect(circles).toEqual(
      operator === 'contains' || operator === 'notContains' ? [['17', '15', '3']] : [],
    );
  });

  it('OperatorIcon passes its props to the svg and draws no glyph for an operator it does not know', () => {
    const { container } = render(<OperatorIcon operator="=" width={13} className="x" />);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('13');
    expect(container.querySelector('svg')!.getAttribute('class')).toBe('x');
    const none = render(<OperatorIcon operator={'nope' as '='} />);
    expect(none.container.querySelector('path')).toBeNull();
  });

  it('PencilIcon pins its two paths: the pencil and its tip (spec phase 6 §4.6, Plan F)', () => {
    const { container } = render(<PencilIcon />);
    stroked(container);
    expect(paths(container)).toEqual([
      'M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z',
      'm15 5 4 4',
    ]);
  });
});
