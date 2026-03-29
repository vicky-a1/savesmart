import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, MONTHLY_INCOME, GOAL_TOTAL, formatINR } from "@/lib/data";
import { User, Bell, Save, Check, Loader2, MapPin, Briefcase, Plus, Trash2, X, Tag } from "lucide-react";

const CATEGORY_TYPES = ["Want", "Need", "Buffer"] as const;
type CategoryType = typeof CATEGORY_TYPES[number];

const TYPE_COLORS: Record<CategoryType, { bg: string; text: string; dot: string }> = {
  Want:   { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-400" },
  Need:   { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  Buffer: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
};

interface CustomCategory {
  id: string;
  name: string;
  type: CategoryType;
  budget: number;
}

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

  // Custom categories state
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [customBudgets, setCustomBudgets] = useState<Record<string, number>>({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<CategoryType>("Want");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [addCatErrors, setAddCatErrors] = useState<Record<string, string>>({});

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

  const validateNewCategory = () => {
    const e: Record<string, string> = {};
    if (!newCatName.trim()) e.name = "Name is required";
    if (!newCatBudget || isNaN(Number(newCatBudget)) || Number(newCatBudget) <= 0) e.budget = "Enter a valid budget";
    return e;
  };

  const handleAddCategory = () => {
    const e = validateNewCategory();
    if (Object.keys(e).length) { setAddCatErrors(e); return; }
    const id = `custom-${Date.now()}`;
    const budget = Number(newCatBudget);
    setCustomCategories((prev) => [...prev, { id, name: newCatName.trim(), type: newCatType, budget }]);
    setCustomBudgets((prev) => ({ ...prev, [id]: budget }));
    setNewCatName("");
    setNewCatBudget("");
    setNewCatType("Want");
    setAddCatErrors({});
    setShowAddCategory(false);
  };

  const handleDeleteCustomCategory = (id: string) => {
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    setCustomBudgets((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-5 max-w-2xl mx-auto">

        {/* Profile */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-[#0F172A]">Profile</h3>
          </div>
          <div className="p-6">
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Category Budgets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Adjust monthly limits for each category</p>
            </div>
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-1.5 h-8 px-3 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Category
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Existing categories */}
            {CATEGORIES.map((c) => {
              const max = c.budget * 2 || 2000;
              const sliderPct = (budgets[c.category] / max) * 100;
              const isOver = budgets[c.category] > c.budget;
              return (
                <div key={c.category}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#0F172A]">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                        {c.category === "rent" || c.category === "groceries" || c.category === "phone" ? "Need" :
                         c.category === "misc" ? "Buffer" : "Want"}
                      </span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${isOver ? "text-red-600" : "text-blue-600"}`}>
                      {formatINR(budgets[c.category])}
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-150 pointer-events-none ${isOver ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-blue-400 to-blue-600"}`}
                      style={{ width: `${Math.min(sliderPct, 100)}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={max}
                      step={100}
                      value={budgets[c.category]}
                      onChange={(e) => setBudgets({ ...budgets, [c.category]: parseInt(e.target.value) })}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      style={{ margin: 0, height: "8px" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>₹0</span>
                    <span>Max {formatINR(max)}</span>
                  </div>
                </div>
              );
            })}

            {/* Custom categories */}
            {customCategories.length > 0 && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Custom Categories
                </p>
                {customCategories.map((c) => {
                  const max = c.budget * 2 || 2000;
                  const val = customBudgets[c.id] ?? c.budget;
                  const sliderPct = (val / max) * 100;
                  const colors = TYPE_COLORS[c.type];
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#0F172A]">{c.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                            {c.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums text-blue-600">{formatINR(val)}</span>
                          <button
                            onClick={() => handleDeleteCustomCategory(c.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            aria-label={`Delete ${c.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="relative h-2 bg-slate-100 rounded-full">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-150 pointer-events-none"
                          style={{ width: `${Math.min(sliderPct, 100)}%` }}
                        />
                        <input
                          type="range"
                          min={0}
                          max={max}
                          step={100}
                          value={val}
                          onChange={(e) => setCustomBudgets({ ...customBudgets, [c.id]: parseInt(e.target.value) })}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          style={{ margin: 0, height: "8px" }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>₹0</span>
                        <span>Max {formatINR(max)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline Add Category Form */}
            {showAddCategory && (
              <div className="pt-4 border-t border-[#E2E8F0] animate-slide-in-bottom">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-blue-600" /> New Category
                    </p>
                    <button onClick={() => { setShowAddCategory(false); setAddCatErrors({}); }} className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Name */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Category Name</label>
                      <input
                        autoFocus
                        type="text"
                        value={newCatName}
                        onChange={(e) => { setNewCatName(e.target.value); setAddCatErrors({ ...addCatErrors, name: "" }); }}
                        placeholder="e.g. Medical, Subscriptions..."
                        className={`w-full h-9 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${addCatErrors.name ? "border-red-400" : "border-[#E2E8F0]"}`}
                      />
                      {addCatErrors.name && <p className="text-xs text-red-500 mt-1">{addCatErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Type */}
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Type</label>
                        <div className="flex gap-1.5">
                          {CATEGORY_TYPES.map((t) => {
                            const colors = TYPE_COLORS[t];
                            return (
                              <button
                                key={t}
                                onClick={() => setNewCatType(t)}
                                className={`flex-1 h-8 rounded-lg text-xs font-semibold border transition-all ${
                                  newCatType === t
                                    ? `${colors.bg} ${colors.text} border-current`
                                    : "bg-white text-slate-500 border-[#E2E8F0] hover:bg-slate-50"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Budget */}
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Monthly Budget</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input
                            type="number"
                            value={newCatBudget}
                            onChange={(e) => { setNewCatBudget(e.target.value); setAddCatErrors({ ...addCatErrors, budget: "" }); }}
                            placeholder="1000"
                            className={`w-full h-9 pl-6 pr-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all tabular-nums ${addCatErrors.budget ? "border-red-400" : "border-[#E2E8F0]"}`}
                          />
                        </div>
                        {addCatErrors.budget && <p className="text-xs text-red-500 mt-1">{addCatErrors.budget}</p>}
                      </div>
                    </div>

                    <button
                      onClick={handleAddCategory}
                      className="w-full h-9 bg-[#1A56DB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state for custom */}
            {customCategories.length === 0 && !showAddCategory && (
              <div className="pt-4 border-t border-[#E2E8F0] text-center py-4">
                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No custom categories yet.</p>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="text-xs text-blue-600 font-medium mt-1 hover:underline"
                >
                  + Add your first custom category
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
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
                <button
                  role="switch"
                  aria-checked={notifications[n.key]}
                  onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key] })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${notifications[n.key] ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${notifications[n.key] ? "translate-x-[22px]" : "translate-x-0.5"}`}
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
            saved ? "bg-emerald-500 text-white" : "bg-[#1A56DB] text-white hover:bg-blue-700 disabled:opacity-70"
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
