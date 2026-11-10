// The application of the AppShell stories: "Lumen", as the mockup draws it (phase-5-shell). Nothing here
// is a component of the library: the mockup's navigation and header widgets are neutral placeholders
// ("only to illustrate"), and the real ones are built by later plans. The stories are about the frame,
// so the placeholders are drawn by the CSS in this file, the way the mockup page draws them.
import type { ReactNode } from 'react';
import {
  AppShell,
  AppShellBrand,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  Avatar,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconButton,
} from '../src/index';
import type { AppShellProps } from '../src/index';
import { strokeIcon } from '../src/internal/icons';

const CSS = `
.demo-mark { display: block; width: 26px; height: 26px; border-radius: var(--flg-radius-md); background: var(--flg-accent-gradient); box-shadow: var(--flg-glow); }
.demo-spacer { flex: 1 1 auto; }
.demo-search { flex: none; width: 300px; max-width: 100%; margin-left: 4px; }
.demo-search > input::-webkit-search-cancel-button { display: none; }
.demo-kbd { flex: none; padding: 1px 6px; border: 1px solid var(--flg-control-border); border-radius: var(--flg-radius-xs); font: var(--flg-weight-medium) var(--flg-text-2xs)/1.4 var(--flg-font-sans); color: var(--flg-text-muted); }
.demo-avatar-button { border-radius: var(--flg-radius-full); }
.demo-avatar-button > .flg-avatar { --flg-avatar-size: 30px; }

.demo-nav { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 12px 12px 12px; }
.flg-app-shell-sidebar[role='dialog'] .demo-nav { padding-top: 8px; }
.demo-nav ul { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
.demo-item { appearance: none; box-sizing: border-box; width: 100%; margin: 0; border: 0; background: none; font: inherit; text-align: left; cursor: pointer; position: relative; display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 10px; border-radius: var(--flg-radius-md); color: var(--flg-text); text-decoration: none; font-size: var(--flg-text-sm); font-weight: var(--flg-weight-medium); white-space: nowrap; }
.demo-item > svg { flex: none; width: 18px; height: 18px; color: var(--flg-text-muted); }
.demo-item > svg.demo-chevron { width: 16px; height: 16px; }
.demo-item:hover, .demo-item[data-hover] { background: var(--flg-control-track); }
.demo-item[aria-current='page'] { background: var(--flg-accent-subtle); color: var(--flg-accent-text); font-weight: var(--flg-weight-semibold); }
.demo-item[aria-current='page'] > svg { color: currentColor; }
.demo-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.demo-item > .flg-badge { flex: none; }
.demo-child { height: 32px; padding-left: 38px; font-weight: var(--flg-weight-regular); }
.demo-sublist { margin-top: 2px; }
.demo-section { padding: 16px 10px 6px; font-size: var(--flg-text-2xs); font-weight: var(--flg-weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--flg-text-muted); }
.demo-nav .demo-nav-end { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--flg-control-border); }
.demo-dot { display: none; }
.demo-tip { position: fixed; z-index: 7; left: 78px; top: calc(100dvh - 32px); translate: 0 -50%; white-space: nowrap; pointer-events: none; }

/* The rail, as the mockup draws it: the sidebar column is narrower, so what is in it is only icons.
   Only on a wide screen: the sheet of a narrow one is never a rail, whatever "collapsed" says. */
@media (min-width: 1024px) {
  .flg-app-shell[data-collapsed] .demo-item { justify-content: center; gap: 0; height: 40px; padding: 0; }
  .flg-app-shell[data-collapsed] .demo-item > .demo-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .flg-app-shell[data-collapsed] .demo-item > .flg-badge,
  .flg-app-shell[data-collapsed] .demo-chevron,
  .flg-app-shell[data-collapsed] .demo-sublist { display: none; }
  .flg-app-shell[data-collapsed] .demo-section { height: 1px; margin: 10px 6px; padding: 0; overflow: hidden; font-size: 0; background: var(--flg-control-border); }
  .flg-app-shell[data-collapsed] .demo-dot { display: block; position: absolute; top: 8px; left: calc(50% + 5px); width: 8px; height: 8px; border-radius: 50%; background: var(--flg-danger-fill); box-shadow: 0 0 0 1.5px var(--flg-on-danger); }
  [data-flg-theme='light'] .flg-app-shell[data-collapsed] .demo-dot { box-shadow: 0 0 0 2px var(--flg-glass-tint-solid); }
}

.demo-page { display: flex; flex-direction: column; gap: 20px; }
.demo-title { margin: 0; font-size: 22px; font-weight: var(--flg-weight-semibold); line-height: 1.25; letter-spacing: -0.01em; }
.demo-lead { margin: 4px 0 0; color: var(--flg-text); font-size: var(--flg-text-sm); }
.demo-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.demo-cards > .flg-card, .demo-wide { gap: 12px; padding: 16px 18px; }
.demo-list { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; list-style: none; }
.demo-todo > li { display: flex; align-items: center; gap: 8px; }
.demo-todo > li::before { content: ''; flex: none; box-sizing: border-box; width: 13px; height: 13px; border-radius: 50%; border: 1.5px solid var(--flg-text-muted); }
.demo-messages > li { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--flg-text-muted); }
.demo-messages b, .demo-activity b { color: var(--flg-text); font-weight: var(--flg-weight-semibold); }
.demo-progress { display: flex; flex-direction: column; gap: 8px; }
.demo-progress-row { display: flex; justify-content: space-between; gap: 8px; }
.demo-bar { height: 6px; border-radius: var(--flg-radius-full); background: var(--flg-control-track); overflow: hidden; }
.demo-bar > i { display: block; width: 68%; height: 100%; border-radius: inherit; background: var(--flg-accent-gradient); }
.demo-activity { gap: 10px; }
.demo-activity > li { display: flex; align-items: center; gap: 10px; }
.demo-activity > li > span:nth-child(2) { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.demo-activity .demo-muted { flex: none; font-size: var(--flg-text-xs); }
.demo-filler { display: flex; flex-direction: column; align-items: flex-start; gap: 80px; margin: 0; padding: 0; list-style: none; }
@media (max-width: 767px) {
  .demo-cards { grid-template-columns: 1fr; gap: 12px; }
  /* A phone has the search as a button, as the mockup draws it, and not as a field. */
  .demo-search { display: none; }
}
@media (min-width: 768px) {
  .demo-search-button { display: none; }
}
`;

