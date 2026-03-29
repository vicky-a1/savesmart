import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GOAL_TOTAL, GOAL_SAVED_TOTAL, SAVINGS_TARGET, formatINR } from "@/lib/data";
import { Target, Calendar, TrendingUp, CheckCircle2, AlertTriangle, Clock, Plus, X, Trash2 } from "lucide-react";

const MONTHS_HISTORY = [
  { month: "Month 1", amount: 25000, target: 25000, status: "done" },
  { month: "Month 2", amount: 22000, target: 25000, status: "warning" },
  { month: "Month 3", amount: 0, target: 25000, status: "in_progress" },
];

const EMOJI_OPTIONS = ["🏍️","🏠","✈️","💻","📱","🎓","💍","🚗","🏋️","🎸","📷","🌏","💰","🏖️","🎯"];

interface Goal {
  id: string;
  emoji: string;
  name: string;
  targetAmount: number;
  targetMonths: number;
  savedAmount: number;
}

const DEFAULT_GOAL: Goal = {
  id: "bike",
  emoji: "🏍️",
  name: "Bike Goal",
  targetAmount: GOAL_TOTAL,
  targetMonths: 6,
  savedAmount: GOAL_SAVED_TOTAL,
};

function GoalRing({ pct, savedAmount }: { pct: number; savedAmount: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashFilled = (pct / 100) * circumference;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="#059669" strokeWidth="8"
          strokeDasharray={`${dashFilled} ${circumference - dashFilled}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: "drop-shadow(0 0 4px rgba(5,150,105,0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#0F172A] tabular-nums">{pct.toFixed(1)}%</span>
        <span className="text-xs text-slate-500 mt-0.5">{formatINR(savedAmount)}</span>
      </div>
    </div>
  );
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: string) => void }) {
  const [monthlyContrib, setMonthlyContrib] = useState(SAVINGS_TARGET);
  const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
  const remaining = goal.targetAmount - goal.savedAmount;
  const monthsNeeded = Math.ceil(remaining / monthlyContrib);
  const baseDate = new Date(2025, 2, 1);
  const projected = new Date(baseDate);
  projected.setMonth(projected.getMonth() + monthsNeeded);
  const projectedStr = projected.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const sliderPct = ((monthlyContrib - 5000) / (40000 - 5000)) * 100;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      {/* Card Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
            {goal.emoji}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">{goal.name}</h2>
            <p className="text-xs text-slate-500">Save {formatINR(goal.targetAmount)} in {goal.targetMonths} months</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Target className="w-3 h-3" /> Active
          </span>
          {goal.id !== "bike" && (
            <button
              onClick={() => onDelete(goal.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Delete goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Ring + Stats */}
      <div className="px-6 pb-5 flex flex-col sm:flex-row items-center gap-6">
        <GoalRing pct={pct} savedAmount={goal.savedAmount} />
        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-bold text-[#0F172A] tabular-nums">{formatINR(goal.savedAmount)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Saved</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-bold text-[#0F172A] tabular-nums">{formatINR(remaining)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Remaining</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-bold text-[#0F172A] tabular-nums">{monthsNeeded}m</p>
              <p className="text-xs text-slate-500 mt-0.5">To go</p>
            </div>
          </div>
          {/* Mini What-If */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-600">Monthly savings</span>
              <span className="text-sm font-bold tabular-nums text-[#1A56DB]">{formatINR(monthlyContrib)}</span>
            </div>
            <div className="relative h-1.5 bg-blue-100 rounded-full mb-2">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-150"
                style={{ width: `${sliderPct}%` }}
              />
              <input
                type="range" min={5000} max={40000} step={1000} value={monthlyContrib}
                onChange={(e) => setMonthlyContrib(parseInt(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ margin: 0, height: "6px" }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center">
              Projected: <span className="font-semibold text-[#1A56DB]">{projectedStr}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddGoalModal({ onAdd, onClose }: { onAdd: (g: Goal) => void; onClose: () => void }) {
  const [emoji, setEmoji] = useState("🎯");
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetMonths, setTargetMonths] = useState("6");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Goal name is required";
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) e.targetAmount = "Enter a valid amount";
    if (!targetMonths || isNaN(Number(targetMonths)) || Number(targetMonths) <= 0) e.targetMonths = "Enter valid months";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onAdd({
      id: `goal-${Date.now()}`,
      emoji,
      name: name.trim(),
      targetAmount: Number(targetAmount),
      targetMonths: Number(targetMonths),
      savedAmount: 0,
    });
    onClose();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-in-bottom"
          style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Add New Goal</h3>
              <p className="text-xs text-slate-500 mt-0.5">Set a new savings target to work towards</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Emoji Picker */}
          <div className="mb-5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-2">Choose Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    emoji === e
                      ? "bg-blue-100 ring-2 ring-blue-500 scale-110"
                      : "bg-slate-50 hover:bg-blue-50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Name */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Goal Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: "" }); }}
              placeholder="e.g. Emergency Fund, New Laptop..."
              className={`w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.name ? "border-red-400" : "border-[#E2E8F0]"}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Target Amount */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Target Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => { setTargetAmount(e.target.value); setErrors({ ...errors, targetAmount: "" }); }}
                  placeholder="50000"
                  className={`w-full h-10 pl-7 pr-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all tabular-nums ${errors.targetAmount ? "border-red-400" : "border-[#E2E8F0]"}`}
                />
              </div>
              {errors.targetAmount && <p className="text-xs text-red-500 mt-1">{errors.targetAmount}</p>}
            </div>
            {/* Target Months */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Target Months</label>
              <input
                type="number"
                value={targetMonths}
                onChange={(e) => { setTargetMonths(e.target.value); setErrors({ ...errors, targetMonths: "" }); }}
                placeholder="6"
                min="1"
                className={`w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.targetMonths ? "border-red-400" : "border-[#E2E8F0]"}`}
              />
              {errors.targetMonths && <p className="text-xs text-red-500 mt-1">{errors.targetMonths}</p>}
            </div>
          </div>

          {/* Preview */}
          {name && targetAmount && (
            <div className="mb-5 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Preview</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{name}</p>
                  <p className="text-xs text-slate-500">Save {formatINR(Number(targetAmount) || 0)} in {targetMonths} months · {formatINR(Math.ceil((Number(targetAmount) || 0) / Number(targetMonths)))}/mo</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-11 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ boxShadow: "0 1px 3px rgba(26,86,219,0.3)" }}
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([DEFAULT_GOAL]);
  const [showModal, setShowModal] = useState(false);

  const addGoal = (g: Goal) => setGoals((prev) => [...prev, g]);
  const deleteGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));

  return (
    <AppShell title="Goals">
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Your Goals</h2>
            <p className="text-sm text-slate-500 mt-0.5">{goals.length} active goal{goals.length !== 1 ? "s" : ""} · Track your savings targets</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-4 bg-[#1A56DB] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] btn-shimmer"
            style={{ boxShadow: "0 1px 3px rgba(26,86,219,0.3)" }}
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>

        {/* Goal Cards */}
        {goals.map((goal, idx) => (
          <div key={goal.id} className={`animate-slide-in-bottom stagger-${Math.min(idx + 1, 8)}`}>
            <GoalCard goal={goal} onDelete={deleteGoal} />
          </div>
        ))}

        {/* Monthly History */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <Calendar className="w-[18px] h-[18px] text-slate-400" />
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Monthly Contributions</h3>
              <p className="text-xs text-slate-500">Bike Goal · Month-by-month history</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {MONTHS_HISTORY.map((m, idx) => {
              const barPct = m.amount > 0 ? (m.amount / m.target) * 100 : 5;
              const barColor =
                m.status === "done" ? "bg-emerald-500" :
                m.status === "warning" ? "bg-amber-400" : "bg-blue-200";
              return (
                <div key={m.month} className={`animate-slide-in-left stagger-${idx + 1}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#0F172A]">{m.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-[#0F172A]">
                        {m.amount > 0 ? formatINR(m.amount) : "In Progress"}
                      </span>
                      {m.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {m.status === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {m.status === "in_progress" && <Clock className="w-4 h-4 text-blue-400" />}
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${barPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>₹0</span>
                    <span>{formatINR(m.target)} target</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global What-If */}
        <GlobalWhatIf />
      </div>

      {/* Add Goal Modal */}
      {showModal && <AddGoalModal onAdd={addGoal} onClose={() => setShowModal(false)} />}
    </AppShell>
  );
}

function GlobalWhatIf() {
  const [monthlyContrib, setMonthlyContrib] = useState(SAVINGS_TARGET);
  const remaining = GOAL_TOTAL - GOAL_SAVED_TOTAL;
  const monthsNeeded = Math.ceil(remaining / monthlyContrib);
  const baseDate = new Date(2025, 2, 1);
  const projected = new Date(baseDate);
  projected.setMonth(projected.getMonth() + monthsNeeded);
  const projectedStr = projected.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const sliderPct = ((monthlyContrib - 5000) / (40000 - 5000)) * 100;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
        <TrendingUp className="w-[18px] h-[18px] text-slate-400" />
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">What If Calculator</h3>
          <p className="text-xs text-slate-500">Drag to see how changing your monthly savings affects completion</p>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-600">Monthly Savings</span>
            <span className="text-xl font-bold tabular-nums text-[#1A56DB]">{formatINR(monthlyContrib)}</span>
          </div>
          <div className="relative pt-1">
            <div className="h-2 bg-slate-100 rounded-full relative">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-150"
                style={{ width: `${sliderPct}%` }}
              />
            </div>
            <input
              type="range" min={5000} max={40000} step={1000} value={monthlyContrib}
              onChange={(e) => setMonthlyContrib(parseInt(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-2 mt-0"
              style={{ margin: 0 }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>{formatINR(5000)}</span>
            <span>{formatINR(40000)}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center border border-blue-100">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Projected Completion</p>
          <p className="text-2xl font-bold text-[#1A56DB] tabular-nums">{projectedStr}</p>
          <p className="text-xs text-slate-500 mt-2">
            {monthsNeeded} months from now · {formatINR(monthlyContrib)}/month
          </p>
        </div>
      </div>
    </div>
  );
}
