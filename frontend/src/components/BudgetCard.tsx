import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { BudgetStatus, BudgetSummary } from '../types';
import { formatMoney, formatMonth } from '../utils/format';

interface BudgetCardProps {
  summary: BudgetSummary;
  onSave: (amount: number) => Promise<void>;
}

const STATUS_LABEL: Record<BudgetStatus, string> = {
  'no-budget': 'No budget set',
  within: 'Within budget',
  approaching: 'Approaching budget',
  over: 'Over budget',
};

export default function BudgetCard({ summary, onSave }: BudgetCardProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(summary.budget !== null ? String(summary.budget) : '');
    setEditing(false);
    setError('');
  }, [summary.month, summary.budget]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a budget greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(amount);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save budget');
    } finally {
      setSaving(false);
    }
  }

  const pct = summary.percentUsed ?? 0;

  return (
    <section className="card budget-card" aria-labelledby="budget-title">
      <div className="card-head">
        <h2 id="budget-title">Budget for {formatMonth(summary.month)}</h2>
        <span className={`badge badge-${summary.status}`}>{STATUS_LABEL[summary.status]}</span>
      </div>

      {summary.budget !== null && (
        <>
          <div
            className={`progress progress-${summary.status}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, Math.round(pct))}
            aria-label="Budget used"
          >
            <div className="progress-bar" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <dl className="budget-figures">
            <div>
              <dt>Budget</dt>
              <dd>{formatMoney(summary.budget)}</dd>
            </div>
            <div>
              <dt>Spent</dt>
              <dd>
                {formatMoney(summary.spent)} <small>({pct}%)</small>
              </dd>
            </div>
            <div>
              <dt>{(summary.remaining ?? 0) < 0 ? 'Over by' : 'Remaining'}</dt>
              <dd className={(summary.remaining ?? 0) < 0 ? 'text-danger' : ''}>
                {formatMoney(Math.abs(summary.remaining ?? 0))}
              </dd>
            </div>
          </dl>
        </>
      )}

      {summary.budget === null && !editing && (
        <p className="muted">
          You have spent {formatMoney(summary.spent)} this month. Set a monthly budget to track what is left.
        </p>
      )}

      {editing ? (
        <form className="inline-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="budget-amount">
            Monthly budget
          </label>
          <input
            id="budget-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Monthly budget"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button className="btn btn-secondary" type="button" onClick={() => setEditing(true)}>
          {summary.budget === null ? 'Set budget' : 'Update budget'}
        </button>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}
