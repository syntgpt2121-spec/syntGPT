import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth: No Bearer token');
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      console.log('❌ Auth: Empty token');
      return res.status(401).json({ error: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    console.log('✅ JWT decoded:', { userId: decoded.userId, email: decoded.email });
    
    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, emailVerified: true }
    });
    
    console.log('🔍 Database user lookup:', user);
    
    if (!user) {
      console.log('❌ Auth: User not found in database');
      return res.status(401).json({ error: 'Hesabınız silinmiş. Lütfen tekrar kayıt olun.', accountDeleted: true });
    }
    
    (req as any).user = decoded;
    console.log('✅ Auth successful for user:', decoded.email);
    
    next();
  } catch (error) {
    console.log('❌ Auth error:', error);
    return res.status(401).json({ error: 'Geçersiz token' });
  }
};
