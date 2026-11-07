import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Progress } from './Progress';

const bar = () => screen.getByRole('progressbar');

describe('Progress', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  describe('structure', () => {
    it('is a progressbar root with a head, a track and a fill, as the spec draws it', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <Progress
          ref={ref}
          label="Uploading contract.pdf"
          value={45}
          showValue
          className="mine"
          style={{ width: 300 }}
          data-testid="root"
        />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(ref.current).toBe(root);
      expect(root).toBe(bar());
      expect(root).toHaveClass('flg-progress', 'mine');
      expect(root).toHaveAttribute('data-testid', 'root');
      expect(root.style.width).toBe('300px');
      expect(root).toHaveAttribute('data-variant', 'thin');
      expect(root).toHaveAttribute('data-size', 'md');
      expect(root).toHaveAttribute('data-status', 'default');
      expect(root).not.toHaveAttribute('data-indeterminate');
      expect(Array.from(root.children).map((child) => child.className)).toEqual([
        'flg-progress-head',
        'flg-progress-line',
      ]);
      const head = root.children[0] as HTMLElement;
      expect(Array.from(head.children).map((child) => child.className)).toEqual([
        'flg-progress-label',
        'flg-progress-value',
      ]);
      const line = root.children[1] as HTMLElement;
      expect(Array.from(line.children).map((child) => child.className)).toEqual([
        'flg-progress-track',
      ]);
      const fill = line.querySelector('.flg-progress-fill') as HTMLElement;
      expect(fill.parentElement).toHaveClass('flg-progress-track');
      // The width is a custom property, so the HTML from a server already has it right.
      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('45%');
    });

    it('puts the data attributes of variant, size and status on the root', () => {
      render(<Progress aria-label="Upload" variant="glow" size="sm" status="error" value={62} />);
      expect(bar()).toHaveAttribute('data-variant', 'glow');
      expect(bar()).toHaveAttribute('data-size', 'sm');
      expect(bar()).toHaveAttribute('data-status', 'error');
    });

    it('has only a track without a label and without a value (a bar under a file row)', () => {
      render(<Progress aria-label="Upload of notes.docx" value={70} size="sm" />);
      expect(bar().querySelector('.flg-progress-head')).toBeNull();
      expect(bar().querySelector('.flg-progress-value')).toBeNull();
      expect(bar().querySelector('.flg-progress-track')).not.toBeNull();
    });

    it('keeps the value in the head of thin and glow, and at the end of the bar in inline', () => {
      const { rerender } = render(<Progress aria-label="Upload" value={45} showValue />);
      expect(bar().querySelector('.flg-progress-head > .flg-progress-value')).toHaveTextContent(
        '45%',
      );
      rerender(<Progress aria-label="Upload" variant="glow" value={45} showValue />);
      expect(bar().querySelector('.flg-progress-head > .flg-progress-value')).toHaveTextContent(
        '45%',
      );
      rerender(<Progress aria-label="Upload" variant="inline" value={45} showValue />);
      expect(bar().querySelector('.flg-progress-head')).toBeNull();
      expect(bar().querySelector('.flg-progress-line > .flg-progress-value')).toHaveTextContent(
        '45%',
      );
    });

    it('puts only the label in the head of inline', () => {
      render(<Progress variant="inline" label="Uploading" value={45} showValue />);
      const head = bar().querySelector('.flg-progress-head') as HTMLElement;
      expect(head.children).toHaveLength(1);
      expect(head.firstElementChild).toHaveClass('flg-progress-label');
    });

    it('hides the visible value from assistive technology: the ARIA attributes carry it', () => {
      render(<Progress aria-label="Upload" value={45} showValue />);
      expect(bar().querySelector('.flg-progress-value')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('ARIA', () => {
    it('sets the range, and the value as given when it is inside it', () => {
      render(<Progress aria-label="Upload" value={45} />);
      expect(bar()).toHaveAttribute('aria-valuemin', '0');
      expect(bar()).toHaveAttribute('aria-valuemax', '100');
      expect(bar()).toHaveAttribute('aria-valuenow', '45');
      expect(bar()).toHaveAttribute('aria-valuetext', '45%');
    });

    it('measures the fill against `max`', () => {
      const { container } = render(<Progress aria-label="Upload" value={30} max={60} />);
      expect(bar()).toHaveAttribute('aria-valuemax', '60');
      expect(bar()).toHaveAttribute('aria-valuenow', '30');
      const fill = container.querySelector('.flg-progress-fill') as HTMLElement;
      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('50%');
    });

    it('clamps a value outside the range, and says so in development', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container, rerender } = render(<Progress aria-label="Upload" value={140} />);
      expect(bar()).toHaveAttribute('aria-valuenow', '100');
      const fill = container.querySelector('.flg-progress-fill') as HTMLElement;
      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('100%');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('a value outside 0 to `max` is clamped'),
      );
      rerender(<Progress aria-label="Upload" value={-5} />);
      expect(bar()).toHaveAttribute('aria-valuenow', '0');
      expect(fill.style.getPropertyValue('--flg-progress-value')).toBe('0%');
    });

    it('warns once about a value that keeps going past `max`, such as a low estimate', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = render(<Progress aria-label="Upload" value={120} />);
      rerender(<Progress aria-label="Upload" value={130} />);
      rerender(<Progress aria-label="Upload" value={140} />);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('is indeterminate without a value: no `aria-valuenow`, no `aria-valuetext`', () => {
      const { rerender } = render(<Progress aria-label="Upload" />);
      expect(bar()).toHaveAttribute('data-indeterminate');
      expect(bar()).not.toHaveAttribute('aria-valuenow');
      expect(bar()).not.toHaveAttribute('aria-valuetext');
      rerender(<Progress aria-label="Upload" value={null} status="error" />);
      expect(bar()).toHaveAttribute('data-indeterminate');
      expect(bar()).not.toHaveAttribute('aria-valuenow');
      expect(bar()).not.toHaveAttribute('aria-valuetext');
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'treats %s as indeterminate and says so in development',
      (value) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<Progress aria-label="Upload" value={value} />);
        expect(bar()).toHaveAttribute('data-indeterminate');
        expect(bar()).not.toHaveAttribute('aria-valuenow');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('is not a finite number'));
      },
    );

    it.each([0, -10, Number.NaN, Number.POSITIVE_INFINITY])(
      'uses 100 for `max` %s, and says so in development',
      (max) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<Progress aria-label="Upload" value={20} max={max} />);
        expect(bar()).toHaveAttribute('aria-valuemax', '100');
        expect(bar()).toHaveAttribute('aria-valuenow', '20');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('max must be a positive'));
      },
    );

    it('says nothing for a value inside the range', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Progress aria-label="Upload" value={100} />);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('aria-valuetext', () => {
    it('is the result of `getValueText`', () => {
      const getValueText = vi.fn((value: number, max: number) => `${value} of ${max} files`);
      render(<Progress aria-label="Upload" value={3} max={8} getValueText={getValueText} />);
      expect(getValueText).toHaveBeenCalledWith(3, 8);
      expect(bar()).toHaveAttribute('aria-valuetext', '3 of 8 files');
    });

    it('names the status after the percent, since progressbar has no ARIA for an error', () => {
      const { rerender } = render(<Progress aria-label="Upload" value={62} status="error" />);
      expect(bar()).toHaveAttribute('aria-valuetext', '62%, Error');
      rerender(<Progress aria-label="Upload" value={100} status="success" />);
      expect(bar()).toHaveAttribute('aria-valuetext', '100%, Success');
    });

    it('names the status after the text of `getValueText` when there is one', () => {
      render(
        <Progress
          aria-label="Upload"
          value={5}
          max={8}
          status="error"
          getValueText={(value, max) => `${value} of ${max} files`}
        />,
      );
      expect(bar()).toHaveAttribute('aria-valuetext', '5 of 8 files, Error');
    });

    it('takes the name of the status from `labels`, and the percent from `locale`', () => {
      render(
        <Progress
          aria-label="Tai len"
          value={62}
          status="error"
          locale="vi-VN"
          labels={{ error: 'Loi' }}
        />,
      );
      expect(bar()).toHaveAttribute('aria-valuetext', '62%, Loi');
    });

    it('keeps the default status word when its label is given as undefined', () => {
      render(
        <Progress aria-label="Upload" value={62} status="error" labels={{ error: undefined }} />,
      );
      expect(bar()).toHaveAttribute('aria-valuetext', '62%, Error');
    });

    it('is the percent for the default status without `getValueText`', () => {
      render(<Progress aria-label="Upload" value={62} status="default" />);
      expect(bar()).toHaveAttribute('aria-valuetext', '62%');
    });

    it('does not read `locale` when `getValueText` writes the text, and does when it does not', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { unmount } = render(
        <Progress aria-label="x" value={5} getValueText={() => 'five'} locale="vi_VN" />,
      );
      expect(bar()).toHaveAttribute('aria-valuetext', 'five');
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('language tag'));
      unmount();
      render(<Progress aria-label="x" value={5} locale="en_GB" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('language tag'));
    });

    it('is the percent of `max`, rounded down, so it matches the text that is shown', () => {
      render(<Progress aria-label="Files" value={3} max={8} showValue />);
      expect(bar()).toHaveAttribute('aria-valuetext', '37%');
      expect(bar().querySelector('.flg-progress-value')).toHaveTextContent('37%');
    });
  });

  describe('the visible value', () => {
    it('is a percent of `max`, rounded to whole numbers', () => {
      render(<Progress aria-label="Upload" value={1} max={3} showValue />);
      expect(bar().querySelector('.flg-progress-value')).toHaveTextContent('33%');
    });

    it.each([
      [99.6, 100, '99%'],
      [995, 1000, '99%'],
      [57, 100, '57%'],
      [100, 100, '100%'],
      [0.4, 100, '0%'],
    ])('rounds %s of %s down to %s, so only a full bar says 100%', (value, max, text) => {
      render(<Progress aria-label="Upload" value={value} max={max} showValue />);
      expect(bar().querySelector('.flg-progress-value')).toHaveTextContent(text);
    });

    it('says 99% in the value text of an error as well, not 100%', () => {
      render(<Progress aria-label="Upload" value={99.6} status="error" />);
      expect(bar()).toHaveAttribute('aria-valuetext', '99%, Error');
    });

    it.each([
      ['en-US', '45%'],
      ['vi-VN', '45%'],
      // German puts a no-break space before the sign.
      ['de-DE', '45 %'],
    ])('is written for %s as %s', (locale, text) => {
      render(<Progress aria-label="Upload" value={45} showValue locale={locale} />);
      expect(bar().querySelector('.flg-progress-value')?.textContent).toBe(text);
    });

    it('is the text of `getValueText` when there is one', () => {
      render(
        <Progress
          aria-label="Upload"
          value={3}
          max={8}
          showValue
          getValueText={(value, max) => `${value}/${max}`}
        />,
      );
      expect(bar().querySelector('.flg-progress-value')).toHaveTextContent('3/8');
    });

    it('is not shown without `showValue`', () => {
      render(<Progress aria-label="Upload" value={45} />);
      expect(bar().querySelector('.flg-progress-value')).toBeNull();
    });

    it('is not shown while the progress is indeterminate', () => {
      render(<Progress aria-label="Upload" showValue />);
      expect(bar().querySelector('.flg-progress-value')).toBeNull();
    });

    it('keeps an empty column in inline while indeterminate, so the bar is as long as the others', () => {
      render(<Progress aria-label="Upload" variant="inline" showValue />);
      const cell = bar().querySelector('.flg-progress-line > .flg-progress-value');
      expect(cell).not.toBeNull();
      expect(cell).toBeEmptyDOMElement();
    });
  });

  describe('the status icon', () => {
    it.each(['success', 'error'] as const)(
      'shows the glyph of %s, hidden, before the value',
      (status) => {
        render(<Progress aria-label="Upload" value={62} status={status} showValue />);
        const cell = bar().querySelector('.flg-progress-value') as HTMLElement;
        const icon = cell.firstElementChild as HTMLElement;
        expect(icon).toHaveClass('flg-progress-icon');
        const svg = icon.querySelector('svg') as SVGElement;
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        // The same path as the circled check or the circled cross of Toast and Alert.
        expect(svg.querySelector('path')?.getAttribute('d')).toBe(
          status === 'success' ? 'm9 12 2 2 4-4' : 'm15 9-6 6M9 9l6 6',
        );
        expect(cell).toHaveTextContent('62%');
      },
    );

    it('shows the icon without `showValue`, so the status is not told by colour alone', () => {
      render(<Progress aria-label="Upload" value={100} status="success" />);
      const cell = bar().querySelector('.flg-progress-value') as HTMLElement;
      expect(cell.querySelector('svg')).not.toBeNull();
      expect(cell.textContent).toBe('');
    });

    it('has no icon for the default status', () => {
      render(<Progress aria-label="Upload" value={45} showValue />);
      expect(bar().querySelector('svg')).toBeNull();
    });
  });

  describe('the name', () => {
    it('is the visible label, which `aria-labelledby` points at', () => {
      render(<Progress label="Uploading contract.pdf" value={45} />);
      const label = screen.getByText('Uploading contract.pdf');
      expect(label).toHaveClass('flg-progress-label');
      expect(label.id).not.toBe('');
      expect(bar()).toHaveAttribute('aria-labelledby', label.id);
      expect(bar()).toHaveAccessibleName('Uploading contract.pdf');
    });

    it('is the `aria-label` of the caller over the label, which then does not name it', () => {
      render(<Progress label="Uploading" aria-label="Upload of contract.pdf" value={45} />);
      expect(bar()).not.toHaveAttribute('aria-labelledby');
      expect(bar()).toHaveAccessibleName('Upload of contract.pdf');
    });

    it('is the `aria-labelledby` of the caller over the label', () => {
      render(
        <>
          <h2 id="title">Documents</h2>
          <Progress label="Uploading" aria-labelledby="title" value={45} />
        </>,
      );
      expect(bar()).toHaveAttribute('aria-labelledby', 'title');
      expect(bar()).toHaveAccessibleName('Documents');
    });

    it('does not take `label={true}` for a name: a boolean renders nothing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Progress value={45} label={true} />);
      expect(bar()).not.toHaveAttribute('aria-labelledby');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Progress> needs a name'));
    });

    it('warns in development when nothing names it', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Progress value={45} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Progress> needs a name'));
    });

    it.each([
      ['a label', <Progress key="a" label="Uploading" value={45} />],
      ['an aria-label', <Progress key="b" aria-label="Upload" value={45} />],
      ['an aria-labelledby', <Progress key="c" aria-labelledby="x" value={45} />],
    ])('does not warn with %s', (_name, element) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(element);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('does not let the caller replace the role or the value attributes', () => {
    // The type refuses `role`; this is a JavaScript caller, or a spread of unknown props.
    const loose = { role: 'meter', 'aria-valuenow': 3 } as object;
    render(<Progress aria-label="Upload" value={45} {...loose} />);
    expect(bar()).toHaveAttribute('role', 'progressbar');
    expect(bar()).toHaveAttribute('aria-valuenow', '45');
  });
});
