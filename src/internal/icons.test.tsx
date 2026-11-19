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
  ExclamationIcon,
  FileIcon,
  GripIcon,
  MenuIcon,
  MinusIcon,
  MonitorIcon,
  MoonIcon,
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

  it('forwards extra props such as className', () => {
    const { container } = render(<ChevronIcon direction="down" className="flg-select-chevron" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('flg-select-chevron');
  });
});
