const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let cachedDevSecret = null;
function getJwtSecret() {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  if (!cachedDevSecret) {
    cachedDevSecret = crypto.randomBytes(48).toString('hex');
    console.warn('[auth] JWT_SECRET unset — using ephemeral dev secret. Set JWT_SECRET to persist tokens across restarts.');
  }
  return cachedDevSecret;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient role' });
    next();
  };
}

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.getJwtSecret = getJwtSecret;
