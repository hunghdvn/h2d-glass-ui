import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment, createRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { List, ListItem } from './List';
import type { ListItemLinkProps } from './List';

beforeEach(() => {
  resetDevWarnings();
  vi.restoreAllMocks();
});

const plainLink = ({ children, ...props }: ListItemLinkProps) => <a {...props}>{children}</a>;
const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
const rows = (container: HTMLElement) => Array.from(container.querySelectorAll('li.flg-list-item'));
const part = (row: Element, name: string) => row.querySelector(`.flg-list-item-${name}`);

const HREF_AND_ON_SELECT =
  '<ListItem> has both href and onSelect; the href wins and onSelect is ignored.';
const NEEDS_TITLE =
  '<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable.';
const RENDER_LINK_WITHOUT_HREF = '<ListItem> renderLink has no effect without href.';

describe('List', () => {
  it('renders a <ul role="list"> with inset and md by default, and the glass surface only for inset', () => {
    const { container } = render(
      <List>
        <ListItem title="A" />
      </List>,
    );
    const list = container.firstElementChild!;
    expect(list.tagName).toBe('UL');
    // Safari drops the list semantics of a list that has `list-style: none`.
    expect(list).toHaveAttribute('role', 'list');
    expect(list).toHaveClass('flg-list', 'flg-surface');
    expect(list).toHaveAttribute('data-variant', 'inset');
    expect(list).toHaveAttribute('data-size', 'md');
    expect(screen.getByRole('list')).toBe(list);
  });

  it.each([
    ['inset', true],
    ['cards', false],
    ['plain', false],
  ] as const)('reflects variant %s, with flg-surface: %s', (variant, surface) => {
    const { container } = render(
      <List variant={variant} size="sm">
        <ListItem title="A" />
      </List>,
    );
    const list = container.firstElementChild!;
    expect(list).toHaveAttribute('data-variant', variant);
    expect(list).toHaveAttribute('data-size', 'sm');
    expect(list.classList.contains('flg-surface')).toBe(surface);
  });

  it('forwards the ref to the <ul> and puts className, style and other props on it', () => {
    const ref = createRef<HTMLUListElement>();
    const { container } = render(
      <List ref={ref} className="mine" style={{ margin: 3 }} aria-label="Members">
        <ListItem title="A" />
      </List>,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('flg-list', 'mine');
    expect(ref.current).toHaveStyle({ margin: '3px' });
    expect(screen.getByRole('list', { name: 'Members' })).toBe(ref.current);
  });
});

describe('ListItem structure', () => {
  it('renders start, a main column with title and description, and end, in that order', () => {
    const { container } = render(
      <List>
        <ListItem
          start={<i data-testid="start" />}
          title="Ada"
          description="ada@example.com"
          end={<b data-testid="end" />}
        />
      </List>,
    );
    const [row] = rows(container);
    expect(Array.from(row!.children).map((child) => child.className)).toEqual([
      'flg-list-item-start',
      'flg-list-item-main',
      'flg-list-item-end',
    ]);
    expect(part(row!, 'start')).toContainElement(screen.getByTestId('start'));
    expect(part(row!, 'end')).toContainElement(screen.getByTestId('end'));
    const main = part(row!, 'main')!;
    expect(Array.from(main.children).map((child) => child.className)).toEqual([
      'flg-list-item-title',
      'flg-list-item-description',
    ]);
    expect(main.querySelector('.flg-list-item-description')).toHaveTextContent('ada@example.com');
  });

  it.each([
    ['false', false],
    ['null', null],
    ['an empty string', ''],
    ['an empty array', []],
    ['an empty fragment', <Fragment key="f" />],
    ['a fragment of nothing', <Fragment key="f">{[null, false]}</Fragment>],
  ])('leaves out a slot that holds %s', (_label, nothing) => {
    const { container } = render(
      <List>
        <ListItem start={nothing} title="A" description={nothing} end={nothing} />
        <ListItem start={nothing} title={nothing} description={nothing} end={nothing} />
      </List>,
    );
    const [first, second] = rows(container);
    expect(part(first!, 'start')).toBeNull();
    expect(part(first!, 'description')).toBeNull();
    expect(part(first!, 'end')).toBeNull();
    expect(part(first!, 'title')).not.toBeNull();
    // A row with nothing in it has no column either.
    expect(second!.children).toHaveLength(0);
  });

  it('keeps a slot that holds the number 0', () => {
    const { container } = render(
      <List>
        <ListItem title="Unread" end={0} />
      </List>,
    );
    expect(part(rows(container)[0]!, 'end')).toHaveTextContent('0');
  });

  it('puts children after the description, in the main column, as the free content of a row without a title', () => {
    const { container } = render(
      <List>
        <ListItem title="With" description="d">
          <em>after</em>
        </ListItem>
        <ListItem>
          <em>free</em>
        </ListItem>
      </List>,
    );
    const [withTitle, free] = rows(container);
    const main = part(withTitle!, 'main')!;
    expect(main.lastElementChild!.tagName).toBe('EM');
    expect(main.children).toHaveLength(3);
    expect(part(free!, 'title')).toBeNull();
    expect(part(free!, 'main')).toHaveTextContent('free');
    expect(free).not.toHaveAttribute('data-interactive');
  });

  it('forwards the ref to the <li> and puts className, style and other props on it', () => {
    const ref = createRef<HTMLLIElement>();
    const { container } = render(
      <List>
        <ListItem ref={ref} title="A" className="mine" style={{ margin: 3 }} id="row" />
      </List>,
    );
    expect(ref.current).toBe(rows(container)[0]);
    expect(ref.current).toHaveClass('flg-list-item', 'mine');
    expect(ref.current).toHaveStyle({ margin: '3px' });
    expect(ref.current).toHaveAttribute('id', 'row');
  });

  it('does not put the title or onSelect on the <li> as attributes', () => {
    const { container } = render(
      <List>
        <ListItem title="A" onSelect={() => {}} />
      </List>,
    );
    const [row] = rows(container);
    expect(row).not.toHaveAttribute('title');
    expect(row).not.toHaveAttribute('onselect');
  });
});

describe('the title', () => {
  it('is a <span> on a row that cannot be pressed', () => {
    const { container } = render(
      <List>
        <ListItem title="Static" />
      </List>,
    );
    const title = part(rows(container)[0]!, 'title')!;
    expect(title.tagName).toBe('SPAN');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is an <a href> with href', () => {
    render(
      <List>
        <ListItem title="Profile" href="/profile" />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link).toHaveAttribute('href', '/profile');
    expect(link).toHaveClass('flg-list-item-title');
  });

  it('is a <button type="button"> with onSelect, and calls onSelect with the click', async () => {
    const onSelect = vi.fn();
    render(
      <List>
        <ListItem title="Open" onSelect={onSelect} />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Open' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('flg-list-item-title');
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0]).toMatchObject({ type: 'click', target: button });
  });

  it('names the link or button by the title alone: the description and the end slot are not in the name', () => {
    render(
      <List>
        <ListItem
          title="Security"
          description="Password, two steps"
          end={<span>New</span>}
          href="/s"
        />
      </List>,
    );
    expect(screen.getByRole('link')).toHaveAccessibleName('Security');
  });

  it('wins with href over onSelect, which is not called, and warns once', async () => {
    const warn = spyWarn();
    const onSelect = vi.fn();
    const tree = (
      <List>
        <ListItem title="Both" href="#x" onSelect={onSelect} />
      </List>
    );
    const { rerender } = render(tree);
    expect(screen.queryByRole('button')).toBeNull();
    await userEvent.click(screen.getByRole('link', { name: 'Both' }));
    expect(onSelect).not.toHaveBeenCalled();
    rerender(tree);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(HREF_AND_ON_SELECT));
  });
});

