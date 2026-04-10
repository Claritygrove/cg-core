import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserTier = "admin" | "dm" | "store_manager" | "standard";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: UserTier;
  role: string;
  storeId?: string;
  wiwId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Permission helpers
  canAccess: (feature: Feature) => boolean;
}

// Features that have restricted access
export type Feature =
  | "business_plans"
  | "net_profit"
  | "all_stores"      // false for standard users (they see only their store)
  | "user_management";

const TIER_FEATURES: Record<UserTier, Feature[]> = {
  admin:         ["business_plans", "net_profit", "all_stores", "user_management"],
  dm:            ["all_stores", "user_management"],
  store_manager: ["all_stores", "user_management"],
  standard:      [],
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Login failed");
    }
    const data = await r.json() as { user: AuthUser };
    setUser(data.user);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }

  function canAccess(feature: Feature): boolean {
    if (!user) return false;
    return TIER_FEATURES[user.tier]?.includes(feature) ?? false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
