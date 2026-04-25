const https = require('https');

const siteId = '39a52bbc-8b4e-46e6-b0ad-82237e40932b';

// Environment variables to set
const envVars = {
  'GROQ_API_KEY': '<YOUR_GROQ_API_KEY>',
  'SMTP_HOST': 'smtp.gmail.com',
  'SMTP_PORT': '587',
  'SMTP_USER': '<YOUR_SMTP_USER>',
  'SMTP_PASS': '<YOUR_SMTP_PASS>',
  'APP_NAME': 'SyntGPT',
  'FROM_EMAIL': '<YOUR_FROM_EMAIL>'
};

console.log('🔧 Netlify Environment Variables ayarlanıyor...');
console.log('Site ID:', siteId);

// Get Netlify access token from CLI
const { execSync } = require('child_process');

try {
  // Try to get token from netlify status
  const statusOutput = execSync('netlify status --json', { encoding: 'utf8' });
  console.log('Netlify durumu alındı');
  
  // Set each environment variable using netlify env:set with different approach
  Object.entries(envVars).forEach(([key, value]) => {
    try {
      console.log(`📝 ${key} ayarlanıyor...`);
      
      // Use netlify env:set with explicit site context
      const command = `netlify env:set "${key}" "${value}"`;
      const result = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        env: { ...process.env, NETLIFY_SITE_ID: siteId }
      });
      
      console.log(`✅ ${key} başarıyla ayarlandı`);
    } catch (error) {
      console.log(`❌ ${key} ayarlanamadı:`, error.message);
      
      // Alternative: Try with curl
      console.log(`🔄 ${key} için alternatif yöntem deneniyor...`);
      try {
        // This would need the access token, skipping for now
        console.log(`⚠️ ${key} manuel olarak ayarlanması gerekiyor`);
      } catch (curlError) {
        console.log(`❌ ${key} alternatif yöntem de başarısız`);
      }
    }
  });

  console.log('\n🎉 Environment variables kurulumu tamamlandı!');
  console.log('\n🚀 Şimdi deploy tetikleniyor...');
  
  // Trigger a new deploy
  try {
    execSync('netlify deploy --prod', { stdio: 'inherit' });
    console.log('✅ Deploy başarıyla tetiklendi!');
  } catch (deployError) {
    console.log('❌ Deploy tetiklenemedi, manuel olarak tetikleyin');
  }

} catch (error) {
  console.error('❌ Netlify CLI hatası:', error.message);
  console.log('\n📋 Manuel olarak ayarlanması gereken environment variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key} = ${value}`);
  });
}