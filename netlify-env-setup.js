// Netlify Environment Variables Setup Script
const { execSync } = require('child_process');

const envVars = {
  'GROQ_API_KEY': '<YOUR_GROQ_API_KEY>',
  'SMTP_HOST': 'smtp.gmail.com',
  'SMTP_PORT': '587',
  'SMTP_USER': '<YOUR_SMTP_USER>',
  'SMTP_PASS': '<YOUR_SMTP_PASS>',
  'APP_NAME': 'SyntGPT',
  'FROM_EMAIL': '<YOUR_FROM_EMAIL>',
  'RESEND_API_KEY': 'dummy_key_for_fallback'
};

console.log('🔧 Netlify Environment Variables ayarlanıyor...\n');

// Her environment variable için netlify env:set komutu çalıştır
Object.entries(envVars).forEach(([key, value]) => {
  try {
    console.log(`📝 ${key} ayarlanıyor...`);
    const command = `netlify env:set "${key}" "${value}"`;
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${key} başarıyla ayarlandı`);
  } catch (error) {
    console.log(`❌ ${key} ayarlanamadı:`, error.message);
  }
});

console.log('\n🎉 Environment variables kurulumu tamamlandı!');
console.log('\n📋 Ayarlanan değişkenler:');
Object.keys(envVars).forEach(key => {
  console.log(`  - ${key}`);
});

console.log('\n🔍 Kontrol için: netlify env:list');