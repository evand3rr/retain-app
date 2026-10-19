import { config } from '../config.js';
import { HttpError } from '../utils/http.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: details[0] || 'Validation failed', details });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier or value' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists' });
  }
  console.error(err);
  res.status(500).json({
    message: config.env === 'production' ? 'Internal server error' : err.message,
  });
}
