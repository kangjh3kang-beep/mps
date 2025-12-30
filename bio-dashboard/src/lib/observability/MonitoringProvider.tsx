"use client";

/**
 * MonitoringProvider - Clean Architecture Wrapper
 * 
 * Encapsulates all monitoring and observability logic:
 * - Error Tracking (Sentry)
 * - User Analytics (PostHog)
 * - Live Chat Support
 * 
 * Usage in layout.tsx:
 *   <MonitoringProvider userId={session?.user?.id}>
 *     {children}
 *   </MonitoringProvider>
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";

import { CSPostHogProvider, analytics, posthog } from "./posthog-provider";
import { LiveChat } from "./live-chat";
import { logger } from "./logger";

interface MonitoringProviderProps {
  children: React.ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  const { data: session, status } = useSession();

  // Identify user across all monitoring tools when authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as { id?: string; email?: string; name?: string };
      const userId = user.id || user.email || "unknown";

      // Identify in Sentry
      logger.setUser({
        id: userId,
        email: user.email || undefined,
        name: user.name || undefined,
      });

      // Identify in PostHog
      analytics.identifyUser(userId, {
        email: user.email,
        name: user.name,
        source: "next-auth",
      });

      logger.info("User identified in monitoring systems", { userId });
    }

    // Clear user on logout
    if (status === "unauthenticated") {
      logger.clearUser();
      analytics.reset();
    }
  }, [session, status]);

  // Global error boundary enhancement
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.exception(
        event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason)),
        { type: "unhandledRejection" }
      );
    };

    const handleError = (event: ErrorEvent) => {
      logger.exception(event.error || new Error(event.message), {
        type: "globalError",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  // Get user context for live chat
  const user = session?.user as { id?: string; email?: string; name?: string } | undefined;
  const lastHealthScore = 87; // TODO: Get from user context/API

  return (
    <CSPostHogProvider>
      {children}
      
      {/* Live Chat - Only for authenticated users */}
      {status === "authenticated" && (
        <LiveChat
          userId={user?.id}
          userEmail={user?.email || undefined}
          userName={user?.name || undefined}
          lastHealthScore={lastHealthScore}
        />
      )}
    </CSPostHogProvider>
  );
}

// ============================================
// RE-EXPORTS for convenience
// ============================================

export { analytics, posthog } from "./posthog-provider";
export { logger } from "./logger";
export { LiveChat } from "./live-chat";

export default MonitoringProvider;