describe('renderLink', () => {
  const TestLink = ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a data-router="yes" {...props}>
      {children}
    </a>
  );

  it('is called with the props of the <a>, and what it returns is the title', () => {
    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
    render(
      <List>
        <ListItem title="Profile" href="/profile" renderLink={renderLink} current />
      </List>,
    );
    expect(renderLink).toHaveBeenCalledTimes(1);
    expect(renderLink.mock.calls[0]![0]).toEqual({
      href: '/profile',
      className: 'flg-list-item-title',
      children: 'Profile',
      'aria-current': 'page',
    });
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link).toHaveAttribute('data-router', 'yes');
    expect(link).toHaveAttribute('href', '/profile');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('is given no aria-current on a row that is not current', () => {
    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
    render(
      <List>
        <ListItem title="Profile" href="/profile" renderLink={renderLink} />
      </List>,
    );
    expect(renderLink.mock.calls[0]![0]).not.toHaveProperty('aria-current');
  });

  it('is not called for a disabled row, which gets the library link without href', () => {
    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
    render(
      <List>
        <ListItem title="Billing" href="/billing" renderLink={renderLink} disabled />
      </List>,
    );
    expect(renderLink).not.toHaveBeenCalled();
    const link = screen.getByRole('link', { name: 'Billing' });
    expect(link).not.toHaveAttribute('data-router');
    expect(link).not.toHaveAttribute('href');
  });

  it('has no effect without href: the title is not a link, and it says so', () => {
    const warn = spyWarn();
    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
    render(
      <List>
        <ListItem title="Nowhere" renderLink={renderLink} />
      </List>,
    );
    expect(renderLink).not.toHaveBeenCalled();
    expect(screen.queryByRole('link')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(RENDER_LINK_WITHOUT_HREF));
  });

  it('is not called for a row without a title, which cannot be pressed', () => {
    spyWarn();
    const renderLink = vi.fn((props: ListItemLinkProps) => <TestLink {...props} />);
    render(
      <List>
        <ListItem href="/x" renderLink={renderLink} />
      </List>,
    );
    expect(renderLink).not.toHaveBeenCalled();
  });
});

