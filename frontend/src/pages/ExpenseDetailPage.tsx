import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Expense } from '../types';
import { formatDate, formatDateTime, formatMoney } from '../utils/format';

export default function ExpenseDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getExpense(id)
      .then((e) => !cancelled && setExpense(e))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load expense'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!expense || !window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteExpense(expense.id);
      navigate('/expenses', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete expense');
    }
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading" />;

  if (!expense) {
    return (
      <div className="card empty">
        <p>{error || 'Expense not found.'}</p>
        <Link to="/expenses" className="btn btn-secondary">
          Back to expenses
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/expenses" className="back-link">
            &larr; All expenses
          </Link>
          <h1>{expense.title}</h1>
        </div>
        <div className="page-actions">
          <Link to={`/expenses/${expense.id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <section className="card detail">
        <div className="detail-amount">{formatMoney(expense.amount)}</div>
        <dl className="detail-list">
          <div>
            <dt>Category</dt>
            <dd>
              <span className="chip">{expense.category?.name ?? 'Uncategorized'}</span>
            </dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(expense.date)}</dd>
          </div>
          <div>
            <dt>Payment method</dt>
            <dd>{expense.paymentMethod}</dd>
          </div>
          <div>
            <dt>Recorded</dt>
            <dd>{formatDateTime(expense.createdAt)}</dd>
          </div>
          <div className="detail-notes">
            <dt>Notes</dt>
            <dd>{expense.notes || <span className="muted">No notes</span>}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
