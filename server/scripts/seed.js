// Optional demo data: npm run seed   (from the repo root or the server folder)
// Creates a demo user (demo@retain.app / Demo1234!), sample expenses for this and last month, and a budget.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { assertConfig, config } from '../src/config.js';
import { ensureAdmin, ensureCategories } from '../src/services/bootstrap.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Expense, PAYMENT_METHODS } from '../src/models/Expense.js';
import { Budget } from '../src/models/Budget.js';
import { currentMonth } from '../src/utils/dates.js';

const SAMPLE = [
  ['Groceries', 'Food & Dining', 54.2],
  ['Lunch with team', 'Food & Dining', 18.5],
  ['Bus pass', 'Transport', 30],
  ['Taxi home', 'Transport', 12.75],
  ['Monthly rent', 'Housing', 400],
  ['Electricity bill', 'Utilities', 45.9],
  ['Internet', 'Utilities', 35],
  ['Movie night', 'Entertainment', 15],
  ['Pharmacy', 'Health', 22.4],
  ['New headphones', 'Shopping', 79.99],
  ['Online course', 'Education', 49],
  ['Coffee', 'Food & Dining', 4.5],
];

function randomDateInMonth(year, monthIndex, maxDay) {
  const day = 1 + Math.floor(Math.random() * maxDay);
  return new Date(Date.UTC(year, monthIndex, day));
}

async function main() {
  assertConfig();
  await mongoose.connect(config.mongoUri);
  await ensureCategories();
  await ensureAdmin();

  const email = 'demo@retain.app';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Demo User',
      email,
      passwordHash: await bcrypt.hash('Demo1234!', 10),
      role: 'user',
    });
  }
  await Expense.deleteMany({ user: user._id });

  const categories = await Category.find();
  const byName = new Map(categories.map((c) => [c.name, c]));
  const fallback = categories.find((c) => c.isDefault);
  const now = new Date();
  const docs = [];

  for (const offset of [0, 1]) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const maxDay = offset === 0 ? Math.max(1, now.getUTCDate()) : 28;
    for (const [title, catName, amount] of SAMPLE) {
      docs.push({
        user: user._id,
        title,
        amount,
        category: (byName.get(catName) || fallback)._id,
        date: randomDateInMonth(d.getUTCFullYear(), d.getUTCMonth(), maxDay),
        paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
        notes: '',
      });
    }
  }
  await Expense.insertMany(docs);
  await Budget.findOneAndUpdate(
    { user: user._id, month: currentMonth() },
    { $set: { amount: 800 } },
    { upsert: true }
  );

  console.log(`Seeded ${docs.length} expenses for ${email} (password: Demo1234!)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