describe('disabled', () => {
  it('makes a link <a role="link" aria-disabled="true"> with no href, so it is neither followed nor focused', async () => {
    const { container } = render(
      <List>
        <ListItem title="Billing" href="/billing" disabled />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Billing' });
    expect(link.tagName).toBe('A');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveClass('flg-list-item-title');
    await userEvent.tab();
    expect(link).not.toHaveFocus();
    expect(rows(container)[0]).toHaveAttribute('data-disabled');
  });

  it('gives a button the native disabled attribute, and does not call onSelect', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <List>
        <ListItem title="Archive" onSelect={onSelect} disabled />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Archive' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
    expect(rows(container)[0]).toHaveAttribute('data-disabled');
  });

  it('does nothing on a row that cannot be pressed', () => {
    const { container } = render(
      <List>
        <ListItem title="Static" disabled />
      </List>,
    );
    expect(rows(container)[0]).not.toHaveAttribute('data-disabled');
    expect(part(rows(container)[0]!, 'title')).not.toHaveAttribute('aria-disabled');
  });
});

describe('current', () => {
  it('puts aria-current="page" on the link, and data-current on the <li>', () => {
    const { container } = render(
      <List>
        <ListItem title="Profile" href="/p" current />
        <ListItem title="Alerts" href="/a" />
      </List>,
    );
    const [profile, alerts] = rows(container);
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
    expect(profile).not.toHaveAttribute('aria-current');
    expect(profile).toHaveAttribute('data-current');
    expect(alerts).not.toHaveAttribute('data-current');
    expect(screen.getByRole('link', { name: 'Alerts' })).not.toHaveAttribute('aria-current');
  });

  it('puts it on the button of a row with onSelect', () => {
    render(
      <List>
        <ListItem title="Open" onSelect={() => {}} current />
      </List>,
    );
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-current', 'page');
  });

  it('puts it on the <li> when the row cannot be pressed', () => {
    const { container } = render(
      <List>
        <ListItem title="Here" current />
      </List>,
    );
    const [row] = rows(container);
    expect(row).toHaveAttribute('aria-current', 'page');
    expect(row).toHaveAttribute('data-current');
    expect(part(row!, 'title')).not.toHaveAttribute('aria-current');
  });

  it('keeps aria-current on the disabled link', () => {
    render(
      <List>
        <ListItem title="Here" href="/h" current disabled />
      </List>,
    );
    expect(screen.getByRole('link', { name: 'Here' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('data-interactive', () => {
  it('is on the rows that can be pressed and on no other', () => {
    const { container } = render(
      <List>
        <ListItem title="Static" description="d" end={<span>x</span>} />
        <ListItem title="Link" href="/l" />
        <ListItem title="Button" onSelect={() => {}} />
        <ListItem>free</ListItem>
      </List>,
    );
    expect(rows(container).map((row) => row.hasAttribute('data-interactive'))).toEqual([
      false,
      true,
      true,
      false,
    ]);
  });

  it('is not on a disabled row, which does not react to the pointer', () => {
    const { container } = render(
      <List>
        <ListItem title="Link" href="/l" disabled />
        <ListItem title="Button" onSelect={() => {}} disabled />
      </List>,
    );
    expect(rows(container).map((row) => row.hasAttribute('data-interactive'))).toEqual([
      false,
      false,
    ]);
  });
});

describe('warnings', () => {
  it.each([
    ['href', <ListItem key="h" href="/x" />],
    ['onSelect', <ListItem key="o" onSelect={() => {}} />],
    ['renderLink', <ListItem key="r" href="/x" renderLink={plainLink} />],
    ['an empty title', <ListItem key="e" title={false} href="/x" />],
  ])('warns that %s without a title leaves the row not pressable', (_label, item) => {
    const warn = spyWarn();
    const { container } = render(<List>{item}</List>);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(NEEDS_TITLE));
    expect(rows(container)[0]).not.toHaveAttribute('data-interactive');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not warn for rows that are used as documented', () => {
    const warn = spyWarn();
    render(
      <List>
        <ListItem title="Static" description="d" />
        <ListItem title="Link" href="/l" renderLink={plainLink} />
        <ListItem title="Button" onSelect={() => {}} />
        <ListItem>free content</ListItem>
      </List>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('prints each warning once however often the rows render', () => {
    const warn = spyWarn();
    const tree = (
      <List>
        <ListItem href="/a" />
        <ListItem href="/b" />
        <ListItem title="x" href="/c" onSelect={() => {}} />
        <ListItem title="y" href="/d" onSelect={() => {}} />
      </List>
    );
    const { rerender } = render(tree);
    rerender(tree);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
