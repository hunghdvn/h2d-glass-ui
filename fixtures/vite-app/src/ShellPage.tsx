// The frame of an application, rendered with React 18.3 in the browser: the same set as the Next.js
// fixture's /shell page. Links are hashes, so that pressing one stays on this page.
import {
  AppShell,
  AppShellBrand,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  Button,
  IconButton,
  Indicator,
  List,
  ListItem,
  MenuItem,
  MenuSeparator,
  Nav,
  NavGroup,
  NavItem,
  NavSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SearchField,
  ThemeMenuGroup,
  ThemeSwitch,
  Toaster,
  UserMenu,
} from 'h2d-glass-ui';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// The strokes of the fixture's own icons, on a 24px grid.
const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);
const HomeIcon = () => (
  <Icon>
    <path d="M3 10.5 12 3l9 7.5V21H3z" />
  </Icon>
);
const InboxIcon = () => (
  <Icon>
    <path d="M3 13h5l1 3h6l1-3h5" />
    <path d="M5 5h14l2 8v6H3v-6z" />
  </Icon>
);
const FolderIcon = () => (
  <Icon>
    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
);
const BellIcon = () => (
  <Icon>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);

const NOTIFICATIONS = [
  { id: 'a', title: 'Minh Anh commented on Design system', time: '5 minutes ago' },
  { id: 'b', title: 'Release 0.4.0 is ready to review', time: '2 hours ago' },
];

function Notifications() {
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  // The number on the bell is for the eyes only, so the name of the button says it too.
  const name = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
  return (
    <Popover>
      <Indicator status="danger" count={unread}>
        <PopoverTrigger asChild>
          <IconButton variant="ghost" aria-label={name}>
            <BellIcon />
          </IconButton>
        </PopoverTrigger>
      </Indicator>
      <PopoverContent side="bottom" align="end" arrow={false} aria-label="Notifications">
        <Button variant="ghost" size="sm" onClick={() => setUnread(0)}>
          Mark all as read
        </Button>
        <List surface={false} aria-label="Notifications">
          {NOTIFICATIONS.map((item) => (
            <ListItem key={item.id} href="#/inbox" title={item.title} description={item.time} />
          ))}
        </List>
      </PopoverContent>
    </Popover>
  );
}

const readCollapsed = () => document.cookie.split('; ').includes('flg-sidebar=collapsed');

/** The route of the page: the hash, as there is no router here. */
function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function ShellPage() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const route = useRoute();
  return (
    <>
      <AppShell
        // There is no server to read the cookie here, so the page reads it itself.
        defaultCollapsed={readCollapsed()}
        onCollapsedChange={(collapsed) => {
          document.cookie = `flg-sidebar=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
        }}
        brand={<AppShellBrand href="#/" name="Lumen" />}
      >
        <AppShellHeader>
          <form role="search" action="#/" style={{ display: 'contents' }}>
            <SearchField name="q" aria-label="Search" placeholder="Search…" shortcut="/" />
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <Notifications />
            <ThemeSwitch />
            <UserMenu name="Minh Anh Nguyen" description="minhanh@lumen.vn">
              <MenuItem>Profile</MenuItem>
              <MenuSeparator />
              <ThemeMenuGroup />
            </UserMenu>
          </div>
        </AppShellHeader>
        <AppShellSidebar>
          <Nav aria-label="Main">
            <NavItem href="#/" icon={<HomeIcon />} active={route === '#/'}>
              Overview
            </NavItem>
            <NavItem href="#/inbox" icon={<InboxIcon />} badge={12} active={route === '#/inbox'}>
              Inbox
            </NavItem>
            <NavSection title="Projects">
              <NavGroup label="Design" icon={<FolderIcon />}>
                <NavItem
                  href="#/projects/design-system"
                  active={route === '#/projects/design-system'}
                >
                  Design system
                </NavItem>
                <NavItem href="#/projects/mobile" active={route === '#/projects/mobile'}>
                  Mobile app
                </NavItem>
              </NavGroup>
            </NavSection>
          </Nav>
        </AppShellSidebar>
        <AppShellMain data-hydrated={hydrated ? '' : undefined}>
          <h1>{route === '#/' ? 'Overview' : route.slice(2)}</h1>
          <p>The page of the application, rendered in the browser.</p>
        </AppShellMain>
        <AppShellFooter>© 2026 Lumen</AppShellFooter>
      </AppShell>
      <Toaster />
    </>
  );
}
