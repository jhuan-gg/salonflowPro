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
    // Alterações: 'bottom-4', 'left-4', 'right-4' para as margens
    // 'rounded-full' ou 'rounded-2xl' para o arredondamento
    // 'shadow-lg' para dar profundidade
    <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-card/90 backdrop-blur-lg border border-border rounded-3xl z-50 overflow-hidden">
      <div className="flex items-center justify-around h-16 px-5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium transition-all duration-300",
                isActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span className="leading-none">{item.title}</span>
            
            {/* Indicador visual opcional (pontinho embaixo) */}
            {/* <div className={cn("h-1 w-1 rounded-full mt-0.5 transition-all", isActive ? "bg-primary" : "bg-transparent")} /> */}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}