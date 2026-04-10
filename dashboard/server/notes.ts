import { Router } from "express";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");
const NOTES_FILE = join(DATA_DIR, "store-notes.json");

function loadNotes(): Record<string, string[]> {
  if (!existsSync(NOTES_FILE)) return {};
  try {
    return JSON.parse(readFileSync(NOTES_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveNotes(data: Record<string, string[]>) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2));
}

const router = Router();

// GET /api/stores/:storeId/notes
router.get("/stores/:storeId/notes", (req, res) => {
  const notes = loadNotes();
  res.json({ notes: notes[req.params.storeId] ?? [] });
});

// POST /api/stores/:storeId/notes  — body: { notes: string[] }
router.post("/stores/:storeId/notes", (req, res) => {
  const { notes } = req.body as { notes: string[] };
  if (!Array.isArray(notes)) {
    res.status(400).json({ error: "notes must be an array" });
    return;
  }
  const all = loadNotes();
  all[req.params.storeId] = notes;
  saveNotes(all);
  res.json({ ok: true });
});

export default router;