/** The CSS of the placeholders; every page of the stories carries it. */
export function DemoStyles() {
  return <style>{CSS}</style>;
}

type IconProps = { children: ReactNode; className?: string };
const Icon = ({ children, className }: IconProps) => (
  <svg {...strokeIcon} className={className}>
    {children}
  </svg>
);

const ICONS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M8 17v-3M13 17V9M18 17V5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
};

/** The brand of the mockup: the 26px gradient mark and the name. */
export function DemoBrand() {
  return (
    <AppShellBrand
      logo={<span className="demo-mark" />}
      name="Lumen"
      href="#home"
      onClick={(event) => event.preventDefault()}
    />
  );
}

const noJump = (event: { preventDefault: () => void }) => event.preventDefault();

function NavLink({
  icon,
  current = false,
  count,
  child = false,
  hover = false,
  children,
}: {
  icon?: keyof typeof ICONS;
  current?: boolean;
  count?: number;
  child?: boolean;
  /** The item the pointer is on in the look stories (see `DemoPage`). */
  hover?: boolean;
  children: string;
}) {
  return (
    <li>
      <a
        className={child ? 'demo-item demo-child' : 'demo-item'}
        href="#page"
        aria-current={current ? 'page' : undefined}
        data-visual-hover={hover ? '' : undefined}
        onClick={noJump}
      >
        {icon ? <Icon>{ICONS[icon]}</Icon> : null}
        <span className="demo-label">{children}</span>
        {count ? <Badge>{count}</Badge> : null}
        {count ? <i className="demo-dot" aria-hidden="true" /> : null}
      </a>
    </li>
  );
}

