export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
}

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Mobile Money',
  'Bank Transfer',
  'Other',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: { id: string; name: string } | null;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  category: string; // category id ('' lets the server use "Uncategorized")
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export type SortBy = 'date' | 'amount';
export type SortOrder = 'asc' | 'desc';

export interface ExpenseFilters {
  search: string;
  category: string;
  paymentMethod: PaymentMethod | '';
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortBy;
  order: SortOrder;
  page: number;
  limit: number;
}

export interface ExpensePage {
  items: Expense[];
  total: number;
  totalAmount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type BudgetStatus = 'no-budget' | 'within' | 'approaching' | 'over';

export interface BudgetSummary {
  month: string;
  budget: number | null;
  spent: number;
  remaining: number | null;
  percentUsed: number | null;
  status: BudgetStatus;
}

export interface CategorySpend {
  categoryId: string | null;
  name: string;
  total: number;
  count: number;
}

export interface DashboardData {
  month: string;
  summary: BudgetSummary;
  expenseCount: number;
  highestExpense: Expense | null;
  byCategory: CategorySpend[];
  recentExpenses: Expense[];
}

export interface CategoryStat {
  id: string;
  name: string;
  count: number;
  total: number;
}

export interface AdminRecentExpense extends Expense {
  user: { id: string; name: string } | null;
}

export interface AdminInsights {
  currentMonth: string;
  totalUsers: number;
  totalExpenses: number;
  totalExpenseValue: number;
  expensesThisMonth: number;
  spendingPerCategory: CategoryStat[];
  topCategories: CategoryStat[];
  bottomCategories: CategoryStat[];
  recentExpenses: AdminRecentExpense[];
  recentUsers: User[];
}
