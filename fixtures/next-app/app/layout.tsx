import 'h2d-glass-ui/styles.css';
import { Toaster } from 'h2d-glass-ui';
import type { ReactNode } from 'react';

export const metadata = { title: 'h2d-glass-ui Next.js fixture' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
