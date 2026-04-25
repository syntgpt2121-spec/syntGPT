const { execSync } = require('child_process');
const fs = require('fs');

async function dropDeploy() {
  try {
    console.log('🎯 Netlify Drop Deploy başlıyor...');
    
    // Build kontrolü
    if (!fs.existsSync('client/dist/index.html')) {
      console.log('📦 Build yapılıyor...');
      execSync('npm run build', { cwd: 'client', stdio: 'inherit' });
    }
    
    console.log('✅ Build hazır');
    
    // Zip dosyası oluştur
    console.log('📦 Zip dosyası oluşturuluyor...');
    
    if (fs.existsSync('syntgpt-deploy.zip')) {
      fs.unlinkSync('syntgpt-deploy.zip');
    }
    
    // PowerShell ile zip oluştur
    execSync('Compress-Archive -Path "client/dist/*" -DestinationPath "syntgpt-deploy.zip" -Force', { 
      stdio: 'inherit',
      shell: 'powershell.exe'
    });
    
    console.log('✅ Zip dosyası oluşturuldu: syntgpt-deploy.zip');
    
    // Netlify Drop URL'sini aç
    console.log('🌐 Netlify Drop açılıyor...');
    
    try {
      execSync('start https://app.netlify.com/drop', { shell: true });
    } catch (e) {
      console.log('Tarayıcı açılamadı, manuel olarak git: https://app.netlify.com/drop');
    }
    
    console.log('\\n🎉 DEPLOY HAZIR!');
    console.log('📋 Adımlar:');
    console.log('1. ✅ Build tamamlandı');
    console.log('2. ✅ syntgpt-deploy.zip oluşturuldu');
    console.log('3. 🌐 https://app.netlify.com/drop açıldı');
    console.log('4. 📤 syntgpt-deploy.zip dosyasını drag & drop yap');
    console.log('\\n⚙️ Deploy sonrası ayarlar:');
    console.log('- Functions directory: netlify/functions');
    console.log('- Build command: cd client && npm ci && npm run build');
    console.log('- Publish directory: client/dist');
    
    console.log('\\n🔗 Hesap: bilal81476@gmail.com');
    
  } catch (error) {
    console.error('💥 Hata:', error.message);
  }
}

dropDeploy();