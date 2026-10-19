export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const isValidId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

export const isDuplicateKey = (err) => err && (err.code === 11000 || err.code === 11001);

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
