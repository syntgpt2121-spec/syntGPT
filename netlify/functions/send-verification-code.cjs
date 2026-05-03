const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  try {
    const { email, code } = JSON.parse(event.body);
    if (!email || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email ve kod gereklidir.' })
      };
    }

    // SMTP ayarları environment variable üzerinden alınır
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Doğrulama Kodu',
      text: `Doğrulama kodunuz: ${code}`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
