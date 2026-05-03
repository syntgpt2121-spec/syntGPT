import dotenv from 'dotenv';
dotenv.config({ override: true });
import { app } from './app.js';

const PORT = process.env.PORT || 3001;

// Start server (skip in Netlify serverless)
if (process.env.NETLIFY !== 'true') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel için CORS ve rate limiting aktif`);
  });
}
