import {
  Home, Utensils, Bus, Smartphone, UtensilsCrossed, Film,
  ShoppingBag, Dumbbell, MoreHorizontal
} from "lucide-react";

export const MONTHLY_INCOME = 45000;
export const SAVINGS_TARGET = 25000;
export const GOAL_TOTAL = 150000;
export const GOAL_SAVED_TOTAL = 47000; // across 3 months

export interface CategoryData {
  name: string;
  icon: any;
  budget: number;
  spent: number;
  category: string;
  status: string;
}

export const CATEGORIES: CategoryData[] = [
  { name: "Rent", icon: Home, budget: 10000, spent: 10000, category: "rent", status: "Done" },
  { name: "Groceries", icon: Utensils, budget: 4000, spent: 3250, category: "groceries", status: "On Track" },
  { name: "Transport", icon: Bus, budget: 2000, spent: 1300, category: "transport", status: "On Track" },
  { name: "Phone+Internet", icon: Smartphone, budget: 800, spent: 799, category: "phone", status: "Done" },
  { name: "Dining Out", icon: UtensilsCrossed, budget: 3500, spent: 2900, category: "dining_out", status: "Almost Spent" },
  { name: "Entertainment", icon: Film, budget: 1000, spent: 1299, category: "entertainment", status: "Over Budget" },
  { name: "Shopping", icon: ShoppingBag, budget: 2000, spent: 2798, category: "shopping", status: "Over Budget" },
  { name: "Fitness", icon: Dumbbell, budget: 1200, spent: 1200, category: "fitness", status: "Done" },
  { name: "Miscellaneous", icon: MoreHorizontal, budget: 1500, spent: 180, category: "misc", status: "On Track" },
];

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export const TRANSACTIONS: Transaction[] = [
  { date: "Mar 1", description: "Rent", amount: 10000, category: "rent" },
  { date: "Mar 2", description: "Zepto groceries", amount: 1200, category: "groceries" },
  { date: "Mar 3", description: "Swiggy biryani", amount: 450, category: "dining_out" },
  { date: "Mar 5", description: "Metro recharge", amount: 500, category: "transport" },
  { date: "Mar 6", description: "Netflix", amount: 649, category: "entertainment" },
  { date: "Mar 7", description: "Zara t-shirt", amount: 1299, category: "shopping" },
  { date: "Mar 8", description: "Dinner Koregaon Park", amount: 1100, category: "dining_out" },
  { date: "Mar 9", description: "Petrol", amount: 800, category: "transport" },
  { date: "Mar 10", description: "Zepto groceries", amount: 950, category: "groceries" },
  { date: "Mar 12", description: "Swiggy pizza", amount: 600, category: "dining_out" },
  { date: "Mar 13", description: "Gym membership", amount: 1200, category: "fitness" },
  { date: "Mar 14", description: "Phone recharge", amount: 799, category: "phone" },
  { date: "Mar 15", description: "PVR movie", amount: 650, category: "entertainment" },
  { date: "Mar 16", description: "Zepto groceries", amount: 1100, category: "groceries" },
  { date: "Mar 17", description: "Swiggy brunch", amount: 750, category: "dining_out" },
  { date: "Mar 18", description: "Amazon earphones", amount: 1499, category: "shopping" },
  { date: "Mar 19", description: "Chai snacks", amount: 180, category: "misc" },
];

export function formatINR(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

export function getBaseSpent(): number {
  return CATEGORIES.reduce((s, c) => s + c.spent, 0);
}
