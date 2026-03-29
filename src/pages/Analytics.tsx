import { AppShell } from "@/components/AppShell";
import { CATEGORIES, TRANSACTIONS, formatINR, MONTHLY_INCOME, getBaseSpent, SAVINGS_TARGET } from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  LineChart, Line, PieChart, Pie, CartesianGrid, Legend
} from "recharts";
import { Receipt, TrendingDown, Repeat, CreditCard } from "lucide-react";

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

// Stats — Dining Out has 4 transactions (Mar 3, 8, 12, 17)
const diningCount = TRANSACTIONS.filter(t => t.category === "dining_out").length;
const avgDaily = Math.round(totalSpent / 19);

export default function Analytics() {
  return (
    <AppShell title="Analytics">
      <div className="space-y-6">
        {/* Month at a Glance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "TOTAL TRANSACTIONS", value: "17", icon: Receipt },
            { label: "AVG DAILY SPEND", value: formatINR(avgDaily), icon: TrendingDown },
            { label: "BIGGEST SPEND", value: `Rent ${formatINR(10000)}`, icon: CreditCard },
            { label: "MOST FREQUENT", value: `Dining Out (${diningCount}x)`, icon: Repeat },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl p-4 shadow-sm border border-border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-[18px] h-[18px] text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget vs Spent */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="text-base font-semibold mb-4">Budget vs Spent by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Legend />
                <Bar dataKey="Budget" fill="#1A56DB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.isOver ? "#DC2626" : "#059669"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Spending */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="text-base font-semibold mb-4">Daily Spending (March)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Line type="monotone" dataKey="amount" stroke="#1A56DB" strokeWidth={2} dot={{ r: 3, fill: "#1A56DB" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border max-w-md mx-auto">
          <h3 className="text-base font-semibold mb-4 text-center">Needs vs Wants vs Savings</h3>
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
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatINR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
