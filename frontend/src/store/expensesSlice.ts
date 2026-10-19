import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';
import type { Expense, ExpenseFilters } from '../types';
import type { RootState } from './index';

// All expense filtering, searching, sorting and pagination state lives here. Components dispatch actions, the thunk reads the current filters from the store and asks the API for the matching page of expenses.
 

export const initialFilters: ExpenseFilters = {
  search: '',
  category: '',
  paymentMethod: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  order: 'desc',
  page: 1,
  limit: 10,
};

interface ExpensesState {
  filters: ExpenseFilters;
  items: Expense[];
  total: number;
  totalAmount: number;
  totalPages: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  requestId: string | null; // latest in-flight request; older responses are ignored
}

const initialState: ExpensesState = {
  filters: initialFilters,
  items: [],
  total: 0,
  totalAmount: 0,
  totalPages: 1,
  status: 'idle',
  error: null,
  requestId: null,
};

export const fetchExpenses = createAsyncThunk<
  Awaited<ReturnType<typeof api.listExpenses>>,
  void,
  { state: RootState; rejectValue: string }
>('expenses/fetch', async (_arg, { getState, rejectWithValue }) => {
  try {
    return await api.listExpenses(getState().expenses.filters);
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : 'Failed to load expenses');
  }
});

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    /** Update one or more filters; any change goes back to the first page. */
    setFilters(state, action: PayloadAction<Partial<Omit<ExpenseFilters, 'page' | 'limit'>>>) {
      Object.assign(state.filters, action.payload);
      state.filters.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    resetFilters(state) {
      state.filters = { ...initialFilters, limit: state.filters.limit };
    },
    /** Clears everything (used when the user signs out). */
    resetExpenses: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return; // stale response
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.totalAmount = action.payload.totalAmount;
        state.totalPages = action.payload.totalPages;
        // If the page we were on no longer exists (e.g. after deleting the last item), step back.
        if (state.filters.page > action.payload.totalPages) state.filters.page = action.payload.totalPages;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Failed to load expenses';
      });
  },
});

export const { setFilters, setPage, resetFilters, resetExpenses } = expensesSlice.actions;
export default expensesSlice.reducer;

export const selectHasActiveFilters = (state: RootState): boolean => {
  const f = state.expenses.filters;
  return Boolean(
    f.search || f.category || f.paymentMethod || f.startDate || f.endDate || f.minAmount || f.maxAmount
  );
};
