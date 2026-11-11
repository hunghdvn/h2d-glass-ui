// The header of the phase 5 look stories (the widgets of the header of the mockup phase-5-header): a
// strip drawn in the story, after the header strip of the mockup, one for each state, and an
// AppShell for the states that need the real header. The widgets that a story is not about are
// neutral placeholders, the same in every option, as the mockup draws them; a story puts the widget it
// is about in their place.
import type { CSSProperties, ReactNode, SVGProps } from 'react';
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
} from '../src/components/app-shell/AppShell';
import type { AppShellLayout } from '../src/components/app-shell/AppShell';
import { Avatar } from '../src/components/avatar/Avatar';
import { IconButton } from '../src/components/icon-button/IconButton';
import { Surface } from '../src/components/surface/Surface';
import { strokeIcon } from '../src/internal/icons';
import { DemoBrand, DemoContent, DemoNav, DemoStyles } from './app-shell-demo';
import { BellIcon } from './icons';

function Sun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function Menu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...strokeIcon} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

/** The avatar button of the mockup, until a story puts the real UserMenu in its place. */
const PLACEHOLDER_ACCOUNT = (
  <IconButton
    variant="ghost"
    aria-label="Account"
    style={{ borderRadius: 'var(--flg-radius-full)' }}
  >
    <Avatar alt="" fallback="MA" size="sm" />
  </IconButton>
);

/** The widgets at the end of the header: the bell, the theme, and the account, `account` or a placeholder. */
export function HeaderWidgets({ account = PLACEHOLDER_ACCOUNT }: { account?: ReactNode }) {
  return (
    <>
      <IconButton variant="ghost" aria-label="Notifications">
        <BellIcon />
      </IconButton>
      <IconButton variant="ghost" aria-label="Theme">
        <Sun />
      </IconButton>
      {account}
    </>
  );
}

const mark: CSSProperties = {
  flex: 'none',
  width: 22,
  height: 22,
  borderRadius: 'var(--flg-radius-xs)',
  background: 'var(--flg-accent-gradient)',
};

/**
 * A strip like the header strip of the mockup (a glass bar, 56px high, a menu button and the brand
 * at the start, the neutral widgets at the end), one for each state. Several bars cannot be a whole
 * AppShell each, so they are drawn as in the page of the mockup (spec phase 5 §7); the stories that
 * need the real header use an AppShell.
 */
export function Strip({
  caption,
  children,
  end,
  account,
}: {
  caption: string;
  /** What stands between the brand and the end cluster. */
  children?: ReactNode;
  /** What stands in the end cluster, before the widgets. */
  end?: ReactNode;
  /** What stands in the place of the avatar button, the last widget. */
  account?: ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 'var(--flg-text-xs)', color: 'var(--flg-text)' }}>{caption}</span>
      <Surface
        style={
          {
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: 56,
            minWidth: 0,
            padding: '0 10px 0 8px',
            boxSizing: 'border-box',
            '--flg-button-icon': '18px',
          } as CSSProperties
        }
      >
        <IconButton variant="ghost" aria-label="Open navigation">
          <Menu />
        </IconButton>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 10px 0 4px',
            font: 'var(--flg-weight-semibold) var(--flg-text-md)/1 var(--flg-font-sans)',
            color: 'var(--flg-text)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={mark} aria-hidden="true" />
          Lumen
        </span>
        {children}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          {end}
          <HeaderWidgets account={account} />
        </div>
      </Surface>
    </div>
  );
}

/** The column of strips of a look story: 640px, as the strips of the mockup. */
export const strips = { display: 'grid', gap: 14, width: 640 } as const;

/** An application with `header` in its header. S2 (`header`) keeps the brand in the header at every width. */
export const App = ({ header, layout }: { header: ReactNode; layout?: AppShellLayout }) => (
  <>
    <DemoStyles />
    <AppShell brand={<DemoBrand />} layout={layout}>
      <AppShellHeader>{header}</AppShellHeader>
      <AppShellSidebar>
        <DemoNav />
      </AppShellSidebar>
      <AppShellMain>
        <DemoContent />
      </AppShellMain>
    </AppShell>
  </>
);

/** The widgets that follow the search in the header, on the right: a cluster that has no `position`. */
export const End = ({ children, account }: { children?: ReactNode; account?: ReactNode }) => (
  // `minWidth: 0`: a wrapper is as wide as what is in it unless it may be narrower, and then the name
  // of a UserMenu cannot give way in a header that is too narrow.
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', minWidth: 0 }}>
    {children}
    <HeaderWidgets account={account} />
  </div>
);
