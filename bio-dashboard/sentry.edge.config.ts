/**
 * Sentry Edge Runtime Configuration
 * 
 * This file configures Sentry for Edge Functions (middleware, edge API routes).
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring (lower sample rate for edge)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Filter out development errors
  beforeSend(event) {
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development",
});

