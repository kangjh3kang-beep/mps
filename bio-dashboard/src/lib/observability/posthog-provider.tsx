"use client";

/**
 * PostHog Analytics Provider
 * 
 * Privacy-first analytics for understanding user behavior.
 * Tracks pageviews and custom events for the Manpasik Flow.
 */

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

// Initialize PostHog
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    // Capture pageviews automatically
    capture_pageview: false, // We handle this manually for SPA
    capture_pageleave: true,
    // Privacy settings
    persistence: "localStorage+cookie",
    // Session recording (optional)
    disable_session_recording: process.env.NODE_ENV === "development",
    // Respect Do Not Track
    respect_dnt: true,
    // Performance
    autocapture: {
      dom_event_allowlist: ["click", "submit"],
      element_allowlist: ["button", "a", "input", "form"],
    },
  });
}

/**
 * PostHog Pageview Tracker
 * Tracks page views for SPA navigation
 */
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * PostHog Provider Component
 * Wraps the app to enable analytics
 */
export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  );
}

// ============================================
// CUSTOM EVENT TRACKING
// ============================================

/**
 * Track Manpasik-specific events
 */
export const analytics = {
  // Measurement events
  measurementStarted: (type: string) => {
    posthog.capture("measurement_started", {
      measurement_type: type,
      timestamp: new Date().toISOString(),
    });
  },

  measurementCompleted: (type: string, score: number) => {
    posthog.capture("measurement_completed", {
      measurement_type: type,
      health_score: score,
      timestamp: new Date().toISOString(),
    });
  },

  // Consultation events
  consultationBooked: (doctorId: string, specialty: string) => {
    posthog.capture("consultation_booked", {
      doctor_id: doctorId,
      specialty,
      timestamp: new Date().toISOString(),
    });
  },

  consultationCompleted: (sessionId: string, duration: number) => {
    posthog.capture("consultation_completed", {
      session_id: sessionId,
      duration_seconds: duration,
      timestamp: new Date().toISOString(),
    });
  },

  // E-commerce events
  productViewed: (productId: string, productName: string, price: number) => {
    posthog.capture("product_viewed", {
      product_id: productId,
      product_name: productName,
      price,
    });
  },

  productPurchased: (productId: string, quantity: number, total: number) => {
    posthog.capture("product_purchased", {
      product_id: productId,
      quantity,
      total_amount: total,
      currency: "KRW",
    });
  },

  // User identification
  identifyUser: (userId: string, traits?: Record<string, unknown>) => {
    posthog.identify(userId, traits);
  },

  // Reset on logout
  reset: () => {
    posthog.reset();
  },
};

export { posthog };

