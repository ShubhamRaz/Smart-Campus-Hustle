import db from '../db/connection.js';
import { logAuditEvent } from '../middleware/audit.js';

const sendJson = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

export function handleUniversityRoutes(req, res, pathname, body) {
  const isRosterRoute = pathname === '/api/university/students/roster';
  const isProfilesRoute = pathname === '/api/university/students/profiles';
  if (
    pathname !== '/api/university/catalog' &&
    pathname !== '/api/university/faculty/verify' &&
    !isRosterRoute &&
    !isProfilesRoute
  ) {
    return false;
  }

  if (!req.user) {
    sendJson(res, 401, { error: 'UNAUTHORIZED', message: 'Sign in to access the university directory.' });
    return true;
  }

  const tenantId = req.tenant?.id || req.user.tenant_id;
  if (req.user.tenant_id !== tenantId) {
    sendJson(res, 403, { error: 'TENANT_MISMATCH', message: 'You cannot access another university directory.' });
    return true;
  }

  if (isRosterRoute || isProfilesRoute) {
    if (req.user.role !== 'UNIVERSITY_ADMIN') {
      sendJson(res, 403, {
        error: 'ADMIN_ONLY',
        message: 'Only a university administrator can access student records.'
      });
      return true;
    }
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Student records support read-only access.' });
      return true;
    }

    const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
    const search = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const parsedPage = Number.parseInt(url.searchParams.get('page') || '1', 10);
    const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '25', 10);
    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 25;

    if (isProfilesRoute) {
      const whereSql = search
        ? `tenant_id = ? AND (
            enrollment_number LIKE ? OR roll_number LIKE ? OR full_name LIKE ?
            OR course_details LIKE ? OR room_number LIKE ?
          )`
        : 'tenant_id = ?';
      const searchPattern = `%${search}%`;
      const queryParams = search
        ? [tenantId, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
        : [tenantId];
      const total = db.prepare(`
        SELECT COUNT(*) AS count FROM student_profiles WHERE ${whereSql}
      `).get(...queryParams).count;
      const profiles = db.prepare(`
        SELECT id, enrollment_number, roll_number, full_name, course_details,
          room_number, verification_status, verified_at
        FROM student_profiles
        WHERE ${whereSql}
        ORDER BY full_name COLLATE NOCASE, enrollment_number
        LIMIT ? OFFSET ?
      `).all(...queryParams, limit, (page - 1) * limit);

      logAuditEvent(
        tenantId,
        req.user.id,
        'STUDENT_PROFILES_READ',
        'STUDENT_PROFILE',
        null,
        req.socket?.remoteAddress,
        { page, limit, returned: profiles.length, searchUsed: Boolean(search) }
      );
      sendJson(res, 200, {
        profiles,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
      return true;
    }

    const whereSql = search
      ? 'tenant_id = ? AND full_name LIKE ?'
      : 'tenant_id = ?';
    const queryParams = search ? [tenantId, `%${search}%`] : [tenantId];
    const total = db.prepare(`
      SELECT COUNT(*) AS count FROM student_roster_records WHERE ${whereSql}
    `).get(...queryParams).count;
    const entries = db.prepare(`
      SELECT id, full_name, record_status
      FROM student_roster_records
      WHERE ${whereSql}
      ORDER BY full_name COLLATE NOCASE, id
      LIMIT ? OFFSET ?
    `).all(...queryParams, limit, (page - 1) * limit);

    sendJson(res, 200, {
      entries,
      incompleteCount: total,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
    return true;
  }

  if (pathname === '/api/university/catalog' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
    const search = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const departmentId = (url.searchParams.get('departmentId') || '').slice(0, 100);
    const section = url.searchParams.get('section') || 'ALL';
    const status = url.searchParams.get('status') || 'ALL';
    const pageValue = Number.parseInt(url.searchParams.get('page') || '1', 10);
    const limitValue = Number.parseInt(url.searchParams.get('limit') || '25', 10);
    const page = Number.isFinite(pageValue) ? Math.max(1, pageValue) : 1;
    const limit = Number.isFinite(limitValue) ? Math.min(100, Math.max(1, limitValue)) : 25;

    if (!['ALL', 'PENDING_VERIFICATION', 'VERIFIED', 'INACTIVE'].includes(status)) {
      sendJson(res, 400, { error: 'INVALID_STATUS', message: 'Unsupported faculty verification status.' });
      return true;
    }
    if (!['ALL', 'FACULTY', 'PUBLISHED_LEADERSHIP'].includes(section)) {
      sendJson(res, 400, { error: 'INVALID_SECTION', message: 'Unsupported directory section.' });
      return true;
    }

    const conditions = ['f.tenant_id = ?'];
    const params = [tenantId];
    if (section !== 'ALL') {
      conditions.push('f.directory_section = ?');
      params.push(section);
    }
    if (departmentId) {
      conditions.push('f.department_id = ?');
      params.push(departmentId);
    }
    if (status !== 'ALL') {
      conditions.push('f.verification_status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(f.full_name LIKE ? OR d.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = conditions.join(' AND ');

    const profile = db.prepare(`
      SELECT university_type, established_year, location, district, state, country,
        postal_code, region, academic_session, official_website, admissions_website,
        student_portal, admissions_helpline, admissions_email, source_note
      FROM university_profiles WHERE tenant_id = ?
    `).get(tenantId);
    const departments = db.prepare(`
      SELECT id, name, verification_status
      FROM university_departments
      WHERE tenant_id = ?
      ORDER BY name
    `).all(tenantId);
    const programmes = db.prepare(`
      SELECT p.id, p.name, p.verification_status, p.department_id,
        COALESCE(d.name, 'Department not specified') AS department_name
      FROM university_programmes p
      LEFT JOIN university_departments d ON d.id = p.department_id AND d.tenant_id = p.tenant_id
      WHERE p.tenant_id = ?
      ORDER BY d.name, p.name
    `).all(tenantId);
    const facultySummary = db.prepare(`
      SELECT verification_status, COUNT(*) AS count
      FROM faculty_directory
      WHERE tenant_id = ?
      GROUP BY verification_status
    `).all(tenantId);
    const total = db.prepare(`
      SELECT COUNT(*) AS count
      FROM faculty_directory f
      LEFT JOIN university_departments d ON d.id = f.department_id AND d.tenant_id = f.tenant_id
      WHERE ${whereSql}
    `).get(...params).count;
    const faculty = db.prepare(`
      SELECT f.id, f.full_name, f.directory_section, f.verification_status,
        f.verified_at, f.source_note, f.department_id, COALESCE(d.name, 'University Leadership') AS department_name
      FROM faculty_directory f
      LEFT JOIN university_departments d ON d.id = f.department_id AND d.tenant_id = f.tenant_id
      WHERE ${whereSql}
      ORDER BY f.directory_section, department_name, f.full_name
      LIMIT ? OFFSET ?
    `).all(...params, limit, (page - 1) * limit);

    sendJson(res, 200, {
      profile,
      departments,
      programmes,
      faculty,
      facultySummary: Object.fromEntries(facultySummary.map((row) => [row.verification_status, row.count])),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
    return true;
  }

  if (pathname === '/api/university/faculty/verify' && req.method === 'POST') {
    if (req.user.role !== 'UNIVERSITY_ADMIN') {
      sendJson(res, 403, {
        error: 'ADMIN_ONLY',
        message: 'Only a university administrator can verify directory records.'
      });
      return true;
    }
    if (typeof body.facultyId !== 'string' || body.facultyId.length < 1 || body.facultyId.length > 200) {
      sendJson(res, 400, { error: 'INVALID_FACULTY_ID', message: 'A valid faculty record ID is required.' });
      return true;
    }

    const result = db.prepare(`
      UPDATE faculty_directory
      SET verification_status = 'VERIFIED', verified_by_user_id = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ? AND verification_status = 'PENDING_VERIFICATION'
    `).run(req.user.id, body.facultyId, tenantId);
    if (result.changes === 0) {
      const record = db.prepare(`
        SELECT verification_status FROM faculty_directory WHERE id = ? AND tenant_id = ?
      `).get(body.facultyId, tenantId);
      if (!record) {
        sendJson(res, 404, { error: 'FACULTY_NOT_FOUND', message: 'Faculty record not found.' });
      } else {
        sendJson(res, 409, { error: 'NOT_PENDING', message: 'Only pending faculty records can be verified.' });
      }
      return true;
    }

    logAuditEvent(
      tenantId,
      req.user.id,
      'FACULTY_DIRECTORY_VERIFY',
      'FACULTY_DIRECTORY',
      body.facultyId,
      req.socket?.remoteAddress,
      {}
    );
    sendJson(res, 200, { success: true, facultyId: body.facultyId, verificationStatus: 'VERIFIED' });
    return true;
  }

  sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'This directory endpoint does not support that method.' });
  return true;
}
