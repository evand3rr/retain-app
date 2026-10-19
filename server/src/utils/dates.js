import { HttpError } from './http.js';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function currentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isValidMonth(month) {
  return typeof month === 'string' && MONTH_RE.test(month);
}

export function resolveMonth(value) {
  if (value === undefined || value === '') return currentMonth();
  if (!isValidMonth(value)) throw new HttpError(400, 'Month must be in YYYY-MM format');
  return value;
}

// Half-open UTC range (start, end) covering the given YYYY-MM month. 
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

// Parses YYYY-MM-DD into a UTC-midnight Date or null if invalid
export function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null;
  return d;
}

export const toDateOnly = (d) => d.toISOString().slice(0, 10);

export const nextDay = (d) => new Date(d.getTime() + DAY_MS);
