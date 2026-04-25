import nodemailer from 'nodemailer';

let testAccount: nodemailer.TestAccount | null = null;

async function getTestAccount(): Promise<nodemailer.TestAccount> {
  if (!testAccount) {
    testAccount = await nodemailer.createTestAccount();
    console.log('✉️ Ethereal Email test account created:', testAccount.user);
  }
  return testAccount;
}

async function createTransporter() {
  const account = await getTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass,
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
}: SendVerificationEmailOptions): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  const appName = process.env.APP_NAME || 'SyntGPT';
  const transporter = await createTransporter();

  const mailOptions = {
    from: `"${appName}" <noreply@ethereal.email>`,
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
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`✅ Email sent to ${to}`);
    console.log(`📧 Preview URL: ${previewUrl}`);
    return { success: true, previewUrl };
  } catch (error) {
    console.error('❌ Email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'E-posta gönderilemedi',
    };
  }
}
