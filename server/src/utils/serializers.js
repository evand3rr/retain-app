import { toDateOnly } from './dates.js';

export function serializeExpense(e) {
  const cat = e.category && e.category._id ? e.category : null;
  return {
    id: e._id.toString(),
    title: e.title,
    amount: e.amount,
    category: cat ? { id: cat._id.toString(), name: cat.name } : null,
    date: toDateOnly(e.date),
    paymentMethod: e.paymentMethod,
    notes: e.notes || '',
    createdAt: e.createdAt,
  };
}
