import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'recipebox_jwt_secret_dev_2026';

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.recipebox_token || req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userStmt = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?');
    const user = userStmt.get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

export const optionalAuth = (req, res, next) => {
  const token = req.cookies?.recipebox_token || req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userStmt = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?');
    const user = userStmt.get(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
};
