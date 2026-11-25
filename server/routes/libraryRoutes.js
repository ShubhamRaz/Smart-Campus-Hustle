import crypto from 'node:crypto';
import db from '../db/connection.js';

export function handleLibraryRoutes(req, res, pathname, body) {
  const tenantId = (req.tenant && req.tenant.id) || 'tenant_apex';
  const userId = req.user ? req.user.id : null;

  // GET /api/library/books
  if (pathname === '/api/library/books' && req.method === 'GET') {
    const books = db.prepare('SELECT * FROM library_books WHERE tenant_id = ? ORDER BY title ASC').all(tenantId);
    
    let userIssues = [];
    let userReservations = [];
    if (userId) {
      userIssues = db.prepare(`
        SELECT bi.*, b.title, b.author, b.isbn
        FROM book_issues bi
        JOIN library_books b ON bi.book_id = b.id
        WHERE bi.user_id = ? AND bi.tenant_id = ?
        ORDER BY bi.issue_date DESC
      `).all(userId, tenantId);

      userReservations = db.prepare(`
        SELECT br.*, b.title, b.author
        FROM book_reservations br
        JOIN library_books b ON br.book_id = b.id
        WHERE br.user_id = ? AND br.tenant_id = ?
      `).all(userId, tenantId);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ books, userIssues, userReservations }));
    return true;
  }

  // POST /api/library/reserve
  if (pathname === '/api/library/reserve' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { bookId } = body;
    const resId = 'res_' + crypto.randomUUID().slice(0, 8);
    const existingWaiting = db.prepare('SELECT count(*) as count FROM book_reservations WHERE book_id = ? AND status = "WAITING"').get(bookId).count;

    db.prepare(`
      INSERT INTO book_reservations (id, tenant_id, book_id, user_id, status, queue_number)
      VALUES (?, ?, ?, ?, 'WAITING', ?)
    `).run(resId, tenantId, bookId, req.user.id, existingWaiting + 1);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, reservationId: resId, queueNumber: existingWaiting + 1 }));
    return true;
  }

  // POST /api/library/turnstile-entry
  if (pathname === '/api/library/turnstile-entry' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const entryId = 'lib_entry_' + crypto.randomUUID().slice(0, 8);
    const allocatedSeat = 'Carrel #' + crypto.randomInt(10, 85);

    db.prepare(`
      INSERT INTO library_gate_logs (id, tenant_id, user_id, allocated_seat)
      VALUES (?, ?, ?, ?)
    `).run(entryId, tenantId, req.user.id, allocatedSeat);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      verified: true,
      allocatedSeat,
      message: `Library gate turnstile unlocked. Welcome ${req.user.name}. Allocated Study Seat: ${allocatedSeat}.`
    }));
    return true;
  }

  return false;
}
