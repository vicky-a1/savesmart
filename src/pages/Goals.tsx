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

  return (
    <AppShell title="Goals">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Main Goal Card */}
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center">
          <Target className="w-8 h-8 text-info mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-1">Bike Goal 🏍️</h2>
          <p className="text-xs text-muted-foreground mb-6">Save {formatINR(GOAL_TOTAL)} in 6 months</p>

          {/* Progress Ring (SVG circle) */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(210, 20%, 96%)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="#059669" strokeWidth="8"
                strokeDasharray={`${pct * 2.639} ${263.9 - pct * 2.639}`}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{pct.toFixed(1)}%</span>
              <span className="text-xs text-muted-foreground">{formatINR(GOAL_SAVED_TOTAL)}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {formatINR(GOAL_SAVED_TOTAL)} / {formatINR(GOAL_TOTAL)} • {monthsNeeded} months to go
          </p>
        </div>

        {/* Monthly History */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-[18px] h-[18px] text-muted-foreground" />
            Monthly Contributions
          </h3>
          <div className="space-y-3">
            {MONTHS_HISTORY.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="text-sm font-medium w-20">{m.month}</span>
                <div className="flex-1 h-8 bg-secondary rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg transition-all duration-300 ${
                      m.status === "done" ? "bg-success" : m.status === "warning" ? "bg-warning" : "bg-info/30"
                    }`}
                    style={{ width: `${(m.amount / m.target) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {m.amount > 0 ? formatINR(m.amount) : "In Progress"}
                  </span>
                </div>
                <div className="w-8 flex justify-center">
                  {m.status === "done" && <CheckCircle2 className="w-5 h-5 text-success" />}
                  {m.status === "warning" && <AlertTriangle className="w-5 h-5 text-warning" />}
                  {m.status === "in_progress" && <Clock className="w-5 h-5 text-info" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What-if Slider */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-muted-foreground" />
            What If Calculator
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Drag to see how changing your monthly savings changes your completion date.
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Monthly Savings</span>
                <span className="font-bold tabular-nums">{formatINR(monthlyContrib)}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={40000}
                step={1000}
                value={monthlyContrib}
                onChange={(e) => setMonthlyContrib(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-info"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatINR(5000)}</span>
                <span>{formatINR(40000)}</span>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Projected completion</p>
              <p className="text-lg font-bold text-info">{projectedStr}</p>
              <p className="text-xs text-muted-foreground mt-1">{monthsNeeded} months from now at {formatINR(monthlyContrib)}/month</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
