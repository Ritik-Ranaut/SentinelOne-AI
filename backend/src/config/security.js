const { randomBytes } = require('crypto');

const configuredSecret = process.env.JWT_SECRET?.trim();
if (process.env.NODE_ENV === 'production' && (!configuredSecret || Buffer.byteLength(configuredSecret) < 32)) {
  throw new Error('JWT_SECRET must be configured with at least 32 bytes in production.');
}

const jwtSecret = configuredSecret || randomBytes(32).toString('hex');
const developmentOrigins = process.env.NODE_ENV === 'production'
  ? []
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const clientOrigins = [...new Set([...developmentOrigins, ...configuredOrigins])];

const corsOrigin = (origin, callback) => {
  callback(null, !origin || clientOrigins.includes(origin));
};

module.exports = { jwtSecret, clientOrigins, corsOrigin };
