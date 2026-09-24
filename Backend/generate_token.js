const jwt = require('jsonwebtoken');
const env = { JWT_SECRET: 'transitsync_jwt_super_secret_key_2026_production' };

const token = jwt.sign({ userId: '6aaeaf5010db015f325a788f', role: 'ROLE_ADMIN' }, env.JWT_SECRET, { expiresIn: '30d' });

console.log(token);
