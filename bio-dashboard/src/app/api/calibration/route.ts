import { NextResponse } from "next/server";

import type { CalibrationParameters } from "@/lib/cartridge";

/**
 * Cloud Calibration Lookup (Mock)
 *
 * GET /api/calibration?serial=CTG-2024-001-A001
 *
 * Returns calibration coefficients for a given cartridge serial number.
 * This is a mock server-side DB for the multi-path calibration workflow.
 */

const CLOUD_CAL_DB: Record<string, CalibrationParameters> = {
  "CTG-2024-001-A001": {
    sensitivityFactor: 1.034,
    offsetCorrection: 12.5,
    temperatureCoefficient: 0.015,
    batchCode: "CLOUD-CAL-A001"
  },
  "CTG-2024-001-A002": {
    sensitivityFactor: 1.028,
    offsetCorrection: 11.8,
    temperatureCoefficient: 0.014,
    batchCode: "CLOUD-CAL-A002"
  },
  "CTG-2024-002-B001": {
    sensitivityFactor: 1.041,
    offsetCorrection: 13.2,
    temperatureCoefficient: 0.016,
    batchCode: "CLOUD-CAL-B001"
  },
  "CTG-DEMO-001": {
    sensitivityFactor: 1.02,
    offsetCorrection: 12.0,
    temperatureCoefficient: 0.012,
    batchCode: "CLOUD-CAL-DEMO"
  }
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const serial = url.searchParams.get("serial")?.trim() ?? "";

  if (!serial) {
    return NextResponse.json({ error: "Missing serial" }, { status: 400 });
  }

  // Simulate network + lookup latency
  await new Promise((r) => setTimeout(r, 250));

  const calibration = CLOUD_CAL_DB[serial];
  if (!calibration) {
    return NextResponse.json({ error: "Calibration not found for serial" }, { status: 404 });
  }

  return NextResponse.json({
    serial,
    calibration
  });
}







