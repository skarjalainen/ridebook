import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import order matters: Mantine's layers must be registered before MapLibre's
// plain stylesheet, and app overrides come last.
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/global.css';

import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router/AppRouter';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
