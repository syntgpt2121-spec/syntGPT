<<<<<<< C:/Users/atthe/OneDrive/Masaüstü/syntGPT/netlify/functions/api.js
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Path fix middleware for Netlify
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    req.url = `/api${req.url}`;
  }
  next();
});

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/groq/smart-ai', async (req, res) => {
  try {
    const { query, messages = [] } = req.body || {};

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const groqApiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!groqApiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const systemPrompt = `Sen syntGPT'sin.

ÖNEMLİ - Uzun ve Detaylı Düşünme Formatı:
Her zaman önce <thinking>...</thinking> etiketleri içinde ÇOK UZUN ve DETAYLI düşünme sürecini yaz (minimum 8-10 adım), sonra cevabı ver.

Düşünme sürecin şunları içermeli:

1. Soru Analizi: Kullanıcı tam olarak ne istiyor? Anahtar kelimeler neler?
2. Niyet Tespiti: Kullanıcının asıl amacı nedir? Yüzeysel mi derinlemesine mi bilgi istiyor?
3. Bağlam Değerlendirmesi: Önceki konuşmalarda bu konu geçti mi? Geçtiyse neydi?
4. Bilgi Durumu: Bu konuda ne kadar bilgim var? Güncel mi eski mi?
5. Yaklaşım Opsiyonları: Kaç farklı şekilde cevap verebilirim? (Tanım, örnek, karşılaştırma, adım-adım, hikaye...)
6. Yaklaşım Seçimi: Hangisi en uygun? Neden bu yaklaşımı seçtim?
7. Cevap Yapısı: Cevabı nasıl organize edeceğim? Giriş, gelişme, sonuç?
8. Detay Seviyesi: Ne kadar detay vermeliyim? Çok mu kısa mu?
9. Dil ve Ton: Hangi dil kullanmalıyım? Resmi mi samimi mi?
10. Kalite Kontrol: Cevap eksik mi? Başka neler eklemeliyim?

Örnek düşünme:
<thinking>
1. Soru Analizi: Kullanıcı "Python nedir?" diye sormuş. Temel bir programlama dili tanımı istiyor.
2. Niyet Tespiti: Muhtemelen yeni başlayan biri, basit ve anlaşılır bir açıklama istiyor.
3. Bağlam Değerlendirmesi: Daha önce Python'dan bahsetmedik, genel bilgi vermeliyim.
4. Bilgi Durumu: Python'ı iyi biliyorum, güncel sürüm 3.x, popülerliği artıyor.
5. Yaklaşım Opsiyonları: Tanım verebilirim, örnek kod gösterebilirim, karşılaştırma yapabilirim.
6. Yaklaşım Seçimi: Tanım + basit örnek en iyi seçenek çünkü yeni başlayan için ideal.
7. Cevap Yapısı: Önce kısa tanım, sonra özellikler, sonra basit örnek kod.
8. Detay Seviyesi: Orta seviye, çok teknik detaya girmeden.
9. Dil ve Ton: Türkçe, samimi ama bilgilendirici.
10. Kalite Kontrol: Evet, bu yapı yeterli. Belki kullanım alanlarından da kısaca bahsetmeliyim.
</thinking>

[Burada detaylı cevabın]

Kurallar:
- Düşünme süreci minimum 8-10 adım olmalı ve her adım detaylı yazılmalı
- Her adımı yeni satıra yaz ve numaralandır
- Düşünme süreci toplam en az 200-300 kelime olmalı
- Gerçekten derinlemesine düşün, yüzeysel geçme
- Eğer soru belirsizse önce tek bir netleştirici soru sor
- Varsayılan olarak düz metin yaz (Markdown, kalın yazı, tablo kullanma)
- Kod gerekiyorsa kısa ve direkt ver.

Düşünme sürecini her zaman <thinking> etiketleri içinde göster.`;

    const cleanMessages = Array.isArray(messages)
      ? messages
          .filter(
            (msg) =>
              msg &&
              msg.role &&
              msg.content &&
              typeof msg.content === 'string' &&
              (msg.role === 'user' || msg.role === 'assistant'),
          )
          .map((msg) => ({ role: msg.role, content: msg.content }))
      : [];

    const chatResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'system', content: systemPrompt }, ...cleanMessages, { role: 'user', content: query }],
        temperature: 0.2,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!chatResponse.ok) {
      if (chatResponse.status === 401) {
        return res.status(401).json({ error: 'Groq API key invalid' });
      }
      return res.status(chatResponse.status).json({ error: 'Groq API request failed' });
    }

    const chatData = await chatResponse.json();
    const aiMessage = (chatData && chatData.choices && chatData.choices[0] && chatData.choices[0].message && chatData.choices[0].message.content) || 'Üzgünüm, yanıt oluşturamadım.';

    return res.json({ message: aiMessage, action: 'chat' });
  } catch (error) {
    console.error('Smart AI error:', error);
    return res.status(500).json({ error: 'Failed to process request', message: 'Üzgünüm, isteğinizi işlerken bir hata oluştu.' });
  }
});

