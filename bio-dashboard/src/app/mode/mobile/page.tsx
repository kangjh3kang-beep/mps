"use client";

/**
 * Mobile Mode - Redirects to main page with mobile mode
 * 
 * The main page (/) already serves the mobile/smartphone experience.
 * This route exists for explicit mode selection and consistency.
 */

import { redirect } from "next/navigation";

export default function MobileModePage() {
  redirect("/");
}






