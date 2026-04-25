import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) {
    throw new Error('SMTP kullanıcı adı ve şifresi gerekli');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
}

export interface SendVerificationEmailOptions {
  to: string;
  code: string;
  name?: string;
}

export async function sendVerificationEmail({
  to,
  code,
  name,
}: SendVerificationEmailOptions): Promise<{ success: boolean; error?: string }> {
  const appName = process.env.APP_NAME || 'SyntGPT';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'syntgptt@gmail.com';
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: `${appName} - Doğrulama Kodunuz`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">${appName} Kayıt Doğrulama</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Merhaba ${name || 'Değerli Kullanıcı'},
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Kayıt işleminizi tamamlamak için doğrulama kodunuz:
          </p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            Bu kod 10 dakika içinde geçerliliğini yitirecektir.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Bu e-postayı siz talep etmediyseniz, lütfen dikkate almayın.
          </p>
        </div>
      </div>
    `,
    text: `${appName} Kayıt Doğrulama\n\nMerhaba ${name || 'Değerli Kullanıcı'},\n\nKayıt işleminizi tamamlamak için doğrulama kodunuz: ${code}\n\nBu kod 10 dakika içinde geçerliliğini yitirecektir.`,
  };

  try {
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Doğrulama e-postası gönderildi: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ E-posta gönderim hatası:', error);
    
    const errText =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'E-posta gönderilemedi';
    return {
      success: false,
      error: errText,
    };
  }
}
