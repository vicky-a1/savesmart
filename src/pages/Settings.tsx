import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, MONTHLY_INCOME, GOAL_TOTAL, formatINR } from "@/lib/data";
import { User, Bell, Save, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [income, setIncome] = useState(MONTHLY_INCOME);
  const [goalAmount, setGoalAmount] = useState(GOAL_TOTAL);
  const [goalMonths, setGoalMonths] = useState(6);
  const [budgets, setBudgets] = useState(
    CATEGORIES.reduce((acc, c) => ({ ...acc, [c.category]: c.budget }), {} as Record<string, number>)
  );
  const [notifications, setNotifications] = useState({
    overshoot: true,
    weekly: true,
    milestone: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setToast(true);
      setTimeout(() => {
        setToast(false);
        navigate("/");
      }, 1200);
    }, 800);
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Profile */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <User className="w-[18px] h-[18px] text-muted-foreground" />
            Profile
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">Name</label>
              <p className="font-medium">Rohan Sharma</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">Age</label>
              <p className="font-medium">25</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">City</label>
              <p className="font-medium">Pune</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">Job</label>
              <p className="font-medium">Junior SWE</p>
            </div>
          </div>
        </div>

        {/* Income & Goal */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold mb-4">Income & Goals</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">Monthly Income</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-info/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">Savings Goal</label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-info/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">Target Months</label>
                <input
                  type="number"
                  value={goalMonths}
                  onChange={(e) => setGoalMonths(parseInt(e.target.value) || 1)}
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-info/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Budgets */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold mb-4">Category Budgets</h3>
          <div className="space-y-4">
            {CATEGORIES.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">{formatINR(budgets[c.category])}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={c.budget * 2}
                  step={100}
                  value={budgets[c.category]}
                  onChange={(e) => setBudgets({ ...budgets, [c.category]: parseInt(e.target.value) })}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-info"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
            Notifications
          </h3>
          <div className="space-y-3">
            {([
              { key: "overshoot" as const, label: "Overshoot Alert", desc: "Notify when a category exceeds budget" },
              { key: "weekly" as const, label: "Weekly Summary", desc: "Get a weekly spending summary" },
              { key: "milestone" as const, label: "Goal Milestone", desc: "Celebrate when you hit savings milestones" },
            ]).map(n => (
              <div key={n.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key] })}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                    notifications[n.key] ? "bg-info" : "bg-secondary"
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    notifications[n.key] ? "translate-x-[22px]" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full h-11 bg-info text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:bg-info/90 active:scale-[0.98] disabled:opacity-70"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-card border border-border border-l-4 border-l-success px-5 py-4 rounded-xl shadow-lg text-sm font-medium z-50 max-w-sm"
          style={{ animation: "slide-up 200ms ease-out" }}>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-success shrink-0" />
            <span>✅ Settings saved! Dashboard updated.</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}
