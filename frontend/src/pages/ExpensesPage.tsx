import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ExpenseFilters from '../components/ExpenseFilters';
import ExpenseList from '../components/ExpenseList';
import Pagination from '../components/Pagination';
import { fetchExpenses, selectHasActiveFilters, setPage } from '../store/expensesSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { Expense } from '../types';
import { formatMoney } from '../utils/format';

export default function ExpensesPage() {
  const dispatch = useAppDispatch();
  const { filters, items, total, totalAmount, totalPages, status, error } = useAppSelector((s) => s.expenses);
  const hasActive = useAppSelector(selectHasActiveFilters);
  const [actionError, setActionError] = useState('');

  // Reload whenever any filter, search term, sort option or page changes
  useEffect(() => {
    void dispatch(fetchExpenses());
  }, [dispatch, filters]);

  async function handleDelete(expense: Expense) {
    if (!window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) return;
    setActionError('');
    try {
      await api.deleteExpense(expense.id);
      void dispatch(fetchExpenses());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete expense');
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Expenses</h1>
          <p className="muted">
            {status === 'succeeded' || items.length > 0
              ? `${total} expense${total === 1 ? '' : 's'} - ${formatMoney(totalAmount)} in total${hasActive ? ' (filtered)' : ''}`
              : 'Search, filter and manage everything you have spent.'}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/expenses/new" className="btn btn-primary">
            Add expense
          </Link>
        </div>
      </div>

      <ExpenseFilters />

      {(error || actionError) && (
        <div className="alert alert-error" role="alert">
          {actionError || error}
        </div>
      )}

      <section className={`card ${status === 'loading' ? 'is-loading' : ''}`}>
        {status === 'loading' && items.length === 0 ? (
          <div className="spinner" role="status" aria-label="Loading" />
        ) : items.length === 0 && status !== 'failed' ? (
          <div className="empty">
            <p>{hasActive ? 'No expenses match your filters.' : 'You have not recorded any expenses yet.'}</p>
            {!hasActive && (
              <Link to="/expenses/new" className="btn btn-primary">
                Add your first expense
              </Link>
            )}
          </div>
        ) : (
          <ExpenseList expenses={items} onDelete={handleDelete} />
        )}
        <Pagination page={filters.page} totalPages={totalPages} onChange={(p) => dispatch(setPage(p))} />
      </section>
    </>
  );
}
