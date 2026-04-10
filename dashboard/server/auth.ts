import { Router, Request, Response, NextFunction } from "express";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");
const USERS_FILE = join(DATA_DIR, "users.json");
const TOKENS_FILE = join(DATA_DIR, "reset-tokens.json");

const JWT_SECRET = process.env.JWT_SECRET ?? "core-dev-secret-change-in-prod";
const TOKEN_EXPIRY = "7d";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export type UserTier = "admin" | "dm" | "store_manager" | "standard";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  tier: UserTier;
  role: string;
  storeId?: string;
  wiwId?: string;
  createdBy: string;
  createdAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

interface ResetToken {
  token: string;
  userId: string;
  expiresAt: string; // ISO
  usedAt?: string;
}

// ── Persistence ───────────────────────────────────────────────────────────────

function loadUsers(): User[] {
  if (!existsSync(USERS_FILE)) return [];
  try { return JSON.parse(readFileSync(USERS_FILE, "utf-8")); }
  catch { return []; }
}

export function saveUsers(users: User[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getUserById(id: string): User | undefined {
  return loadUsers().find((u) => u.id === id);
}

function loadTokens(): ResetToken[] {
  if (!existsSync(TOKENS_FILE)) return [];
  try { return JSON.parse(readFileSync(TOKENS_FILE, "utf-8")); }
  catch { return []; }
}

function saveTokens(tokens: ResetToken[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

// ── Seed admin if no users exist ──────────────────────────────────────────────

async function seedAdminIfEmpty() {
  const users = loadUsers();
  if (users.length > 0) return;
  const hash = await bcrypt.hash("Admin@Core1", 10);
  const admin: User = {
    id: "admin-seed",
    email: "admin@eaglevco.com",
    passwordHash: hash,
    firstName: "Admin",
    lastName: "User",
    tier: "admin",
    role: "Administrator",
    createdBy: "system",
    createdAt: new Date().toISOString(),
  };
  saveUsers([admin]);
  console.log("Seeded default admin: admin@eaglevco.com / Admin@Core1");
}

seedAdminIfEmpty();

// ── Email ─────────────────────────────────────────────────────────────────────

function getMailer() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) return false;
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? "The Core <noreply@eaglevco.com>",
      to,
      subject: "Reset your Core password",
      text: `Hi ${name},\n\nSomeone requested a password reset for your Core account.\n\nClick here to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\n— Eagle V Corp`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Reset your password</h2>
          <p style="color:#666;margin-bottom:24px">Hi ${name}, someone requested a password reset for your Core account.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">Reset Password</a>
          <p style="color:#999;font-size:12px;margin-top:24px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          <p style="color:#999;font-size:12px">— Eagle V Corp</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("Failed to send reset email:", e);
    return false;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: PublicUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token =
    req.cookies?.core_token ??
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = getUserById(payload.userId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const { passwordHash: _, ...pub } = user;
    req.user = pub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireTier(...tiers: UserTier[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !tiers.includes(req.user.tier)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { res.status(401).json({ error: "Invalid credentials" }); return; }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.cookie("core_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
  });
  const { passwordHash: _, ...pub } = user;
  res.json({ user: pub, token });
});

// POST /api/auth/logout
router.post("/auth/logout", (_req, res) => {
  res.clearCookie("core_token");
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password  (requires login)
router.post("/auth/change-password", requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === req.user!.id);
  if (idx === -1) { res.status(404).json({ error: "User not found" }); return; }
  const ok = await bcrypt.compare(currentPassword, users[idx]!.passwordHash);
  if (!ok) { res.status(401).json({ error: "Current password is incorrect" }); return; }
  users[idx]!.passwordHash = await bcrypt.hash(newPassword, 10);
  saveUsers(users);
  res.json({ ok: true });
});

// POST /api/auth/forgot-password  (public — no login required)
// If SMTP is configured: sends email and returns { sent: true }
// If not:               returns { sent: false, resetUrl } so admin can copy/paste
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  // Always respond the same to avoid user enumeration
  if (!user) {
    res.json({ sent: true, message: "If that email exists, a reset link was sent." });
    return;
  }

  // Generate token (1 hour expiry)
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // Prune old tokens for this user, add new one
  const tokens = loadTokens().filter((t) => t.userId !== user.id || new Date(t.expiresAt) > new Date());
  tokens.push({ token: rawToken, userId: user.id, expiresAt });
  saveTokens(tokens);

  const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;
  const emailSent = await sendResetEmail(user.email, user.firstName, resetUrl);

  if (emailSent) {
    res.json({ sent: true, message: "Reset link sent to your email." });
  } else {
    // No SMTP — return the link so an admin can send it manually
    res.json({
      sent: false,
      resetUrl,
      message: "Email not configured. Copy this link and send it to the user.",
    });
  }
});

// GET /api/auth/validate-reset-token/:token  (public)
router.get("/auth/validate-reset-token/:token", (req, res) => {
  const tokens = loadTokens();
  const entry = tokens.find((t) => t.token === req.params.token);
  if (!entry || new Date(entry.expiresAt) < new Date() || entry.usedAt) {
    res.status(410).json({ valid: false, error: "Link is invalid or has expired." });
    return;
  }
  const user = getUserById(entry.userId);
  res.json({ valid: true, email: user?.email, firstName: user?.firstName });
});

// POST /api/auth/reset-password  (public)
router.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) {
    res.status(400).json({ error: "token and newPassword required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const tokens = loadTokens();
  const idx = tokens.findIndex((t) => t.token === token);
  const entry = tokens[idx];
  if (!entry || new Date(entry.expiresAt) < new Date() || entry.usedAt) {
    res.status(410).json({ error: "Link is invalid or has expired." });
    return;
  }

  const users = loadUsers();
  const uIdx = users.findIndex((u) => u.id === entry.userId);
  if (uIdx === -1) { res.status(404).json({ error: "User not found" }); return; }

  users[uIdx]!.passwordHash = await bcrypt.hash(newPassword, 10);
  saveUsers(users);

  // Mark token as used
  tokens[idx]!.usedAt = new Date().toISOString();
  saveTokens(tokens);

  res.json({ ok: true });
});

// POST /api/auth/admin-reset-link  (admin only — generate reset link for any user)
router.post("/auth/admin-reset-link", requireAuth, requireTier("admin", "dm"), async (req: AuthRequest, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  const user = getUserById(userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h for admin-generated

  const tokens = loadTokens().filter((t) => t.userId !== userId);
  tokens.push({ token: rawToken, userId, expiresAt });
  saveTokens(tokens);

  const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;
  res.json({ resetUrl, expiresAt });
});

export default router;
