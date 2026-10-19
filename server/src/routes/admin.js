import { Router } from 'express';
import { User } from '../models/User.js';
import { Expense } from '../models/Expense.js';
import { Category } from '../models/Category.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, round2 } from '../utils/http.js';
import { currentMonth, monthRange } from '../utils/dates.js';
import { serializeExpense } from '../utils/serializers.js';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/insights; platform-wide statistics for the admin dashboard
router.get(
  '/insights',
  asyncHandler(async (_req, res) => {
    const month = currentMonth();
    const { start, end } = monthRange(month);

    const [totalUsers, totals, expensesThisMonth, perCategoryAgg, categories, recentExpenses, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        Expense.aggregate([{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
        Expense.countDocuments({ date: { $gte: start, $lt: end } }),
        Expense.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
        Category.find().lean(),
        Expense.find().sort({ createdAt: -1 }).limit(5).populate('category', 'name').populate('user', 'name'),
        User.find().sort({ createdAt: -1 }).limit(5),
      ]);

    const stats = new Map(perCategoryAgg.map((r) => [String(r._id), r]));
    // Every category appears, even with zero expenses.
    const perCategory = categories.map((c) => {
      const s = stats.get(String(c._id));
      return { id: c._id.toString(), name: c.name, count: s?.count ?? 0, total: round2(s?.total ?? 0) };
    });

    const byUsageDesc = [...perCategory].sort(
      (a, b) => b.count - a.count || b.total - a.total || a.name.localeCompare(b.name)
    );
    const byUsageAsc = [...perCategory].sort(
      (a, b) => a.count - b.count || a.total - b.total || a.name.localeCompare(b.name)
    );

    res.json({
      currentMonth: month,
      totalUsers,
      totalExpenses: totals[0]?.count ?? 0,
      totalExpenseValue: round2(totals[0]?.total ?? 0),
      expensesThisMonth,
      spendingPerCategory: [...perCategory].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
      topCategories: byUsageDesc.slice(0, 5),
      bottomCategories: byUsageAsc.slice(0, 5),
      recentExpenses: recentExpenses.map((e) => ({
        ...serializeExpense(e),
        user: e.user ? { id: e.user._id.toString(), name: e.user.name } : null,
      })),
      recentUsers: recentUsers.map((u) => u.toPublic()),
    });
  })
);

export default router;
