// A Server Component: it reads the cookie that the shell writes, so the sidebar is a rail from the
// first HTML when it was left folded, and it renders the navigation from data.
import { cookies } from 'next/headers';
import { ShellNav } from '../nav';
import { Shell } from '../shell';

export default async function ShellPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const collapsed = (await cookies()).get('flg-sidebar')?.value === 'collapsed';
  const path = ['/shell', ...slug].join('/');
  return (
    <Shell defaultCollapsed={collapsed} nav={<ShellNav path={path} />}>
      <h1>{slug.length > 0 ? slug.join(' / ') : 'Overview'}</h1>
      <p>The page of the application, rendered on the server.</p>
    </Shell>
  );
}
