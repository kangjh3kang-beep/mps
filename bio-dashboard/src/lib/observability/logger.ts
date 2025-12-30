/**
 * Production-Ready Logger Utility
 * 
 * - Development: Logs to console with colors
 * - Production: Sends errors to Sentry
 * 
 * Usage:
 *   import { logger } from '@/lib/observability/logger';
 *   logger.error('Something went wrong', { userId: '123' });
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === "development";

// Console colors for development
const colors = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m",  // Green
  warn: "\x1b[33m",  // Yellow
  error: "\x1b[31m", // Red
  reset: "\x1b[0m",
};

/**
 * Format log message for console
 */
function formatConsoleLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `${colors[level]}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}${contextStr}`;
}

/**
 * Log to console in development
 */
function logToConsole(level: LogLevel, message: string, context?: LogContext): void {
  const formattedMessage = formatConsoleLog(level, message, context);
  
  switch (level) {
    case "debug":
      console.debug(formattedMessage);
      break;
    case "info":
      console.info(formattedMessage);
      break;
    case "warn":
      console.warn(formattedMessage);
      break;
    case "error":
      console.error(formattedMessage);
      break;
  }
}

/**
 * Send to Sentry in production
 */
function logToSentry(level: LogLevel, message: string, context?: LogContext): void {
  if (level === "error") {
    Sentry.captureException(new Error(message), {
      level: "error",
      extra: context,
    });
  } else if (level === "warn") {
    Sentry.captureMessage(message, {
      level: "warning",
      extra: context,
    });
  } else {
    // For info/debug, use breadcrumbs instead of events
    Sentry.addBreadcrumb({
      category: "log",
      message,
      level: level === "info" ? "info" : "debug",
      data: context,
    });
  }
}

/**
 * Main Logger Object
 */
export const logger = {
  /**
   * Debug level - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      logToConsole("debug", message, context);
    }
  },

  /**
   * Info level - development console, production breadcrumb
   */
  info(message: string, context?: LogContext): void {
    if (isDev) {
      logToConsole("info", message, context);
    } else {
      logToSentry("info", message, context);
    }
  },

  /**
   * Warning level - console in dev, Sentry in prod
   */
  warn(message: string, context?: LogContext): void {
    if (isDev) {
      logToConsole("warn", message, context);
    } else {
      logToConsole("warn", message, context); // Also log locally
      logToSentry("warn", message, context);
    }
  },

  /**
   * Error level - console in dev, Sentry in prod
   */
  error(message: string, context?: LogContext): void {
    if (isDev) {
      logToConsole("error", message, context);
    } else {
      logToConsole("error", message, context); // Also log locally
      logToSentry("error", message, context);
    }
  },

  /**
   * Capture an exception with full stack trace
   */
  exception(error: Error, context?: LogContext): void {
    if (isDev) {
      console.error("[EXCEPTION]", error, context);
    } else {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  },

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; name?: string }): void {
    Sentry.setUser(user);
  },

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    Sentry.setUser(null);
  },

  /**
   * Add custom context to all future events
   */
  setContext(name: string, context: LogContext): void {
    Sentry.setContext(name, context);
  },

  /**
   * Add a breadcrumb for debugging
   */
  breadcrumb(message: string, category?: string, data?: LogContext): void {
    Sentry.addBreadcrumb({
      message,
      category: category || "custom",
      data,
      level: "info",
    });
  },
};

export default logger;

