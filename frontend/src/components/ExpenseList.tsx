import { Link } from 'react-router-dom';
import type { Expense } from '../types';
import { formatDate, formatMoney } from '../utils/format';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (expense: Expense) => void;
  compact?: boolean;
}

export default function ExpenseList({ expenses, onDelete, compact = false }: ExpenseListProps) {
  return (
    <div className="table-wrap">
      <table className="table responsive-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Date</th>
            {!compact && <th>Payment</th>}
            <th className="num">Amount</th>
            {onDelete && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td data-label="Title">
                <Link to={`/expenses/${e.id}`} className="row-link">
                  {e.title}
                </Link>
              </td>
              <td data-label="Category">
                <span className="chip">{e.category?.name ?? 'Uncategorized'}</span>
              </td>
              <td data-label="Date">{formatDate(e.date)}</td>
              {!compact && <td data-label="Payment">{e.paymentMethod}</td>}
              <td data-label="Amount" className="num">
                {formatMoney(e.amount)}
              </td>
              {onDelete && (
                <td data-label="Actions" className="actions-col">
                  <Link className="btn btn-ghost btn-sm" to={`/expenses/${e.id}/edit`}>
                    Edit
                  </Link>
                  <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => onDelete(e)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
