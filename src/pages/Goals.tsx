import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GOAL_TOTAL, GOAL_SAVED_TOTAL, SAVINGS_TARGET, formatINR } from "@/lib/data";
import { Target, Calendar, TrendingUp, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const MONTHS_HISTORY = [
  { month: "Month 1", amount: 25000, target: 25000, status: "done" },
  { month: "Month 2", amount: 22000, target: 25000, status: "warning" },
  { month: "Month 3", amount: 0, target: 25000, status: "in_progress" },
];

export default function Goals() {
  const [monthlyContrib, setMonthlyContrib] = useState(SAVINGS_TARGET);
  const remaining = GOAL_TOTAL - GOAL_SAVED_TOTAL;
  const monthsNeeded = Math.ceil(remaining / monthlyContrib);
  const pct = (GOAL_SAVED_TOTAL / GOAL_TOTAL) * 100;

  // Project from March 2025
  const baseDate = new Date(2025, 2, 1); // March 2025
  const projected = new Date(baseDate);
  projected.setMonth(projected.getMonth() + monthsNeeded);
  const projectedStr = projected.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // SVG ring params
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.9
  const dashFilled = (pct / 100) * circumference;

  const sliderPct = ((monthlyContrib - 5000) / (40000 - 5000)) * 100;

  return (
    <AppShell title="Goals">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Main Goal Card */}
        <div
          className="bg-white rounded-xl p-8 border border-[#E2E8F0] text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <Target className="w-3.5 h-3.5" />
            Active Goal
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-1">Bike Goal 🏍️</h2>
          <p className="text-sm text-slate-500 mb-6">Save {formatINR(GOAL_TOTAL)} in 6 months</p>

          {/* Animated SVG Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Track */}
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="8"
              />
              {/* Progress */}
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke="#059669"
                strokeWidth="8"
                strokeDasharray={`${dashFilled} ${circumference - dashFilled}`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out animate-progress-fill"
                style={{ filter: "drop-shadow(0 0 4px rgba(5,150,105,0.4))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#0F172A] tabular-nums">{pct.toFixed(1)}%</span>
              <span className="text-xs text-slate-500 mt-0.5">{formatINR(GOAL_SAVED_TOTAL)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-[#0F172A] tabular-nums">{formatINR(GOAL_SAVED_TOTAL)}</p>
              <p className="text-xs text-slate-500">Saved</p>
            </div>
            <div className="w-px h-8 bg-[#E2E8F0]" />
            <div className="text-center">
              <p className="text-lg font-bold text-[#0F172A] tabular-nums">{formatINR(remaining)}</p>
              <p className="text-xs text-slate-500">Remaining</p>
            </div>
            <div className="w-px h-8 bg-[#E2E8F0]" />
            <div className="text-center">
              <p className="text-lg font-bold text-[#0F172A] tabular-nums">{monthsNeeded}</p>
              <p className="text-xs text-slate-500">Months left</p>
            </div>
          </div>
        </div>

        {/* Monthly History */}
        <div
          className="bg-white rounded-xl p-6 border border-[#E2E8F0]"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <Calendar className="w-[18px] h-[18px] text-slate-400" />
            Monthly Contributions
          </h3>
          <div className="space-y-3">
            {MONTHS_HISTORY.map((m, idx) => {
              const barPct = m.amount > 0 ? (m.amount / m.target) * 100 : 5;
              const barColor =
                m.status === "done"
                  ? "bg-emerald-500"
                  : m.status === "warning"
                  ? "bg-amber-400"
                  : "bg-blue-200";

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
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                      style={{ width: `${barPct}%` }}
                    />
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

        {/* What-if Slider */}
        <div
          className="bg-white rounded-xl p-6 border border-[#E2E8F0]"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <h3 className="text-base font-semibold text-[#0F172A] mb-1 flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-slate-400" />
            What If Calculator
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Drag to see how changing your monthly savings changes your completion date.
          </p>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-600">Monthly Savings</span>
                <span className="text-xl font-bold tabular-nums text-[#1A56DB]">{formatINR(monthlyContrib)}</span>
              </div>
              {/* Custom styled range slider */}
              <div className="relative pt-1">
                <div className="h-2 bg-slate-100 rounded-full relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-150"
                    style={{ width: `${sliderPct}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={5000}
                  max={40000}
                  step={1000}
                  value={monthlyContrib}
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
      </div>
    </AppShell>
  );
}
