import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import type { AdminInsights as Insights, CategoryStat } from '../../types';
import { formatDate, formatDateTime, formatMoney, formatMonth } from '../../utils/format';
import CategoryBreakdown from '../CategoryBreakdown';
import StatCard from '../StatCard';

function UsageTable({ rows }: { rows: CategoryStat[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Category</th>
          <th className="num">Expenses</th>
          <th className="num">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.name}</td>
            <td className="num">{r.count}</td>
            <td className="num">{formatMoney(r.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminInsights() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .adminInsights()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load insights'));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        {error}
      </div>
    );
  }
  if (!data) return <div className="spinner" role="status" aria-label="Loading" />;

  return (
    <>
      <div className="grid stats stats-4">
        <StatCard label="Registered users" value={data.totalUsers} />
        <StatCard label="Expenses recorded" value={data.totalExpenses} />
        <StatCard label="Total expense value" value={formatMoney(data.totalExpenseValue)} />
        <StatCard
          label="Expenses this month"
          value={data.expensesThisMonth}
          hint={formatMonth(data.currentMonth)}
        />
      </div>

      <div className="grid two-col">
        <section className="card">
          <h2>Total spending per category</h2>
          <CategoryBreakdown rows={data.spendingPerCategory} emptyText="No categories yet." />
        </section>

        <div className="stack">
          <section className="card">
            <h2>Top 5 most-used categories</h2>
            <UsageTable rows={data.topCategories} />
          </section>
          <section className="card">
            <h2>Bottom 5 least-used categories</h2>
            <UsageTable rows={data.bottomCategories} />
          </section>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card">
          <h2>Recently added expenses</h2>
          {data.recentExpenses.length === 0 ? (
            <p className="muted">No expenses have been recorded yet.</p>
          ) : (
            <ul className="plain-list">
              {data.recentExpenses.map((e) => (
                <li key={e.id}>
                  <div>
                    <strong>{e.title}</strong>
                    <div className="muted small">
                      {e.user?.name ?? 'Unknown user'} - {e.category?.name ?? 'Uncategorized'} - {formatDate(e.date)}
                    </div>
                  </div>
                  <span className="amount">{formatMoney(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Recently registered users</h2>
          {data.recentUsers.length === 0 ? (
            <p className="muted">No users yet.</p>
          ) : (
            <ul className="plain-list">
              {data.recentUsers.map((u) => (
                <li key={u.id}>
                  <div>
                    <strong>{u.name}</strong>
                    {u.role === 'admin' && <span className="badge badge-admin">admin</span>}
                    <div className="muted small">{u.email}</div>
                  </div>
                  <span className="muted small">{formatDateTime(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <p className="muted small">
        <Link to="/">Back to my dashboard</Link>
      </p>
    </>
  );
}
