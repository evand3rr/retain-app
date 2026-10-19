import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler, isDuplicateKey } from '../utils/http.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/signup; public sign up always creates a regular user
router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req, res) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name || name.length > 80) throw new HttpError(400, 'Name is required (max 80 characters)');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'A valid email address is required');
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await User.create({ name, email, passwordHash, role: 'user' });
    } catch (err) {
      if (isDuplicateKey(err)) throw new HttpError(409, 'An account with that email already exists');
      throw err;
    }
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  })
);

// POST /api/auth/signin
router.post(
  '/signin',
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) throw new HttpError(400, 'Email and password are required');

    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!ok) throw new HttpError(401, 'Invalid email or password');

    res.json({ token: signToken(user), user: user.toPublic() });
  })
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

export default router;
