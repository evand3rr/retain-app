import bcrypt from 'bcryptjs';
import { Category, DEFAULT_CATEGORY_NAME } from '../models/Category.js';
import { User } from '../models/User.js';
import { config } from '../config.js';

const STARTER_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Education',
];

// Returns the default ("Uncategorized") category and creating it if needed
export async function ensureDefaultCategory() {
  const existing = await Category.findOne({ isDefault: true });
  if (existing) return existing;
  return Category.findOneAndUpdate(
    { name: DEFAULT_CATEGORY_NAME },
    { $set: { isDefault: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Creates starter categories on a fresh database then guarantees the default category exists
export async function ensureCategories() {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(STARTER_CATEGORIES.map((name) => ({ name })), { ordered: false });
  }
  return ensureDefaultCategory();
}

// Creates the admin account described by ADMIN_EMAIL / ADMIN_PASSWORD in the .env file, if it doesn't already exist. If the account exists but is not an admin, it is promoted to admin.
export async function ensureAdmin() {
  const { name, email, password } = config.admin;
  if (!email || !password) {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set: no admin account will be created.');
    return null;
  }
  let admin = await User.findOne({ email });
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 10);
    admin = await User.create({ name, email, passwordHash, role: 'admin' });
    console.log(`Admin account created for ${email}`);
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
    console.log(`Existing user ${email} promoted to admin`);
  }
  return admin;
}

export async function bootstrap() {
  await ensureCategories();
  await ensureAdmin();
}
