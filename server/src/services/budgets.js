import { round2 } from '../utils/http.js';

export const APPROACHING_THRESHOLD = 0.8;

// within: < 80% used, approaching: 80%-100% used, over: > 100% used.
export function budgetStatus(spent, budget) {
  if (budget === null || budget === undefined || budget <= 0) return 'no-budget';
  const ratio = spent / budget;
  if (ratio > 1) return 'over';
  if (ratio >= APPROACHING_THRESHOLD) return 'approaching';
  return 'within';
}

export function buildSummary(month, spent, budgetAmount) {
  const hasBudget = budgetAmount !== null && budgetAmount !== undefined;
  const spentRounded = round2(spent);
  return {
    month,
    budget: hasBudget ? round2(budgetAmount) : null,
    spent: spentRounded,
    remaining: hasBudget ? round2(budgetAmount - spentRounded) : null,
    percentUsed: hasBudget && budgetAmount > 0 ? Math.round((spentRounded / budgetAmount) * 1000) / 10 : null,
    status: budgetStatus(spentRounded, hasBudget ? budgetAmount : null),
  };
}