function NavGroup({
  icon,
  open = false,
  label,
  children,
}: {
  icon: keyof typeof ICONS;
  open?: boolean;
  label: string;
  children?: ReactNode;
}) {
  return (
    <li>
      <button type="button" className="demo-item" aria-expanded={open}>
        <Icon>{ICONS[icon]}</Icon>
        <span className="demo-label">{label}</span>
        <Icon className="demo-chevron">
          <path d={open ? 'm6 9 6 6 6-6' : 'm9 18 6-6-6-6'} />
        </Icon>
      </button>
      {open ? <ul className="demo-sublist">{children}</ul> : null}
    </li>
  );
}

/** The navigation of the mockup, drawn by the story's own CSS; Nav is a later plan. */
export function DemoNav({ hoverSettings = false }: { hoverSettings?: boolean }) {
  return (
    <nav className="demo-nav" aria-label="Main">
      <ul>
        <NavLink icon="home" current>
          Overview
        </NavLink>
        <NavLink icon="inbox" count={12}>
          Inbox
        </NavLink>
        <NavLink icon="calendar">Calendar</NavLink>
      </ul>
      <div className="demo-section">Projects</div>
      <ul>
        <NavGroup icon="folder" label="Design" open>
          <NavLink child>Design system</NavLink>
          <NavLink child>Mobile app</NavLink>
        </NavGroup>
        <NavGroup icon="folder" label="Engineering" />
      </ul>
      <div className="demo-section">Team</div>
      <ul>
        <NavLink icon="people">Members</NavLink>
        <NavLink icon="chart" count={3}>
          Reports
        </NavLink>
      </ul>
      <ul className="demo-nav-end">
        <NavLink icon="gear" hover={hoverSettings}>
          Settings
        </NavLink>
      </ul>
    </nav>
  );
}

/** What the mockup puts in the header besides the brand and the button that folds the sidebar. */
export function DemoHeaderContent() {
  return (
    <>
      <div className="flg-input demo-search">
        <span className="flg-input-adornment">
          <Icon>{ICONS.search}</Icon>
        </span>
        <input type="search" placeholder="Search…" aria-label="Search" />
        <kbd className="demo-kbd">⌘K</kbd>
      </div>
      <span className="demo-spacer" />
      <IconButton variant="ghost" aria-label="Search" className="demo-search-button">
        <Icon>{ICONS.search}</Icon>
      </IconButton>
      <IconButton variant="ghost" aria-label="Notifications">
        <Icon>{ICONS.bell}</Icon>
      </IconButton>
      <IconButton variant="ghost" aria-label="Theme">
        <Icon>{ICONS.sun}</Icon>
      </IconButton>
      <IconButton
        variant="ghost"
        aria-label="Account: Minh Anh Nguyen"
        className="demo-avatar-button"
      >
        <Avatar fallback="MA" alt="" />
      </IconButton>
    </>
  );
}

const PEOPLE = [
  { initials: 'PQ', name: 'Pham Quan', text: 'updated "Mobile app"', when: '10 minutes ago' },
  {
    initials: 'LH',
    name: 'Le Hoang',
    text: 'added 4 files to "Design system"',
    when: '1 hour ago',
  },
  { initials: 'TT', name: 'Tran Thu', text: 'created the report "Week 45"', when: 'Yesterday' },
];

