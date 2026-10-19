import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

// Verifies the Bearer token and attaches the current user to req.user.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }

  // Load the user on every request so role changes and deleted accounts take effect immediately
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  req.user = user;
  next();
});

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new HttpError(403, 'Admin access required'));
  }
  next();
}
