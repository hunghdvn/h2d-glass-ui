import 'h2d-glass-ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GridPage } from './GridPage';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <GridPage />
  </StrictMode>,
);
