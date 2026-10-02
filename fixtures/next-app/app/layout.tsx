import 'fl-glass-ui/styles.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'fl-glass-ui Next.js fixture' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
