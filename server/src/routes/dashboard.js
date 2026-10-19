import { Router } from 'express';
import { Expense } from '../models/Expense.js';
import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { authenticate } from '../middleware/auth.js';
import { buildSummary } from '../services/budgets.js';
import { asyncHandler, round2 } from '../utils/http.js';
import { monthRange, resolveMonth } from '../utils/dates.js';
import { serializeExpense } from '../utils/serializers.js';

const router = Router();
router.use(authenticate);

// GET /api/dashboard?month=YYYY-MM
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = resolveMonth(req.query.month);
    const { start, end } = monthRange(month);
    const match = { user: req.user._id, date: { $gte: start, $lt: end } };

    const [totals, byCategory, highest, recent, budget] = await Promise.all([
      Expense.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'cat' } },
        { $sort: { total: -1 } },
      ]),
      Expense.findOne(match).sort({ amount: -1, date: -1 }).populate('category', 'name'),
      Expense.find(match).sort({ date: -1, createdAt: -1 }).limit(5).populate('category', 'name'),
      Budget.findOne({ user: req.user._id, month }),
    ]);

    res.json({
      month,
      summary: buildSummary(month, totals[0]?.total ?? 0, budget ? budget.amount : null),
      expenseCount: totals[0]?.count ?? 0,
      highestExpense: highest ? serializeExpense(highest) : null,
      byCategory: byCategory.map((row) => ({
        categoryId: row._id ? row._id.toString() : null,
        name: row.cat[0]?.name ?? 'Uncategorized',
        total: round2(row.total),
        count: row.count,
      })),
      recentExpenses: recent.map(serializeExpense),
    });
  })
);

export default router;
