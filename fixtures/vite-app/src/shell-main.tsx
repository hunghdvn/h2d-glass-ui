import 'h2d-glass-ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ShellPage } from './ShellPage';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ShellPage />
  </StrictMode>,
);
