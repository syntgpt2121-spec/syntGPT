const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: '<YOUR_SMTP_USER>',
    pass: '<YOUR_SMTP_PASS>'
  }
});

async function testEmail() {
  try {
    const result = await transporter.sendMail({
      from: '"SyntGPT Test" <<YOUR_SMTP_USER>>',
      to: '<YOUR_SMTP_USER>',
      subject: 'Test Email',
      text: 'This is a test email from SyntGPT'
    });
    console.log('✅ Email sent:', result.messageId);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Code:', err.code);
    console.error('Command:', err.command);
  }
}

testEmail();
