import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { TRANSACTIONS, CATEGORIES, formatINR, MONTHLY_INCOME } from "@/lib/data";
import { ArrowUpDown, Search, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";

interface TxRow {
  date: string;
  dateNum: number;
  desc: string;
  category: string;
  categoryName: string;
  type: string;
  amount: number;
  isEmergency: boolean;
}

const ALL_TX: TxRow[] = [
  { date: "Mar 1", dateNum: 1, desc: "Salary credited 🎉", category: "income", categoryName: "Income", type: "income", amount: 45000, isEmergency: false },
  { date: "Mar 1", dateNum: 1, desc: "Rent — March", category: "rent", categoryName: "Rent", type: "expense", amount: -10000, isEmergency: false },
  { date: "Mar 2", dateNum: 2, desc: "Zepto — groceries", category: "groceries", categoryName: "Groceries", type: "expense", amount: -1200, isEmergency: false },
  { date: "Mar 3", dateNum: 3, desc: "Swiggy — butter chicken biryani", category: "dining_out", categoryName: "Dining Out", type: "expense", amount: -450, isEmergency: false },
  { date: "Mar 5", dateNum: 5, desc: "Metro card recharge", category: "transport", categoryName: "Transport", type: "expense", amount: -500, isEmergency: false },
  { date: "Mar 6", dateNum: 6, desc: "Netflix monthly", category: "entertainment", categoryName: "Entertainment", type: "expense", amount: -649, isEmergency: false },
  { date: "Mar 7", dateNum: 7, desc: "Zara — t-shirt", category: "shopping", categoryName: "Shopping", type: "expense", amount: -1299, isEmergency: false },
  { date: "Mar 8", dateNum: 8, desc: "Dinner with friends — Koregaon Park", category: "dining_out", categoryName: "Dining Out", type: "expense", amount: -1100, isEmergency: false },
  { date: "Mar 9", dateNum: 9, desc: "Petrol fill-up", category: "transport", categoryName: "Transport", type: "expense", amount: -800, isEmergency: false },
  { date: "Mar 10", dateNum: 10, desc: "Zepto — groceries", category: "groceries", categoryName: "Groceries", type: "expense", amount: -950, isEmergency: false },
  { date: "Mar 12", dateNum: 12, desc: "Swiggy — pizza night", category: "dining_out", categoryName: "Dining Out", type: "expense", amount: -600, isEmergency: false },
  { date: "Mar 13", dateNum: 13, desc: "Gym membership", category: "fitness", categoryName: "Fitness", type: "expense", amount: -1200, isEmergency: false },
  { date: "Mar 14", dateNum: 14, desc: "Phone recharge", category: "phone", categoryName: "Phone+Internet", type: "expense", amount: -799, isEmergency: false },
  { date: "Mar 15", dateNum: 15, desc: "PVR movie + popcorn", category: "entertainment", categoryName: "Entertainment", type: "expense", amount: -650, isEmergency: false },
  { date: "Mar 16", dateNum: 16, desc: "Zepto — groceries", category: "groceries", categoryName: "Groceries", type: "expense", amount: -1100, isEmergency: false },
  { date: "Mar 17", dateNum: 17, desc: "Swiggy — weekend brunch", category: "dining_out", categoryName: "Dining Out", type: "expense", amount: -750, isEmergency: false },
  { date: "Mar 18", dateNum: 18, desc: "Amazon — earphones", category: "shopping", categoryName: "Shopping", type: "expense", amount: -1499, isEmergency: false },
  { date: "Mar 19", dateNum: 19, desc: "Chai + snacks (office area)", category: "misc", categoryName: "Miscellaneous", type: "expense", amount: -180, isEmergency: false },
  { date: "Mar 20", dateNum: 20, desc: "⚠️ Bike puncture + mechanic repair", category: "unexpected", categoryName: "Unexpected", type: "emergency", amount: -5000, isEmergency: true },
];

type SortKey = "dateNum" | "desc" | "categoryName" | "type" | "amount";

const TYPE_FILTERS = ["all", "income", "expense", "emergency"] as const;
type TypeFilter = typeof TYPE_FILTERS[number];

export default function TransactionsPage() {
  const [catFilter, setCatFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dateNum");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    let rows = [...ALL_TX];
    if (catFilter !== "all") rows = rows.filter(r => r.category === catFilter);
    if (typeFilter !== "all") rows = rows.filter(r => r.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.desc.toLowerCase().includes(q));
    }
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [catFilter, typeFilter, search, sortKey, sortAsc]);

  const totalIn = ALL_TX.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const totalOut = ALL_TX.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  const net = totalIn - totalOut;

  const uniqueCats = [...new Set(ALL_TX.map(r => r.category))];

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const TYPE_LABELS: Record<TypeFilter, string> = {
    all: "All",
    income: "Income",
    expense: "Expense",
    emergency: "Emergency",
  };

  return (
    <AppShell title="Transactions">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Transactions</h2>
            <p className="text-sm text-slate-500 mt-0.5">March 2025 · {filtered.length} records</p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Type filter pills */}
          <div className="flex gap-1.5">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  typeFilter === t
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-[#E2E8F0] text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {TYPE_LABELS[t]}
                {t === "emergency" && <span className="ml-1">🚨</span>}
              </button>
            ))}
          </div>

          {/* Category select */}
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          >
            <option value="all">All Categories</option>
            {uniqueCats.map(c => (
              <option key={c} value={c}>
                {ALL_TX.find(r => r.category === c)?.categoryName || c}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div
          className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  {([
                    ["dateNum", "Date"],
                    ["desc", "Description"],
                    ["categoryName", "Category"],
                    ["type", "Type"],
                    ["amount", "Amount"],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 cursor-pointer hover:text-slate-700 transition-colors select-none sticky top-0 bg-slate-50"
                    >
                      <div className="flex items-center gap-1">
                        {label} <SortIcon col={key} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => (
                  <tr
                    key={i}
                    className={`border-b border-[#E2E8F0] last:border-0 transition-colors hover:bg-slate-50 ${
                      tx.isEmergency
                        ? "bg-red-50/60"
                        : i % 2 === 1
                        ? "bg-slate-50/40"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-500 text-xs font-medium">{tx.date}</td>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">
                      {tx.desc}
                      {tx.isEmergency && <span className="ml-2 text-xs text-red-500">🚨</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{tx.categoryName}</td>
                    <td className="px-4 py-3">
                      {tx.isEmergency ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Emergency
                        </span>
                      ) : tx.type === "income" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Income
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Expense
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-semibold tabular-nums text-right text-sm ${
                      tx.amount > 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {tx.amount > 0 ? "+" : "−"}{formatINR(Math.abs(tx.amount))}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No transactions match your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Summary Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between text-sm">
            <span className="text-slate-500">
              In: <span className="font-semibold text-emerald-600">{formatINR(totalIn)}</span>
              <span className="mx-2 text-slate-300">·</span>
              Out: <span className="font-semibold text-red-500">{formatINR(totalOut)}</span>
            </span>
            <span className={`font-bold tabular-nums ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Net: {net >= 0 ? "+" : "−"}{formatINR(Math.abs(net))}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
