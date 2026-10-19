import { Router } from 'express';
import { Budget } from '../models/Budget.js';
import { Expense } from '../models/Expense.js';
import { authenticate } from '../middleware/auth.js';
import { buildSummary } from '../services/budgets.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { isValidMonth, monthRange } from '../utils/dates.js';

const router = Router();
router.use(authenticate);

function requireMonth(param) {
  if (!isValidMonth(param)) throw new HttpError(400, 'Month must be in YYYY-MM format');
  return param;
}

async function summaryFor(userId, month) {
  const { start, end } = monthRange(month);
  const [budget, agg] = await Promise.all([
    Budget.findOne({ user: userId, month }),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  return buildSummary(month, agg[0]?.total ?? 0, budget ? budget.amount : null);
}

// GET /api/budgets/:month; budget, spent, remaining and status for that month
router.get(
  '/:month',
  asyncHandler(async (req, res) => {
    const month = requireMonth(req.params.month);
    res.json({ summary: await summaryFor(req.user._id, month) });
  })
);

// PUT /api/budgets/:month; create or update the monthly budget
router.put(
  '/:month',
  asyncHandler(async (req, res) => {
    const month = requireMonth(req.params.month);
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) {
      throw new HttpError(400, 'Budget amount must be a positive number');
    }
    await Budget.findOneAndUpdate(
      { user: req.user._id, month },
      { $set: { amount } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ summary: await summaryFor(req.user._id, month) });
  })
);

// DELETE /api/budgets/:month
router.delete(
  '/:month',
  asyncHandler(async (req, res) => {
    const month = requireMonth(req.params.month);
    await Budget.deleteOne({ user: req.user._id, month });
    res.json({ summary: await summaryFor(req.user._id, month) });
  })
);

export default router;
