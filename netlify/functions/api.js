const serverless = require('serverless-http');
const fs = require('fs');
const path = require('path');

let cachedHandler;

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  // Try multiple paths to find the app.js
  const possiblePaths = [
    // Preferred: bundled into the function directory at build time
    './server/dist/app.js',
    path.join(__dirname, 'server/dist/app.js'),
    '../../server/dist/app.js',
    '../server/dist/app.js',
    path.join(__dirname, '../../server/dist/app.js'),
    path.join(__dirname, '../server/dist/app.js'),
    path.join(process.cwd(), 'server/dist/app.js'),
  ];

  let mod = null;
  let lastError = null;

  for (const p of possiblePaths) {
    try {
      console.log('Trying path:', p);
      if (fs.existsSync(p)) {
        mod = await import(p);
        console.log('Successfully loaded from:', p);
        break;
      }
    } catch (e) {
      lastError = e;
      console.log('Failed to load from:', p, e.message);
    }
  }

  if (!mod || !mod.app) {
    // List directory contents for debugging
    const debugInfo = {
      cwd: process.cwd(),
      dirname: __dirname,
      files: [],
      error: lastError?.message
    };
    
    try {
      if (fs.existsSync('../../server')) {
        debugInfo.files = fs.readdirSync('../../server');
      }
    } catch (e) {
      debugInfo.filesError = e.message;
    }
    
    console.error('Debug info:', JSON.stringify(debugInfo, null, 2));
    throw new Error('Failed to load server app. Debug: ' + JSON.stringify(debugInfo));
  }

  cachedHandler = serverless(mod.app);
  return cachedHandler;
}

module.exports.handler = async (event, context) => {
  try {
    const handler = await getHandler();
    return handler(event, context);
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
