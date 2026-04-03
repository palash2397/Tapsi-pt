import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';

const envFile = env === 'production'
  ? '.env.production'
  : '.env';

dotenv.config({ path: envFile });

console.log(`Loaded ENV: ${envFile}`);