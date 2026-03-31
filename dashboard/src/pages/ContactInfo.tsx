import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Building2, Key, Eye, EyeOff, Hash, Pencil, Check, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactField {
  label: string;
  value: string;
  type?: "email" | "phone" | "text";
}

interface Contact {
  name: string;
  fields: ContactField[];
}

interface DirectorySection {
  heading: string;
  contacts: Contact[];
}

// ─── Default directory data ───────────────────────────────────────────────────
// Edit via the Edit button on the page — changes persist until page refresh.

const DEFAULT_DIRECTORY: DirectorySection[] = [
  {
    heading: "Owners",
    contacts: [
      {
        name: "Bob",
        fields: [
          { label: "Email", value: "bob@example.com", type: "email" },
          { label: "Email 2", value: "bob2@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Adam",
        fields: [
          { label: "Email", value: "adam@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
          { label: "Corporate", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Lori",
        fields: [
          { label: "Email", value: "lori@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Emily",
        fields: [
          { label: "Email", value: "emily@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
    ],
  },
  {
    heading: "District Managers",
    contacts: [
      {
        name: "Erin",
        fields: [
          { label: "Email", value: "erin@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Lyric",
        fields: [
          { label: "Email", value: "lyric@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
    ],
  },
  {
    heading: "Store Managers",
    contacts: [
      {
        name: "Nancy",
        fields: [
          { label: "Email", value: "nancy@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Kat",
        fields: [
          { label: "Email", value: "kat@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Kennedy",
        fields: [
          { label: "Email", value: "kennedy@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Kenzie",
        fields: [
          { label: "Email", value: "kenzie@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Shea",
        fields: [
          { label: "Email", value: "shea@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
    ],
  },
  {
    heading: "Assistant Managers",
    contacts: [
      {
        name: "Jadyn",
        fields: [
          { label: "Email", value: "jadyn@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
      {
        name: "Isaiah",
        fields: [
          { label: "Email", value: "isaiah@example.com", type: "email" },
          { label: "Cell", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
    ],
  },
  {
    heading: "Support / External",
    contacts: [
      {
        name: "Winmark Support Center",
        fields: [
          { label: "Email", value: "support@winmark.com", type: "email" },
          { label: "Phone", value: "(xxx) xxx-xxxx", type: "phone" },
        ],
      },
    ],
  },
];

// ─── Brand Advantage data ─────────────────────────────────────────────────────

interface BAEntry {
  storeId: string;
  storeName: string;
  username: string;
  password: string;
}

const DEFAULT_BA: BAEntry[] = [
  { storeId: "pc-80237", storeName: "PC Portage",      username: "placeholder", password: "placeholder" },
  { storeId: "se-60039", storeName: "SE Portage",      username: "placeholder", password: "placeholder" },
  { storeId: "pc-80185", storeName: "PC East Lansing", username: "placeholder", password: "placeholder" },
  { storeId: "pc-80634", storeName: "PC Jackson",      username: "placeholder", password: "placeholder" },
  { storeId: "pc-80726", storeName: "PC Ann Arbor",    username: "placeholder", password: "placeholder" },
  { storeId: "pc-80783", storeName: "PC Canton",       username: "placeholder", password: "placeholder" },
  { storeId: "pc-80877", storeName: "PC Novi",         username: "placeholder", password: "placeholder" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function FieldIcon({ type }: { type?: string }) {
  if (type === "email") return <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  if (type === "phone") return <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  return <span className="w-3.5 h-3.5 shrink-0" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContactInfo() {
  const [editMode, setEditMode] = useState(false);
  const [directory, setDirectory] = useState<DirectorySection[]>(
    () => JSON.parse(JSON.stringify(DEFAULT_DIRECTORY))
  );
  const [baEntries, setBaEntries] = useState<BAEntry[]>(
    () => JSON.parse(JSON.stringify(DEFAULT_BA))
  );

  // ── Reveal state for passwords (indexed by storeId) ──────────────────────
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const toggleReveal = (id: string) => setRevealed((r) => ({ ...r, [id]: !r[id] }));

  // ── Directory edit helpers ────────────────────────────────────────────────

  function updateContactName(si: number, ci: number, name: string) {
    setDirectory((d) => {
      const next = JSON.parse(JSON.stringify(d)) as DirectorySection[];
      next[si]!.contacts[ci]!.name = name;
      return next;
    });
  }

  function updateFieldLabel(si: number, ci: number, fi: number, label: string) {
    setDirectory((d) => {
      const next = JSON.parse(JSON.stringify(d)) as DirectorySection[];
      next[si]!.contacts[ci]!.fields[fi]!.label = label;
      return next;
    });
  }

  function updateFieldValue(si: number, ci: number, fi: number, value: string) {
    setDirectory((d) => {
      const next = JSON.parse(JSON.stringify(d)) as DirectorySection[];
      next[si]!.contacts[ci]!.fields[fi]!.value = value;
      return next;
    });
  }

  function deleteField(si: number, ci: number, fi: number) {
    setDirectory((d) => {
      const next = JSON.parse(JSON.stringify(d)) as DirectorySection[];
      next[si]!.contacts[ci]!.fields.splice(fi, 1);
      return next;
    });
  }

  function addField(si: number, ci: number) {
    setDirectory((d) => {
      const next = JSON.parse(JSON.stringify(d)) as DirectorySection[];
      next[si]!.contacts[ci]!.fields.push({ label: "Field", value: "", type: "text" });
      return next;
    });
  }

  function deleteContact(si: number, ci: number) {
    setDirectory((d) => {
      const next = JSON.parse(JSON.stringify(d)) as DirectorySection[];
      next[si]!.contacts.splice(ci, 1);
      return next;
    });
  }

  function addContact(si: number) {
    setDirectory((d) => {
      const next = JSON.parse(JSON.stringify(d)) as DirectorySection[];
      next[si]!.contacts.push({
        name: "New Person",
        fields: [
          { label: "Email", value: "", type: "email" },
          { label: "Cell", value: "", type: "phone" },
        ],
      });
      return next;
    });
  }

  // ── BA edit helpers ───────────────────────────────────────────────────────

  function updateBA(idx: number, key: "username" | "password", val: string) {
    setBaEntries((entries) => entries.map((e, i) => i === idx ? { ...e, [key]: val } : e));
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Contact Info</h1>
          </div>
          <p className="text-muted-foreground mt-1">Directory of key people and vendors.</p>
        </div>

        <button
          onClick={() => setEditMode((m) => !m)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 mt-1",
            editMode
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-muted text-muted-foreground hover:text-foreground border border-border/50"
          )}
        >
          {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editMode ? "Done" : "Edit"}
        </button>
      </div>

      {editMode && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5"
        >
          Edit mode — click any field to change it. Use + to add people or fields. Changes last until you refresh the page.
        </motion.div>
      )}

      {/* People sections */}
      {directory.map((section, si) => (
        <section key={section.heading}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">
              {section.heading}
            </h2>
            {editMode && (
              <button
                onClick={() => addContact(si)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Person
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence>
              {section.contacts.map((contact, ci) => (
                <motion.div
                  key={`${si}-${ci}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-3 px-4 rounded-xl bg-muted/30 border border-border/40 space-y-2"
                >
                  {/* Name */}
                  <div className="flex items-center justify-between gap-2">
                    {editMode ? (
                      <input
                        value={contact.name}
                        onChange={(e) => updateContactName(si, ci, e.target.value)}
                        className="font-semibold text-sm text-foreground bg-background border border-border rounded-md px-2 py-0.5 flex-1 outline-none focus:border-primary/50"
                      />
                    ) : (
                      <p className="font-semibold text-sm text-foreground">{contact.name}</p>
                    )}
                    {editMode && (
                      <button
                        onClick={() => deleteContact(si, ci)}
                        className="text-muted-foreground hover:text-rose-400 transition-colors shrink-0"
                        title="Remove person"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields */}
                  {contact.fields.map((field, fi) => (
                    <div key={fi} className={cn("flex items-center gap-2 text-sm", editMode && "flex-wrap")}>
                      {!editMode && <FieldIcon type={field.type} />}
                      {editMode ? (
                        <>
                          <input
                            value={field.label}
                            onChange={(e) => updateFieldLabel(si, ci, fi, e.target.value)}
                            className="text-muted-foreground text-xs w-20 shrink-0 bg-background border border-border rounded-md px-1.5 py-0.5 outline-none focus:border-primary/50"
                          />
                          <input
                            value={field.value}
                            onChange={(e) => updateFieldValue(si, ci, fi, e.target.value)}
                            className="flex-1 min-w-0 text-sm text-foreground bg-background border border-border rounded-md px-2 py-0.5 outline-none focus:border-primary/50"
                          />
                          <button
                            onClick={() => deleteField(si, ci, fi)}
                            className="text-muted-foreground hover:text-rose-400 transition-colors shrink-0"
                            title="Remove field"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground w-20 shrink-0 text-xs">{field.label}</span>
                          <span className="text-foreground">{field.value || "—"}</span>
                        </>
                      )}
                    </div>
                  ))}

                  {editMode && (
                    <button
                      onClick={() => addField(si, ci)}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors pt-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add field
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      ))}

      {/* Brand Advantage section */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">
          Brand Advantage
        </h2>
        <Card className="p-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              brandadvantage.winmark.com
              <a
                href="https://brandadvantage.winmark.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline ml-1 font-normal"
              >
                ↗ Open
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {baEntries.map((entry, idx) => (
                <div key={entry.storeId} className="py-3 px-4 rounded-xl bg-muted/30 border border-border/40 space-y-2">
                  {/* Store label */}
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="font-semibold text-sm text-foreground">{entry.storeName}</p>
                    <span className="text-xs text-muted-foreground font-mono">#{entry.storeId.split("-")[1]}</span>
                  </div>

                  {/* Username */}
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0" />
                    <span className="text-muted-foreground w-20 shrink-0 text-xs">Username</span>
                    {editMode ? (
                      <input
                        value={entry.username}
                        onChange={(e) => updateBA(idx, "username", e.target.value)}
                        className="font-mono text-foreground text-xs flex-1 bg-background border border-border rounded-md px-2 py-0.5 outline-none focus:border-primary/50"
                      />
                    ) : (
                      <span className="font-mono text-foreground text-xs">{entry.username}</span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0" />
                    <span className="text-muted-foreground w-20 shrink-0 text-xs">Password</span>
                    {editMode ? (
                      <input
                        value={entry.password}
                        onChange={(e) => updateBA(idx, "password", e.target.value)}
                        className="font-mono text-foreground text-xs flex-1 bg-background border border-border rounded-md px-2 py-0.5 outline-none focus:border-primary/50"
                      />
                    ) : (
                      <>
                        <span className="font-mono text-foreground text-xs">
                          {revealed[entry.storeId] ? entry.password : "••••••••"}
                        </span>
                        <button
                          onClick={() => toggleReveal(entry.storeId)}
                          className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                          title={revealed[entry.storeId] ? "Hide" : "Show"}
                        >
                          {revealed[entry.storeId]
                            ? <EyeOff className="h-3.5 w-3.5" />
                            : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