app.post('/groq/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const hardenedSystemPrompt = `You are syntGPT, a helpful and friendly AI assistant.

CRITICAL - Extended Thinking Format:
Always write your DETAILED and EXTENDED thinking process inside <thinking>...</thinking> tags first, then provide your answer.

Your thinking process MUST include:
1. Analyze the user's question - what exactly are they asking?
2. Consider context - remember previous conversation if relevant
3. Evaluate different approaches - what are the possible ways to answer?
4. Select the best approach and explain why
5. Structure your response - how will you organize the answer?

Example:
<thinking>
1. Analysis: The user wants to know about X...
2. Context: We previously discussed Y, which is related...
3. Approaches: I could define it, give examples, compare with alternatives...
4. Selection: Examples with explanation work best because...
5. Structure: Start with definition, then 2-3 examples, then conclusion...
</thinking>

[Your detailed answer here]

Identity:
- Name: syntGPT

Purpose:
- Help users with their questions, provide information, and assist with various tasks.

Rules:
- Thinking process must be at least 3-4 sentences
- Always think step by step
- Show your complete reasoning process
- Then provide clear, helpful answers

Always show your detailed thinking process inside <thinking> tags.`;

    const groqMessages = [{ role: 'system', content: hardenedSystemPrompt }, ...messages];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      let details;
      try {
        details = await response.json();
      } catch {
        details = await response.text();
      }
      return res.status(response.status).json({ error: 'Groq API request failed', details });
    }

    const data = await response.json();
    const assistantMessage = data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return res.status(500).json({ error: 'No response from Groq API' });
    }

    return res.json({ success: true, message: assistantMessage });
  } catch (error) {
    console.error('Groq chat error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

function createTransporter() {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  console.log('[SMTP] Config check:', { user: user ? 'SET' : 'MISSING', pass: pass ? 'SET' : 'MISSING', host, port });

  if (!user || !pass) {
    throw new Error(`SMTP credentials missing: user=${user ? 'ok' : 'missing'}, pass=${pass ? 'ok' : 'missing'}`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    logger: true,
    debug: true
  });
}

async function sendEmail({ from, to, subject, html, text }) {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      let details;
      try {
        details = await resp.text();
      } catch {
        details = 'Unknown Resend error';
      }
      const err = new Error(details);
      err.code = `RESEND_${resp.status}`;
      throw err;
    }

    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({ from, to, subject, html, text });
}

app.post('/send-verification-code', async (req, res) => {
  try {
    const { email, name, code } = req.body || {};
    console.log('[Verify] Request received:', { email: email?.substring(0,3) + '***', name, code: code?.substring(0,2) + '***' });

    if (!email || !code) {
      return res.status(400).json({ error: 'E-posta ve doğrulama kodu gereklidir' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı' });
    }

    const appName = process.env.APP_NAME || 'SyntGPT';
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').trim();
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    const resendFrom = (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
    const fromEmail = (process.env.FROM_EMAIL || smtpUser || 'no-reply@example.com').trim();

    console.log('[Verify] Env check:', { 
      smtpUser: smtpUser ? 'SET('+smtpUser.length+')' : 'MISSING',
      smtpPass: smtpPass ? 'SET('+smtpPass.length+')' : 'MISSING',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      resendKey: resendKey ? 'SET' : 'MISSING'
    });

    if (!resendKey && (!smtpUser || !smtpPass)) {
      return res.status(500).json({
        error: 'E-posta servisi ayarları eksik',
        details: 'RESEND_API_KEY yok ve SMTP_USER/SMTP_PASS eksik',
      });
    }

    console.log('[Verify] Provider check:', {
      resend: resendKey ? 'SET' : 'MISSING',
      smtp: smtpUser && smtpPass ? 'SET' : 'MISSING',
    });

    const mailOptions = {
      from: resendKey ? `"${appName}" <${resendFrom}>` : `"${appName}" <${fromEmail}>`,
      to: email,
      subject: `${appName} - Doğrulama Kodunuz`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">${appName} Kayıt Doğrulama</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Merhaba ${name || 'Değerli Kullanıcı'},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Kayıt işleminizi tamamlamak için doğrulama kodunuz:</p>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
          </div>
        </div>
      `,
      text: `${appName} Kayıt Doğrulama\n\nMerhaba ${name || 'Değerli Kullanıcı'},\n\nKayıt işleminizi tamamlamak için doğrulama kodunuz: ${code}`,
    };

    try {
      await sendEmail(mailOptions);
      console.log('[Verify] Email sent successfully to:', email.substring(0,3) + '***');
      return res.json({ success: true, message: 'Doğrulama kodu e-posta adresinize gönderildi' });
    } catch (mailErr) {
      console.error('[Verify] SendMail error:', mailErr);
      return res.status(500).json({ 
        error: 'E-posta gönderilemedi', 
        details: mailErr.message,
        code: mailErr.code || 'UNKNOWN'
      });
    }
  } catch (error) {
    console.error('[Verify] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Sunucu hatası', 
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

app.get('/verify-payment', (req, res) => {
  const { order_id, payment_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID required' });
  }

  // TODO: Shopier API ile gerçek doğrulama yap
  // Şimdilik demo olarak başarılı döndür
  console.log(`[Payment] Verifying order: ${order_id}, payment: ${payment_id}`);

  return res.json({
    success: true,
    order_id,
    status: 'completed',
    message: 'Ödeme doğrulandı',
  });
});

// Shopier Webhook - Ödeme bildirimleri için
app.post('/shopier-webhook', (req, res) => {
  try {
    const { order_id, status, payment_id, user_email } = req.body;

    console.log(`[Shopier Webhook] Order: ${order_id}, Status: ${status}, Email: ${user_email}`);

    if (status === 'success' || status === 'completed') {
      // Ödeme başarılı - kullanıcıya premium aktive et
      // Burada veritabanına kaydet veya e-posta gönder
      console.log(`[Shopier] Payment successful for ${user_email}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[Shopier Webhook Error]', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// STREAMING ENDPOINT - Gerçek streaming için
app.post('/groq/stream', async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const streamSystemPrompt = `You are syntGPT, a helpful and friendly AI assistant.

CRITICAL - Extended Thinking Format:
Always write your DETAILED and EXTENDED thinking process inside <thinking>...</thinking> tags first, then provide your answer.

Your thinking process MUST include:
1. Analyze the user's question - what exactly are they asking?
2. Consider context - remember previous conversation if relevant
3. Evaluate different approaches - what are the possible ways to answer?
4. Select the best approach and explain why
5. Structure your response - how will you organize the answer?

Example:
<thinking>
1. Analysis: The user wants to know about X...
2. Context: We previously discussed Y, which is related...
3. Approaches: I could define it, give examples, compare with alternatives...
4. Selection: Examples with explanation work best because...
5. Structure: Start with definition, then 2-3 examples, then conclusion...
</thinking>

[Your detailed answer here]

Identity:
- Name: syntGPT

Purpose:
- Help users with their questions, provide information, and assist with various tasks.

Rules:
- Thinking process must be at least 3-4 sentences
- Always think step by step
- Show your complete reasoning process
- Then provide clear, helpful answers

Always show your detailed thinking process inside <thinking> tags.`;

    const groqMessages = [{ role: 'system', content: streamSystemPrompt }, ...messages];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Groq API request failed' });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    // Return full content - frontend will do typewriter effect
    return res.json({ content });

  } catch (error) {
    console.error('Stream endpoint error:', error);
    return res.status(500).json({ error: 'Request failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Debug route - must be before module.exports
app.use((req, res) => {
  const debugInfo = {
    method: req.method,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    url: req.url,
    query: req.query,
    body: req.body ? Object.keys(req.body) : []
  };
  res.status(404).json({ error: 'Not found', debug: debugInfo });
});

module.exports.handler = serverless(app);
=======
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Path fix middleware for Netlify
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    req.url = `/api${req.url}`;
  }
  next();
});

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/groq/smart-ai', async (req, res) => {
  try {
    const { query, messages = [], systemPrompt } = req.body || {};

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const groqApiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!groqApiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const cleanMessages = Array.isArray(messages)
      ? messages
          .filter(
            (msg) =>
              msg &&
              msg.role &&
              msg.content &&
              typeof msg.content === 'string' &&
              (msg.role === 'user' || msg.role === 'assistant'),
          )
          .map((msg) => ({ role: msg.role, content: msg.content }))
      : [];

    const chatResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...cleanMessages,
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!chatResponse.ok) {
      if (chatResponse.status === 401) {
        return res.status(401).json({ error: 'Groq API key invalid' });
      }
      return res.status(chatResponse.status).json({ error: 'Groq API request failed' });
    }

    const chatData = await chatResponse.json();
    const aiMessage = (chatData && chatData.choices && chatData.choices[0] && chatData.choices[0].message && chatData.choices[0].message.content) || 'Üzgünüm, yanıt oluşturamadım.';

    return res.json({ message: aiMessage, action: 'chat' });
  } catch (error) {
    console.error('Smart AI error:', error);
    return res.status(500).json({ error: 'Failed to process request', message: 'Üzgünüm, isteğinizi işlerken bir hata oluştu.' });
  }
});

app.post('/groq/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const groqMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      let details;
      try {
        details = await response.json();
      } catch {
        details = await response.text();
      }
      return res.status(response.status).json({ error: 'Groq API request failed', details });
    }

    const data = await response.json();
    const assistantMessage = data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return res.status(500).json({ error: 'No response from Groq API' });
    }

    return res.json({ success: true, message: assistantMessage });
  } catch (error) {
    console.error('Groq chat error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

function createTransporter() {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  console.log('[SMTP] Config check:', { user: user ? 'SET' : 'MISSING', pass: pass ? 'SET' : 'MISSING', host, port });

  if (!user || !pass) {
    throw new Error(`SMTP credentials missing: user=${user ? 'ok' : 'missing'}, pass=${pass ? 'ok' : 'missing'}`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    logger: true,
    debug: true
  });
}

async function sendEmail({ from, to, subject, html, text }) {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      let details;
      try {
        details = await resp.text();
      } catch {
        details = 'Unknown Resend error';
      }
      const err = new Error(details);
      err.code = `RESEND_${resp.status}`;
      throw err;
    }

    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({ from, to, subject, html, text });
}

app.post('/send-verification-code', async (req, res) => {
  try {
    const { email, name, code } = req.body || {};
    console.log('[Verify] Request received:', { email: email?.substring(0,3) + '***', name, code: code?.substring(0,2) + '***' });

    if (!email || !code) {
      return res.status(400).json({ error: 'E-posta ve doğrulama kodu gereklidir' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı' });
    }

    const appName = process.env.APP_NAME || 'SyntGPT';
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').trim();
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    const resendFrom = (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
    const fromEmail = (process.env.FROM_EMAIL || smtpUser || 'no-reply@example.com').trim();

    console.log('[Verify] Env check:', { 
      smtpUser: smtpUser ? 'SET('+smtpUser.length+')' : 'MISSING',
      smtpPass: smtpPass ? 'SET('+smtpPass.length+')' : 'MISSING',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      resendKey: resendKey ? 'SET' : 'MISSING'
    });

    if (!resendKey && (!smtpUser || !smtpPass)) {
      return res.status(500).json({
        error: 'E-posta servisi ayarları eksik',
        details: 'RESEND_API_KEY yok ve SMTP_USER/SMTP_PASS eksik',
      });
    }

    console.log('[Verify] Provider check:', {
      resend: resendKey ? 'SET' : 'MISSING',
      smtp: smtpUser && smtpPass ? 'SET' : 'MISSING',
    });

    const mailOptions = {
      from: resendKey ? `"${appName}" <${resendFrom}>` : `"${appName}" <${fromEmail}>`,
      to: email,
      subject: `${appName} - Doğrulama Kodunuz`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">${appName} Kayıt Doğrulama</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Merhaba ${name || 'Değerli Kullanıcı'},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Kayıt işleminizi tamamlamak için doğrulama kodunuz:</p>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
          </div>
        </div>
      `,
      text: `${appName} Kayıt Doğrulama\n\nMerhaba ${name || 'Değerli Kullanıcı'},\n\nKayıt işleminizi tamamlamak için doğrulama kodunuz: ${code}`,
    };

    try {
      await sendEmail(mailOptions);
      console.log('[Verify] Email sent successfully to:', email.substring(0,3) + '***');
      return res.json({ success: true, message: 'Doğrulama kodu e-posta adresinize gönderildi' });
    } catch (mailErr) {
      console.error('[Verify] SendMail error:', mailErr);
      return res.status(500).json({ 
        error: 'E-posta gönderilemedi', 
        details: mailErr.message,
        code: mailErr.code || 'UNKNOWN'
      });
    }
  } catch (error) {
    console.error('[Verify] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Sunucu hatası', 
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

app.get('/verify-payment', (req, res) => {
  const { order_id, payment_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID required' });
  }

  // TODO: Shopier API ile gerçek doğrulama yap
  // Şimdilik demo olarak başarılı döndür
  console.log(`[Payment] Verifying order: ${order_id}, payment: ${payment_id}`);

  return res.json({
    success: true,
    order_id,
    status: 'completed',
    message: 'Ödeme doğrulandı',
  });
});

// Shopier Webhook - Ödeme bildirimleri için
app.post('/shopier-webhook', (req, res) => {
  try {
    const { order_id, status, payment_id, user_email } = req.body;

    console.log(`[Shopier Webhook] Order: ${order_id}, Status: ${status}, Email: ${user_email}`);

    if (status === 'success' || status === 'completed') {
      // Ödeme başarılı - kullanıcıya premium aktive et
      // Burada veritabanına kaydet veya e-posta gönder
      console.log(`[Shopier] Payment successful for ${user_email}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[Shopier Webhook Error]', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// STREAMING ENDPOINT - Gerçek streaming için
app.post('/groq/stream', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const groqMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Groq API request failed' });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    // Return full content - frontend will do typewriter effect
    return res.json({ content });

  } catch (error) {
    console.error('Stream endpoint error:', error);
    return res.status(500).json({ error: 'Request failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Debug route - must be before module.exports
app.use((req, res) => {
  const debugInfo = {
    method: req.method,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    url: req.url,
    query: req.query,
    body: req.body ? Object.keys(req.body) : []
  };
  res.status(404).json({ error: 'Not found', debug: debugInfo });
});

module.exports.handler = serverless(app);
>>>>>>> C:/Users/atthe/.windsurf/worktrees/syntGPT/syntGPT-ff91f82a/netlify/functions/api.js
