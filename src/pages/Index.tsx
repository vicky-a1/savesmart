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
    { value: remaining, fill: "hsl(210, 20%, 96%)" },
  ];
  const statusColor =
    cat.spent > cat.budget
      ? "bg-destructive/10 text-destructive"
      : cat.spent / cat.budget >= 0.75
      ? "bg-warning/10 text-warning"
      : "bg-success/10 text-success";

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-[380px] max-w-[90vw] bg-card border-l border-border shadow-lg z-50 flex flex-col"
        style={{ animation: "slide-right 300ms ease-out" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">{cat.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <span className={`px-2.5 py-1 rounded-[999px] text-xs font-medium ${statusColor}`}>
              {cat.status}
            </span>
          </div>

          {/* Stat pills */}
          <div className="flex gap-2 justify-center">
            <span className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium">
              Budget {formatINR(cat.budget)}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium">
              Spent {formatINR(cat.spent)}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium">
              Left {formatINR(Math.max(0, cat.budget - cat.spent))}
            </span>
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
                <span className="text-sm font-bold">{pct.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">used</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold mb-3">Transactions</h4>
            {transactions.length === 0 ? (
              <div className="text-center py-6">
                <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted-foreground">No transactions this month.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...transactions].reverse().map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-destructive">
                      -{formatINR(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Mark as Essential</span>
            </div>
            <button
              onClick={() => setEssential(!essential)}
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                essential ? "bg-info" : "bg-secondary"
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
    status === "on_track" ? "bg-success" : status === "at_risk" ? "bg-warning" : "bg-destructive";

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-[18px] h-[18px] text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold">Bike Goal 🏍️</h2>
            <p className="text-xs text-muted-foreground">
              {formatINR(GOAL_SAVED_TOTAL)} saved across 3 months
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge === "recovery" && (
            <span className="px-2.5 py-1 rounded-[999px] text-xs font-medium uppercase tracking-wide bg-destructive/10 text-destructive animate-slide-up">
              🚨 Recovery Needed
            </span>
          )}
          {badge === "active" && (
            <span className="px-2.5 py-1 rounded-[999px] text-xs font-medium uppercase tracking-wide bg-success/10 text-success animate-slide-up">
              ✅ Plan Active
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span className="font-medium">{formatINR(saved)} saved</span>
        <span className="font-bold text-sm">{pct.toFixed(1)}%</span>
        <span className="font-medium">{formatINR(total)} goal</span>
      </div>
      <div className="h-3 bg-secondary rounded-[999px] overflow-hidden">
        <div
          className={`h-full rounded-[999px] transition-all duration-[400ms] ease-out ${barColor} ${
            recovering ? "animate-pulse-subtle" : ""
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {gapText && (
        <p className="text-xs text-destructive mt-2">{gapText}</p>
      )}
    </div>
  );
}

// ─── WARNING BANNER ───
function WarningBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
        <p className="text-sm text-warning">
          <span className="font-semibold">⚠️ 2 categories over budget</span> — Entertainment (₹299
          over) and Shopping (₹798 over). Review your spending.
        </p>
      </div>
      <button onClick={onDismiss} className="text-warning hover:text-warning/80 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── SUMMARY CARDS ───
function SummaryCards({ spent, remaining }: { spent: number; remaining: number }) {
  const cards = [
    { label: "MONTHLY INCOME", value: MONTHLY_INCOME, icon: ArrowUpRight, borderColor: "border-l-info" },
    { label: "SPENT THIS MONTH", value: spent, icon: ArrowDownRight, borderColor: "border-l-warning" },
    {
      label: "REMAINING",
      value: remaining,
      icon: Wallet,
      borderColor: remaining < 0 ? "border-l-destructive" : "border-l-success",
    },
    { label: "SAVINGS TARGET", value: SAVINGS_TARGET, icon: PiggyBank, borderColor: "border-l-info" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-card rounded-xl p-4 shadow-sm border border-border border-l-4 ${c.borderColor} transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md`}
        >
          <div className="flex items-center gap-2 mb-2">
            <c.icon className="w-[18px] h-[18px] text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {c.label}
            </span>
          </div>
          <p className={`text-xl font-bold tabular-nums ${c.value < 0 ? "text-destructive" : ""}`}>
            <AnimatedNumber value={c.value} />
          </p>
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
  const statusColor = ratio > 1 ? "bg-destructive" : ratio >= 0.75 ? "bg-warning" : "bg-success";
  const statusTextColor =
    ratio > 1 ? "text-destructive" : ratio >= 0.75 ? "text-warning" : "text-success";

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl p-4 shadow-sm border transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md
        ${
          highlighted
            ? "border-destructive ring-2 ring-destructive/20 shadow-[0_0_12px_rgba(220,38,38,0.15)]"
            : isOver
            ? "border-destructive/30"
            : "border-border"
        }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-[18px] h-[18px] ${isOver ? "text-destructive" : "text-muted-foreground"}`} />
          <span className="text-sm font-semibold">{item.name}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-[999px] text-xs font-medium ${
            isOver
              ? "bg-destructive/10 text-destructive"
              : ratio >= 0.99
              ? "bg-success/10 text-success"
              : ratio >= 0.75
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
          }`}
        >
          {item.status}
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-[999px] overflow-hidden mb-2">
        <div
          className={`h-full rounded-[999px] transition-all duration-300 ease-out ${statusColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums">
        <span className="text-muted-foreground">
          {formatINR(item.spent)} / {formatINR(item.budget)}
        </span>
        <span className={statusTextColor}>
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
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Plus className="w-[18px] h-[18px] text-muted-foreground" />
        Log Unexpected Expense
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className={shaking && errors.amount ? "animate-shake" : ""}>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 block">
            Amount (₹)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9.]/g, "") })}
            placeholder="5,000"
            disabled={disabled}
            className={`w-full h-10 px-3 rounded-lg border text-sm tabular-nums bg-card transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errors.amount ? "border-destructive" : "border-border"}`}
          />
          {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
        </div>
        <div className={shaking && errors.category ? "animate-shake" : ""}>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 block">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={disabled}
            className={`w-full h-10 px-3 rounded-lg border text-sm bg-card transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info disabled:opacity-50
              ${errors.category ? "border-destructive" : "border-border"}`}
          >
            <option value="">Select category</option>
            {allCategories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 block">
            Note
          </label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="e.g. Bike repair"
            disabled={disabled}
            className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-card transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info disabled:opacity-50"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full h-10 bg-info text-white rounded-lg text-sm font-medium
              flex items-center justify-center gap-2 transition-all duration-150
              hover:bg-info/90 active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-info/30
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> AI Agent Analysing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Submit Expense
              </>
            )}
          </button>
        </div>
      </div>
      {dupWarning && (
        <div className="mt-3 flex items-center gap-2 text-xs text-warning">
          <AlertTriangle className="w-4 h-4" />
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
        <div key={i} className="bg-card rounded-xl p-6 shadow-md border border-border animate-pulse">
          <div className="h-5 bg-secondary rounded w-1/3 mb-4" />
          <div className="h-3 bg-secondary rounded w-2/3 mb-3" />
          <div className="h-3 bg-secondary rounded w-1/2 mb-3" />
          <div className="h-3 bg-secondary rounded w-3/4 mb-3" />
          <div className="h-8 bg-secondary rounded w-1/4" />
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

  const displaySteps = accepted
    ? [
        ...steps,
        { step: 7, text: "Plan accepted — budget locked in ✅", status: "done" },
      ]
    : steps;

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="w-[18px] h-[18px] text-info" />
        <h3 className="text-base font-semibold">🤖 Agent Reasoning — Live</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Watch SaveSmart's AI work through your finances
      </p>
      <div className="border-l-2 border-info/20 ml-3 space-y-0">
        {displaySteps.map((s, i) => {
          const isVisible = i < visibleCount || phase !== "LOADING";
          const isPending = phase === "LOADING" && i >= visibleCount;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 py-2 relative transition-opacity duration-300 ${
                isVisible ? "opacity-100" : isPending ? "opacity-30" : "opacity-0"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 -ml-[13px] transition-colors duration-300 ${
                  isVisible ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
                }`}
              >
                {isVisible ? "✅" : "⏳"}
              </div>
              <p className="text-xs text-muted-foreground pt-1">{s.text}</p>
            </div>
          );
        })}
      </div>
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
        <div className="bg-[#7f1d1d] text-white rounded-xl p-4 flex items-center gap-3">
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
        className={`bg-card rounded-xl p-6 shadow-md border ${
          isExtreme ? "border-l-4 border-l-[#7f1d1d] border-t-border border-r-border border-b-border" : "border-l-4 border-l-destructive border-t-border border-r-border border-b-border"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-[18px] h-[18px] text-warning" />
          <h3 className="text-base font-semibold">
            ⚡ Emergency Detected — {shockNote || "Expense"} — {formatINR(shockAmount)}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Savings gap this month: {formatINR(response.gap)}
        </p>
        <p className="text-xs text-muted-foreground">
          Agent Note: {response.agentNote}
        </p>
      </div>

      {noWants ? (
        <div className="bg-card rounded-xl p-6 shadow-md border border-border text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-sm font-medium mb-2">All discretionary spending already at zero.</p>
          <p className="text-xs text-muted-foreground">
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
                ? "bg-info/10 text-info"
                : s.tagColor === "red"
                ? "bg-destructive/10 text-destructive"
                : "bg-purple-100 text-purple-700";

            const borderClass = isAccepted
              ? "bg-success/5 border-success"
              : s.recommended && acceptedIndex === null
              ? "border-info bg-info/5 border-2"
              : "border-border";

            return (
              <div
                key={i}
                className={`rounded-xl p-4 border-2 transition-all duration-200 ${staggerClass} ${borderClass} ${
                  isOther ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-[999px] text-xs font-medium ${tagBg}`}>
                    {isAccepted ? "✓ Plan Activated" : s.tag}
                  </span>
                  <span className="px-2 py-0.5 rounded-[999px] text-xs font-medium bg-secondary text-muted-foreground">
                    {s.difficulty}
                  </span>
                </div>
                <h4 className="text-sm font-semibold mb-2">{s.name}</h4>
                <p className="text-xs font-medium text-muted-foreground mb-1">What to do:</p>
                <ul className="text-xs text-muted-foreground mb-3 space-y-1">
                  {s.actions.map((a, j) => (
                    <li key={j}>• {a}</li>
                  ))}
                </ul>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-success tabular-nums">
                    Recovers: {formatINR(s.recovery_amount)}
                  </span>
                  <span className="text-muted-foreground">Score: {s.feasibility}/10</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-muted-foreground">Timeframe: {s.timeframe}</span>
                </div>
                <p className="text-xs italic text-muted-foreground mb-3">
                  Why this works: {s.why}
                </p>
                {acceptedIndex === null && (
                  <button
                    onClick={() => onAccept(i)}
                    className={`w-full h-9 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                      s.recommended
                        ? "bg-info text-white hover:bg-info/90"
                        : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    }`}
                  >
                    Accept This Plan
                  </button>
                )}
                {isAccepted && (
                  <div className="flex items-center justify-center gap-2 text-success text-sm font-medium">
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
        <div className="bg-info-light border-l-4 border-l-info rounded-xl p-4 flex items-start gap-3">
          <Bot className="w-5 h-5 text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">{response.recommendation}</p>
            <p className="text-xs text-muted-foreground mt-1">— SaveSmart AI</p>
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
      color: savingsRate > 20 ? "text-success" : "text-warning",
      tooltip: "Monthly savings ÷ savings target × 100",
    },
    {
      label: "STRESS SCORE",
      value: `${stressScore}/100`,
      icon: Gauge,
      color:
        stressScore <= 50 ? "text-success" : stressScore <= 65 ? "text-warning" : "text-destructive",
      tooltip: "100 − (overshoot events × 10) − (gap severity × 5)",
    },
    {
      label: "ADHERENCE RATE",
      value: `${adherenceRate}%`,
      icon: Shield,
      color: adherenceRate > 70 ? "text-success" : "text-warning",
      tooltip: "Scenarios accepted ÷ total shocks × 100",
    },
    {
      label: "GOAL VELOCITY",
      value: `${goalVelocity}x`,
      icon: Rocket,
      color: goalVelocity >= 1 ? "text-success" : "text-destructive",
      tooltip: "Actual pace ÷ required pace — >1 means ahead",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="bg-card rounded-xl p-4 shadow-sm border border-border text-center group relative transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        >
          <k.icon className="w-[18px] h-[18px] text-muted-foreground mx-auto mb-2" />
          <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-1">
            {k.label}
          </p>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
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
    <div
      className="fixed bottom-6 right-6 bg-card border border-border border-l-4 border-l-success px-5 py-4 rounded-xl shadow-lg text-sm font-medium z-50 max-w-sm"
      style={{ animation: "slide-up 200ms ease-out" }}
    >
      <div className="flex items-center gap-3">
        <Check className="w-5 h-5 text-success shrink-0" />
        <span>{message}</span>
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

  const N8N_WEBHOOK = "https://victor2218.app.n8n.cloud/webhook/savesmart-agent";

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
          <h3 className="text-lg font-semibold mb-4">Category Spending</h3>
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded text-xs bg-secondary text-muted-foreground">
              (Offline Mode)
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
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground border border-border
                hover:bg-secondary hover:text-foreground transition-colors duration-150 flex items-center gap-2"
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
            className="px-3 py-1 rounded text-xs text-muted-foreground border border-dashed border-border hover:bg-secondary transition-colors"
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
