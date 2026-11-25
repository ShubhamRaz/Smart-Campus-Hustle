import crypto from 'node:crypto';
import db from '../db/connection.js';

const QR_SIGNING_SECRET = process.env.QR_SECRET || 'smart_campus_qr_hmac_signing_key_2026';

export class DynamicQRService {
  /**
   * Generates a 60-second dynamic cryptographic QR token for Digital Identity / Turnstiles
   */
  static generateDynamicIDToken(userId, tenantId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(6).toString('hex');
    const payload = `${userId}:${tenantId}:${timestamp}:${nonce}`;
    const signature = crypto
      .createHmac('sha256', QR_SIGNING_SECRET)
      .update(payload)
      .digest('hex');

    const token = Buffer.from(JSON.stringify({
      uid: userId,
      tid: tenantId,
      ts: timestamp,
      n: nonce,
      sig: signature.slice(0, 32)
    })).toString('base64url');

    return {
      token,
      validUntil: new Date((timestamp + 60) * 1000).toISOString(),
      expiresInSeconds: 60
    };
  }

  /**
   * Validates dynamic QR token scanned at turnstile or gate reader
   */
  static verifyDynamicIDToken(tokenString, expectedTenantId) {
    try {
      const decoded = JSON.parse(Buffer.from(tokenString, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);

      if (expectedTenantId && decoded.tid !== expectedTenantId) {
        return {
          valid: false,
          error: 'TENANT_MISMATCH',
          message: 'This university ID QR code belongs to a different institution.'
        };
      }

      // Check 60-second validity window
      if (now - decoded.ts > 60 || decoded.ts > now + 5) {
        return {
          valid: false,
          error: 'TOKEN_EXPIRED',
          message: 'Dynamic QR code has expired. Screen refresh required.'
        };
      }

      // Verify HMAC signature
      const payload = `${decoded.uid}:${decoded.tid}:${decoded.ts}:${decoded.n}`;
      const expectedSignature = crypto
        .createHmac('sha256', QR_SIGNING_SECRET)
        .update(payload)
        .digest('hex')
        .slice(0, 32);

      if (decoded.sig !== expectedSignature) {
        return {
          valid: false,
          error: 'TAMPERED_QR_CODE',
          message: 'Cryptographic signature mismatch! Unauthorized or forged pass.'
        };
      }

      // Fetch user and check active status
      const user = db.prepare('SELECT id, university_id, name, role, department, photo_url, card_status, tenant_id FROM users WHERE id = ? AND tenant_id = ?').get(decoded.uid, decoded.tid);
      if (!user) {
        return { valid: false, error: 'USER_NOT_FOUND', message: 'User does not exist in registry.' };
      }

      if (user.card_status !== 'ACTIVE') {
        return {
          valid: false,
          error: 'CARD_DEACTIVATED',
          message: `Access denied. University ID card is currently marked as ${user.card_status}.`
        };
      }

      return {
        valid: true,
        user,
        verifiedAt: new Date().toISOString()
      };
    } catch {
      return { valid: false, error: 'INVALID_QR_PAYLOAD', message: 'Malformed QR code data.' };
    }
  }

  /**
   * Module 20: Controlled Gate Pass Emergency Protocol for Network Outage
   * Requires dual-officer emergency master override PIN.
   */
  static emergencyGateOverride({ officerId, dualWitnessId, officerPin, reason, studentUniversityId, tenantId }) {
    const safeOfficerId = String(officerId || '').trim();
    const safeWitnessId = String(dualWitnessId || '').trim();
    const safeTenantId = String(tenantId || '').trim();

    if (officerPin !== 'EMERGENCY_OVERRIDE_9911') {
      return { success: false, message: 'Invalid Emergency Master Override credentials.' };
    }

    if (!safeOfficerId || !safeWitnessId || safeOfficerId === safeWitnessId) {
      return { success: false, message: 'Emergency override requires valid officer and dual-witness credentials.' };
    }

    const officer = db.prepare('SELECT id, role, tenant_id FROM users WHERE id = ? AND tenant_id = ?').get(safeOfficerId, safeTenantId);
    const witness = db.prepare('SELECT id, role, tenant_id FROM users WHERE id = ? AND tenant_id = ?').get(safeWitnessId, safeTenantId);

    if (!officer || !witness) {
      return { success: false, message: 'Emergency override requires authorized staff credentials from the same tenant.' };
    }

    const validOfficerRoles = new Set(['SECURITY_GUARD', 'UNIVERSITY_ADMIN']);
    const validWitnessRoles = new Set(['UNIVERSITY_ADMIN', 'WARDEN', 'COUNSELLOR']);
    if (!validOfficerRoles.has(officer.role) || !validWitnessRoles.has(witness.role)) {
      return { success: false, message: 'Emergency override requires a valid guard record and an authorized dual witness.' };
    }

    const student = db.prepare('SELECT * FROM users WHERE university_id = ? AND tenant_id = ?').get(studentUniversityId, safeTenantId);
    if (!student) {
      return { success: false, message: 'Student ID not found in institutional cache.' };
    }

    // Log emergency outage gate entry in audit
    const overrideLogId = 'gate_emg_' + crypto.randomUUID().slice(0, 10);
    db.prepare(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, 'EMERGENCY_GATE_OVERRIDE', 'TURNSTILE', ?, ?)
    `).run(
      overrideLogId,
      safeTenantId,
      safeOfficerId,
      student.id,
      JSON.stringify({ witness: safeWitnessId, reason, overrideTimestamp: new Date().toISOString() })
    );

    return {
      success: true,
      message: `Emergency Gate Passage authorized by Officer ${safeOfficerId} & Witness ${safeWitnessId}. Audit record #${overrideLogId} registered.`,
      student
    };
  }
}
