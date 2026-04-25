import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { handleSmartAI } from './routes/smart-ai.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { authenticate } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security: CORS configuration
app.use(cors({
  origin: true, // Allow all origins but with credentials check
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  credentials: false
}));

// Security: Basic rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function rateLimit(windowMs: number = 60000, maxRequests: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const record = requestCounts.get(key);
    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Çok fazla istek. Lütfen bekleyin.' });
    }
    
    record.count++;
    next();
  };
}

// Admin rate limit
const adminRateLimit = rateLimit(60000, 300);

app.use(express.json({ limit: '10mb' }));

// Security: Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Routes

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', rateLimit(60000, 20), authRoutes);

// Admin routes with strict rate limiting
app.use('/api/admin', adminRateLimit, adminRoutes);

// Groq Smart AI endpoint (protected)
app.post('/api/groq/smart-ai', authenticate, rateLimit(60000, 50), handleSmartAI);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel için CORS ve rate limiting aktif`);
});
