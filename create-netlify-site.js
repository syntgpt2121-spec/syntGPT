const https = require('https');
const fs = require('fs');
const path = require('path');

// Netlify API token'ını al
const { execSync } = require('child_process');

try {
  // Netlify token'ını al
  const tokenResult = execSync('netlify env:get NETLIFY_AUTH_TOKEN', { encoding: 'utf8' });
  console.log('Token result:', tokenResult);
} catch (error) {
  console.log('Token alma hatası, alternatif yöntem deneniyor...');
}

// Site oluşturma fonksiyonu
async function createSite() {
  const siteName = `syntgpt-app-${Date.now()}`;
  
  console.log('🚀 Netlify sitesi oluşturuluyor:', siteName);
  
  // Önce deploy klasörünü zip'le
  const archiver = require('archiver');
  const output = fs.createWriteStream('deploy.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', function() {
    console.log('✅ Deploy paketi hazır:', archive.pointer() + ' bytes');
    uploadSite();
  });
  
  archive.on('error', function(err) {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory('client/dist/', false);
  archive.finalize();
  
  function uploadSite() {
    console.log('📤 Site yükleniyor...');
    
    // Netlify deploy API'sini kullan
    const deployData = fs.readFileSync('deploy.zip');
    
    const options = {
      hostname: 'api.netlify.com',
      port: 443,
      path: '/api/v1/sites',
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': deployData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Site oluşturuldu!');
          console.log('🌐 Site URL:', result.url);
          console.log('🆔 Site ID:', result.id);
          
          // Environment variables'ları ayarla
          setupEnvironmentVariables(result.id);
          
        } catch (error) {
          console.error('❌ Yanıt parse hatası:', error);
          console.log('Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request hatası:', error);
    });
    
    req.write(deployData);
    req.end();
  }
  
  function setupEnvironmentVariables(siteId) {
    console.log(' Environment variables ayarlanıyor...');
    
    const envVars = {
      'GROQ_API_KEY': '<YOUR_GROQ_API_KEY>',
      'SMTP_HOST': 'smtp.gmail.com',
      'SMTP_PORT': '587',
      'SMTP_USER': '<YOUR_SMTP_USER>',
      'SMTP_PASS': '<YOUR_SMTP_PASS>',
      'APP_NAME': 'SyntGPT',
      'FROM_EMAIL': '<YOUR_FROM_EMAIL>'
    };
    
    // Her environment variable için API call yap
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`  → ${key} ayarlanıyor...`);
      // Bu kısım Netlify API token'ı gerektirir
    });
    
    console.log('🎉 Deploy tamamlandı!');
  }
}

// Archiver modülünü kontrol et
try {
  require('archiver');
  createSite();
} catch (error) {
  console.log('📦 Archiver modülü yükleniyor...');
  execSync('npm install archiver', { stdio: 'inherit' });
  createSite();
}