import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Plug, Store as StoreIcon, Home, ChevronLeft, ChevronRight,
  Package, UserCheck, Sparkles, GraduationCap, BookOpen, BarChart2,
  Users, Shield, LogOut, ChevronUp, KeyRound, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type UserTier } from "@/contexts/AuthContext";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

const TIER_LABELS: Record<UserTier, string> = {
  admin:         "Admin",
  dm:            "District Manager",
  store_manager: "Store Manager",
  standard:      "Standard User",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { user, logout, canAccess } = useAuth();

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  const navigation = [
    { name: "Dashboard",           href: "/",                icon: LayoutDashboard, always: true },
    { name: "Store Info",          href: "/store-info",      icon: Home,            always: true },
    { name: "Floor Plan",          href: "/floor-plan",      icon: Map,             always: true },
    { name: "Reports",             href: "/reports",         icon: BarChart2,       always: true },
    { name: "Contact Info",        href: "/contacts",        icon: Users,           always: true },
    { name: "New Product Vendors", href: "/vendors",         icon: Package,         always: true },
    { name: "Training",            href: "/hr",              icon: UserCheck,       always: true },
    { name: "Ask EV",              href: "/ask-ev",          icon: Sparkles,        always: true },
    { name: "EV University",       href: "/ev-university",   icon: GraduationCap,   always: true },
    { name: "Business Plans",      href: "/business-plans",  icon: BookOpen,        feature: "business_plans" as const },
    { name: "User Management",     href: "/users",           icon: Shield,          feature: "user_management" as const },
    { name: "Integrations",        href: "/integrations",    icon: Plug,            always: true },
  ].filter((item) => {
    if (item.always) return true;
    if (item.feature) return canAccess(item.feature);
    return true;
  });

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border/50 bg-card flex flex-col relative z-10 hidden md:flex transition-all duration-300 overflow-hidden shrink-0",
          collapsed ? "w-[60px]" : "w-64"
        )}
      >
        {/* Logo / header */}
        <div className={cn(
          "h-[60px] flex items-center border-b border-border/50 shrink-0 gap-2.5",
          collapsed ? "justify-center px-0" : "px-4"
        )}>
          {!collapsed && (
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <StoreIcon className="h-3.5 w-3.5 text-primary" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="font-display font-bold text-sm leading-none tracking-wide">THE CORE</h1>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">Eagle V Corp</span>
            </div>
          )}
          <button
            onClick={toggle}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0",
              collapsed ? "w-9 h-9" : "w-7 h-7"
            )}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group",
                  collapsed ? "justify-center px-0" : "px-3 gap-2.5",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="p-2 border-t border-border/50 shrink-0 relative">
            <button
              onClick={() => setUserMenuOpen((p) => !p)}
              title={collapsed ? `${user.firstName} ${user.lastName}` : undefined}
              className={cn(
                "flex items-center w-full py-2.5 text-sm rounded-lg hover:bg-muted/50 transition-all",
                collapsed ? "justify-center px-0" : "px-3 gap-2.5"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary uppercase">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[12px] font-semibold leading-none truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{TIER_LABELS[user.tier]}</p>
                  </div>
                  <ChevronUp className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", userMenuOpen ? "" : "rotate-180")} />
                </>
              )}
            </button>

            {/* Popup menu */}
            {userMenuOpen && !collapsed && (
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-card border border-border/60 rounded-xl shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-border/30">
                  <p className="text-[11px] font-semibold">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] text-muted-foreground">{user.role}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); setShowChangePassword(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Change Password
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-rose-400 hover:bg-rose-400/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="min-h-full px-6 py-8 md:px-10 md:py-10 lg:px-14">
          {children}
        </div>
      </main>
    </div>
  );
}
