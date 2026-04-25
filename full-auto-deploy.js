const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

async function fullAutoDeploy() {
  try {
    console.log('🚀 TAM OTOMATİK DEPLOY BAŞLIYOR...');
    
    // 1. Token al
    console.log('🔑 Token alınıyor...');
    let token = null;
    
    // CLI'dan token almaya çalış
    try {
      const result = execSync('netlify status --json', { encoding: 'utf8' });
      const status = JSON.parse(result);
      
      // Config dosyasından token al
      const configPath = path.join(os.homedir(), '.netlify', 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.users && config.users.length > 0) {
          token = config.users[0].auth?.token;
        }
      }
    } catch (e) {
      console.log('Token alma hatası:', e.message);
    }
    
    // Alternatif token alma yöntemi
    if (!token) {
      try {
        const envResult = execSync('netlify env:list --json', { encoding: 'utf8' });
        console.log('Env result:', envResult);
      } catch (e) {
        console.log('Env hatası:', e.message);
      }
    }
    
    // Manuel token girişi için geçici çözüm
    if (!token) {
      console.log('❌ Token bulunamadı, alternatif yöntem...');
      
      // Netlify login durumunu kontrol et
      try {
        const loginCheck = execSync('netlify status', { encoding: 'utf8' });
        console.log('Login durumu:', loginCheck);
        
        // Token'ı farklı yollarla almaya çalış
        const homeDir = os.homedir();
        const possiblePaths = [
          path.join(homeDir, '.netlify', 'config.json'),
          path.join(homeDir, '.config', 'netlify', 'config.json'),
          path.join(process.cwd(), '.netlify', 'state.json')
        ];
        
        for (const configPath of possiblePaths) {
          if (fs.existsSync(configPath)) {
            try {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              console.log('Config bulundu:', configPath);
              
              if (config.users && config.users[0] && config.users[0].auth) {
                token = config.users[0].auth.token;
                break;
              }
              
              if (config.siteId) {
                console.log('Site ID bulundu:', config.siteId);
              }
            } catch (e) {
              console.log('Config okuma hatası:', e.message);
            }
          }
        }
      } catch (e) {
        console.log('Status kontrol hatası:', e.message);
      }
    }
    
    if (token) {
      console.log('✅ Token bulundu, API deploy yapılıyor...');
      await deployWithAPI(token);
    } else {
      console.log('❌ Token bulunamadı, CLI deploy deneniyor...');
      await deployWithCLI();
    }
    
  } catch (error) {
    console.error('💥 Genel hata:', error.message);
    await fallbackDeploy();
  }
}

async function deployWithAPI(token) {
  try {
    console.log('🌐 API ile site oluşturuluyor...');
    
    const siteName = 'syntgpt-auto-' + Date.now();
    const siteData = JSON.stringify({
      name: siteName,
      custom_domain: null
    });
    
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
    
    console.log('✅ Site oluşturuldu:', site.name);
    console.log('🔗 URL:', site.url);
    
    // Site ID'yi kaydet
    const netlifyDir = '.netlify';
    if (!fs.existsSync(netlifyDir)) {
      fs.mkdirSync(netlifyDir);
    }
    
    fs.writeFileSync(path.join(netlifyDir, 'state.json'), JSON.stringify({
      siteId: site.id
    }, null, 2));
    
    // Deploy yap
    console.log('📦 Deploy yapılıyor...');
    const deployResult = execSync(`netlify deploy --site ${site.id} --dir client/dist --functions netlify/functions --prod`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log('🎉 DEPLOY BAŞARILI!');
    console.log('🔗 Site URL:', site.url);
    
  } catch (error) {
    console.error('API deploy hatası:', error.message);
    throw error;
  }
}

async function deployWithCLI() {
  try {
    console.log('🔧 CLI ile deploy deneniyor...');
    
    // Farklı CLI yöntemleri dene
    const methods = [
      'netlify deploy --dir client/dist --functions netlify/functions --prod --create-site',
      'netlify deploy --dir client/dist --prod --create-site',
      'netlify sites:create --name syntgpt-cli && netlify deploy --dir client/dist --functions netlify/functions --prod'
    ];
    
    for (const method of methods) {
      try {
        console.log(`Deneniyor: ${method}`);
        const result = execSync(method, {
          encoding: 'utf8',
          stdio: 'inherit',
          timeout: 120000
        });
        
        console.log('✅ CLI deploy başarılı!');
        return;
      } catch (e) {
        console.log(`❌ Başarısız: ${method}`);
        continue;
      }
    }
    
    throw new Error('Tüm CLI yöntemleri başarısız');
    
  } catch (error) {
    console.error('CLI deploy hatası:', error.message);
    throw error;
  }
}

async function fallbackDeploy() {
  console.log('🆘 FALLBACK DEPLOY - Son çare yöntemleri...');
  
  try {
    // Build kontrolü
    if (!fs.existsSync('client/dist/index.html')) {
      console.log('📦 Build yapılıyor...');
      execSync('npm run build', { cwd: 'client', stdio: 'inherit' });
    }
    
    // Zip oluştur
    console.log('📦 Zip oluşturuluyor...');
    execSync('Compress-Archive -Path "client/dist/*" -DestinationPath "auto-deploy.zip" -Force', {
      shell: 'powershell.exe'
    });
    
    // Netlify Drop'u aç
    console.log('🌐 Netlify Drop açılıyor...');
    execSync('start https://app.netlify.com/drop', { shell: true });
    
    // Explorer'ı aç
    const zipPath = path.resolve('auto-deploy.zip');
    execSync(`explorer /select,"${zipPath}"`, { shell: true });
    
    console.log('📋 MANUEL ADIM GEREKLİ:');
    console.log('1. auto-deploy.zip dosyasını Netlify Drop sayfasına sürükle');
    console.log('2. Upload tamamlandıktan sonra Functions ayarını yap: netlify/functions');
    
  } catch (error) {
    console.error('Fallback hatası:', error.message);
    console.log('❌ Otomatik deploy mümkün değil');
    console.log('📋 Manuel deploy gerekli: https://app.netlify.com/drop');
  }
}

// Çalıştır
fullAutoDeploy();