import mongoose from 'mongoose';

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Mobile Money',
  'Bank Transfer',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    date: { type: Date, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
