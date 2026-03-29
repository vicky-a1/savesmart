import { AppShell } from "@/components/AppShell";
import { CATEGORIES, TRANSACTIONS, formatINR, MONTHLY_INCOME, getBaseSpent, SAVINGS_TARGET } from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  LineChart, Line, PieChart, Pie, CartesianGrid, Legend
} from "recharts";
import { Receipt, TrendingDown, Repeat, CreditCard, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

const barData = CATEGORIES.map(c => ({
  name: c.name.length > 8 ? c.name.slice(0, 8) + "…" : c.name,
  Budget: c.budget,
  Spent: c.spent,
  isOver: c.spent > c.budget,
}));

// Daily spending from transactions
const dailyData: { day: string; amount: number }[] = [];
const dayMap = new Map<number, number>();
TRANSACTIONS.forEach(t => {
  const dayNum = parseInt(t.date.replace("Mar ", ""));
  dayMap.set(dayNum, (dayMap.get(dayNum) || 0) + t.amount);
});
for (let d = 1; d <= 20; d++) {
  dailyData.push({ day: `Mar ${d}`, amount: dayMap.get(d) || 0 });
}

const totalSpent = getBaseSpent();
const needs = CATEGORIES.filter(c => ["rent", "groceries", "transport", "phone", "fitness"].includes(c.category))
  .reduce((s, c) => s + c.spent, 0);
const wants = CATEGORIES.filter(c => ["dining_out", "entertainment", "shopping", "misc"].includes(c.category))
  .reduce((s, c) => s + c.spent, 0);
const savings = MONTHLY_INCOME - totalSpent;

const pieData = [
  { name: "Needs", value: needs, fill: "#059669" },
  { name: "Wants", value: wants, fill: "#D97706" },
  { name: "Savings", value: Math.max(0, savings), fill: "#1A56DB" },
];

const diningCount = TRANSACTIONS.filter(t => t.category === "dining_out").length;
const avgDaily = Math.round(totalSpent / 19);

const INSIGHTS = [
  {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    text: "Dining Out is your fastest-growing category — 4 transactions, ₹2,900 of ₹3,500 budget used with 12 days left in March.",
  },
  {
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    text: "Shopping is ₹798 over budget. The Zara purchase (Mar 7) + Amazon earphones (Mar 18) alone exceeded your ₹2,000 limit.",
  },
  {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    text: "Groceries and Transport are well within budget. You're spending ₹1,300 of ₹2,000 on transport — a 35% underspend.",
  },
];

export default function Analytics() {
  return (
    <AppShell title="Analytics">
      <div className="space-y-6">
        {/* Month at a Glance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "TOTAL TRANSACTIONS", value: "17", icon: Receipt, trend: null },
            { label: "AVG DAILY SPEND", value: formatINR(avgDaily), icon: TrendingDown, trend: "up" },
            { label: "BIGGEST SPEND", value: `Rent`, sub: formatINR(10000), icon: CreditCard, trend: null },
            { label: "MOST FREQUENT", value: `Dining Out`, sub: `${diningCount}x this month`, icon: Repeat, trend: null },
          ].map((s, idx) => (
            <div
              key={s.label}
              className="bg-white rounded-xl p-4 border border-[#E2E8F0] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-blue-600" />
                </div>
                {s.trend === "up" && (
                  <span className="badge-warning text-xs">
                    <TrendingUp className="w-3 h-3" /> +12%
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-[#0F172A] tabular-nums">{s.value}</p>
              {s.sub && <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>}
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget vs Spent */}
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Budget vs Spent</h3>
              <p className="text-xs text-slate-500 mt-0.5">Red bars = over budget categories</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => formatINR(v)}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Budget" fill="#DBEAFE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.isOver ? "#DC2626" : "#059669"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Spending */}
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Daily Spending</h3>
              <p className="text-xs text-slate-500 mt-0.5">March 2025 — day by day</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => formatINR(v)}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#1A56DB"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#1A56DB", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#1A56DB" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie + Insights row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie */}
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[#0F172A] text-center">Needs vs Wants vs Savings</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatINR(v)}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Spending Insights */}
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[#0F172A]">Spending Insights</h3>
              <p className="text-xs text-slate-500 mt-0.5">AI-generated patterns for Rohan</p>
            </div>
            <div className="space-y-3">
              {INSIGHTS.map((insight, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${insight.bg} animate-slide-in-left stagger-${i + 1}`}>
                  <insight.icon className={`w-4 h-4 shrink-0 mt-0.5 ${insight.color}`} />
                  <p className="text-xs text-[#0F172A] leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
