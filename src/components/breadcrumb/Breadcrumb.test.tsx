import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('puts each child in a list item, with a hidden separator between them', () => {
    render(
      <Breadcrumb>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
        <BreadcrumbPage>Attachments</BreadcrumbPage>
      </Breadcrumb>,
    );
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const items = within(nav).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Home', 'Projects', 'Attachments']);
    const separators = nav.querySelectorAll('.flg-breadcrumb-separator');
    expect(separators).toHaveLength(2);
    for (const separator of separators) expect(separator).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Attachments')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  });

  it('reads children through Fragments and arrays, skipping null and false', () => {
    const extra = ['a', 'b'].map((name) => (
      <BreadcrumbLink key={name} href={`/${name}`}>
        {name}
      </BreadcrumbLink>
    ));
    render(
      <Breadcrumb>
        <>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
          {extra}
        </>
        {null}
        {false}
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Home', 'a', 'b', 'Here']);
  });

  it('renders nothing, not an empty landmark, when no child is left', () => {
    const path: string[] = [];
    const { container } = render(
      <Breadcrumb>
        {path.map((name) => (
          <BreadcrumbLink key={name} href={`/${name}`}>
            {name}
          </BreadcrumbLink>
        ))}
        {null}
      </Breadcrumb>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(renderToString(<Breadcrumb>{false}</Breadcrumb>)).toBe('');
  });

  it('uses a slash when asked, and takes its own label', () => {
    render(
      <Breadcrumb separator="slash" aria-label="You are here">
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    const nav = screen.getByRole('navigation', { name: 'You are here' });
    expect(nav).toHaveAttribute('data-separator', 'slash');
    expect(nav.querySelector('.flg-breadcrumb-separator')?.textContent).toBe('/');
  });

  it('renders a router link as the link with asChild, and forwards refs', () => {
    const navRef = createRef<HTMLElement>();
    const linkRef = createRef<HTMLAnchorElement>();
    render(
      <Breadcrumb ref={navRef}>
        <BreadcrumbLink asChild ref={linkRef} className="mine">
          <a href="/docs" data-router="">
            Docs
          </a>
        </BreadcrumbLink>
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveClass('flg-breadcrumb-link', 'mine');
    expect(linkRef.current).toBe(link);
    expect(navRef.current?.tagName).toBe('NAV');
  });

  it('renders on the server', () => {
    const html = renderToString(
      <Breadcrumb>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('aria-current="page"');
  });

  it('keeps a keyed item’s state when the items are reordered', () => {
    function Item({ label }: { label: string }) {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          {label}: {count}
        </button>
      );
    }
    const { rerender } = render(
      <Breadcrumb>
        <Item key="a" label="A" />
        <Item key="b" label="B" />
      </Breadcrumb>,
    );
    fireEvent.click(screen.getByText('A: 0'));
    expect(screen.getByText('A: 1')).toBeInTheDocument();
    rerender(
      <Breadcrumb>
        <Item key="b" label="B" />
        <Item key="a" label="A" />
      </Breadcrumb>,
    );
    expect(screen.getByText('A: 1')).toBeInTheDocument();
    expect(screen.getByText('B: 0')).toBeInTheDocument();
  });
});
