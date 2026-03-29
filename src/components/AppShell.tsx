import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, TrendingUp, Target, Settings, Wallet, Receipt } from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },
  { icon: Receipt, label: "Transactions", path: "/transactions" },
  { icon: Target, label: "Goals", path: "/goals" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-16 lg:w-56 bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-info flex items-center justify-center shrink-0">
          <Wallet className="w-[18px] h-[18px] text-white" />
        </div>
        <span className="text-base font-bold hidden lg:block">SaveSmart</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((l) => {
          const active = location.pathname === l.path;
          return (
            <button
              key={l.label}
              onClick={() => navigate(l.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
                ${active
                  ? "bg-info/10 text-info font-semibold"
                  : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
                }`}
            >
              <l.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="hidden lg:block">{l.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppHeader({ title, stressScore }: { title: string; stressScore: number }) {
  const stressColor = stressScore >= 70
    ? "bg-destructive/10 text-destructive"
    : stressScore >= 40
      ? "bg-warning/10 text-warning"
      : "bg-success/10 text-success";

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-[999px] text-xs font-medium uppercase tracking-wide ${stressColor}`}>
          Stress {stressScore}/100
        </div>
        <span className="text-sm text-muted-foreground">Hey Rohan 🔔</span>
      </div>
    </header>
  );
}

export function AppShell({ children, title, stressScore = 62 }: { children: ReactNode; title: string; stressScore?: number }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title={title} stressScore={stressScore} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
