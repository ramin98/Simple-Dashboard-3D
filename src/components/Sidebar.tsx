import { Link, useLocation } from "wouter";
import { LayoutDashboard, Box, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Designers", icon: Users, href: "/designers" },
  { label: "3D Editor", icon: Box, href: "/editor" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col fixed left-0 top-0 z-30 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Box className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight">Studio 3D</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
