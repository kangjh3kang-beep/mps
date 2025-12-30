/**
 * Sentry Client-Side Configuration
 * 
 * This file configures Sentry for the browser environment.
 * Includes Session Replay for video-like debugging.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay Configuration
  // Records last 30 seconds before crash for video-like debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% when error occurs

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and input for privacy
      maskAllText: false,
      maskAllInputs: true,
      // Block sensitive elements
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration({
      // Track navigation
      enableInp: true,
    }),
  ],

  // Filter out development errors
  beforeSend(event) {
    // Don't send errors in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry] Event captured (dev mode):", event);
      return null;
    }
    return event;
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    // Network errors
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // User-caused errors
    "ResizeObserver loop",
    // Third-party script errors
    /^Script error\.?$/,
  ],

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development",
});

