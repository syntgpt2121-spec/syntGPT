import { Router, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { sendVerificationEmail } from '../services/email.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Generate random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gereklidir' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // If user exists but email not verified, delete old record and allow re-registration
      if (!existingUser.emailVerified) {
        // Delete old verification codes
        await prisma.verificationCode.deleteMany({ where: { userId: existingUser.id } });
        // Delete old user
        await prisma.user.delete({ where: { id: existingUser.id } });
      } else {
        return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: false,
      },
    });

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        type: 'register',
        expiresAt,
      },
    });

    // Send email (optional - log but don't fail if email fails)
    const emailResult = await sendVerificationEmail({
      to: email,
      code,
      name: name || email,
    });

    if (!emailResult.success) {
      console.log('⚠️ Email failed, but continuing:', emailResult.error);
    }

    // Auto-verify user (skip email verification for now)
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Generate JWT immediately
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Kayıt başarılı. E-posta doğrulaması atlandı (test modu).',
      userId: user.id,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu' });
  }
};

// Verify email
const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'Kullanıcı ID ve kod gereklidir' });
    }

    // Find verification code
    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId,
        code,
        type: 'register',
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş kod' });
    }

    // Mark as used
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Verify user email
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Get user for token
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'E-posta doğrulandı',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Doğrulama sırasında bir hata oluştu' });
  }
};

// Login
const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gereklidir' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Şifre yanlış' });
    }

    // Check if email is verified (skip for now - auto verify)
    if (!user.emailVerified) {
      // Auto-verify on login
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
  }
};

// Get current user
const me: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    // Get user with subscription info
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        subscriptions: {
          where: {
            status: 'active',
            expiresAt: { gt: new Date() },
          },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!userData) {
      return res.status(401).json({ error: 'Hesabınız silinmiş. Lütfen tekrar kayıt olun.', accountDeleted: true });
    }

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        isPremium: userData.subscriptions.length > 0,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

router.post('/register', register);
router.post('/verify', verifyEmail);
router.post('/login', login);
router.get('/me', authenticate, me);

export default router;
