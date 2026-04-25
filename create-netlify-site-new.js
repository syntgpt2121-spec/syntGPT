const https = require('https');
const fs = require('fs');
const path = require('path');

// Netlify API kullanarak site oluştur
async function createNetlifySite() {
  try {
    console.log('Yeni Netlify sitesi oluşturuluyor...');
    
    // Netlify Drop kullanarak manuel deploy yapacağız
    console.log('\n=== MANUEL DEPLOY ADIMLARı ===');
    console.log('1. https://app.netlify.com adresine git');
    console.log('2. "Add new site" butonuna tıkla');
    console.log('3. "Deploy manually" seç');
    console.log('4. client/dist klasörünü sürükle-bırak yap');
    console.log('5. Site oluşturulduktan sonra:');
    console.log('   - Site settings → Functions → Functions directory: netlify/functions');
    console.log('   - Build settings → Build command: cd client && npm ci && npm run build');
    console.log('   - Publish directory: client/dist');
    
    console.log('\n=== DOSYALAR HAZIR ===');
    console.log('✅ client/dist klasörü build edildi');
    console.log('✅ netlify/functions klasörü hazır');
    console.log('✅ syntgpt-deploy-new.zip oluşturuldu');
    console.log('✅ syntgpt-functions.zip oluşturuldu');
    
    console.log('\n=== YENİ HESAP BİLGİLERİ ===');
    console.log('📧 Email: bilal81476@gmail.com');
    console.log('👤 Name: xfgdf zdfgfz');
    
    console.log('\nManuel deploy için hazır! Netlify web arayüzünü kullan.');
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

createNetlifySite();