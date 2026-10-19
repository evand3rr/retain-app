import { Router } from 'express';
import mongoose from 'mongoose';
import { Expense, PAYMENT_METHODS } from '../models/Expense.js';
import { Category } from '../models/Category.js';
import { authenticate } from '../middleware/auth.js';
import { ensureDefaultCategory } from '../services/bootstrap.js';
import { HttpError, asyncHandler, escapeRegex, isValidId, round2 } from '../utils/http.js';
import { nextDay, parseDateOnly } from '../utils/dates.js';
import { serializeExpense } from '../utils/serializers.js';

const router = Router();
router.use(authenticate); // every route below is scoped to the signed-in user

function parseAmountFilter(value, label) {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new HttpError(400, `${label} must be a non-negative number`);
  return n;
}

function buildFilter(query, userId) {
  const filter = { user: userId };
  const { search, category, paymentMethod, startDate, endDate, minAmount, maxAmount } = query;

  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { notes: rx }];
  }
  if (category) {
    if (!isValidId(category)) throw new HttpError(400, 'Invalid category filter');
    filter.category = new mongoose.Types.ObjectId(category);
  }
  if (paymentMethod) {
    if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Invalid payment method filter');
    filter.paymentMethod = paymentMethod;
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const d = parseDateOnly(startDate);
      if (!d) throw new HttpError(400, 'startDate must be in YYYY-MM-DD format');
      filter.date.$gte = d;
    }
    if (endDate) {
      const d = parseDateOnly(endDate);
      if (!d) throw new HttpError(400, 'endDate must be in YYYY-MM-DD format');
      filter.date.$lt = nextDay(d); // endDate is inclusive
    }
  }
  const min = parseAmountFilter(minAmount, 'minAmount');
  const max = parseAmountFilter(maxAmount, 'maxAmount');
  if (min !== null || max !== null) {
    filter.amount = {};
    if (min !== null) filter.amount.$gte = min;
    if (max !== null) filter.amount.$lte = max;
  }
  return filter;
}

async function validateExpense(body) {
  const errors = [];

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 120) errors.push('Title is required (max 120 characters)');

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) {
    errors.push('Amount must be a positive number');
  }

  const date = parseDateOnly(body.date);
  if (!date) errors.push('Date must be a valid date in YYYY-MM-DD format');

  if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
    errors.push(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }

  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (notes.length > 500) errors.push('Notes must be 500 characters or fewer');

  let categoryId;
  if (body.category) {
    if (!isValidId(body.category) || !(await Category.exists({ _id: body.category }))) {
      errors.push('Category not found');
    } else {
      categoryId = body.category;
    }
  } else {
    categoryId = (await ensureDefaultCategory())._id; // no category chosen -> "Uncategorized"
  }

  if (errors.length) throw new HttpError(400, errors[0], errors);
  return { title, amount: round2(amount), date, paymentMethod: body.paymentMethod, notes, category: categoryId };
}

// GET /api/expenses?search=&category=&paymentMethod=&startDate=&endDate=&minAmount=&maxAmount=&sortBy=date|amount&order=asc|desc&page=&limit=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req.query, req.user._id);
    const sortBy = req.query.sortBy === 'amount' ? 'amount' : 'date';
    const direction = req.query.order === 'asc' ? 1 : -1;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const [items, agg] = await Promise.all([
      Expense.find(filter)
        .sort({ [sortBy]: direction, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category', 'name'),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),
    ]);

    const total = agg[0]?.total ?? 0;
    res.json({
      items: items.map(serializeExpense),
      total,
      totalAmount: round2(agg[0]?.totalAmount ?? 0),
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  })
);

// POST /api/expenses
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = await validateExpense(req.body);
    const expense = await Expense.create({ ...data, user: req.user._id });
    await expense.populate('category', 'name');
    res.status(201).json({ expense: serializeExpense(expense) });
  })
);

// GET /api/expenses/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) throw new HttpError(404, 'Expense not found');
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id }).populate('category', 'name');
    if (!expense) throw new HttpError(404, 'Expense not found');
    res.json({ expense: serializeExpense(expense) });
  })
);

// PUT /api/expenses/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) throw new HttpError(404, 'Expense not found');
    const data = await validateExpense(req.body);
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // ownership enforced in the query itself
      { $set: data },
      { new: true, runValidators: true }
    ).populate('category', 'name');
    if (!expense) throw new HttpError(404, 'Expense not found');
    res.json({ expense: serializeExpense(expense) });
  })
);

// DELETE /api/expenses/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) throw new HttpError(404, 'Expense not found');
    const result = await Expense.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) throw new HttpError(404, 'Expense not found');
    res.json({ message: 'Expense deleted' });
  })
);

export default router;
