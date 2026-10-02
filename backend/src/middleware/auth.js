const jwt = require('jsonwebtoken');
const dbRepo = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'udhaar_secure_v1_jwt_secret_key_2026';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

async function authenticateOwner(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const owner = await dbRepo.getOwnerById(decoded.ownerId);

    if (!owner) {
      return res.status(401).json({ success: false, message: 'Invalid session or owner no longer exists.' });
    }

    const business = await dbRepo.getBusinessByOwnerId(owner.id);

    req.owner = owner;
    req.business = business || null;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }
}

// In-memory lightweight rate limiter for public endpoints
const requestCounts = new Map();
function publicRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  requestCounts.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again in a minute.'
    });
  }

  next();
}

module.exports = {
  generateToken,
  authenticateOwner,
  publicRateLimiter
};
