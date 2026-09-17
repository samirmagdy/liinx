import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as Sentry from '@sentry/react';

// Shield against third-party extension crashes (e.g. frame_start.js, IDM, adblockers)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.filename && (e.filename.includes('frame_start.js') || e.filename.includes('extension://'))) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
}

const sentryDsn = (import.meta as any).env?.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: (import.meta as any).env?.VITE_SENTRY_ENVIRONMENT || 'production',
    sendDefaultPii: false,
    tracesSampleRate: Number((import.meta as any).env?.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.05)
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
