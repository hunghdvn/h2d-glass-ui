// A Server Component: the navigation is data, rendered into the HTML, and the sidebar of the client
// shell shows it. `active` comes from the path, which is how an application knows the page it is on.
import { Nav, NavGroup, NavItem, NavSection } from 'h2d-glass-ui';
import Link from 'next/link';
import { FolderIcon, HomeIcon, InboxIcon } from './icons';

const MAIN = [
  { href: '/shell', label: 'Overview', icon: <HomeIcon />, badge: undefined },
  { href: '/shell/inbox', label: 'Inbox', icon: <InboxIcon />, badge: 12 },
];
const PROJECTS = [
  { href: '/shell/projects/design-system', label: 'Design system' },
  { href: '/shell/projects/mobile', label: 'Mobile app' },
];

export function ShellNav({ path }: { path: string }) {
  return (
    <Nav aria-label="Main">
      {MAIN.map(({ href, label, icon, badge }) => (
        <NavItem key={href} asChild active={path === href} icon={icon} badge={badge}>
          <Link href={href}>{label}</Link>
        </NavItem>
      ))}
      <NavSection title="Projects">
        <NavGroup label="Design" icon={<FolderIcon />}>
          {PROJECTS.map(({ href, label }) => (
            <NavItem key={href} asChild active={path === href}>
              <Link href={href}>{label}</Link>
            </NavItem>
          ))}
        </NavGroup>
      </NavSection>
    </Nav>
  );
}