/** The main content of the mockup: a title, three cards and a wide one. */
export function DemoContent({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-page">
      <div>
        <h1 className="demo-title">Overview</h1>
        <p className="demo-lead">Good morning, Minh Anh. Here is how today looks.</p>
      </div>
      <div className="demo-cards">
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>Today</h2>
            </CardTitle>
            <CardDescription>3 things to finish before 5 pm</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="demo-list demo-todo">
              <li>Review the new home page design</li>
              <li>Engineering sync at 2 pm</li>
              <li>Send the weekly report</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>Inbox</h2>
            </CardTitle>
            <CardDescription>12 unread messages</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="demo-list demo-messages">
              <li>
                <b>Le Hoang</b> The new design is ready
              </li>
              <li>
                <b>Tran Thu</b> Next week&apos;s schedule
              </li>
              <li>
                <b>Pham Quan</b> Notes for the mobile app
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>Project progress</h2>
            </CardTitle>
            <CardDescription>Design system</CardDescription>
          </CardHeader>
          <CardContent className="demo-progress">
            <div className="demo-progress-row">
              <span>34 of 50 tasks done</span>
              <b>68%</b>
            </div>
            <div className="demo-bar">
              <i />
            </div>
            <span style={{ color: 'var(--flg-text-muted)' }}>Due: 28 Nov 2026</span>
          </CardContent>
        </Card>
      </div>
      <Card className="demo-wide">
        <CardHeader>
          <CardTitle asChild>
            <h2>Recent activity</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="demo-list demo-activity">
            {PEOPLE.map((person) => (
              <li key={person.initials}>
                <Avatar fallback={person.initials} alt="" size="sm" />
                <span>
                  <b>{person.name}</b> {person.text}
                </span>
                <span className="demo-muted" style={{ color: 'var(--flg-text-muted)' }}>
                  {person.when}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {children}
    </div>
  );
}

/** The footer of the mockup. */
export function DemoFooter() {
  return (
    <>
      <span>© 2026 Lumen</span>
      <span aria-hidden="true">·</span>
      <a href="#terms" onClick={noJump}>
        Terms
      </a>
      <span aria-hidden="true">·</span>
      <a href="#help" onClick={noJump}>
        Help
      </a>
    </>
  );
}

/**
 * A column of buttons, each a screen apart, to make the page tall and to give the keyboard
 * something to go back to under the header.
 */
export function DemoRows({ count, step = 120 }: { count: number; step?: number }) {
  return (
    <ul className="demo-filler" style={{ gap: step - 34 }}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <button type="button" data-row={index + 1} style={{ height: 34 }}>
            Row {index + 1}
          </button>
        </li>
      ))}
    </ul>
  );
}

export interface DemoPageProps extends AppShellProps {
  /** Draws the footer. Default true. */
  footer?: boolean;
  /** Rows of buttons below the cards, to make the page scroll. */
  rows?: number;
  /** The header gets the brand cell and the widgets. Default true. */
  header?: boolean;
  /** Draws the sidebar with the navigation. Default true. */
  sidebar?: boolean;
  /** What a story puts in the sidebar after the navigation. */
  sidebarEnd?: ReactNode;
  /**
   * The pointer is on "Settings", with the tooltip the rail shows (the mockup's hovered icon). The
   * tooltip is drawn by the story, as Nav and its tooltip are a later plan: it is placed at the foot
   * of the rail, where "Settings" is when the sidebar is as tall as the window.
   */
  hoverSettings?: boolean;
}

/** The whole application of the mockup in an AppShell, in the order the docs recommend. */
export function DemoPage({
  footer = true,
  header = true,
  sidebar = true,
  sidebarEnd,
  rows = 0,
  hoverSettings = false,
  children,
  ...props
}: DemoPageProps) {
  return (
    <>
      <DemoStyles />
      <AppShell brand={<DemoBrand />} {...props}>
        {header ? (
          <AppShellHeader>
            <DemoHeaderContent />
          </AppShellHeader>
        ) : null}
        {sidebar ? (
          <AppShellSidebar>
            <DemoNav hoverSettings={hoverSettings} />
            {sidebarEnd}
          </AppShellSidebar>
        ) : null}
        <AppShellMain>
          <DemoContent>{rows > 0 ? <DemoRows count={rows} /> : null}</DemoContent>
          {children}
        </AppShellMain>
        {footer ? (
          <AppShellFooter>
            <DemoFooter />
          </AppShellFooter>
        ) : null}
        {hoverSettings ? (
          <div className="flg-tooltip demo-tip" aria-hidden="true">
            Settings
          </div>
        ) : null}
      </AppShell>
    </>
  );
}
