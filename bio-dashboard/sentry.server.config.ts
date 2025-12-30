/**
 * Sentry Server-Side Configuration
 * 
 * This file configures Sentry for the Node.js server environment.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Filter out development errors
  beforeSend(event) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry Server] Event captured (dev mode):", event);
      return null;
    }
    return event;
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
  ],

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development",
});

