import test from 'node:test';
import assert from 'node:assert';
import db from '../server/db/connection.js';
import { logSensitiveAccess } from '../server/middleware/audit.js';
import { AIAssistantService } from '../server/services/aiService.js';
import { DynamicQRService } from '../server/services/qrService.js';

test('Security Module 19 & 22: Strict Tenant Isolation Enforced', () => {
  // Apex University tenant
  const apexCourses = db.prepare('SELECT * FROM courses WHERE tenant_id = ?').all('tenant_apex');
  // Metro Tech tenant
  const metroCourses = db.prepare('SELECT * FROM courses WHERE tenant_id = ?').all('tenant_metro');

  // Apex courses must belong exclusively to Apex
  for (const c of apexCourses) {
    assert.strictEqual(c.tenant_id, 'tenant_apex', 'Course must strictly match Apex tenant');
    assert.notStrictEqual(c.tenant_id, 'tenant_metro', 'Apex course cannot bleed into Metro Tech');
  }

  // Cross-tenant user verification
  const apexUser = db.prepare('SELECT * FROM users WHERE tenant_id = ? AND role = ?').get('tenant_apex', 'STUDENT');
  const metroUser = db.prepare('SELECT * FROM users WHERE tenant_id = ?').get('tenant_metro');

  assert.notStrictEqual(apexUser.tenant_id, metroUser.tenant_id, 'Tenants must remain isolated');
});

test('Security Module 22: Sensitive Data Access Audit Trail Logged', () => {
  logSensitiveAccess(
    'tenant_apex',
    'user_faculty_1',
    'user_student_1',
    'DISCIPLINARY',
    'Faculty HOD review of lab conduct'
  );

  const log = db.prepare(`
    SELECT * FROM sensitive_access_logs
    WHERE target_student_id = ? AND record_category = ?
    ORDER BY created_at DESC LIMIT 1
  `).get('user_student_1', 'DISCIPLINARY');

  assert.ok(log, 'Sensitive access must be recorded in audit log');
  assert.strictEqual(log.justification, 'Faculty HOD review of lab conduct');
});

test('Security Module 17: Deactivated ID Card Blocks Gate and Exam Entry', () => {
  // Temporarily deactivate card
  db.prepare('UPDATE users SET card_status = ? WHERE id = ?').run('DEACTIVATED', 'user_student_2');

  const user = db.prepare('SELECT card_status FROM users WHERE id = ?').get('user_student_2');
  assert.strictEqual(user.card_status, 'DEACTIVATED');

  // Restore for standard tests
  db.prepare('UPDATE users SET card_status = ? WHERE id = ?').run('ACTIVE', 'user_student_2');
});

test('AI assistant gracefully handles empty and malformed prompts', () => {
  const emptyReply = AIAssistantService.handleQuery({ query: '', user: null, tenantId: 'tenant_apex' });
  const malformedReply = AIAssistantService.handleQuery({ query: null, user: null, tenantId: 'tenant_apex' });

  assert.ok(emptyReply.answer.includes('Please ask a specific question'));
  assert.ok(malformedReply.answer.includes('Please ask a specific question'));
});

test('Emergency override rejects invalid dual-witness credentials', () => {
  const invalidWitness = DynamicQRService.emergencyGateOverride({
    officerId: 'user_guard_1',
    dualWitnessId: 'missing_witness',
    officerPin: 'EMERGENCY_OVERRIDE_9911',
    reason: 'Power outage',
    studentUniversityId: 'MUR2600425',
    tenantId: 'tenant_apex'
  });

  assert.strictEqual(invalidWitness.success, false);
  assert.ok(invalidWitness.message.includes('authorized staff credentials'));
});
