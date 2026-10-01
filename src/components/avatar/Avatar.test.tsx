import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Avatar } from './Avatar';

const PHOTO = 'https://example.test/a.png';

const root = (container: HTMLElement) => container.querySelector('.flg-avatar') as HTMLElement;

describe('Avatar', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('shows the default icon without src, and stays decorative without alt', () => {
    const { container } = render(<Avatar />);
    const avatar = root(container);
    expect(avatar).toHaveAttribute('data-status', 'error');
    expect(avatar).toHaveAttribute('data-size', 'md');
    expect(avatar.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).not.toHaveAttribute('role');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('names the fallback after alt', () => {
    render(<Avatar alt="Trần Thị B" fallback="TB" />);
    const avatar = screen.getByRole('img', { name: 'Trần Thị B' });
    expect(avatar).toHaveTextContent('TB');
  });

  it('shows the fallback while the image loads, then the image', () => {
    const { container } = render(<Avatar src={PHOTO} alt="Nguyễn Văn A" fallback="NA" />);
    const avatar = root(container);
    const image = container.querySelector('img') as HTMLImageElement;
    expect(avatar).toHaveAttribute('data-status', 'loading');
    expect(avatar).toHaveAttribute('role', 'img');
    expect(avatar).toHaveTextContent('NA');

    fireEvent.load(image);
    expect(avatar).toHaveAttribute('data-status', 'loaded');
    expect(avatar).not.toHaveAttribute('role');
    expect(avatar).not.toHaveTextContent('NA');
    expect(screen.getByRole('img', { name: 'Nguyễn Văn A' }).tagName).toBe('IMG');
  });

  it('falls back when the image fails', () => {
    const { container } = render(<Avatar src={PHOTO} alt="Nguyễn Văn A" fallback="NA" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(root(container)).toHaveAttribute('data-status', 'error');
    expect(screen.getByRole('img', { name: 'Nguyễn Văn A' })).toHaveTextContent('NA');
  });

  it('shows an image that finished loading before React attached its listeners', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(64);
    const { container } = render(<Avatar src={PHOTO} alt="Nguyễn Văn A" />);
    expect(root(container)).toHaveAttribute('data-status', 'loaded');
  });

  it('goes back to the fallback when src changes, until the new image loads', () => {
    const { container, rerender } = render(<Avatar src={PHOTO} alt="A" fallback="A" />);
    fireEvent.load(container.querySelector('img') as HTMLImageElement);
    expect(root(container)).toHaveAttribute('data-status', 'loaded');
    rerender(<Avatar src="https://example.test/b.png" alt="A" fallback="A" />);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
  });

  it('warns when an image has no alt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Avatar src={PHOTO} />);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] Avatar has `src` but no `alt`; screen readers cannot tell who it shows.',
    );
  });

  it('reflects size, joins a className and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} size="lg" className="mine" />);
    expect(ref.current).toHaveClass('flg-avatar', 'mine');
    expect(ref.current).toHaveAttribute('data-size', 'lg');
  });
});
