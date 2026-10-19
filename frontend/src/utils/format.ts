const currency = import.meta.env.VITE_CURRENCY || 'USD';
const moneyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });

export const formatMoney = (n: number): string => moneyFormatter.format(n);

const pad = (n: number) => String(n).padStart(2, '0');

export const currentMonthKey = (d: Date = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const todayISO = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const formatDate = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const formatMonth = (month: string): string =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
