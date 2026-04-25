const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

async function simpleNetlifyDeploy() {
  try {
    console.log('🚀 Basit Netlify deploy başlıyor...');
    
    // 1. Token bul
    console.log('🔑 Token aranıyor...');
    let token = null;
    
    // Netlify config dosyasından token al
    const configPath = `${os.homedir()}/.netlify/config.json`;
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.users && config.users.length > 0) {
          token = config.users[0].auth?.token;
        }
      } catch (e) {
        console.log('Config okuma hatası:', e.message);
      }
    }
    
    if (!token) {
      console.log('❌ Token bulunamadı');
      throw new Error('Token not found');
    }
    
    console.log('✅ Token bulundu');
    
    // 2. Site oluştur
    console.log('🌐 Site oluşturuluyor...');
    
    const siteName = 'syntgpt-' + Date.now();
    const siteData = JSON.stringify({ name: siteName });
    
    const site = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.netlify.com',
        port: 443,
        path: '/api/v1/sites',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 201) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Site creation failed: ${res.statusCode} - ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(siteData);
      req.end();
    });
    
    console.log('✅ Site oluşturuldu!');
    console.log('📛 Site Name:', site.name);
    console.log('🔗 URL:', site.url);
    console.log('🆔 Site ID:', site.id);
    
    // 3. netlify.toml güncelle
    console.log('⚙️ Netlify config güncelleniyor...');
    const netlifyToml = `[build]
  command = "cd client && npm ci && npm run build"
  functions = "netlify/functions"
  publish = "client/dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;
    
    fs.writeFileSync('netlify.toml', netlifyToml);
    
    // 4. Site ID'yi kaydet
    const netlifyConfig = {
      siteId: site.id
    };
    
    if (!fs.existsSync('.netlify')) {
      fs.mkdirSync('.netlify');
    }
    
    fs.writeFileSync('.netlify/state.json', JSON.stringify(netlifyConfig, null, 2));
    
    // 5. Deploy yap
    console.log('📦 Deploy yapılıyor...');
    
    try {
      const deployResult = execSync(`netlify deploy --site ${site.id} --dir client/dist --functions netlify/functions --prod`, { 
        encoding: 'utf8',
        timeout: 120000,
        stdio: 'inherit'
      });
      
      console.log('✅ Deploy başarılı!');
      console.log('🎉 Site hazır:', site.url);
      
    } catch (deployError) {
      console.log('❌ Deploy hatası, manuel deploy gerekli');
      console.log('📋 Manuel adımlar:');
      console.log(`1. https://app.netlify.com/sites/${site.id}/deploys`);
      console.log('2. client/dist klasörünü drag & drop yap');
    }
    
  } catch (error) {
    console.error('💥 Hata:', error.message);
    console.log('\n📋 Tamamen manuel deploy:');
    console.log('1. https://app.netlify.com');
    console.log('2. Add new site → Deploy manually');
    console.log('3. client/dist klasörünü drag & drop');
    console.log('4. Functions: netlify/functions ayarla');
  }
}

simpleNetlifyDeploy();