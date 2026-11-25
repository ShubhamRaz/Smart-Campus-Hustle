import crypto from 'node:crypto';
import db from '../db/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_campus_enterprise_super_secret_key_2026';

export function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    universityId: user.university_id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
    campusId: user.campus_id,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (expectedSig !== signature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return decoded;
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If optional auth or guest endpoint
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Session token invalid or expired.' }));
    return;
  }

  // Fetch fresh user record
  const user = db.prepare('SELECT id, tenant_id, campus_id, university_id, name, email, role, department, card_status, mfa_enabled FROM users WHERE id = ?').get(payload.userId);
  if (!user || user.card_status === 'DEACTIVATED') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'ACCOUNT_DEACTIVATED', message: 'Account has been deactivated. Contact university administration.' }));
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Authentication required for this operation.' }));
      return;
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'PLATFORM_OWNER') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'FORBIDDEN', message: `Access denied. Requires one of roles: [${roles.join(', ')}]` }));
      return;
    }

    next();
  };
}
