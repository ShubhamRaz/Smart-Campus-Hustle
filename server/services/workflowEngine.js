import crypto from 'node:crypto';
import db from '../db/connection.js';

export class WorkflowEngine {
  /**
   * Evaluate trigger event against active institutional workflows
   */
  static trigger(tenantId, eventType, eventPayload) {
    const workflows = db.prepare(`
      SELECT * FROM automation_workflows
      WHERE tenant_id = ? AND trigger_event = ? AND is_active = 1
    `).all(tenantId, eventType);

    const executedActions = [];

    for (const wf of workflows) {
      try {
        let conditionMet = true;
        if (wf.condition_json) {
          const conditions = JSON.parse(wf.condition_json);
          for (const [key, val] of Object.entries(conditions)) {
            if (eventPayload[key] !== undefined) {
              if (typeof val === 'number' && eventPayload[key] < val) {
                conditionMet = true;
              } else if (eventPayload[key] !== val) {
                conditionMet = false;
              }
            }
          }
        }

        if (conditionMet) {
          const actionPayload = JSON.parse(wf.action_payload_json || '{}');
          const executionResult = this.executeAction(tenantId, wf.action_type, actionPayload, eventPayload);
          
          db.prepare('UPDATE automation_workflows SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = ?').run(wf.id);
          
          executedActions.push({
            workflowId: wf.id,
            workflowName: wf.name,
            actionType: wf.action_type,
            result: executionResult
          });
        }
      } catch (err) {
        console.error(`Workflow ${wf.id} evaluation failed:`, err);
      }
    }

    return executedActions;
  }

  static executeAction(tenantId, actionType, actionPayload, eventPayload) {
    switch (actionType) {
      case 'SEND_PARENT_SMS': {
        const smsId = 'sms_' + Date.now();
        console.log(`[SMS Gateway Dispatch] Tenant ${tenantId} -> Parent of ${eventPayload.student_name}: "${actionPayload.template || 'Important academic alert.'}"`);
        return { dispatched: true, channel: 'SMS_GATEWAY', messageId: smsId };
      }

      case 'ESCALATE_TICKET': {
        if (eventPayload.ticket_id) {
          db.prepare("UPDATE maintenance_tickets SET priority = 'URGENT' WHERE id = ?").run(eventPayload.ticket_id);
        }
        if (eventPayload.grievance_id) {
          db.prepare("UPDATE grievances SET is_escalated = 1, priority = 'EMERGENCY_CRITICAL' WHERE id = ?").run(eventPayload.grievance_id);
        }
        return { escalated: true, targetRole: actionPayload.target_role || 'ADMIN' };
      }

      case 'GENERATE_NO_DUES_DOC': {
        const docId = 'doc_' + crypto.randomUUID().slice(0, 10);
        const hash = crypto.createHash('sha256').update(docId + eventPayload.userId).digest('hex');
        db.prepare(`
          INSERT INTO generated_documents (id, tenant_id, user_id, doc_type, document_hash, download_url)
          VALUES (?, ?, ?, 'NO_DUES_CLEARANCE', ?, ?)
        `).run(docId, tenantId, eventPayload.userId, hash, `/documents/${docId}.pdf`);
        return { generatedDocId: docId, hash };
      }

      default:
        return { handled: true, actionType };
    }
  }

  /**
   * Generates official certificates and letters
   */
  static generateDocument({ tenantId, userId, docType }) {
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').get(userId, tenantId);
    if (!user) throw new Error('User not found.');

    const docId = 'doc_' + crypto.randomUUID().slice(0, 10);
    const hash = crypto.createHash('sha256').update(`${tenantId}:${userId}:${docType}:${Date.now()}`).digest('hex');
    const downloadUrl = `/documents/official_${docType.toLowerCase()}_${user.university_id}.pdf`;

    db.prepare(`
      INSERT INTO generated_documents (id, tenant_id, user_id, doc_type, document_hash, download_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(docId, tenantId, userId, docType, hash, downloadUrl);

    return {
      docId,
      docType,
      universityId: user.university_id,
      studentName: user.name,
      documentHash: hash,
      downloadUrl,
      issuedAt: new Date().toISOString()
    };
  }
}
