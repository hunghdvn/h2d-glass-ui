import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  BoxCheckIcon,
  CalendarIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  ExclamationIcon,
  FileIcon,
  MinusIcon,
  PlusIcon,
  StatusIcon,
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

  it('CloseIcon pins its path', () => {
    const { container } = render(<CloseIcon />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M18 6 6 18M6 6l12 12');
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

  it('forwards extra props such as className', () => {
    const { container } = render(<ChevronIcon direction="down" className="flg-select-chevron" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('flg-select-chevron');
  });
});
