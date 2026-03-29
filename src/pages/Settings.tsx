import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, MONTHLY_INCOME, GOAL_TOTAL, formatINR } from "@/lib/data";
import { User, Bell, Save, Check, Loader2, MapPin, Briefcase } from "lucide-react";

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
      <div className="space-y-5 max-w-2xl mx-auto">

        {/* Profile */}
        <div
          className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-[#0F172A]">Profile</h3>
          </div>
          <div className="p-6">
            {/* Avatar row */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-lg">RS</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Rohan Sharma</p>
                <p className="text-xs text-slate-500 mt-0.5">Junior Software Engineer · Pune</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Age</span>
                </div>
                <p className="font-semibold text-[#0F172A]">25</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">City</span>
                </div>
                <p className="font-semibold text-[#0F172A]">Pune</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Role</span>
                </div>
                <p className="font-semibold text-[#0F172A]">Junior Software Engineer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Income & Goal */}
        <div
          className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#0F172A]">Income & Goals</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure your financial targets</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Monthly Income</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all tabular-nums"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Savings Goal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(parseInt(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Target Months</label>
                <input
                  type="number"
                  value={goalMonths}
                  onChange={(e) => setGoalMonths(parseInt(e.target.value) || 1)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Budgets */}
        <div
          className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#0F172A]">Category Budgets</h3>
            <p className="text-xs text-slate-500 mt-0.5">Drag sliders to adjust monthly limits</p>
          </div>
          <div className="p-6 space-y-5">
            {CATEGORIES.map((c) => {
              const sliderPct = c.budget > 0 ? (budgets[c.category] / (c.budget * 2)) * 100 : 50;
              return (
                <div key={c.category}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#0F172A]">{c.name}</span>
                    <span className="text-sm font-bold tabular-nums text-blue-600">{formatINR(budgets[c.category])}</span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-150 pointer-events-none"
                      style={{ width: `${sliderPct}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={c.budget * 2}
                      step={100}
                      value={budgets[c.category]}
                      onChange={(e) => setBudgets({ ...budgets, [c.category]: parseInt(e.target.value) })}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      style={{ margin: 0, height: "8px" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div
          className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-[#0F172A]">Notifications</h3>
          </div>
          <div className="px-6 divide-y divide-[#E2E8F0]">
            {([
              { key: "overshoot" as const, label: "Overshoot Alert", desc: "Notify when a category exceeds budget" },
              { key: "weekly" as const, label: "Weekly Summary", desc: "Get a weekly spending summary every Sunday" },
              { key: "milestone" as const, label: "Goal Milestone", desc: "Celebrate when you hit savings milestones" },
            ]).map(n => (
              <div key={n.key} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{n.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                </div>
                {/* Smooth toggle switch */}
                <button
                  role="switch"
                  aria-checked={notifications[n.key]}
                  onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key] })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    notifications[n.key] ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      notifications[n.key] ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] btn-shimmer ${
            saved
              ? "bg-emerald-500 text-white"
              : "bg-[#1A56DB] text-white hover:bg-blue-700 disabled:opacity-70"
          }`}
          style={{ boxShadow: "0 1px 3px rgba(26,86,219,0.3)" }}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved Successfully!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast-item flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Settings saved! Dashboard updated.</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}
