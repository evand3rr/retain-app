import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useCategories } from '../hooks/useCategories';
import { PAYMENT_METHODS } from '../types';
import type { PaymentMethod } from '../types';
import { todayISO } from '../utils/format';

interface FormState {
  title: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export default function ExpenseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();

  const [form, setForm] = useState<FormState>({
    title: '',
    amount: '',
    category: '',
    date: todayISO(),
    paymentMethod: 'Cash',
    notes: '',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Editing: load the existing expense
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .getExpense(id)
      .then((e) => {
        if (cancelled) return;
        setForm({
          title: e.title,
          amount: String(e.amount),
          category: e.category?.id ?? '',
          date: e.date,
          paymentMethod: e.paymentMethod,
          notes: e.notes,
        });
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load expense'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Creating: preselect the default ("Uncategorized") category once categories are loaded
  useEffect(() => {
    if (isEdit || form.category || categories.length === 0) return;
    const fallback = categories.find((c) => c.isDefault) ?? categories[0];
    setForm((f) => ({ ...f, category: fallback.id }));
  }, [isEdit, categories, form.category]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const amount = Number(form.amount);
    if (!form.title.trim()) return setError('Please enter a title.');
    if (!Number.isFinite(amount) || amount <= 0) return setError('Amount must be greater than zero.');
    if (!form.date) return setError('Please choose a date.');

    const payload = {
      title: form.title.trim(),
      amount,
      category: form.category,
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (id) await api.updateExpense(id, payload);
      else await api.createExpense(payload);
      navigate('/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save expense');
      setSaving(false);
    }
  }

  if (loading || categoriesLoading) return <div className="spinner" role="status" aria-label="Loading" />;

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/expenses" className="back-link">
            &larr; All expenses
          </Link>
          <h1>{isEdit ? 'Edit expense' : 'Add expense'}</h1>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            maxLength={120}
            placeholder="e.g. Groceries"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={(e) => update('category', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="payment">Payment method</label>
            <select
              id="payment"
              value={form.paymentMethod}
              onChange={(e) => update('paymentMethod', e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            rows={3}
            maxLength={500}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add expense'}
          </button>
          <Link to="/expenses" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
