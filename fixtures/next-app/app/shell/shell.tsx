'use client';

// The frame of the page, a Client Component because it keeps state (the folded sidebar, the unread
// notifications) and passes functions. The navigation and the page arrive as children, rendered by
// the server. The Toaster is not here: it belongs to the layout, outside the shell.
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  SearchField,
  ThemeMenuGroup,
  ThemeSwitch,
  UserMenu,
} from 'h2d-glass-ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BellIcon } from './icons';

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
            <ListItem
              key={item.id}
              href="/shell/inbox"
              title={item.title}
              description={item.time}
            />
          ))}
        </List>
      </PopoverContent>
    </Popover>
  );
}

export function Shell({
  defaultCollapsed,
  nav,
  children,
}: {
  defaultCollapsed: boolean;
  nav: ReactNode;
  children: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <AppShell
      defaultCollapsed={defaultCollapsed}
      // The server reads this cookie for `defaultCollapsed`, so the next page opens as it was left.
      onCollapsedChange={(collapsed) => {
        document.cookie = `flg-sidebar=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
      }}
      brand={
        <AppShellBrand asChild name="Lumen">
          <Link href="/shell" />
        </AppShellBrand>
      }
    >
      <AppShellHeader>
        <form role="search" action="/shell">
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
      <AppShellSidebar>{nav}</AppShellSidebar>
      <AppShellMain data-hydrated={hydrated ? '' : undefined}>{children}</AppShellMain>
      <AppShellFooter>© 2026 Lumen</AppShellFooter>
    </AppShell>
  );
}
