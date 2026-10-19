import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import BudgetCard from '../components/BudgetCard';
import CategoryBreakdown from '../components/CategoryBreakdown';
import ExpenseList from '../components/ExpenseList';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import type { DashboardData } from '../types';
import { currentMonthKey, formatDate, formatMoney, formatMonth } from '../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonthKey());
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    setError('');
    try {
      setData(await api.dashboard(m));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(month);
  }, [month, load]);

  async function saveBudget(amount: number) {
    await api.setBudget(month, amount);
    await load(month);
  }

  const summary = data?.summary;
  const tone = summary?.status === 'over' ? 'danger' : summary?.status === 'approaching' ? 'warn' : 'default';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi, {user?.name.split(' ')[0]}</h1>
          <p className="muted">Here is your spending for {formatMonth(month)}.</p>
        </div>
        <div className="page-actions">
          <label className="sr-only" htmlFor="month">
            Month
          </label>
          <input
            id="month"
            type="month"
            value={month}
            max={currentMonthKey()}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
          <Link to="/expenses/new" className="btn btn-primary">
            Add expense
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error} <button className="link-btn" onClick={() => void load(month)}>Retry</button>
        </div>
      )}

      {loading && !data && <div className="spinner" role="status" aria-label="Loading" />}

      {data && summary && (
        <div className={loading ? 'is-loading' : undefined}>
          <div className="grid stats">
            <StatCard
              label="Total spent"
              value={formatMoney(summary.spent)}
              hint={`${data.expenseCount} expense${data.expenseCount === 1 ? '' : 's'}`}
              tone={tone}
            />
            <StatCard
              label="Remaining budget"
              value={summary.remaining === null ? '-' : formatMoney(summary.remaining)}
              hint={summary.budget === null ? 'No budget set' : `of ${formatMoney(summary.budget)}`}
              tone={summary.status === 'over' ? 'danger' : 'default'}
            />
            <StatCard
              label="Highest expense"
              value={data.highestExpense ? formatMoney(data.highestExpense.amount) : '-'}
              hint={
                data.highestExpense
                  ? `${data.highestExpense.title} - ${formatDate(data.highestExpense.date)}`
                  : 'No expenses yet'
              }
            />
          </div>

          <div className="grid two-col">
            <BudgetCard summary={summary} onSave={saveBudget} />
            <section className="card">
              <h2>Spending by category</h2>
              <CategoryBreakdown rows={data.byCategory} emptyText="No spending recorded this month." />
            </section>
          </div>

          <section className="card">
            <div className="card-head">
              <h2>Recent expenses</h2>
              <Link to="/expenses" className="btn btn-ghost btn-sm">
                View all
              </Link>
            </div>
            {data.recentExpenses.length === 0 ? (
              <p className="muted">
                Nothing recorded for {formatMonth(month)}. <Link to="/expenses/new">Add your first expense</Link>.
              </p>
            ) : (
              <ExpenseList expenses={data.recentExpenses} compact />
            )}
          </section>
        </div>
      )}
    </>
  );
}
