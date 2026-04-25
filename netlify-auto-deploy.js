const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function autoDeployToNetlify() {
  try {
    console.log('🚀 Otomatik Netlify deploy başlıyor...');
    
    // 1. Build kontrolü
    console.log('📦 Build kontrolü yapılıyor...');
    if (!fs.existsSync('client/dist')) {
      console.log('❌ client/dist bulunamadı, build yapılıyor...');
      execSync('npm run build', { cwd: 'client', stdio: 'inherit' });
    }
    console.log('✅ Build hazır');
    
    // 2. Netlify CLI ile farklı yöntemler deneyeceğiz
    console.log('🌐 Netlify deploy deneniyor...');
    
    try {
      // Yöntem 1: Basit deploy
      console.log('Yöntem 1: Basit deploy...');
      const result = execSync('netlify deploy --dir client/dist --prod', { 
        encoding: 'utf8',
        timeout: 60000 
      });
      console.log('✅ Deploy başarılı!');
      console.log(result);
      return;
    } catch (error) {
      console.log('❌ Yöntem 1 başarısız, Yöntem 2 deneniyor...');
    }
    
    try {
      // Yöntem 2: Site oluştur ve deploy et
      console.log('Yöntem 2: Site oluşturma...');
      const createResult = execSync('echo "syntgpt-new" | netlify sites:create', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      console.log('Site oluşturuldu:', createResult);
      
      const deployResult = execSync('netlify deploy --dir client/dist --functions netlify/functions --prod', { 
        encoding: 'utf8',
        timeout: 60000 
      });
      console.log('✅ Deploy başarılı!');
      console.log(deployResult);
      return;
    } catch (error) {
      console.log('❌ Yöntem 2 başarısız, Yöntem 3 deneniyor...');
    }
    
    try {
      // Yöntem 3: Init ile
      console.log('Yöntem 3: Init ile...');
      const initResult = execSync('echo -e "Yes, create and deploy project manually\\nsyntgpt-new" | netlify init', { 
        encoding: 'utf8',
        timeout: 30000,
        shell: true
      });
      console.log('Init tamamlandı:', initResult);
      
      const deployResult = execSync('netlify deploy --dir client/dist --functions netlify/functions --prod', { 
        encoding: 'utf8',
        timeout: 60000 
      });
      console.log('✅ Deploy başarılı!');
      console.log(deployResult);
      return;
    } catch (error) {
      console.log('❌ Yöntem 3 başarısız');
    }
    
    // Tüm yöntemler başarısız
    console.log('\n❌ Otomatik deploy başarısız oldu');
    console.log('📋 Manuel deploy adımları:');
    console.log('1. https://app.netlify.com adresine git');
    console.log('2. "Add new site" → "Deploy manually" seç');
    console.log('3. client/dist klasörünü sürükle-bırak yap');
    console.log('4. Functions: netlify/functions ayarla');
    
  } catch (error) {
    console.error('💥 Hata:', error.message);
    console.log('\n📋 Manuel deploy gerekli:');
    console.log('1. https://app.netlify.com');
    console.log('2. Add new site → Deploy manually');
    console.log('3. client/dist klasörünü sürükle-bırak');
  }
}

autoDeployToNetlify();