/**
 * server/floorPlan.ts
 *
 * Floor plan API routes. The server is a pure storage layer — it reads and
 * writes JSON without inspecting plan contents deeply. All type validation
 * happens on the client.
 *
 * Routes:
 *   GET  /api/floor-plans/:storeId                          — load plan + versions
 *   POST /api/floor-plans/:storeId                          — save working plan
 *   POST /api/floor-plans/:storeId/versions                 — publish named version
 *   PATCH /api/floor-plans/:storeId/versions/:versionId     — set wentLiveAt date
 */

import { Router } from "express";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import {
  requireAuth,
  requireTier,
  type AuthRequest,
} from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data/floor-plans");

// ── Store allowlist (prevents arbitrary file paths) ───────────────────────────

const VALID_STORE_IDS = new Set([
  "pc-80237", "se-60039", "pc-80185",
  "pc-80634", "pc-80726", "pc-80783", "pc-80877",
]);

// ── File shape (lightweight — server doesn't inspect plan contents deeply) ────

interface PlanFile {
  plan: Record<string, unknown>;
  versions: Array<Record<string, unknown>>;
}

// ── Persistence helpers ───────────────────────────────────────────────────────

function planFilePath(storeId: string): string {
  return join(DATA_DIR, `${storeId}.json`);
}

function loadPlanFile(storeId: string): PlanFile {
  const filePath = planFilePath(storeId);
  if (!existsSync(filePath)) {
    return { plan: makeDefaultPlan(storeId), versions: [] };
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as PlanFile;
  } catch {
    return { plan: makeDefaultPlan(storeId), versions: [] };
  }
}

function savePlanFile(storeId: string, data: PlanFile): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(planFilePath(storeId), JSON.stringify(data, null, 2));
}

/**
 * Default plan returned when a store has no saved data yet.
 * Dimensions are placeholder values — admins set real dimensions in Layer 1.
 */
function makeDefaultPlan(storeId: string): Record<string, unknown> {
  return {
    storeId,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    baseLayout: {
      floorWidthFt: 80,
      floorHeightFt: 50,
      walls: [],
      rooms: [],
    },
    fixtures: [],
    merchandising: {
      colorMode: "gender",
      assignments: [],
    },
    cameras: [],
  };
}

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

// GET /api/floor-plans/:storeId — load current plan and version history
router.get("/floor-plans/:storeId", requireAuth, (req: AuthRequest, res) => {
  const { storeId } = req.params;
  if (!VALID_STORE_IDS.has(storeId)) {
    res.status(400).json({ error: "Invalid store ID" });
    return;
  }
  const file = loadPlanFile(storeId);
  res.json({ plan: file.plan, versions: file.versions });
});

// POST /api/floor-plans/:storeId — save (overwrite) the current working plan
router.post(
  "/floor-plans/:storeId",
  requireAuth,
  (req: AuthRequest, res) => {
    const { storeId } = req.params;
    if (!VALID_STORE_IDS.has(storeId)) {
      res.status(400).json({ error: "Invalid store ID" });
      return;
    }
    const incoming = req.body as Record<string, unknown>;
    if (!incoming || typeof incoming !== "object") {
      res.status(400).json({ error: "Invalid plan body" });
      return;
    }

    const file = loadPlanFile(storeId);
    const updated = {
      ...incoming,
      storeId,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user!.id,
    };
    file.plan = updated;
    savePlanFile(storeId, file);
    res.json({ ok: true, plan: updated });
  }
);

// POST /api/floor-plans/:storeId/versions — publish a named snapshot
router.post(
  "/floor-plans/:storeId/versions",
  requireAuth,
  requireTier("admin", "dm", "store_manager"),
  (req: AuthRequest, res) => {
    const { storeId } = req.params;
    if (!VALID_STORE_IDS.has(storeId)) {
      res.status(400).json({ error: "Invalid store ID" });
      return;
    }
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Version name is required" });
      return;
    }

    const file = loadPlanFile(storeId);
    const version: Record<string, unknown> = {
      id: randomUUID(),
      storeId,
      name: name.trim(),
      publishedAt: new Date().toISOString(),
      publishedBy: req.user!.id,
      wentLiveAt: null,
      plan: file.plan,  // snapshot of the current working plan
    };
    file.versions = [version, ...file.versions];
    savePlanFile(storeId, file);
    res.json({ ok: true, version });
  }
);

// PATCH /api/floor-plans/:storeId/versions/:versionId — mark a version as live
router.patch(
  "/floor-plans/:storeId/versions/:versionId",
  requireAuth,
  requireTier("admin", "dm", "store_manager"),
  (req: AuthRequest, res) => {
    const { storeId, versionId } = req.params;
    if (!VALID_STORE_IDS.has(storeId)) {
      res.status(400).json({ error: "Invalid store ID" });
      return;
    }
    const { wentLiveAt } = req.body as { wentLiveAt?: string };
    if (!wentLiveAt || typeof wentLiveAt !== "string") {
      res.status(400).json({ error: "wentLiveAt (ISO string) is required" });
      return;
    }

    const file = loadPlanFile(storeId);
    const idx = file.versions.findIndex(
      (v) => (v as Record<string, unknown>).id === versionId
    );
    if (idx === -1) {
      res.status(404).json({ error: "Version not found" });
      return;
    }
    (file.versions[idx] as Record<string, unknown>).wentLiveAt = wentLiveAt;
    savePlanFile(storeId, file);
    res.json({ ok: true, version: file.versions[idx] });
  }
);

export default router;
