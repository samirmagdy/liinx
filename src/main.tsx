import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as Sentry from '@sentry/react';

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
