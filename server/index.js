import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load environment variables
dotenv.config();

import db from './db.js';
import authRouter from './routes/auth.js';
import recipesRouter from './routes/recipes.js';
import paymentsRouter from './routes/payments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// ------------------------------------------------------------------------------
// CORS Configuration for Production & Development
// ------------------------------------------------------------------------------
const rawOrigins = process.env.FRONTEND_URL || process.env.CLIENT_URL || '';
const configuredOrigins = rawOrigins
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedDevOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');

    // Allow configured production origins
    if (configuredOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // In development, allow standard local dev servers
    if (process.env.NODE_ENV !== 'production' && allowedDevOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Allow Render, Vercel, and Netlify preview deployment subdomains if not explicitly restricted
    if (
      normalizedOrigin.endsWith('.onrender.com') ||
      normalizedOrigin.endsWith('.vercel.app') ||
      normalizedOrigin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }

    // If no specific FRONTEND_URL is set in development, permit request
    if (process.env.NODE_ENV !== 'production' && configuredOrigins.length === 0) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
}));

// Preflight is handled by the cors() middleware above

// Cookie & Body Parsing
app.use(cookieParser());
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Preserve raw buffer for Razorpay webhook HMAC verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ------------------------------------------------------------------------------
// Health & Liveness Checks
// ------------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'RecipeBox API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected (SQLite WAL)'
  });
});

// ------------------------------------------------------------------------------
// API Routes
// ------------------------------------------------------------------------------
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/payments', paymentsRouter);

// ------------------------------------------------------------------------------
// Static Frontend Serving (Monolithic Full-Stack Render Deployment)
// ------------------------------------------------------------------------------
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    // Serve index.html for GET requests that do not target /api
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// ------------------------------------------------------------------------------
// Global Error Handler
// ------------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// ------------------------------------------------------------------------------
// Start Express Server (Binds to 0.0.0.0 and process.env.PORT)
// ------------------------------------------------------------------------------
app.listen(PORT, HOST, () => {
  console.log(`[RecipeBox Backend] Server running on http://${HOST}:${PORT}`);
  console.log(`[RecipeBox Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
