import crypto from 'node:crypto';
import db from '../db/connection.js';
import { generateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

export function handleAuthRoutes(req, res, pathname, body) {
  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const { email, password, tenantId = 'tenant_apex' } = body;
    const passwordHash = crypto.createHash('sha256').update(password || '').digest('hex');

    const user = db.prepare(`
      SELECT * FROM users
      WHERE email = ? AND (tenant_id = ? OR role = 'PLATFORM_OWNER')
    `).get(email, tenantId);

    if (!user || user.password_hash !== passwordHash) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'INVALID_CREDENTIALS', message: 'Invalid university email or password.' }));
      return true;
    }

    if (user.card_status === 'DEACTIVATED') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'CARD_DEACTIVATED', message: 'Account is deactivated. Contact campus registrar.' }));
      return true;
    }

    const token = generateToken(user);
    logAuditEvent(user.tenant_id, user.id, 'LOGIN', 'SESSION', user.id, req.socket.remoteAddress, { mode: 'PASSWORD', success: true });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      token,
      user: {
        id: user.id,
        universityId: user.university_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        tenantId: user.tenant_id,
        campusId: user.campus_id,
        photoUrl: user.photo_url,
        cardStatus: user.card_status,
        mfaEnabled: !!user.mfa_enabled
      }
    }));
    return true;
  }

  // GET /api/auth/me
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.user.tenant_id);
    const campuses = db.prepare('SELECT * FROM campuses WHERE tenant_id = ?').all(req.user.tenant_id);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user: req.user,
      tenant,
      campuses
    }));
    return true;
  }

  // GET /api/auth/demo-users
  if (pathname === '/api/auth/demo-users' && req.method === 'GET') {
    const users = db.prepare(`
      SELECT u.id, u.university_id, u.name, u.email, u.role, u.department, u.photo_url, u.tenant_id, t.name as tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      ORDER BY u.role, u.name
    `).all();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users }));
    return true;
  }

  return false;
}
