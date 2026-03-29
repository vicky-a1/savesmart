import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, TrendingUp, Target, Settings, Receipt, Bell } from "lucide-react";

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
    <aside className="sidebar-desktop w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[#E2E8F0]">
        <div className="w-8 h-8 rounded-lg bg-[#1A56DB] flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-[15px] font-bold text-[#0F172A] tracking-tight">SaveSmart</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                ${active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              style={{
                minHeight: "40px",
                paddingTop: "10px",
                paddingBottom: "10px",
                paddingRight: "12px",
                paddingLeft: active ? "9px" : "12px",
                borderLeft: active ? "3px solid #1A56DB" : "3px solid transparent",
              }}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-700 font-bold text-xs">RS</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] truncate">Rohan Sharma</p>
            <p className="text-xs text-slate-500">Month 3 of 6</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AppHeader({ title, stressScore }: { title: string; stressScore: number }) {
  const stressColor =
    stressScore >= 70
      ? "bg-red-50 text-red-600 border border-red-200"
      : stressScore >= 40
        ? "bg-amber-50 text-amber-600 border border-amber-200"
        : "bg-emerald-50 text-emerald-600 border border-emerald-200";

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-[#0F172A] tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${stressColor}`}>
          Stress {stressScore}/100
        </div>
        <button className="relative w-9 h-9 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors">
          <Bell className="w-[18px] h-[18px] text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-700 font-bold text-xs">RS</span>
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  title,
  stressScore = 62,
}: {
  children: ReactNode;
  title: string;
  stressScore?: number;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main area offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-[240px]">
        <AppHeader title={title} stressScore={stressScore} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 main-content-padded page-fade-in bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="bottom-tab-bar fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-40 justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                active ? "text-blue-600" : "text-slate-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
