---
'h2d-glass-ui': minor
---

Phase 5 of the roadmap: the frame of an application, and the widgets of its header.

- AppShell (with AppShellHeader, AppShellSidebar, AppShellMain, AppShellFooter,
  AppShellSidebarTrigger and AppShellBrand): a header, a sidebar, the page and a footer on one grid,
  laid out by CSS alone, so the HTML from the server is right at every width. `layout` puts the
  sidebar full height (`sidebar`) or under a full-width header (`header`). Wide, the sidebar is a
  column that folds into a rail (`collapsed`, `defaultCollapsed`, `onCollapsedChange`; keep it in a
  cookie and the server draws the rail from the first HTML); narrow, it is a sheet with a scrim,
  `inert` behind it, Esc and focus return. It has a skip link, and on a page that has one it keeps
  `scroll-padding-top` of `<html>` equal to the header and the margin of `<body>` at zero.
- Nav (with NavSection, NavItem and NavGroup): `pill` and `bar`. Items are links (`asChild` takes a
  router's `Link`), can show a count, and groups open from an active child. In a rail an item keeps
  its name and count, with a tooltip, and a group is a flyout.
- Indicator: a count, a dot or a status on the corner of what it wraps, in four statuses. The number
  is for the eyes: put it in the name of the button.
- SearchField: a field with a key hint, a clear button and `shortcut` (`/` or `mod+k`); with
  `collapsible` it rests as a button and opens over the header on a narrow screen.
- ThemeSwitch, ThemeMenuGroup and ThemeScript: a button that goes round Light, Dark and System, the
  same choice as three radio items for a menu, and a script for the `<head>` that sets the stored
  theme on `<html>` before the first paint. They share one `localStorage` key and follow other tabs.
- UserMenu: the avatar of the person signed in as a menu button, with a header that says who it is;
  `showName` adds their name.
- List gets `surface`, so a list can sit inside a panel that is already glass.
- Two new theme tokens: `--flg-indicator-accent` and `--flg-on-status`.

AppShellBrand and Indicator render in a Server Component, and so does ThemeScript. The other parts
are client components that take server-rendered children: a Server Component page can render the
whole frame, its navigation included.

There are no breaking changes.
