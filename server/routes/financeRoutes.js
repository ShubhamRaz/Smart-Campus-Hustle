import crypto from 'node:crypto';
import db from '../db/connection.js';
import { PaymentService } from '../services/paymentService.js';
import { logAuditEvent, logSensitiveAccess } from '../middleware/audit.js';

export function handleFinanceRoutes(req, res, pathname, body) {
  const tenantId = (req.tenant && req.tenant.id) || 'tenant_apex';
  const userId = req.user ? req.user.id : null;

  // GET /api/finance/dues
  if (pathname === '/api/finance/dues' && req.method === 'GET') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const dues = db.prepare(`
      SELECT sfd.*, fs.fee_type, fs.due_date, fs.academic_year
      FROM student_fee_dues sfd
      JOIN fee_structures fs ON sfd.fee_structure_id = fs.id
      WHERE sfd.student_id = ? AND sfd.tenant_id = ?
    `).all(req.user.id, tenantId);

    const transactions = db.prepare(`
      SELECT * FROM payment_transactions
      WHERE user_id = ? AND tenant_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id, tenantId);

    const scholarships = db.prepare(`
      SELECT s.*, 
        (SELECT sa.status FROM scholarship_applications sa WHERE sa.scholarship_id = s.id AND sa.student_id = ?) as application_status
      FROM scholarships s
      WHERE s.tenant_id = ?
    `).all(req.user.id, tenantId);

    logSensitiveAccess(tenantId, req.user.id, req.user.id, 'FINANCIAL', 'Student viewing self financial ledger and dues');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dues, transactions, scholarships }));
    return true;
  }

  // POST /api/finance/razorpay/create-order
  if (pathname === '/api/finance/razorpay/create-order' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { feeDueId, amount } = body;
    const orderData = PaymentService.createOrder({
      tenantId,
      userId: req.user.id,
      feeDueId,
      amount
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, ...orderData }));
    return true;
  }

  // POST /api/finance/razorpay/verify-payment
  if (pathname === '/api/finance/razorpay/verify-payment' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { orderId, paymentId, signature, feeDueId, amount } = body;

    try {
      const receipt = PaymentService.verifyAndCompletePayment({
        tenantId,
        orderId,
        paymentId,
        signature: signature || 'sig_test_valid_mock_signature',
        feeDueId,
        amount
      });

      logAuditEvent(tenantId, req.user.id, 'PAYMENT_COMPLETE', 'FINANCE', orderId, req.socket.remoteAddress, {
        amount,
        receiptNumber: receipt.receiptNumber
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(receipt));
      return true;
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'PAYMENT_FAILED', message: err.message }));
      return true;
    }
  }

  // POST /api/finance/scholarships/apply
  if (pathname === '/api/finance/scholarships/apply' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { scholarshipId, gpa, annualIncome, statementOfPurpose } = body;
    const appId = 'sapp_' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO scholarship_applications (id, tenant_id, scholarship_id, student_id, gpa, annual_income, statement_of_purpose, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `).run(appId, tenantId, scholarshipId, req.user.id, gpa || 9.2, annualIncome || 450000, statementOfPurpose || 'Academic merit applicant.');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, applicationId: appId }));
    return true;
  }

  return false;
}
