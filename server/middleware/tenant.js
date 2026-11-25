import db from '../db/connection.js';

export function tenantMiddleware(req, res, next) {
  // Tenant can be specified by Header, Query param, or derived from authenticated user
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const tenantId = req.headers['x-tenant-id'] || parsedUrl.searchParams.get('tenant_id') || (req.user && req.user.tenant_id) || 'tenant_apex';

  try {
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ? OR slug = ?').get(tenantId, tenantId);
    
    if (!tenant) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'INVALID_TENANT', message: 'Tenant institution not recognized or access denied.' }));
      return;
    }

    if (tenant.subscription_status === 'SUSPENDED') {
      res.writeHead(402, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'TENANT_SUSPENDED', message: 'Institutional subscription is suspended. Contact campus IT billing.' }));
      return;
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    console.error('Tenant middleware error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'SERVER_ERROR', message: err.message }));
  }
}
