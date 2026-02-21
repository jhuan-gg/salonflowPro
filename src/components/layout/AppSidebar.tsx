import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCog,
  History,
  Package,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Agenda", icon: Calendar, path: "/agenda" },
  { title: "Clientes", icon: Users, path: "/clientes" },
  { title: "Serviços", icon: Scissors, path: "/servicos" },
  { title: "Atendentes", icon: UserCog, path: "/atendentes" },
  { title: "Histórico", icon: History, path: "/historico" },
  // { title: "Materiais", icon: Package, path: "/materiais" },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Scissors className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg truncate">SalonFlow</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent w-full transition-colors"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          {!collapsed && <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-sidebar-accent w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sair</span>}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex justify-center text-sidebar-foreground/50"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
