const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitsync',
  JWT_SECRET: process.env.JWT_SECRET || 'transitsync_secret_2026',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '*',
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  AI_API_KEY: process.env.AI_API_KEY || '',
};
