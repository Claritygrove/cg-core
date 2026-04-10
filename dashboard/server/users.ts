import { Router } from "express";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { requireAuth, requireTier, type AuthRequest, type User, type UserTier, type PublicUser } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");
const USERS_FILE = join(DATA_DIR, "users.json");

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadUsers(): User[] {
  if (!existsSync(USERS_FILE)) return [];
  try { return JSON.parse(readFileSync(USERS_FILE, "utf-8")); }
  catch { return []; }
}

function saveUsers(users: User[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function toPublic(u: User): PublicUser {
  const { passwordHash: _, ...pub } = u;
  return pub;
}

// Who can create which tiers
const CAN_CREATE: Record<UserTier, UserTier[]> = {
  admin:         ["admin", "dm", "store_manager", "standard"],
  dm:            ["store_manager", "standard"],
  store_manager: ["standard"],
  standard:      [],
};

const router = Router();

// GET /api/users — list all users (admin/dm/sm only)
router.get("/users", requireAuth, requireTier("admin", "dm", "store_manager"), (req: AuthRequest, res) => {
  const users = loadUsers();
  const me = req.user!;

  let visible = users;
  // DMs and store managers only see users at their tier and below
  if (me.tier === "store_manager") {
    visible = users.filter((u) => u.tier === "standard" || u.id === me.id);
  } else if (me.tier === "dm") {
    visible = users.filter((u) => ["store_manager", "standard"].includes(u.tier) || u.id === me.id);
  }
  res.json({ users: visible.map(toPublic) });
});

// POST /api/users — create a user
router.post("/users", requireAuth, async (req: AuthRequest, res) => {
  const me = req.user!;
  const { email, password, firstName, lastName, tier, role, storeId, wiwId } = req.body as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tier: UserTier;
    role: string;
    storeId?: string;
    wiwId?: string;
  };

  if (!email || !password || !firstName || !lastName || !tier || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const allowed = CAN_CREATE[me.tier] ?? [];
  if (!allowed.includes(tier)) {
    res.status(403).json({ error: `Your tier cannot create ${tier} users` });
    return;
  }

  const users = loadUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: uid(),
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    tier,
    role,
    storeId: tier === "standard" ? storeId : undefined,
    wiwId,
    createdBy: me.id,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  res.json({ user: toPublic(newUser) });
});

// PATCH /api/users/:id — update user (tier, role, storeId, name)
router.patch("/users/:id", requireAuth, async (req: AuthRequest, res) => {
  const me = req.user!;
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "User not found" }); return; }

  const target = users[idx]!;
  // Can only edit users you could create, or yourself (password only)
  const allowed = CAN_CREATE[me.tier] ?? [];
  const isSelf = me.id === target.id;
  if (!isSelf && !allowed.includes(target.tier)) {
    res.status(403).json({ error: "Insufficient permissions to edit this user" });
    return;
  }

  const { firstName, lastName, tier, role, storeId, password } = req.body as {
    firstName?: string;
    lastName?: string;
    tier?: UserTier;
    role?: string;
    storeId?: string;
    password?: string;
  };

  if (firstName)  target.firstName = firstName;
  if (lastName)   target.lastName  = lastName;
  if (role)       target.role      = role;
  if (storeId !== undefined) target.storeId = storeId;

  // Only admin can change tiers
  if (tier && me.tier === "admin") target.tier = tier;

  if (password) {
    target.passwordHash = await bcrypt.hash(password, 10);
  }

  users[idx] = target;
  saveUsers(users);
  res.json({ user: toPublic(target) });
});

// DELETE /api/users/:id
router.delete("/users/:id", requireAuth, (req: AuthRequest, res) => {
  const me = req.user!;
  const users = loadUsers();
  const target = users.find((u) => u.id === req.params.id);
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  const allowed = CAN_CREATE[me.tier] ?? [];
  if (!allowed.includes(target.tier)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  if (target.id === me.id) {
    res.status(400).json({ error: "Cannot delete yourself" });
    return;
  }

  saveUsers(users.filter((u) => u.id !== req.params.id));
  res.json({ ok: true });
});

// GET /api/wiw/employees — fetch employees from When I Work API
router.get("/wiw/employees", requireAuth, requireTier("admin", "dm"), async (_req, res) => {
  const apiKey = process.env.WIW_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "WIW_API_KEY not configured", employees: [] });
    return;
  }
  try {
    const resp = await fetch("https://api.wheniwork.com/2/users", {
      headers: { "W-Token": apiKey, "Content-Type": "application/json" },
    });
    if (!resp.ok) {
      res.status(502).json({ error: `WIW API error: ${resp.status}`, employees: [] });
      return;
    }
    const data = await resp.json() as { users?: { id: number; first_name: string; last_name: string; email: string; role: number }[] };
    const employees = (data.users ?? []).map((u) => ({
      wiwId: String(u.id),
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role === 1 ? "Manager" : "Employee",
    }));
    res.json({ employees });
  } catch (e) {
    res.status(502).json({ error: "Failed to reach WIW API", employees: [] });
  }
});

export default router;
