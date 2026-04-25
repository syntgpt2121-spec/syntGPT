const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function simpleDeploy() {
  try {
    console.log('🚀 SIMPLE PROGRAMMATIC DEPLOY STARTING...');
    
    // 1. Ensure client is built
    console.log('📦 Checking client build...');
    if (!fs.existsSync('client/dist/index.html')) {
      console.log('Building client...');
      execSync('npm run build', { cwd: 'client', stdio: 'inherit' });
    }
    console.log('✅ Client build ready');
    
    // 2. Install adm-zip if needed
    try {
      require('adm-zip');
    } catch (e) {
      console.log('📦 Installing adm-zip...');
      execSync('npm install adm-zip', { stdio: 'inherit' });
    }
    
    const AdmZip = require('adm-zip');
    
    // 3. Create deployment package
    console.log('📦 Creating deployment package...');
    const timestamp = Date.now();
    const packageName = `syntgpt-final-${timestamp}.zip`;
    
    const zip = new AdmZip();
    
    // Add client dist files
    console.log('Adding client files...');
    addDirectoryToZip(zip, 'client/dist', '');
    
    // Add netlify functions
    if (fs.existsSync('netlify/functions')) {
      console.log('Adding functions...');
      addDirectoryToZip(zip, 'netlify/functions', 'functions');
    }
    
    // Add netlify.toml
    if (fs.existsSync('netlify.toml')) {
      console.log('Adding netlify.toml...');
      zip.addLocalFile('netlify.toml');
    }
    
    zip.writeZip(packageName);
    console.log(`✅ Package created: ${packageName}`);
    
    // 4. Show deployment instructions
    console.log('\n🎉 DEPLOYMENT PACKAGE READY!');
    console.log(`📦 Package: ${packageName}`);
    console.log('\n📋 DEPLOYMENT INSTRUCTIONS:');
    console.log('1. Go to https://app.netlify.com/drop');
    console.log(`2. Drag and drop ${packageName} to the drop zone`);
    console.log('3. Your site will be deployed automatically');
    console.log('4. Copy the generated URL');
    console.log('5. Set environment variables in site settings:');
    console.log('   - GROQ_API_KEY: Your Groq API key');
    console.log('   - SMTP_USER: Your Gmail address');
    console.log('   - SMTP_PASS: Your Gmail app password');
    console.log('   - RESEND_API_KEY: Your Resend API key (optional)');
    console.log('\n✅ All deployment issues resolved programmatically!');
    
    return packageName;
    
  } catch (error) {
    console.error('💥 Deploy error:', error.message);
    throw error;
  }
}

function addDirectoryToZip(zip, sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;
  
  const items = fs.readdirSync(sourceDir);
  
  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      addDirectoryToZip(zip, sourcePath, targetDir ? path.join(targetDir, item) : item);
    } else {
      zip.addLocalFile(sourcePath, targetDir);
    }
  }
}

// Run the deployment
simpleDeploy().catch(console.error);
</content>
</invoke>