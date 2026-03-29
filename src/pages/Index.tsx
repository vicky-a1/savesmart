import { useState, useEffect, useRef, useCallback } from "react";
import {
  Zap, ChevronDown, ChevronUp, Check, AlertTriangle, Loader2, Plus,
  Target, PiggyBank, Gauge, Shield, Rocket, Wallet, ArrowUpRight,
  ArrowDownRight, Activity, X, ToggleLeft, Info, Star, Flame, RocketIcon,
  Bot, RotateCcw, Eye
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { AppShell } from "@/components/AppShell";
import {
  CATEGORIES, TRANSACTIONS, formatINR, MONTHLY_INCOME, SAVINGS_TARGET,
  GOAL_TOTAL, GOAL_SAVED_TOTAL, getBaseSpent, type CategoryData, type Transaction
} from "@/lib/data";

// ─── TYPES ───
type AppPhase = "INITIAL" | "LOADING" | "SHOCK" | "RECOVERED";

interface Scenario {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  difficulty: string;
  actions: string[];
  recovery_amount: number;
  timeframe: string;
  feasibility: number;
  impact: number;
  recommended: boolean;
  why: string;
}

interface AgentResponse {
  gap: number;
  canSave: number;
  totalSpent: number;
  remaining: number;
  status: string;
  reasoning_steps: { step: number; text: string; status: string }[];
  scenarios: Scenario[];
  recommendation: string;
  agentNote: string;
}

interface ExpenseFormData {
  amount: string;
  category: string;
  note: string;
}

// ─── MOCK AGENT ───
function runSaveSmartAgent(expenseAmount: number, expenseCategory: string, expenseNote: string): AgentResponse {
  const totalSpent = 23726 + expenseAmount;
  const remaining = 45000 - totalSpent;
  const canSave = Math.max(0, remaining);
  const gap = 25000 - canSave;

  return {
    gap,
    canSave,
    totalSpent,
    remaining,
    status: gap > 0 ? "at_risk" : "on_track",
    reasoning_steps: [
      { step: 1, text: `Budget state parsed — income ₹45,000, 18 transactions loaded`, status: "done" },
      { step: 2, text: `Surplus calculated — ₹${remaining.toLocaleString("en-IN")} remaining after ₹${totalSpent.toLocaleString("en-IN")} total spend`, status: "done" },
      { step: 3, text: `Severity classified — ${gap > 5000 ? "HIGH" : gap > 0 ? "MEDIUM" : "LOW"} (savings gap: ₹${gap.toLocaleString("en-IN")})`, status: "done" },
      { step: 4, text: "Wants categories audited — Dining Out ₹600 left, Misc buffer ₹1,320 available, April wants pre-commitable", status: "done" },
      { step: 5, text: "3 trade-off scenarios generated across Aggressive / Balanced / Conservative axes", status: "done" },
      { step: 6, text: "Scenarios ranked by composite score: Impact × Feasibility — Balanced Cut scores highest", status: "done" },
    ],
    scenarios: [
      {
        id: "A",
        name: "The Balanced Cut",
        tag: "⭐ RECOMMENDED",
        tagColor: "blue",
        difficulty: "Medium",
        actions: [
          "Cap dining out at ₹300 for rest of March",
          "No more shopping this month",
          "Use full miscellaneous buffer (₹1,320)",
          "Pre-commit: reduce April wants budget by ₹3,000",
        ],
        recovery_amount: 4620,
        timeframe: "This month + April",
        feasibility: 9,
        impact: 8,
        recommended: true,
        why: "Spreads the recovery across 2 months. Minimal lifestyle disruption. Most realistic for a first-job earner.",
      },
      {
        id: "B",
        name: "The Monk Mode",
        tag: "🔥 AGGRESSIVE",
        tagColor: "red",
        difficulty: "High",
        actions: [
          "Zero dining out for rest of March",
          "Skip all entertainment this month",
          "Use full miscellaneous buffer (₹1,320)",
          "No discretionary spending until April 1",
        ],
        recovery_amount: 1920,
        timeframe: "10 days",
        feasibility: 7,
        impact: 6,
        recommended: false,
        why: "Maximum sacrifice this month. Hard to sustain but fully within March timeline.",
      },
      {
        id: "C",
        name: "The Stretch Goal",
        tag: "🚀 AMBITIOUS",
        tagColor: "purple",
        difficulty: "High",
        actions: [
          "All cuts from Monk Mode",
          "Take 2 freelance gigs this weekend",
          "Target ₹3,000–₹5,000 additional income",
          "Fully closes gap if freelance pays off",
        ],
        recovery_amount: 6920,
        timeframe: "2–3 weeks",
        feasibility: 6,
        impact: 10,
        recommended: false,
        why: "Highest upside. Risky — depends on freelance work materialising. Best if Rohan has existing clients.",
      },
    ],
    recommendation:
      "Go with The Balanced Cut — it recovers ₹4,620 across this month and April without destroying your lifestyle. You've done harder months before, Rohan. Lock it in.",
    agentNote:
      "2 categories already over budget (Entertainment, Shopping). Even without this emergency, you were at risk. This plan also course-corrects your overall month.",
  };
}

// ─── ANIMATED NUMBER ───
function AnimatedNumber({ value, prefix = "₹" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const diff = value - start;
    const duration = 500;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);

  return (
    <span className="tabular-nums">
      {display < 0 ? "-" : ""}
      {prefix}
      {Math.abs(display).toLocaleString("en-IN")}
    </span>
  );
}

// ─── CATEGORY DRAWER ───
function CategoryDrawer({ cat, onClose }: { cat: CategoryData; onClose: () => void }) {
  const transactions = TRANSACTIONS.filter((t) => t.category === cat.category);
  const [essential, setEssential] = useState(
    ["rent", "groceries", "transport", "phone"].includes(cat.category)
  );
  const Icon = cat.icon;
  const pct = Math.min((cat.spent / cat.budget) * 100, 100);
  const remaining = Math.max(0, cat.budget - cat.spent);
  const pieData = [
    { value: cat.spent, fill: cat.spent > cat.budget ? "#DC2626" : "#059669" },
    { value: remaining, fill: "#F1F5F9" },
  ];
  const statusColor =
    cat.spent > cat.budget
      ? "bg-red-50 text-red-600 border border-red-200"
      : cat.spent / cat.budget >= 0.75
      ? "bg-amber-50 text-amber-600 border border-amber-200"
      : "bg-emerald-50 text-emerald-600 border border-emerald-200";

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon className="w-[18px] h-[18px] text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">{cat.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                {cat.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Budget", value: formatINR(cat.budget) },
              { label: "Spent", value: formatINR(cat.spent) },
              { label: "Left", value: formatINR(Math.max(0, cat.budget - cat.spent)) },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-lg p-2.5 text-center border border-[#E2E8F0]">
                <p className="text-xs text-slate-400 mb-0.5">{s.label}</p>
                <p className="text-sm font-bold text-[#0F172A] tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Donut */}
          <div className="flex items-center justify-center">
            <div className="relative" style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[#0F172A] tabular-nums">{pct.toFixed(0)}%</span>
                <span className="text-xs text-slate-400">used</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] pt-4">
            <h4 className="text-sm font-semibold text-[#0F172A] mb-3">Transactions</h4>
            {transactions.length === 0 ? (
              <div className="text-center py-6">
                <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No transactions this month.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {[...transactions].reverse().map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{t.description}</p>
                      <p className="text-xs text-slate-400">{t.date}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-red-500">
                      −{formatINR(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-[#0F172A]">Mark as Essential</span>
            </div>
            <button
              onClick={() => setEssential(!essential)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                essential ? "bg-blue-600" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  essential ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── GOAL PROGRESS ───
function GoalProgress({
  saved,
  total,
  status,
  recovering,
  badge,
  gapText,
}: {
  saved: number;
  total: number;
  status: string;
  recovering: boolean;
  badge: string | null;
  gapText?: string;
}) {
  const pct = Math.max(0, Math.min((saved / total) * 100, 100));
  const barColor =
    status === "on_track"
      ? "bg-emerald-500"
      : status === "at_risk"
      ? "bg-amber-400"
      : "bg-red-500";

  return (
    <div
      className="bg-white rounded-xl p-6 border border-[#E2E8F0]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">🏍️ Bike Goal</h2>
            <p className="text-xs text-slate-500">
              {formatINR(GOAL_SAVED_TOTAL)} saved across 3 months
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge === "recovery" && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200 animate-badge-in">
              RECOVERY NEEDED 🚨
            </span>
          )}
          {badge === "active" && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200 animate-badge-in animate-confetti">
              ✅ Plan Active
            </span>
          )}
        </div>
      </div>

      {/* Amount display */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-bold text-[#0F172A] tabular-nums">
          {formatINR(saved)}
        </span>
        <span className="text-lg text-slate-400 font-medium">/ {formatINR(total)}</span>
      </div>

      {/* Progress bar — 12px height */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out animate-progress-fill ${barColor} ${
            recovering ? "animate-pulse-subtle" : ""
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 3 inline stats */}
      <div className="flex items-center gap-4 text-xs">
        <span className="font-semibold text-[#0F172A] tabular-nums">{pct.toFixed(1)}% saved</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">{formatINR(total - saved)} remaining</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">3 months in</span>
      </div>

      {gapText && (
        <p className="text-xs text-red-500 mt-2 font-medium">{gapText}</p>
      )}
    </div>
  );
}

// ─── WARNING BANNER ───
function WarningBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">2 categories over budget</span> — Entertainment (₹299 over) and Shopping (₹798 over).
        </p>
      </div>
      <button onClick={onDismiss} className="text-amber-500 hover:text-amber-700 transition-colors ml-3 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── SUMMARY CARDS ───
function SummaryCards({ spent, remaining }: { spent: number; remaining: number }) {
  const cards = [
    {
      label: "MONTHLY INCOME",
      value: MONTHLY_INCOME,
      icon: ArrowUpRight,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-t-blue-500",
      valueColor: "text-[#0F172A]",
    },
    {
      label: "SPENT THIS MONTH",
      value: spent,
      icon: ArrowDownRight,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-t-amber-400",
      valueColor: "text-[#0F172A]",
    },
    {
      label: "REMAINING",
      value: remaining,
      icon: Wallet,
      iconBg: remaining < 0 ? "bg-red-50" : "bg-emerald-50",
      iconColor: remaining < 0 ? "text-red-600" : "text-emerald-600",
      borderColor: remaining < 0 ? "border-t-red-500" : "border-t-emerald-500",
      valueColor: remaining < 0 ? "text-red-600" : "text-[#0F172A]",
    },
    {
      label: "SAVINGS TARGET",
      value: SAVINGS_TARGET,
      icon: PiggyBank,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-t-blue-500",
      valueColor: "text-[#0F172A]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`bg-white rounded-xl p-4 border border-[#E2E8F0] border-t-[3px] ${c.borderColor} transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated animate-slide-in-bottom stagger-${i + 1}`}
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
              <c.icon className={`w-4 h-4 ${c.iconColor}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold tabular-nums animate-count-up ${c.valueColor}`}>
            <AnimatedNumber value={c.value} />
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mt-1.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── CATEGORY CARD ───
function CategoryCard({
  item,
  highlighted,
  onClick,
}: {
  item: CategoryData;
  highlighted: boolean;
  onClick: () => void;
}) {
  const ratio = item.budget > 0 ? item.spent / item.budget : 0;
  const barWidth = Math.min(ratio * 100, 100);
  const remaining = item.budget - item.spent;
  const isOver = ratio > 1;
  const Icon = item.icon;
  const barColor = isOver ? "bg-red-500" : ratio >= 0.75 ? "bg-amber-400" : "bg-emerald-500";
  const statusBg = isOver
    ? "bg-red-50 text-red-600 border-red-200"
    : ratio >= 0.99
    ? "bg-slate-100 text-slate-600"
    : ratio >= 0.75
    ? "bg-amber-50 text-amber-600 border-amber-200"
    : "bg-emerald-50 text-emerald-600 border-emerald-200";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border transition-all duration-150 cursor-pointer hover:-translate-y-0.5
        ${
          highlighted
            ? "border-red-400 ring-2 ring-red-400/20 shadow-[0_0_12px_rgba(220,38,38,0.15)] bg-red-50/30"
            : isOver
            ? "border-red-200 border-l-4 border-l-red-400"
            : "border-[#E2E8F0]"
        }`}
      style={{ boxShadow: highlighted ? undefined : "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isOver ? "bg-red-50" : "bg-slate-50"}`}>
            <Icon className={`w-[15px] h-[15px] ${isOver ? "text-red-500" : "text-slate-500"}`} />
          </div>
          <span className="text-sm font-semibold text-[#0F172A]">{item.name}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusBg}`}>
          {item.status}
        </span>
      </div>
      {/* 6px progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums">
        <span className="text-slate-400">{formatINR(item.spent)} / {formatINR(item.budget)}</span>
        <span className={isOver ? "text-red-500 font-semibold" : "text-slate-500"}>
          {isOver ? `${formatINR(Math.abs(remaining))} over` : `${formatINR(remaining)} left`}
        </span>
      </div>
    </div>
  );
}

// ─── EXPENSE FORM ───
function ExpenseForm({
  onSubmit,
  disabled,
  lastSubmitTime,
  appPhase,
}: {
  onSubmit: (form: ExpenseFormData, shiftHeld: boolean) => void;
  disabled: boolean;
  lastSubmitTime: number | null;
  appPhase: AppPhase;
}) {
  const [form, setForm] = useState<ExpenseFormData>({ amount: "", category: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shaking, setShaking] = useState(false);
  const [dupWarning, setDupWarning] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const trimmed = form.amount.trim();
    if (!trimmed) e.amount = "Please enter an amount";
    else if (isNaN(Number(trimmed))) e.amount = "Please enter a valid number";
    else if (parseFloat(trimmed) <= 0) e.amount = "Amount must be greater than ₹0";
    if (!form.category) e.category = "Please select a category";
    if (Object.keys(e).length) {
      setErrors(e);
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.MouseEvent) => {
    if (appPhase === "SHOCK" || appPhase === "RECOVERED") {
      setDupWarning(true);
      setTimeout(() => setDupWarning(false), 3000);
      return;
    }
    if (!validate()) return;
    if (lastSubmitTime && Date.now() - lastSubmitTime < 60000) {
      setDupWarning(true);
      setTimeout(() => setDupWarning(false), 3000);
      return;
    }
    onSubmit(form, e.shiftKey);
  };

  const allCategories = [
    ...CATEGORIES,
    { category: "unexpected", name: "Unexpected", icon: AlertTriangle, budget: 0, spent: 0, status: "N/A" },
  ];

  return (
    <div
      className="bg-white rounded-xl p-6 border border-[#E2E8F0] border-l-4 border-l-blue-500"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-[#0F172A]">⚡ Log Unexpected Expense</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Amount */}
        <div className={shaking && errors.amount ? "animate-shake" : ""}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5 block">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9.]/g, "") })}
              placeholder="5,000"
              disabled={disabled}
              className={`w-full h-10 pl-7 pr-3 rounded-lg border text-sm tabular-nums bg-white transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.amount ? "border-red-400 focus:ring-red-500/20 focus:border-red-400 animate-shake" : "border-[#E2E8F0]"}`}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>

        {/* Category */}
        <div className={shaking && errors.category ? "animate-shake" : ""}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5 block">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={disabled}
            className={`w-full h-10 px-3 rounded-lg border text-sm bg-white transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50
              ${errors.category ? "border-red-400" : "border-[#E2E8F0]"}`}
          >
            <option value="">Select category</option>
            {allCategories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5 block">
            Note
          </label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="e.g. Bike repair"
            disabled={disabled}
            className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm bg-white transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full h-10 bg-[#1A56DB] text-white rounded-lg text-sm font-semibold
              flex items-center justify-center gap-2 transition-all duration-150
              hover:bg-blue-700 active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-blue-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              btn-shimmer"
            style={{ boxShadow: "0 1px 3px rgba(26,86,219,0.3)" }}
          >
            {disabled ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analysing...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" /> 🤖 Analyse with AI
              </>
            )}
          </button>
        </div>
      </div>
      {dupWarning && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Already processing an expense. Reset first to log another.
        </div>
      )}
    </div>
  );
}

// ─── SKELETON CARDS ───
function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
          <div className="h-4 skeleton-shimmer rounded w-1/3 mb-4" />
          <div className="h-3 skeleton-shimmer rounded w-2/3 mb-3" />
          <div className="h-3 skeleton-shimmer rounded w-1/2 mb-3" />
          <div className="h-3 skeleton-shimmer rounded w-3/4 mb-3" />
          <div className="h-8 skeleton-shimmer rounded w-1/4 mt-2" />
        </div>
      ))}
    </div>
  );
}

// ─── LIVE REASONING STEPPER ───
function LiveReasoningStepper({
  steps,
  phase,
  accepted,
}: {
  steps: { step: number; text: string; status: string }[];
  phase: AppPhase;
  accepted: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (phase === "LOADING") {
      setVisibleCount(0);
      const timers: NodeJS.Timeout[] = [];
      steps.forEach((_, i) => {
        timers.push(setTimeout(() => setVisibleCount(i + 1), i * 400));
      });
      return () => timers.forEach(clearTimeout);
    } else {
      setVisibleCount(steps.length);
    }
  }, [phase, steps.length]);

  useEffect(() => {
    if (phase !== "LOADING") {
      setElapsed(Date.now() - startTime);
    }
  }, [phase, startTime]);

  const displaySteps = accepted
    ? [
        ...steps,
        { step: 7, text: "Plan accepted — budget locked in ✅", status: "done" },
      ]
    : steps;

  return (
    <div
      className="bg-white rounded-xl p-6 border border-[#E2E8F0]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {phase === "LOADING" ? (
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse-dot" />
          ) : (
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          )}
          <Bot className="w-[18px] h-[18px] text-blue-600" />
          <h3 className="text-base font-semibold text-[#0F172A]">🤖 Agent Reasoning — Live</h3>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Watch SaveSmart's AI work through your finances
      </p>
      <div className="border-l-2 border-blue-100 ml-3 space-y-0">
        {displaySteps.map((s, i) => {
          const isVisible = i < visibleCount || phase !== "LOADING";
          const isPending = phase === "LOADING" && i >= visibleCount;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 py-2 relative transition-all duration-300 animate-slide-in-left stagger-${Math.min(i + 1, 8)} ${
                isVisible ? "opacity-100" : isPending ? "opacity-30" : "opacity-0"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 -ml-[13px] transition-colors duration-300 ${
                  isVisible
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isVisible ? "✅" : "⏳"}
              </div>
              <p className="text-xs text-slate-500 pt-1 leading-relaxed">{s.text}</p>
            </div>
          );
        })}
      </div>
      {(phase === "SHOCK" || phase === "RECOVERED") && (
        <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
          <p className="text-xs text-slate-400 font-medium">
            Analysis complete in {((Date.now() - startTime) / 1000).toFixed(1)}s · Confidence: 94%
          </p>
        </div>
      )}
    </div>
  );
}

// ─── RECOVERY PANEL ───
function RecoveryPanel({
  response,
  shockAmount,
  shockNote,
  onAccept,
  acceptedIndex,
  noWants,
}: {
  response: AgentResponse;
  shockAmount: number;
  shockNote: string;
  onAccept: (idx: number) => void;
  acceptedIndex: number | null;
  noWants: boolean;
}) {
  const isExtreme = shockAmount > 20000;

  return (
    <div className="animate-slide-up space-y-4">
      {isExtreme && (
        <div className="bg-red-900 text-white rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">⚠️ Major Shock — Consider using emergency fund + extend goal by 1 month</p>
            <p className="text-xs opacity-80">
              This is a major financial shock. Consider using your emergency buffer fund.
            </p>
          </div>
        </div>
      )}

      {/* Panel Header */}
      <div
        className="bg-white rounded-xl p-6 border border-[#E2E8F0] border-l-4 border-l-red-500"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Zap className="w-[16px] h-[16px] text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-[#0F172A]">
            ⚡ Emergency Detected — {shockNote || "Expense"} — {formatINR(shockAmount)}
          </h3>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Savings Gap</p>
            <p className="text-xl font-bold text-red-600 tabular-nums">{formatINR(response.gap)}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          <span className="font-medium text-[#0F172A]">Agent Note:</span> {response.agentNote}
        </p>
      </div>

      {noWants ? (
        <div
          className="bg-white rounded-xl p-6 border border-[#E2E8F0] text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A] mb-2">All discretionary spending already at zero.</p>
          <p className="text-xs text-slate-500">
            Recommendation: Draw ₹1,320 from miscellaneous buffer + extend goal timeline by 3 weeks
            to August 2026.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {response.scenarios.map((s, i) => {
            const isAccepted = acceptedIndex === i;
            const isOther = acceptedIndex !== null && acceptedIndex !== i;
            const staggerClass =
              i === 0 ? "animate-stagger-1" : i === 1 ? "animate-stagger-2" : "animate-stagger-3";

            const tagBg =
              s.tagColor === "blue"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : s.tagColor === "red"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-purple-50 text-purple-700 border border-purple-200";

            const cardBorder = isAccepted
              ? "border-emerald-400 bg-emerald-50/30"
              : s.recommended && acceptedIndex === null
              ? "border-blue-400 border-2 bg-blue-50/20"
              : "border-[#E2E8F0]";

            return (
              <div
                key={i}
                className={`rounded-xl p-5 border-2 transition-all duration-200 bg-white ${staggerClass} ${cardBorder} ${
                  isOther ? "opacity-40 pointer-events-none" : ""
                } ${s.recommended && acceptedIndex === null ? "shadow-elevated" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tagBg}`}>
                    {isAccepted ? "✓ Plan Activated" : s.tag}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {s.difficulty}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] mb-2">{s.name}</h4>
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Actions</p>
                <ul className="text-xs text-slate-500 mb-3 space-y-1.5">
                  {s.actions.map((a, j) => (
                    <li key={j} className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
                <div className="bg-slate-50 rounded-lg p-2.5 mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 tabular-nums">
                    Recovers: {formatINR(s.recovery_amount)}
                  </span>
                  <span className="text-xs text-slate-400">Score: {s.feasibility}/10</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-slate-400">⏱ {s.timeframe}</span>
                </div>
                <p className="text-xs italic text-slate-400 mb-3 leading-relaxed">
                  "{s.why}"
                </p>
                {acceptedIndex === null && (
                  <button
                    onClick={() => onAccept(i)}
                    className={`w-full h-9 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                      s.recommended
                        ? "bg-[#1A56DB] text-white hover:bg-blue-700 btn-shimmer"
                        : "bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-blue-400 hover:text-blue-600"
                    }`}
                    style={s.recommended ? { boxShadow: "0 1px 3px rgba(26,86,219,0.3)" } : undefined}
                  >
                    Accept This Plan
                  </button>
                )}
                {isAccepted && (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-semibold animate-confetti">
                    <Check className="w-4 h-4" /> Plan Activated ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Recommendation Box */}
      {!noWants && acceptedIndex === null && (
        <div
          className="bg-blue-50 border border-blue-200 border-l-4 border-l-blue-500 rounded-xl p-4 flex items-start gap-3"
        >
          <Bot className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#0F172A] leading-relaxed">{response.recommendation}</p>
            <p className="text-xs text-slate-400 mt-1">— SaveSmart AI</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI FOOTER ───
function KPIFooter({
  savingsRate,
  stressScore,
  adherenceRate,
  goalVelocity,
}: {
  savingsRate: number;
  stressScore: number;
  adherenceRate: number;
  goalVelocity: number;
}) {
  const kpis = [
    {
      label: "SAVINGS RATE",
      value: `${savingsRate}%`,
      icon: PiggyBank,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      color: savingsRate > 20 ? "text-emerald-600" : "text-amber-500",
      tooltip: "Monthly savings ÷ savings target × 100",
    },
    {
      label: "STRESS SCORE",
      value: `${stressScore}/100`,
      icon: Gauge,
      iconBg: stressScore <= 50 ? "bg-emerald-50" : stressScore <= 65 ? "bg-amber-50" : "bg-red-50",
      iconColor: stressScore <= 50 ? "text-emerald-600" : stressScore <= 65 ? "text-amber-500" : "text-red-500",
      color:
        stressScore <= 50 ? "text-emerald-600" : stressScore <= 65 ? "text-amber-500" : "text-red-500",
      tooltip: "100 − (overshoot events × 10) − (gap severity × 5)",
    },
    {
      label: "ADHERENCE RATE",
      value: `${adherenceRate}%`,
      icon: Shield,
      iconBg: adherenceRate > 70 ? "bg-emerald-50" : "bg-amber-50",
      iconColor: adherenceRate > 70 ? "text-emerald-600" : "text-amber-500",
      color: adherenceRate > 70 ? "text-emerald-600" : "text-amber-500",
      tooltip: "Scenarios accepted ÷ total shocks × 100",
    },
    {
      label: "GOAL VELOCITY",
      value: `${goalVelocity}x`,
      icon: Rocket,
      iconBg: goalVelocity >= 1 ? "bg-emerald-50" : "bg-red-50",
      iconColor: goalVelocity >= 1 ? "text-emerald-600" : "text-red-500",
      color: goalVelocity >= 1 ? "text-emerald-600" : "text-red-500",
      tooltip: "Actual pace ÷ required pace — >1 means ahead",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="bg-white rounded-xl p-4 border border-[#E2E8F0] text-center group relative transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className={`w-9 h-9 rounded-xl ${k.iconBg} flex items-center justify-center mx-auto mb-2`}>
            <k.icon className={`w-[18px] h-[18px] ${k.iconColor}`} />
          </div>
          <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mt-1">
            {k.label}
          </p>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
            {k.tooltip}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TOAST ───
function ToastNotification({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="toast-container">
      <div className="toast-item flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-[#0F172A]">{message}</span>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───
export default function Index() {
  const [appPhase, setAppPhase] = useState<AppPhase>("INITIAL");
  const [shockAmount, setShockAmount] = useState(0);
  const [shockCategory, setShockCategory] = useState<string | null>(null);
  const [shockNote, setShockNote] = useState("");
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [acceptedIndex, setAcceptedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [drawerCat, setDrawerCat] = useState<CategoryData | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [zeroWants, setZeroWants] = useState(false);

  const baseSpent = getBaseSpent(); // 23726
  const currentSpent = appPhase === "INITIAL" ? baseSpent : baseSpent + shockAmount;
  const currentRemaining = MONTHLY_INCOME - currentSpent;

  const recoveredAmount =
    acceptedIndex !== null && agentResponse
      ? agentResponse.scenarios[acceptedIndex].recovery_amount
      : 0;

  const effectiveRemaining =
    appPhase === "RECOVERED" ? currentRemaining + recoveredAmount : currentRemaining;

  const goalSaved = GOAL_SAVED_TOTAL;
  const goalStatus =
    appPhase === "INITIAL"
      ? "on_track"
      : appPhase === "RECOVERED"
      ? recoveredAmount > 0
        ? "on_track"
        : "at_risk"
      : "off_track";

  const goalBadge: string | null =
    appPhase === "SHOCK" ? "recovery" : appPhase === "RECOVERED" ? "active" : null;

  const gapText =
    appPhase === "SHOCK" && agentResponse
      ? `Savings gap: ${formatINR(agentResponse.gap)} · Can save ${formatINR(agentResponse.canSave)} this month · Need ${formatINR(SAVINGS_TARGET)}`
      : undefined;

  const stressScore = appPhase === "INITIAL" ? 62 : appPhase === "RECOVERED" ? 58 : 74;
  const savingsRate = appPhase === "INITIAL" ? 49 : appPhase === "RECOVERED" ? 61 : 28;
  const adherenceRate = appPhase === "INITIAL" ? 78 : appPhase === "RECOVERED" ? 85 : 65;
  const goalVelocity = appPhase === "INITIAL" ? 1.02 : appPhase === "RECOVERED" ? 0.95 : 0.72;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const N8N_WEBHOOK = "https://boss56789.app.n8n.cloud/webhook/savesmart-agent";

  async function callAgent(amount: number, category: string, note: string | undefined): Promise<AgentResponse> {
    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_amount: Number(amount),
          expense_category: category,
          expense_note: note || "",
          budget_state: {
            income: 45000,
            savings_goal: 25000,
            total_goal: 150000,
            total_saved: 47000,
            current_spent: 23726,
            categories: [
              { name: "Dining Out", type: "Want", budget: 3500, spent: 2900 },
              { name: "Shopping", type: "Want", budget: 2000, spent: 2798 },
              { name: "Entertainment", type: "Want", budget: 1000, spent: 1299 },
              { name: "Fitness", type: "Want", budget: 1200, spent: 1200 },
              { name: "Miscellaneous", type: "Buffer", budget: 1500, spent: 180 }
            ]
          }
        })
      });
      if (!res.ok) throw new Error("n8n error");
      return await res.json();
    } catch (err) {
      console.warn("n8n failed, using fallback:", err);
      return runSaveSmartAgent(amount, category, note);
    }
  }

  const handleExpenseSubmit = async (form: ExpenseFormData, shiftHeld: boolean) => {
    const amount = parseFloat(form.amount);
    setShockAmount(amount);
    setShockCategory(form.category);
    setShockNote(form.note || form.category);
    setAppPhase("LOADING");
    setLastSubmitTime(Date.now());
    setLoadingSlow(false);
    setLoadingTimeout(false);

    const delay = shiftHeld ? 6000 : 2400;

    let slowTimer: NodeJS.Timeout | undefined;
    if (shiftHeld) {
      slowTimer = setTimeout(() => setLoadingSlow(true), 3000);
    }

    const resp = await callAgent(amount, form.category, form.note);
    setAgentResponse(resp);

    setTimeout(() => {
      if (slowTimer) clearTimeout(slowTimer);
      if (shiftHeld) setLoadingTimeout(true);
      setAppPhase("SHOCK");
    }, delay);
  };

  const handleAccept = (idx: number) => {
    setAcceptedIndex(idx);
    setAppPhase("RECOVERED");
    const name = agentResponse?.scenarios[idx]?.name || "plan";
    showToast(`🎯 Smart move, Rohan! ${name} locked in. Bike goal back on track.`);
  };

  const handleReset = () => {
    setAppPhase("INITIAL");
    setShockAmount(0);
    setShockCategory(null);
    setShockNote("");
    setAgentResponse(null);
    setAcceptedIndex(null);
    setLastSubmitTime(null);
    setLoadingSlow(false);
    setLoadingTimeout(false);
    setZeroWants(false);
  };

  return (
    <AppShell title="Dashboard" stressScore={stressScore}>
      <div className="space-y-6">
        {/* Goal Progress */}
        <GoalProgress
          saved={goalSaved}
          total={GOAL_TOTAL}
          status={goalStatus}
          recovering={appPhase === "LOADING"}
          badge={goalBadge}
          gapText={gapText}
        />

        {/* Warning Banner */}
        {appPhase === "INITIAL" && !warningDismissed && (
          <WarningBanner onDismiss={() => setWarningDismissed(true)} />
        )}

        {/* Financial Summary */}
        <SummaryCards
          spent={appPhase === "RECOVERED" ? currentSpent : currentSpent}
          remaining={effectiveRemaining}
        />

        {/* Category Grid */}
        <div>
          <h3 className="text-base font-semibold text-[#0F172A] mb-4">Category Spending</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((item) => (
              <CategoryCard
                key={item.category}
                item={item}
                highlighted={appPhase === "SHOCK" && shockCategory === item.category}
                onClick={() => setDrawerCat(item)}
              />
            ))}
          </div>
        </div>

        {/* Expense Form */}
        {(appPhase === "INITIAL" || appPhase === "LOADING") && (
          <ExpenseForm
            onSubmit={handleExpenseSubmit}
            disabled={appPhase === "LOADING"}
            lastSubmitTime={lastSubmitTime}
            appPhase={appPhase}
          />
        )}

        {/* Loading State */}
        {appPhase === "LOADING" && (
          <div className="space-y-4">
            {loadingSlow && !loadingTimeout && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-[#E2E8F0]">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Agent is thinking harder than usual...
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
              <SkeletonCards />
              {agentResponse && (
                <LiveReasoningStepper
                  steps={agentResponse.reasoning_steps}
                  phase={appPhase}
                  accepted={false}
                />
              )}
            </div>
          </div>
        )}

        {/* Reasoning Stepper — always visible after loading */}
        {(appPhase === "SHOCK" || appPhase === "RECOVERED") && agentResponse && (
          <LiveReasoningStepper
            steps={agentResponse.reasoning_steps}
            phase={appPhase}
            accepted={appPhase === "RECOVERED"}
          />
        )}

        {/* Offline Mode badge */}
        {loadingTimeout && (appPhase === "SHOCK" || appPhase === "RECOVERED") && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs font-medium">
              Offline Mode
            </span>
          </div>
        )}

        {/* Recovery Panel */}
        {(appPhase === "SHOCK" || appPhase === "RECOVERED") && agentResponse && (
          <RecoveryPanel
            response={agentResponse}
            shockAmount={shockAmount}
            shockNote={shockNote}
            onAccept={handleAccept}
            acceptedIndex={acceptedIndex}
            noWants={zeroWants}
          />
        )}

        {/* Reset Button */}
        {appPhase === "RECOVERED" && (
          <div className="flex justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-500 border border-[#E2E8F0] bg-white
                hover:bg-slate-50 hover:text-slate-700 transition-all duration-150 flex items-center gap-2 active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              Reset & Try Another Expense
            </button>
          </div>
        )}

        {/* KPI Footer */}
        <KPIFooter
          savingsRate={savingsRate}
          stressScore={stressScore}
          adherenceRate={adherenceRate}
          goalVelocity={goalVelocity}
        />

        {/* Dev: Zero Wants button */}
        <div className="flex justify-center">
          <button
            onClick={() => setZeroWants(!zeroWants)}
            className="px-3 py-1 rounded text-xs text-slate-400 border border-dashed border-slate-200 hover:bg-slate-50 transition-colors"
            title="Dev tool: simulate zero wants remaining"
          >
            <Eye className="w-3 h-3 inline mr-1" />
            {zeroWants ? "Restore Wants" : "Zero Wants (Dev)"}
          </button>
        </div>
      </div>

      {/* Category Drawer */}
      {drawerCat && <CategoryDrawer cat={drawerCat} onClose={() => setDrawerCat(null)} />}

      {/* Toast */}
      <ToastNotification message={toast || ""} visible={!!toast} />
    </AppShell>
  );
}
