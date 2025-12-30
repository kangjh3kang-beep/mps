#!/usr/bin/env node
/**
 * SBOM Generator (CycloneDX JSON)
 *
 * FDA submissions commonly require an SBOM. This script generates a lightweight CycloneDX
 * SBOM from package.json (+ package-lock.json when available for resolved versions).
 *
 * Usage:
 *   node scripts/generate-sbom.js
 *
 * Output:
 *   sbom/cyclonedx.json
 */

import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function readJson(p) {
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

function nowIso() {
  return new Date().toISOString();
}

function toPurlNpm(name, version) {
  // minimal purl for npm
  return `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`;
}

function componentOf(name, version, scope) {
  return {
    type: "library",
    name,
    version,
    scope,
    purl: toPurlNpm(name, version)
  };
}

function resolveVersionsFromLock(lock) {
  // Supports npm v9+ lockfile with "packages" map.
  const map = new Map();
  if (lock?.packages && typeof lock.packages === "object") {
    for (const [pkgPath, info] of Object.entries(lock.packages)) {
      if (!pkgPath.startsWith("node_modules/")) continue;
      const name = pkgPath.replace(/^node_modules\//, "");
      if (info && typeof info === "object" && typeof info.version === "string") {
        map.set(name, info.version);
      }
    }
  }
  // Fallback: dependencies tree
  if (lock?.dependencies && typeof lock.dependencies === "object") {
    for (const [name, info] of Object.entries(lock.dependencies)) {
      if (info && typeof info === "object" && typeof info.version === "string") {
        if (!map.has(name)) map.set(name, info.version);
      }
    }
  }
  return map;
}

async function main() {
  const pkgPath = path.join(root, "package.json");
  const lockPath = path.join(root, "package-lock.json");

  const pkg = await readJson(pkgPath);
  let lock = null;
  try {
    lock = await readJson(lockPath);
  } catch {
    // ok
  }

  const resolved = lock ? resolveVersionsFromLock(lock) : new Map();

  const deps = { ...(pkg.dependencies ?? {}) };
  const devDeps = { ...(pkg.devDependencies ?? {}) };

  const components = [];

  for (const [name, range] of Object.entries(deps)) {
    const version = resolved.get(name) ?? range;
    components.push(componentOf(name, version, "required"));
  }

  for (const [name, range] of Object.entries(devDeps)) {
    const version = resolved.get(name) ?? range;
    components.push(componentOf(name, version, "development"));
  }

  components.sort((a, b) => a.name.localeCompare(b.name));

  const sbom = {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    metadata: {
      timestamp: nowIso(),
      tools: [{ vendor: "Manpasik", name: "generate-sbom.js", version: "0.1" }],
      component: {
        type: "application",
        name: pkg.name ?? "app",
        version: pkg.version ?? "0.0.0"
      }
    },
    components
  };

  const outDir = path.join(root, "sbom");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "cyclonedx.json");
  await fs.writeFile(outPath, JSON.stringify(sbom, null, 2), "utf-8");
  console.log(`[SBOM] Written: ${outPath} (${components.length} components)`);
}

main().catch((e) => {
  console.error("[SBOM] Failed:", e);
  process.exit(1);
});







