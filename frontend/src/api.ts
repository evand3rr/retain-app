import type {
  AdminInsights,
  BudgetSummary,
  Category,
  DashboardData,
  Expense,
  ExpenseFilters,
  ExpenseInput,
  ExpensePage,
  User,
} from './types';

const BASE: string = import.meta.env.VITE_API_URL || '/api';

export const TOKEN_KEY = 'retain.token';
export const UNAUTHORIZED_EVENT = 'retain:unauthorized';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Query = Record<string, string | number | undefined | null>;

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query } = {}
): Promise<T> {
  const qs = new URLSearchParams();
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
    }
  }
  const queryString = qs.toString();
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${queryString ? `?${queryString}` : ''}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // An expired/invalid session: tell AuthContext to sign the user out.
    if (res.status === 401 && token && !path.startsWith('/auth/signin')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, data?.message || res.statusText || 'Request failed');
  }
  return data as T;
}

export const api = {
  // auth
  signUp: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/signup', { method: 'POST', body: { name, email, password } }),
  signIn: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/signin', { method: 'POST', body: { email, password } }),
  me: () => request<{ user: User }>('/auth/me').then((r) => r.user),

  // categories
  listCategories: () => request<{ categories: Category[] }>('/categories').then((r) => r.categories),
  createCategory: (name: string) =>
    request<{ category: Category }>('/categories', { method: 'POST', body: { name } }).then((r) => r.category),
  updateCategory: (id: string, name: string) =>
    request<{ category: Category }>(`/categories/${id}`, { method: 'PUT', body: { name } }).then((r) => r.category),
  deleteCategory: (id: string) =>
    request<{ message: string; reassignedExpenses: number }>(`/categories/${id}`, { method: 'DELETE' }),

  // expenses
  listExpenses: (f: ExpenseFilters) =>
    request<ExpensePage>('/expenses', {
      query: {
        search: f.search.trim(),
        category: f.category,
        paymentMethod: f.paymentMethod,
        startDate: f.startDate,
        endDate: f.endDate,
        minAmount: f.minAmount,
        maxAmount: f.maxAmount,
        sortBy: f.sortBy,
        order: f.order,
        page: f.page,
        limit: f.limit,
      },
    }),
  getExpense: (id: string) => request<{ expense: Expense }>(`/expenses/${id}`).then((r) => r.expense),
  createExpense: (input: ExpenseInput) =>
    request<{ expense: Expense }>('/expenses', { method: 'POST', body: input }).then((r) => r.expense),
  updateExpense: (id: string, input: ExpenseInput) =>
    request<{ expense: Expense }>(`/expenses/${id}`, { method: 'PUT', body: input }).then((r) => r.expense),
  deleteExpense: (id: string) => request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),

  // budgets & dashboard
  getBudget: (month: string) => request<{ summary: BudgetSummary }>(`/budgets/${month}`).then((r) => r.summary),
  setBudget: (month: string, amount: number) =>
    request<{ summary: BudgetSummary }>(`/budgets/${month}`, { method: 'PUT', body: { amount } }).then(
      (r) => r.summary
    ),
  dashboard: (month: string) => request<DashboardData>('/dashboard', { query: { month } }),

  // admin
  adminInsights: () => request<AdminInsights>('/admin/insights'),
};
