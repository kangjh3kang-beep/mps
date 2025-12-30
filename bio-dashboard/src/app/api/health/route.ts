import { NextResponse } from "next/server";

/**
 * Health Check Endpoint for Vercel/Load Balancer
 * 
 * Used for:
 * - Deployment verification
 * - Load balancer health checks
 * - Uptime monitoring
 */
export async function GET() {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "0.1.0",
    region: process.env.VERCEL_REGION || "unknown",
  };

  return NextResponse.json(healthCheck, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// Disable caching for health checks
export const dynamic = "force-dynamic";

