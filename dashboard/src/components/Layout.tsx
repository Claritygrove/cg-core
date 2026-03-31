import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Plug, Store as StoreIcon, Settings, Home, Users, ChevronLeft, ChevronRight, Package, UserCheck, Sparkles, GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  const navigation = [
    { name: "Dashboard",    href: "/",             icon: LayoutDashboard },
    { name: "Store Info",   href: "/store-info",   icon: Home },
    { name: "Contact Info", href: "/contacts",     icon: Users },
    { name: "New Product Vendors", href: "/vendors", icon: Package },
    { name: "Training",     href: "/hr",           icon: UserCheck },
    { name: "Ask EV",       href: "/ask-ev",       icon: Sparkles       },
    { name: "EV University", href: "/ev-university", icon: GraduationCap },
    { name: "Business Plans", href: "/business-plans", icon: BookOpen },
    { name: "Integrations", href: "/integrations", icon: Plug },
  ];

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
              <h1 className="font-display font-bold text-sm leading-none tracking-wide">THE NEST</h1>
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

        {/* Settings */}
        <div className="p-2 border-t border-border/50 shrink-0">
          <button
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center w-full py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted/50 hover:text-foreground transition-all",
              collapsed ? "justify-center px-0" : "px-3 gap-2.5"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="min-h-full px-6 py-8 md:px-10 md:py-10 lg:px-14">
          {children}
        </div>
      </main>
    </div>
  );
}
