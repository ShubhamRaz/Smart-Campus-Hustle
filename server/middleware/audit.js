import crypto from 'node:crypto';
import db from '../db/connection.js';

export function logAuditEvent(tenantId, userId, action, resourceType, resourceId, ipAddress, detailsObj) {
  try {
    const id = 'aud_' + crypto.randomUUID().slice(0, 12);
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, ip_address, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, tenantId, userId, action, resourceType, resourceId, ipAddress || '127.0.0.1', JSON.stringify(detailsObj || {}));
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export function logSensitiveAccess(tenantId, accessedByUserId, targetStudentId, recordCategory, justification) {
  try {
    const id = 'sens_' + crypto.randomUUID().slice(0, 12);
    const stmt = db.prepare(`
      INSERT INTO sensitive_access_logs (id, tenant_id, accessed_by_user_id, target_student_id, record_category, justification)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, tenantId, accessedByUserId, targetStudentId, recordCategory, justification || 'Authorized Academic / Administrative Justification');
  } catch (err) {
    console.error('Sensitive access logging failed:', err);
  }
}
