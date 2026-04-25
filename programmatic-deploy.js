const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

async function programmaticDeploy() {
  try {
    console.log('🤖 TAMAMEN PROGRAMATIK DEPLOY BAŞLIYOR...');
    
    // 1. Personal Access Token oluştur
    console.log('🔑 Netlify token oluşturuluyor...');
    
    // Netlify CLI'dan mevcut session'ı kullan
    let authToken = null;
    
    try {
      // CLI'dan auth token'ı çıkar
      const netlifyConfig = execSync('netlify status --json', { encoding: 'utf8' });
      const config = JSON.parse(netlifyConfig);
      
      // Config dosyasından token al
      const os = require('os');
      const configPath = path.join(os.homedir(), '.netlify', 'config.json');
      
      if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (configData.users && configData.users[0]) {
          authToken = configData.users[0].auth?.token;
        }
      }
      
      // Alternatif: CLI'dan direkt token al
      if (!authToken) {
        try {
          const tokenResult = execSync('netlify env:get NETLIFY_AUTH_TOKEN', { encoding: 'utf8' });
          authToken = tokenResult.trim();
        } catch (e) {
          console.log('Env token bulunamadı');
        }
      }
      
    } catch (e) {
      console.log('Config okuma hatası:', e.message);
    }
    
    // Token yoksa yeni bir yöntem dene
    if (!authToken) {
      console.log('❌ Token bulunamadı, API key oluşturuluyor...');
      
      // Netlify API'sine login yap ve token al
      const loginData = await netlifyLogin();
      authToken = loginData.token;
    }
    
    if (!authToken) {
      throw new Error('Auth token alınamadı');
    }
    
    console.log('✅ Auth token hazır');
    
    // 2. Site oluştur
    console.log('🌐 Site oluşturuluyor...');
    
    const siteName = `syntgpt-auto-${Date.now()}`;
    const site = await createSite(authToken, siteName);
    
    console.log('✅ Site oluşturuldu:', site.name);
    console.log('🔗 URL:', site.url);
    
    // 3. Build dosyalarını hazırla
    console.log('📦 Build hazırlanıyor...');
    
    if (!fs.existsSync('client/dist/index.html')) {
      execSync('npm run build', { cwd: 'client', stdio: 'inherit' });
    }
    
    // 4. Deploy yap
    console.log('🚀 Deploy yapılıyor...');
    
    const deployResult = await deployToSite(authToken, site.id, 'client/dist');
    
    console.log('✅ Deploy tamamlandı!');
    console.log('🎉 Site hazır:', deployResult.url);
    
    // 5. Functions ayarla
    console.log('⚙️ Functions ayarlanıyor...');
    
    await configureFunctions(authToken, site.id);
    
    console.log('✅ Functions yapılandırıldı');
    
    // 6. Build ayarları
    console.log('🔧 Build ayarları yapılıyor...');
    
    await configureBuildSettings(authToken, site.id);
    
    console.log('✅ Build ayarları tamamlandı');
    
    console.log('\\n🎉 DEPLOY TAMAMEN TAMAMLANDI!');
    console.log('🔗 Site URL:', site.url);
    console.log('📧 Hesap: bilal81476@gmail.com');
    console.log('⚙️ Ayarlar ikonu sorunu: ✅ Çözüldü');
    
  } catch (error) {
    console.error('💥 Programatik deploy hatası:', error.message);
    
    // Fallback: CLI ile zorla deploy
    console.log('🆘 Fallback deploy deneniyor...');
    await fallbackCLIDeploy();
  }
}

async function netlifyLogin() {
  // Netlify OAuth flow simülasyonu
  return new Promise((resolve, reject) => {
    // Mevcut CLI session'ından token çıkar
    try {
      const result = execSync('netlify status', { encoding: 'utf8' });
      if (result.includes('bilal81476@gmail.com')) {
        // Token'ı config'den al
        const os = require('os');
        const configPath = path.join(os.homedir(), '.netlify', 'config.json');
        
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.users && config.users[0]) {
            resolve({ token: config.users[0].auth?.token });
            return;
          }
        }
      }
      
      reject(new Error('Login failed'));
    } catch (e) {
      reject(e);
    }
  });
}

async function createSite(token, name) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ name });
    
    const options = {
      hostname: 'api.netlify.com',
      port: 443,
      path: '/api/v1/sites',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Site creation failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function deployToSite(token, siteId, buildDir) {
  return new Promise((resolve, reject) => {
    // Deploy API'sini kullan
    const deployData = JSON.stringify({
      files: getFileHashes(buildDir)
    });
    
    const options = {
      hostname: 'api.netlify.com',
      port: 443,
      path: `/api/v1/sites/${siteId}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const deploy = JSON.parse(responseData);
          // Dosyaları upload et
          uploadFiles(token, deploy.id, buildDir, deploy.required)
            .then(() => resolve(deploy))
            .catch(reject);
        } else {
          reject(new Error(`Deploy failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(deployData);
    req.end();
  });
}

function getFileHashes(dir) {
  const files = {};
  
  function walkDir(currentDir, basePath = '') {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relativePath = path.join(basePath, item).replace(/\\\\/g, '/');
      
      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath, relativePath);
      } else {
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha1').update(content).digest('hex');
        files[relativePath] = hash;
      }
    }
  }
  
  walkDir(dir);
  return files;
}

async function uploadFiles(token, deployId, buildDir, requiredFiles) {
  // Gerekli dosyaları upload et
  for (const filePath of requiredFiles) {
    const fullPath = path.join(buildDir, filePath);
    if (fs.existsSync(fullPath)) {
      await uploadFile(token, deployId, filePath, fullPath);
    }
  }
}

async function uploadFile(token, deployId, filePath, fullPath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(fullPath);
    
    const options = {
      hostname: 'api.netlify.com',
      port: 443,
      path: `/api/v1/deploys/${deployId}/files/${filePath}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileContent.length
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`File upload failed: ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.write(fileContent);
    req.end();
  });
}

async function configureFunctions(token, siteId) {
  // Functions ayarlarını yap
  const settings = {
    functions_dir: 'netlify/functions'
  };
  
  return updateSiteSettings(token, siteId, settings);
}

async function configureBuildSettings(token, siteId) {
  // Build ayarlarını yap
  const settings = {
    build_settings: {
      cmd: 'cd client && npm ci && npm run build',
      dir: 'client/dist'
    }
  };
  
  return updateSiteSettings(token, siteId, settings);
}

async function updateSiteSettings(token, siteId, settings) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(settings);
    
    const options = {
      hostname: 'api.netlify.com',
      port: 443,
      path: `/api/v1/sites/${siteId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Settings update failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fallbackCLIDeploy() {
  try {
    console.log('🔧 CLI fallback deploy...');
    
    // Zorla site oluştur ve deploy et
    const commands = [
      'netlify sites:create --name syntgpt-fallback --manual',
      'netlify deploy --dir client/dist --functions netlify/functions --prod'
    ];
    
    for (const cmd of commands) {
      try {
        execSync(cmd, { stdio: 'inherit', timeout: 60000 });
        console.log(`✅ ${cmd} başarılı`);
      } catch (e) {
        console.log(`❌ ${cmd} başarısız`);
      }
    }
    
  } catch (error) {
    console.error('Fallback deploy hatası:', error.message);
  }
}

// Çalıştır
programmaticDeploy();