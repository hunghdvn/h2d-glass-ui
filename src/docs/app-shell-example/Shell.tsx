'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  AppShell,
  AppShellBrand,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  MenuItem,
  MenuSeparator,
  Nav,
  NavGroup,
  NavItem,
  NavSection,
  SearchField,
  ThemeSwitch,
  UserMenu,
} from '../../index';
import {
  CalendarIcon,
  ChartIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  LogOutIcon,
  PersonIcon,
  UsersIcon,
} from './icons';
import { ListNotifications } from './notifications';
import type { NotificationItem } from './notifications';

/**
 * The frame of the application "Lumen": the brand and the navigation, a header with the search, the
 * notifications, the theme and the account, the page, and a footer. It is a Client Component because
 * the notifications keep their own state here; the page (`children`) can be a Server Component.
 */
export function Shell({
  notifications,
  children,
}: {
  notifications: NotificationItem[];
  children: ReactNode;
}) {
  const [items, setItems] = useState(notifications);
  const markAllRead = () => setItems((all) => all.map((item) => ({ ...item, unread: false })));

  return (
    <AppShell
      brand={
        <AppShellBrand
          href="/"
          name="Lumen"
          logo={
            <span
              style={{
                display: 'block',
                width: 26,
                height: 26,
                borderRadius: 'var(--flg-radius-md)',
                background: 'var(--flg-accent-gradient)',
              }}
            />
          }
        />
      }
    >
      <AppShellHeader>
        <SearchField aria-label="Search" placeholder="Search…" shortcut="mod+k" />
        {/* The widgets stand at the end of the header: the header is a row, and this pushes them. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <ListNotifications items={items} onMarkAllRead={markAllRead} />
          <ThemeSwitch />
          <UserMenu
            name="Minh Anh Nguyen"
            description="minhanh@lumen.vn"
            avatar={{ fallback: 'MA' }}
          >
            <MenuItem icon={<PersonIcon />}>Profile</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<LogOutIcon />}>Log out</MenuItem>
          </UserMenu>
        </div>
      </AppShellHeader>
      <AppShellSidebar>
        <Nav aria-label="Main">
          <NavItem href="/" icon={<HomeIcon />} active>
            Overview
          </NavItem>
          <NavItem href="/inbox" icon={<InboxIcon />} badge={12}>
            Inbox
          </NavItem>
          <NavItem href="/calendar" icon={<CalendarIcon />}>
            Calendar
          </NavItem>
          <NavSection title="Projects">
            <NavGroup label="Design" icon={<FolderIcon />}>
              <NavItem href="/projects/design-system">Design system</NavItem>
              <NavItem href="/projects/mobile">Mobile app</NavItem>
            </NavGroup>
          </NavSection>
          <NavSection title="Team">
            <NavItem href="/team" icon={<UsersIcon />}>
              Members
            </NavItem>
            <NavItem href="/reports" icon={<ChartIcon />} badge={3}>
              Reports
            </NavItem>
          </NavSection>
        </Nav>
      </AppShellSidebar>
      <AppShellMain>{children}</AppShellMain>
      <AppShellFooter>© 2026 Lumen</AppShellFooter>
    </AppShell>
  );
}
