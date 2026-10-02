import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

describe('Card', () => {
  it('renders a glass surface with the card layout and its parts', () => {
    render(
      <Card aria-label="Plan">
        <CardHeader>
          <CardTitle>Upgrade</CardTitle>
          <CardDescription>More sync</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>,
    );
    const card = screen.getByLabelText('Plan');
    expect(card).toHaveClass('flg-surface', 'flg-card');
    expect(screen.getByRole('heading', { level: 3, name: 'Upgrade' })).toHaveClass(
      'flg-card-title',
    );
    expect(screen.getByText('More sync').tagName).toBe('P');
    expect(screen.getByText('More sync')).toHaveClass('flg-card-description');
    expect(screen.getByText('Body')).toHaveClass('flg-card-content');
    expect(screen.getByText('Actions')).toHaveClass('flg-card-footer');
    expect(card.querySelector('.flg-card-header')).not.toBeNull();
  });

  it('renders a different element with asChild on Card and CardTitle', () => {
    render(
      <Card asChild>
        <section aria-labelledby="t">
          <CardTitle asChild>
            <h2 id="t">Billing</h2>
          </CardTitle>
        </section>
      </Card>,
    );
    const region = screen.getByRole('region', { name: 'Billing' });
    expect(region).toHaveClass('flg-surface', 'flg-card');
    expect(screen.getByRole('heading', { level: 2, name: 'Billing' })).toHaveClass(
      'flg-card-title',
    );
  });

  it('forwards refs and joins class names', () => {
    const cardRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    render(
      <Card ref={cardRef} className="mine">
        <CardTitle ref={titleRef}>T</CardTitle>
      </Card>,
    );
    expect(cardRef.current).toHaveClass('flg-card', 'mine');
    expect(titleRef.current?.tagName).toBe('H3');
  });

  it('forwards refs and joins class names on every part', () => {
    const header = createRef<HTMLDivElement>();
    const description = createRef<HTMLParagraphElement>();
    const content = createRef<HTMLDivElement>();
    const footer = createRef<HTMLDivElement>();
    render(
      <Card>
        <CardHeader ref={header} className="h">
          <CardDescription ref={description} className="d">
            D
          </CardDescription>
        </CardHeader>
        <CardContent ref={content} className="c">
          C
        </CardContent>
        <CardFooter ref={footer} className="f">
          F
        </CardFooter>
      </Card>,
    );
    expect(header.current).toHaveClass('flg-card-header', 'h');
    expect(description.current).toHaveClass('flg-card-description', 'd');
    expect(content.current).toHaveClass('flg-card-content', 'c');
    expect(footer.current).toHaveClass('flg-card-footer', 'f');
  });
});
