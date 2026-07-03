import * as Sentry from '@sentry/react-native';
import { env } from './env';

// Crash and error reports. No personal data: no IPs, emails or names, and
// request bodies are never attached.
export function initSentry() {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.user) event.user = { id: event.user.id };
      if (event.request) delete event.request.data;
      return event;
    },
  });
}

export { Sentry };
