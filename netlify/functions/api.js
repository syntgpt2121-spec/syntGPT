const serverless = require('serverless-http');

let cachedHandler;

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  const mod = await import('../../server/dist/app.js');
  if (!mod || !mod.app) {
    throw new Error('Failed to load server app from ../../server/dist/app.js');
  }

  cachedHandler = serverless(mod.app);
  return cachedHandler;
}

module.exports.handler = async (event, context) => {
  const handler = await getHandler();
  return handler(event, context);
};
