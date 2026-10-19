import { useEffect, useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { resetFilters, selectHasActiveFilters, setFilters } from '../store/expensesSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { PAYMENT_METHODS } from '../types';
import type { PaymentMethod, SortBy, SortOrder } from '../types';

// Search, filter and sort controls
export default function ExpenseFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.expenses.filters);
  const hasActive = useAppSelector(selectHasActiveFilters);
  const { categories } = useCategories();

  // Free-text and numeric inputs keep a local draft and are committed to Redux after a short pause.
  const [search, setSearch] = useState(filters.search);
  const [minAmount, setMinAmount] = useState(filters.minAmount);
  const [maxAmount, setMaxAmount] = useState(filters.maxAmount);

  useEffect(() => {
    if (search === filters.search && minAmount === filters.minAmount && maxAmount === filters.maxAmount) return;
    const t = setTimeout(() => dispatch(setFilters({ search, minAmount, maxAmount })), 350);
    return () => clearTimeout(t);
  }, [search, minAmount, maxAmount, filters.search, filters.minAmount, filters.maxAmount, dispatch]);

  function handleReset() {
    setSearch('');
    setMinAmount('');
    setMaxAmount('');
    dispatch(resetFilters());
  }

  return (
    <section className="card filters" aria-label="Search and filter expenses">
      <div className="filters-grid">
        <div className="field field-wide">
          <label htmlFor="f-search">Search</label>
          <input
            id="f-search"
            type="search"
            placeholder="Search title or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="f-category">Category</label>
          <select
            id="f-category"
            value={filters.category}
            onChange={(e) => dispatch(setFilters({ category: e.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="f-payment">Payment method</label>
          <select
            id="f-payment"
            value={filters.paymentMethod}
            onChange={(e) => dispatch(setFilters({ paymentMethod: e.target.value as PaymentMethod | '' }))}
          >
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="f-start">From date</label>
          <input
            id="f-start"
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) => dispatch(setFilters({ startDate: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="f-end">To date</label>
          <input
            id="f-end"
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => dispatch(setFilters({ endDate: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="f-min">Min amount</label>
          <input
            id="f-min"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="f-max">Max amount</label>
          <input
            id="f-max"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="f-sort">Sort by</label>
          <select
            id="f-sort"
            value={`${filters.sortBy}:${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split(':') as [SortBy, SortOrder];
              dispatch(setFilters({ sortBy, order }));
            }}
          >
            <option value="date:desc">Date (newest first)</option>
            <option value="date:asc">Date (oldest first)</option>
            <option value="amount:desc">Amount (high to low)</option>
            <option value="amount:asc">Amount (low to high)</option>
          </select>
        </div>
      </div>

      <div className="filters-foot">
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleReset} disabled={!hasActive}>
          Clear filters
        </button>
      </div>
    </section>
  );
}
