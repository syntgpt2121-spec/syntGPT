const fs = require('fs');
const { execSync } = require('child_process');

async function uploadToNetlifyDrop() {
  try {
    console.log('🚀 Netlify Drop Upload başlıyor...');
    
    // Zip dosyasının varlığını kontrol et
    if (!fs.existsSync('syntgpt-deploy.zip')) {
      console.log('❌ syntgpt-deploy.zip bulunamadı, oluşturuluyor...');
      execSync('Compress-Archive -Path "client/dist/*" -DestinationPath "syntgpt-deploy.zip" -Force', { 
        shell: 'powershell.exe',
        stdio: 'inherit'
      });
    }
    
    console.log('✅ Zip dosyası hazır');
    
    // Dosya boyutunu kontrol et
    const stats = fs.statSync('syntgpt-deploy.zip');
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`📦 Dosya boyutu: ${fileSizeInMB.toFixed(2)} MB`);
    
    if (fileSizeInMB > 100) {
      console.log('⚠️ Dosya çok büyük (>100MB), manuel upload gerekli');
    }
    
    // Netlify Drop'a yönlendir
    console.log('\\n🎯 DEPLOY ADIMI:');
    console.log('1. https://app.netlify.com/drop sayfası açık');
    console.log('2. syntgpt-deploy.zip dosyasını drag & drop yap');
    console.log('3. Upload tamamlandıktan sonra site URL verilecek');
    
    console.log('\\n📁 Upload edilecek dosya: syntgpt-deploy.zip');
    console.log('📧 Hesap: bilal81476@gmail.com');
    
    // Dosya yolunu göster
    const fullPath = require('path').resolve('syntgpt-deploy.zip');
    console.log('📍 Dosya yolu:', fullPath);
    
    // Windows Explorer'da dosyayı göster
    try {
      execSync(`explorer /select,"${fullPath}"`, { shell: true });
      console.log('✅ Windows Explorer açıldı');
    } catch (e) {
      console.log('❌ Explorer açılamadı');
    }
    
    console.log('\\n⏳ Upload işlemi manuel olarak yapılmalı...');
    console.log('🔄 Upload tamamlandıktan sonra site ayarlarını yap:');
    console.log('   - Site Settings → Functions → Directory: netlify/functions');
    console.log('   - Build Settings → Command: cd client && npm ci && npm run build');
    console.log('   - Build Settings → Publish: client/dist');
    
  } catch (error) {
    console.error('💥 Hata:', error.message);
  }
}

uploadToNetlifyDrop();