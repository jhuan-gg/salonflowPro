import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  MoreHorizontal,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Agenda", icon: Calendar, path: "/agenda" },
  { title: "Clientes", icon: Users, path: "/clientes" },
  { title: "Serviços", icon: Scissors, path: "/servicos" },
  { title: "Mais", icon: MoreHorizontal, path: "/mais" },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
