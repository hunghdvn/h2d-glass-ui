import 'h2d-glass-ui/styles.css';
import { ThemeScript, Toaster } from 'h2d-glass-ui';
import type { ReactNode } from 'react';

export const metadata = { title: 'h2d-glass-ui Next.js fixture' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script changes an attribute of <html> before React hydrates it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
