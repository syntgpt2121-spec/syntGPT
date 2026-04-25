import { RequestHandler } from 'express';
import { sendVerificationEmail } from '../services/email.js';

interface SendCodeRequest {
  email: string;
  name?: string;
  code: string;
}

export const sendVerificationCode: RequestHandler = async (req, res) => {
  try {
    const { email, name, code } = req.body as SendCodeRequest;

    if (!email || !code) {
      return res.status(400).json({
        error: 'E-posta ve doğrulama kodu gereklidir',
      });
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Geçersiz e-posta formatı',
      });
    }

    const result = await sendVerificationEmail({
      to: email,
      code,
      name,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Doğrulama kodu e-posta adresinize gönderildi',
      });
    } else {
      res.status(500).json({
        error: result.error || 'E-posta gönderilemedi',
      });
    }
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
};
