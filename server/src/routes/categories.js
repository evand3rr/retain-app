import { Router } from 'express';
import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { ensureDefaultCategory } from '../services/bootstrap.js';
import { HttpError, asyncHandler, isDuplicateKey, isValidId } from '../utils/http.js';

const router = Router();
router.use(authenticate);

function cleanName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 40) throw new HttpError(400, 'Category name is required (max 40 characters)');
  return name;
}

// GET /api/categories; any signed-in user can see the list of categories, sorted by default first, then alphabetically
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await Category.find()
      .collation({ locale: 'en', strength: 2 })
      .sort({ isDefault: -1, name: 1 });
    res.json({ categories: categories.map((c) => c.toPublic()) });
  })
);

// POST /api/categories; admin only
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = cleanName(req.body.name);
    try {
      const category = await Category.create({ name });
      res.status(201).json({ category: category.toPublic() });
    } catch (err) {
      if (isDuplicateKey(err)) throw new HttpError(409, 'A category with that name already exists');
      throw err;
    }
  })
);

// PUT /api/categories/:id; admin only
router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) throw new HttpError(404, 'Category not found');
    const name = cleanName(req.body.name);
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');
    if (category.isDefault) throw new HttpError(400, 'The default category cannot be renamed');

    category.name = name;
    try {
      await category.save();
    } catch (err) {
      if (isDuplicateKey(err)) throw new HttpError(409, 'A category with that name already exists');
      throw err;
    }
    res.json({ category: category.toPublic() });
  })
);

// DELETE /api/categories/:id; admin only. Expenses in the deleted category move to the default category.
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) throw new HttpError(404, 'Category not found');
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');
    if (category.isDefault) throw new HttpError(400, 'The default category cannot be deleted');

    const fallback = await ensureDefaultCategory();
    const result = await Expense.updateMany(
      { category: category._id },
      { $set: { category: fallback._id } }
    );
    await category.deleteOne();

    res.json({
      message: `Category deleted. ${result.modifiedCount} expense(s) moved to "${fallback.name}".`,
      reassignedExpenses: result.modifiedCount,
      reassignedTo: fallback.toPublic(),
    });
  })
);

export default router;
