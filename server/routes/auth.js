import express from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'recipebox_jwt_secret_dev_2026';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Normalization utilities
function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : '';
}

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    // If 10-digit Indian number, add +91
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

// 1. Send OTP
router.post('/send-otp', (req, res) => {
  try {
    let { identifier, type } = req.body || {};

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Please provide an email address or mobile number.' });
    }

    identifier = identifier.trim();

    // Auto-detect type if not explicitly provided
    if (!type) {
      type = identifier.includes('@') ? 'email' : 'phone';
    } else {
      type = type.toLowerCase().trim();
    }

    if (type !== 'email' && type !== 'phone') {
      return res.status(400).json({ error: 'Type must be email or phone' });
    }

    let normalizedIdentifier = '';
    if (type === 'email') {
      normalizedIdentifier = normalizeEmail(identifier);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
        return res.status(400).json({ error: 'Please enter a valid email address (e.g. chef@example.com)' });
      }
    } else {
      normalizedIdentifier = normalizePhone(identifier);
      if (!/^\+[1-9]\d{6,14}$/.test(normalizedIdentifier)) {
        return res.status(400).json({ error: 'Please enter a valid mobile number with country code (e.g. +91 98765 43210)' });
      }
    }

    const now = Date.now();

    // Rate limiting: Check if an OTP was sent in the last 60 seconds
    const recentOtpStmt = db.prepare(`
      SELECT created_at FROM otps
      WHERE identifier = ? AND consumed = 0
      ORDER BY id DESC LIMIT 1
    `);
    const recentOtp = recentOtpStmt.get(normalizedIdentifier);

    if (recentOtp && (now - recentOtp.created_at) < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - recentOtp.created_at)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSeconds}s before requesting a new OTP`,
        cooldownRemaining: waitSeconds
      });
    }

    // Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.createHash('sha256').update(otp + salt).digest('hex');
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiration

    // Invalidate previous unconsumed OTPs for this identifier
    db.prepare('UPDATE otps SET consumed = 1 WHERE identifier = ? AND consumed = 0').run(normalizedIdentifier);

    // Save new OTP record
    const insertOtpStmt = db.prepare(`
      INSERT INTO otps (identifier, type, otp_hash, salt, attempts, expires_at, consumed, created_at)
      VALUES (?, ?, ?, ?, 0, ?, 0, ?)
    `);
    insertOtpStmt.run(normalizedIdentifier, type, otpHash, salt, expiresAt, now);

    // Always log OTP on server console for deployment debugging and verification
    console.log(`[AUTH] One-Time Password for ${normalizedIdentifier}: ${otp}`);

    const response = {
      success: true,
      message: `A 6-digit verification code has been sent to your ${type}.`,
      identifier: normalizedIdentifier,
      type,
      expiresInSeconds: 300
    };

    // Return dev_otp in non-production or when SHOW_DEMO_OTP is enabled
    if (IS_DEV || process.env.SHOW_DEMO_OTP === 'true') {
      response.dev_otp = otp;
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in /send-otp:', err);
    return res.status(500).json({ error: 'Failed to generate verification code' });
  }
});

// 2. Verify OTP
router.post('/verify-otp', (req, res) => {
  try {
    let { identifier, otp, type } = req.body || {};

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP code are required' });
    }

    identifier = identifier.trim();
    if (!type) {
      type = identifier.includes('@') ? 'email' : 'phone';
    }

    const trimmedOtp = otp.toString().trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      return res.status(400).json({ error: 'OTP must be a 6-digit number' });
    }

    const normalizedIdentifier = identifier.includes('@')
      ? normalizeEmail(identifier)
      : normalizePhone(identifier);

    const now = Date.now();

    // Retrieve active OTP record
    const otpStmt = db.prepare(`
      SELECT * FROM otps
      WHERE identifier = ? AND consumed = 0 AND expires_at > ?
      ORDER BY id DESC LIMIT 1
    `);
    const otpRecord = otpStmt.get(normalizedIdentifier, now);

    if (!otpRecord) {
      return res.status(400).json({ error: 'No active OTP found or code expired. Please request a new one.' });
    }

    // Check maximum attempts (max 5)
    if (otpRecord.attempts >= 5) {
      db.prepare('UPDATE otps SET consumed = 1 WHERE id = ?').run(otpRecord.id);
      return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a new code.' });
    }

    // Verify cryptographic hash
    const computedHash = crypto.createHash('sha256').update(trimmedOtp + otpRecord.salt).digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(otpRecord.otp_hash, 'hex')
    );

    if (!isValid) {
      const newAttempts = otpRecord.attempts + 1;
      db.prepare('UPDATE otps SET attempts = ? WHERE id = ?').run(newAttempts, otpRecord.id);
      const remaining = 5 - newAttempts;
      return res.status(400).json({
        error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    // Mark OTP as consumed
    db.prepare('UPDATE otps SET consumed = 1 WHERE id = ?').run(otpRecord.id);

    // Find or create user
    const isEmail = normalizedIdentifier.includes('@');
    let userStmt = isEmail
      ? db.prepare('SELECT * FROM users WHERE email = ?')
      : db.prepare('SELECT * FROM users WHERE phone = ?');
    let user = userStmt.get(normalizedIdentifier);

    if (!user) {
      const defaultName = isEmail
        ? 'Chef ' + normalizedIdentifier.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim().slice(0, 15)
        : 'Chef ' + normalizedIdentifier.slice(-4);

      const insertUserStmt = db.prepare(`
        INSERT INTO users (name, email, phone)
        VALUES (?, ?, ?)
      `);
      const insertResult = insertUserStmt.run(
        defaultName,
        isEmail ? normalizedIdentifier : null,
        isEmail ? null : normalizedIdentifier
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(insertResult.lastInsertRowid);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    res.cookie('recipebox_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Error in /verify-otp:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// 3. Current User Profile
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// 4. Update Profile (Name)
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Display name cannot be empty' });
    }

    const trimmedName = name.trim().slice(0, 50);
    db.prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      trimmedName,
      req.user.id
    );

    const updatedUser = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?').get(req.user.id);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 5. Logout
router.post('/logout', (req, res) => {
  res.clearCookie('recipebox_token');
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
