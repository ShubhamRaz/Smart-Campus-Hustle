import crypto from 'node:crypto';
import db from '../db/connection.js';
import { logAuditEvent } from '../middleware/audit.js';
import { WorkflowEngine } from '../services/workflowEngine.js';

export function handleOperationsRoutes(req, res, pathname, body) {
  const tenantId = (req.tenant && req.tenant.id) || 'tenant_apex';
  const userId = req.user ? req.user.id : null;

  if (pathname === '/api/notifications' && req.method === 'GET') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const notifications = db.prepare(`
      SELECT id, title, message, type, source_id, read_at, created_at
      FROM user_notifications
      WHERE tenant_id = ? AND recipient_user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(tenantId, userId);
    const unreadCount = notifications.filter((notification) => !notification.read_at).length;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ notifications, unreadCount }));
    return true;
  }

  if (pathname === '/api/notifications/read' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    db.prepare(`
      UPDATE user_notifications
      SET read_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND recipient_user_id = ? AND read_at IS NULL
    `).run(tenantId, userId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return true;
  }

  // =========================================================================
  // MODULE 3: VISITOR MANAGEMENT
  // =========================================================================
  if (pathname === '/api/visitors' && req.method === 'GET') {
    const visitors = db.prepare(`
      SELECT v.*, u.name as host_name, u.department as host_department
      FROM visitor_requests v
      JOIN users u ON v.host_user_id = u.id
      WHERE v.tenant_id = ?
      ORDER BY v.expected_arrival DESC
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ visitors }));
    return true;
  }

  if (pathname === '/api/visitors/register' && req.method === 'POST') {
    const { visitorName, visitorPhone, visitorEmail, idProofType, idProofNumber, hostUserId, purpose, expectedArrival, campusId = 'campus_apex_main' } = body;
    const reqId = 'vis_' + crypto.randomUUID().slice(0, 8);
    const passQr = `PASS_VIS_${reqId}_${crypto.randomBytes(4).toString('hex')}`;

    db.prepare(`
      INSERT INTO visitor_requests (id, tenant_id, campus_id, visitor_name, visitor_phone, visitor_email, id_proof_type, id_proof_number, host_user_id, purpose, expected_arrival, host_approval_status, pass_qr_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)
    `).run(reqId, tenantId, campusId, visitorName, visitorPhone, visitorEmail || '', idProofType, idProofNumber, hostUserId, purpose, expectedArrival, passQr);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, visitorId: reqId, passQrCode: passQr }));
    return true;
  }

  if (pathname === '/api/visitors/verify-gate' && req.method === 'POST') {
    const { passQrCode, gateNumber = 'Gate 1 Main Gate' } = body;
    const pass = db.prepare('SELECT * FROM visitor_requests WHERE pass_qr_code = ? AND tenant_id = ?').get(passQrCode, tenantId);

    if (!pass) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ valid: false, message: 'Invalid or unregistered visitor pass.' }));
      return true;
    }

    if (pass.host_approval_status !== 'APPROVED') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ valid: false, message: `Access denied. Visitor pass is currently ${pass.host_approval_status}.` }));
      return true;
    }

    const isCheckIn = !pass.check_in_time;
    if (isCheckIn) {
      db.prepare('UPDATE visitor_requests SET check_in_time = CURRENT_TIMESTAMP WHERE id = ?').run(pass.id);
    } else {
      db.prepare('UPDATE visitor_requests SET check_out_time = CURRENT_TIMESTAMP WHERE id = ?').run(pass.id);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      valid: true,
      action: isCheckIn ? 'CHECKED_IN' : 'CHECKED_OUT',
      visitor: pass,
      gateNumber,
      timestamp: new Date().toISOString()
    }));
    return true;
  }

  // =========================================================================
  // MODULE 4: EMERGENCY & SAFETY MANAGEMENT
  // =========================================================================
  if (pathname === '/api/emergency/sos' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { alertType = 'GENERAL_SOS', locationDescription = 'Campus Academic Plaza', gpsCoordinates = null } = body;
    const sosId = 'sos_' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO sos_alerts (id, tenant_id, campus_id, triggered_by_user_id, alert_type, location_description, gps_coordinates, status, dispatched_officers)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NULL)
    `).run(sosId, tenantId, req.user.campus_id || 'campus_apex_main', req.user.id, alertType, locationDescription, gpsCoordinates);

    const student = req.user.role === 'STUDENT'
      ? db.prepare(`
        SELECT id, name, university_id, parent_id, campus_id
        FROM users WHERE id = ? AND tenant_id = ?
      `).get(req.user.id, tenantId)
      : db.prepare(`
        SELECT id, name, university_id, parent_id, campus_id
        FROM users
        WHERE parent_id = ? AND tenant_id = ? AND role = 'STUDENT'
        ORDER BY created_at DESC
        LIMIT 1
      `).get(req.user.id, tenantId);
    const studentName = student?.name || req.user.name;
    const studentId = student?.university_id || req.user.university_id || 'Unknown';
    const recipients = student
      ? db.prepare(`
        SELECT id, role
        FROM users
        WHERE tenant_id = ?
          AND (
            (id = ? AND role = 'PARENT')
            OR (
              role IN ('WARDEN', 'COUNSELLOR')
              AND (campus_id = ? OR campus_id IS NULL)
            )
          )
      `).all(tenantId, student.parent_id || '', student.campus_id || req.user.campus_id)
      : [];
    const notificationMessage =
      `Emergency alert from ${studentName} (${studentId}): ${alertType.replaceAll('_', ' ')} at ${locationDescription}. ` +
      'This is an in-app alert; contact emergency services directly if immediate response is needed.';
    const insertNotification = db.prepare(`
      INSERT INTO user_notifications (
        id, tenant_id, recipient_user_id, title, message, type, source_id
      ) VALUES (?, ?, ?, ?, ?, 'EMERGENCY', ?)
    `);
    for (const recipient of recipients) {
      insertNotification.run(
        `notif_${crypto.randomUUID()}`,
        tenantId,
        recipient.id,
        `Campus SOS: ${studentName}`,
        notificationMessage,
        sosId
      );
    }

    logAuditEvent(tenantId, req.user.id, 'SOS_TRIGGER', 'SAFETY', sosId, req.socket.remoteAddress, { alertType, gpsCoordinates });
    WorkflowEngine.trigger(tenantId, 'SOS_FIRED', { sosId, student_name: studentName, studentName, locationDescription });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      sosId,
      notifiedRoles: [...new Set(recipients.map((recipient) => recipient.role))],
      status: 'RECORDED',
      etaMinutes: null,
      instructions: 'Your alert was recorded in the campus portal. This demo is not connected to a live emergency response team. For immediate help, call 112.'
    }));
    return true;
  }

  if (pathname === '/api/emergency/contacts' && req.method === 'GET') {
    const contacts = db.prepare('SELECT * FROM emergency_contacts WHERE tenant_id = ?').all(tenantId);
    const broadcasts = db.prepare('SELECT * FROM emergency_broadcasts WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5').all(tenantId);
    const recentSos = db.prepare(`
      SELECT s.*, u.name as user_name, u.phone as user_phone, u.role as user_role
      FROM sos_alerts s
      JOIN users u ON s.triggered_by_user_id = u.id
      WHERE s.tenant_id = ?
      ORDER BY s.created_at DESC LIMIT 10
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ contacts, broadcasts, recentSos }));
    return true;
  }

  // =========================================================================
  // MODULE 5: MAINTENANCE MANAGEMENT
  // =========================================================================
  if (pathname === '/api/maintenance/tickets' && req.method === 'GET') {
    const tickets = db.prepare(`
      SELECT m.*, u.name as reporter_name, tech.name as technician_name
      FROM maintenance_tickets m
      JOIN users u ON m.reported_by_user_id = u.id
      LEFT JOIN users tech ON m.assigned_technician_id = tech.id
      WHERE m.tenant_id = ?
      ORDER BY 
        CASE m.status
          WHEN 'OPEN' THEN 1
          WHEN 'IN_PROGRESS' THEN 2
          WHEN 'RESOLVED' THEN 3
          ELSE 4
        END,
        m.created_at DESC
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tickets }));
    return true;
  }

  if (pathname === '/api/maintenance/tickets' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { title, description, category, location, photoUrl, priority = 'NORMAL' } = body;
    const ticketId = 'maint_' + crypto.randomUUID().slice(0, 8);

    // Auto department assignment logic
    const deptMap = {
      ELECTRICAL: 'Electrical Maintenance',
      PLUMBING: 'Plumbing & Sanitation',
      HVAC: 'HVAC & Climate Team',
      IT_HARDWARE: 'Campus Network & Systems',
      CARPENTRY: 'Carpentry & Furniture',
      CIVIL: 'Civil & Masonry Services'
    };
    const assignedDepartment = deptMap[category] || 'General Maintenance';

    db.prepare(`
      INSERT INTO maintenance_tickets (id, tenant_id, campus_id, reported_by_user_id, title, description, category, location, photo_url, priority, status, assigned_department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `).run(ticketId, tenantId, req.user.campus_id || 'campus_apex_main', req.user.id, title, description, category, location, photoUrl || null, priority, assignedDepartment);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, ticketId, assignedDepartment }));
    return true;
  }

  if (pathname === '/api/maintenance/resolve' && req.method === 'POST') {
    const { ticketId, resolutionNotes, studentRating, studentFeedback } = body;
    if (studentRating) {
      db.prepare('UPDATE maintenance_tickets SET student_rating = ?, student_feedback = ? WHERE id = ?').run(studentRating, studentFeedback || '', ticketId);
    } else {
      db.prepare('UPDATE maintenance_tickets SET status = "RESOLVED", resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run(resolutionNotes || 'Resolved by engineering team.', ticketId);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return true;
  }

  // =========================================================================
  // MODULE 8: SMART TRANSPORT
  // =========================================================================
  if (pathname === '/api/transport/routes' && req.method === 'GET') {
    const routes = db.prepare('SELECT * FROM transport_routes WHERE tenant_id = ?').all(tenantId).map(r => ({
      ...r,
      stops: JSON.parse(r.stops_json)
    }));

    const vehicles = db.prepare(`
      SELECT v.*, r.route_name
      FROM transport_vehicles v
      LEFT JOIN transport_routes r ON v.route_id = r.id
      WHERE v.tenant_id = ?
    `).all(tenantId);

    let myAllocation = null;
    if (userId) {
      myAllocation = db.prepare(`
        SELECT ta.*, tr.route_name, tv.bus_number, tv.driver_name, tv.driver_phone, tv.current_lat, tv.current_lng, tv.speed_kmh, tv.eta_minutes
        FROM transport_allocations ta
        JOIN transport_routes tr ON ta.route_id = tr.id
        LEFT JOIN transport_vehicles tv ON ta.vehicle_id = tv.id
        WHERE ta.student_id = ? AND ta.tenant_id = ?
      `).get(userId, tenantId);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ routes, vehicles, myAllocation }));
    return true;
  }

  // =========================================================================
  // MODULE 12: EVENTS & STUDENT ACTIVITIES
  // =========================================================================
  if (pathname === '/api/events' && req.method === 'GET') {
    const events = db.prepare(`
      SELECT e.*, c.name as club_name,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.user_id = ?) as is_registered
      FROM events e
      LEFT JOIN student_clubs c ON e.club_id = c.id
      WHERE e.tenant_id = ?
      ORDER BY e.event_date ASC
    `).all(userId, tenantId);

    const clubs = db.prepare('SELECT * FROM student_clubs WHERE tenant_id = ?').all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events, clubs }));
    return true;
  }

  if (pathname === '/api/events/register' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { eventId } = body;
    const regId = 'ereg_' + crypto.randomUUID().slice(0, 8);
    const qrTicket = `EVT_TICKET_${eventId}_${req.user.university_id}`;

    db.prepare(`
      INSERT INTO event_registrations (id, tenant_id, event_id, user_id, qr_ticket)
      VALUES (?, ?, ?, ?, ?)
    `).run(regId, tenantId, eventId, req.user.id, qrTicket);

    db.prepare('UPDATE events SET registered_count = registered_count + 1 WHERE id = ?').run(eventId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, qrTicket }));
    return true;
  }

  // =========================================================================
  // MODULE 13: CAFETERIA & MESS
  // =========================================================================
  if (pathname === '/api/cafeteria/menu' && req.method === 'GET') {
    const menu = db.prepare('SELECT * FROM cafeteria_items WHERE tenant_id = ? ORDER BY category, name').all(tenantId);
    
    let activeMessSub = null;
    let recentOrders = [];
    if (userId) {
      activeMessSub = db.prepare('SELECT * FROM mess_subscriptions WHERE student_id = ? AND tenant_id = ? AND status = "ACTIVE"').get(userId, tenantId);
      recentOrders = db.prepare('SELECT * FROM cafeteria_orders WHERE user_id = ? AND tenant_id = ? ORDER BY ordered_at DESC LIMIT 5').all(userId, tenantId).map(o => ({
        ...o,
        items: JSON.parse(o.items_json)
      }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ menu, activeMessSub, recentOrders }));
    return true;
  }

  if (pathname === '/api/cafeteria/order' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { items, totalAmount } = body;
    const orderId = 'ord_' + crypto.randomUUID().slice(0, 8);
    const tokenNumber = crypto.randomInt(101, 999);

    db.prepare(`
      INSERT INTO cafeteria_orders (id, tenant_id, user_id, token_number, total_amount, payment_status, order_status, items_json)
      VALUES (?, ?, ?, ?, ?, 'PAID', 'READY', ?)
    `).run(orderId, tenantId, req.user.id, tokenNumber, totalAmount, JSON.stringify(items || []));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, orderId, tokenNumber, message: `Order #${tokenNumber} received and sent to cafeteria kitchen!` }));
    return true;
  }

  // =========================================================================
  // MODULE 14: RESOURCE BOOKING
  // =========================================================================
  if (pathname === '/api/resources' && req.method === 'GET') {
    const resources = db.prepare('SELECT * FROM campus_resources WHERE tenant_id = ?').all(tenantId);
    const reservations = db.prepare(`
      SELECT r.*, res.name as resource_name, u.name as booked_by_name
      FROM resource_reservations r
      JOIN campus_resources res ON r.resource_id = res.id
      JOIN users u ON r.requested_by_user_id = u.id
      WHERE r.tenant_id = ?
      ORDER BY r.date DESC, r.start_time ASC
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ resources, reservations }));
    return true;
  }

  if (pathname === '/api/resources/book' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { resourceId, purpose, date, startTime, endTime } = body;

    // Check collision / double-booking
    const collision = db.prepare(`
      SELECT * FROM resource_reservations
      WHERE resource_id = ? AND date = ? AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?)
      ) AND approval_status != 'REJECTED'
    `).get(resourceId, date, startTime, startTime, endTime, endTime);

    if (collision) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'SLOT_OCCUPIED', message: 'Resource already reserved during this time slot.' }));
      return true;
    }

    const bookId = 'res_bk_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO resource_reservations (id, tenant_id, resource_id, requested_by_user_id, purpose, date, start_time, end_time, approval_status, approved_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 'Prof. Arvind Namboodiri')
    `).run(bookId, tenantId, resourceId, req.user.id, purpose, date, startTime, endTime);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, bookingId: bookId }));
    return true;
  }

  // =========================================================================
  // MODULE 16: LOST & FOUND
  // =========================================================================
  if (pathname === '/api/lost-found' && req.method === 'GET') {
    const items = db.prepare(`
      SELECT lf.*, u.name as reported_by_name
      FROM lost_found_items lf
      JOIN users u ON lf.reported_by_user_id = u.id
      WHERE lf.tenant_id = ?
      ORDER BY lf.created_at DESC
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items }));
    return true;
  }

  if (pathname === '/api/lost-found' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { itemType, title, category, description, location, photoUrl } = body;
    const itemId = 'lf_' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO lost_found_items (id, tenant_id, campus_id, item_type, title, category, description, location, photo_url, reported_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(itemId, tenantId, req.user.campus_id || 'campus_apex_main', itemType, title, category, description, location, photoUrl || null, req.user.id);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, itemId }));
    return true;
  }

  // =========================================================================
  // MODULE 18: GRIEVANCES & ANTI-RAGGING
  // =========================================================================
  if (pathname === '/api/grievances' && req.method === 'GET') {
    const grievances = db.prepare(`
      SELECT g.*, 
        CASE WHEN g.confidentiality_level = 'STRICTLY_ANONYMOUS' THEN 'Confidential Student' ELSE u.name END as submitter_name
      FROM grievances g
      LEFT JOIN users u ON g.submitted_by_user_id = u.id
      WHERE g.tenant_id = ?
      ORDER BY 
        CASE g.priority
          WHEN 'EMERGENCY_CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          ELSE 3
        END,
        g.created_at DESC
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ grievances }));
    return true;
  }

  if (pathname === '/api/grievances' && req.method === 'POST') {
    const { category, confidentialityLevel = 'CONFIDENTIAL', subject, details } = body;
    const grvId = 'grv_' + crypto.randomUUID().slice(0, 8);
    const ticketNumber = `GRV-2026-${crypto.randomInt(1000, 9999)}`;
    const isAntiRagging = category === 'ANTI_RAGGING';
    const priority = isAntiRagging ? 'EMERGENCY_CRITICAL' : 'HIGH';
    const submitterId = confidentialityLevel === 'STRICTLY_ANONYMOUS' ? null : (req.user ? req.user.id : null);

    db.prepare(`
      INSERT INTO grievances (id, tenant_id, campus_id, tracking_ticket_number, category, confidentiality_level, submitted_by_user_id, subject, details, priority, status, auto_escalation_deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_REVIEW', datetime('now', '+72 hours'))
    `).run(grvId, tenantId, req.user?.campus_id || 'campus_apex_main', ticketNumber, category, confidentialityLevel, submitterId, subject, details, priority);

    if (isAntiRagging) {
      WorkflowEngine.trigger(tenantId, 'ANTI_RAGGING_ALERT', { ticketNumber, subject });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, trackingTicketNumber: ticketNumber, autoEscalationDeadline: '72 Hours' }));
    return true;
  }

  return false;
}
