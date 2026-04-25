const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const { execSync } = require('child_process');

async function deployViaAPI() {
  try {
    console.log('🔑 Netlify token alınıyor...');
    
    // Token'ı CLI'dan al
    let token;
    try {
      const tokenResult = execSync('netlify env:get NETLIFY_AUTH_TOKEN', { encoding: 'utf8' });
      token = tokenResult.trim();
    } catch (error) {
      console.log('❌ Token bulunamadı, alternatif yöntem...');
      
      // Netlify config dosyasından token al
      const os = require('os');
      const configPath = `${os.homedir()}/.netlify/config.json`;
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        token = config.users?.[0]?.auth?.token;
      }
    }
    
    if (!token) {
      console.log('❌ Token bulunamadı');
      console.log('📋 Manuel deploy gerekli:');
      console.log('1. https://app.netlify.com');
      console.log('2. Add new site → Deploy manually');
      console.log('3. client/dist klasörünü drag & drop');
      return;
    }
    
    console.log('✅ Token bulundu');
    console.log('🌐 Site oluşturuluyor...');
    
    // Site oluştur
    const siteData = JSON.stringify({
      name: 'syntgpt-new-' + Date.now(),
      custom_domain: null
    });
    
    const siteOptions = {
      hostname: 'api.netlify.com',
      port: 443,
      path: '/api/v1/sites',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(siteData)
      }
    };
    
    const siteResponse = await new Promise((resolve, reject) => {
      const req = https.request(siteOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Site creation failed: ${res.statusCode} ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(siteData);
      req.end();
    });
    
    console.log('✅ Site oluşturuldu:', siteResponse.name);
    console.log('🔗 URL:', siteResponse.url);
    console.log('🆔 Site ID:', siteResponse.id);
    
    // Deploy yap
    console.log('📦 Deploy yapılıyor...');
    
    const deployResult = execSync(`netlify deploy --site ${siteResponse.id} --dir client/dist --functions netlify/functions --prod`, { 
      encoding: 'utf8',
      timeout: 120000 
    });
    
    console.log('✅ Deploy başarılı!');
    console.log(deployResult);
    
  } catch (error) {
    console.error('💥 API Deploy hatası:', error.message);
    console.log('\n📋 Manuel deploy adımları:');
    console.log('1. https://app.netlify.com adresine git');
    console.log('2. "Add new site" → "Deploy manually" seç');
    console.log('3. client/dist klasörünü sürükle-bırak yap');
    console.log('4. Site ayarları → Functions → netlify/functions');
  }
}

deployViaAPI();