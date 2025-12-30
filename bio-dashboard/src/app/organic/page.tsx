"use client";

import { OrganicDashboard } from "@/components/navigation/OrganicDashboard";
import { AppNavigation } from "@/components/navigation/AppNavigation";

/**
 * The Organic Dashboard - "My Daily Rhythm"
 * 
 * A simplified, intent-based home screen focusing on:
 * - Today's Health Score
 * - AI Mate Greeting
 * - Today's To-Do list with deep-links
 */
export default function OrganicPage() {
  return (
    <AppNavigation>
      <OrganicDashboard />
    </AppNavigation>
  );
}

