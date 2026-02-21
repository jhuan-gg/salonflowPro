import { AppLayout } from "@/components/layout/AppLayout";
import { UserCog, History, Package, Sun, Moon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Atendentes", icon: UserCog, path: "/atendentes" },
  { title: "Histórico", icon: History, path: "/historico" },
  // { title: "Materiais", icon: Package, path: "/materiais" },
];

export default function Mais() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-4 animate-fade-in">
        <h1 className="text-2xl font-display font-bold">Mais</h1>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <span className="font-medium">{item.title}</span>
            </button>
          ))}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            {theme === "light" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <span className="font-medium">{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="font-medium text-destructive">Sair</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
