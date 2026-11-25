import crypto from 'node:crypto';
import db from '../db/connection.js';
import { logAuditEvent } from '../middleware/audit.js';

export function handleAcademicRoutes(req, res, pathname, body) {
  const tenantId = (req.tenant && req.tenant.id) || 'tenant_apex';
  const userId = req.user ? req.user.id : null;

  // GET /api/academic/courses
  if (pathname === '/api/academic/courses' && req.method === 'GET') {
    const courses = db.prepare(`
      SELECT c.*, COUNT(ce.id) as enrolled_count
      FROM courses c
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE c.tenant_id = ?
      GROUP BY c.id
      ORDER BY c.code
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ courses }));
    return true;
  }

  // GET /api/academic/timetable
  if (pathname === '/api/academic/timetable' && req.method === 'GET') {
    const timetable = db.prepare(`
      SELECT t.*, c.code, c.title, c.department, u.name as faculty_name
      FROM timetables t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.faculty_id = u.id
      WHERE t.tenant_id = ?
        AND (
          ? != 'STUDENT'
          OR EXISTS (
            SELECT 1
            FROM course_enrollments ce
            WHERE ce.course_id = t.course_id
              AND ce.student_id = ?
              AND ce.tenant_id = t.tenant_id
              AND ce.status = 'ACTIVE'
          )
        )
      ORDER BY 
        CASE t.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          ELSE 6
        END,
        t.start_time
    `).all(tenantId, req.user?.role || '', userId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ timetable }));
    return true;
  }

  // GET /api/academic/assignments
  if (pathname === '/api/academic/assignments' && req.method === 'GET') {
    const assignments = db.prepare(`
      SELECT a.*, c.code as course_code, c.title as course_title, u.name as faculty_name,
        (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id) as submission_count,
        (SELECT s.marks_obtained FROM assignment_submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as user_marks,
        (SELECT s.feedback FROM assignment_submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as user_feedback,
        (SELECT s.submitted_at FROM assignment_submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as user_submitted_at
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.faculty_id = u.id
      WHERE a.tenant_id = ?
      ORDER BY a.due_date ASC
    `).all(userId, userId, userId, tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ assignments }));
    return true;
  }

  // POST /api/academic/assignments/submit
  if (pathname === '/api/academic/assignments/submit' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { assignmentId, contentText, attachmentUrl } = body;
    const subId = 'sub_' + crypto.randomUUID().slice(0, 10);

    db.prepare(`
      INSERT INTO assignment_submissions (id, tenant_id, assignment_id, student_id, content_text, attachment_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(subId, tenantId, assignmentId, req.user.id, contentText || 'Submitted online work.', attachmentUrl || '/submissions/user_upload.pdf');

    logAuditEvent(tenantId, req.user.id, 'SUBMIT_ASSIGNMENT', 'ASSIGNMENT', assignmentId, req.socket.remoteAddress, { subId });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, submissionId: subId, message: 'Assignment submitted successfully!' }));
    return true;
  }

  // GET /api/academic/lms-materials
  if (pathname === '/api/academic/lms-materials' && req.method === 'GET') {
    const materials = db.prepare(`
      SELECT m.*, c.code as course_code, c.title as course_title
      FROM lms_materials m
      JOIN courses c ON m.course_id = c.id
      WHERE m.tenant_id = ?
      ORDER BY m.created_at DESC
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ materials }));
    return true;
  }

  // GET /api/academic/quizzes
  if (pathname === '/api/academic/quizzes' && req.method === 'GET') {
    const quizzes = db.prepare(`
      SELECT q.*, c.code as course_code, c.title as course_title,
        (SELECT qa.score FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ?) as user_score,
        (SELECT qa.completed_at FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ?) as completed_at
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      WHERE q.tenant_id = ?
    `).all(userId, userId, tenantId);

    // Attach questions
    for (const q of quizzes) {
      q.questions = db.prepare('SELECT id, question_text, options_json, points FROM quiz_questions WHERE quiz_id = ?').all(q.id).map(quest => ({
        ...quest,
        options: JSON.parse(quest.options_json)
      }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ quizzes }));
    return true;
  }

  // POST /api/academic/quizzes/submit
  if (pathname === '/api/academic/quizzes/submit' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { quizId, answers } = body; // answers: { [questionId]: selectedOptionIndex }
    const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?').all(quizId);
    
    let totalScore = 0;
    const feedback = [];

    for (const q of questions) {
      const selected = answers ? answers[q.id] : null;
      const isCorrect = selected === q.correct_option_index;
      if (isCorrect) totalScore += q.points;
      feedback.push({
        questionId: q.id,
        selected,
        correctIndex: q.correct_option_index,
        isCorrect
      });
    }

    const attemptId = 'att_' + crypto.randomUUID().slice(0, 10);
    db.prepare(`
      INSERT INTO quiz_attempts (id, tenant_id, quiz_id, student_id, score, answers_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(attemptId, tenantId, quizId, req.user.id, totalScore, JSON.stringify(answers || {}));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, score: totalScore, maxMarks: questions.reduce((a, b) => a + b.points, 0), feedback }));
    return true;
  }

  // GET /api/academic/exams
  if (pathname === '/api/academic/exams' && req.method === 'GET') {
    const exams = db.prepare(`
      SELECT e.*, c.code as course_code, c.title as course_title,
        er.id as registration_id, er.registration_status, er.hall_ticket_number, er.seat_allotment, er.qr_verification_code
      FROM exam_schedules e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN exam_registrations er ON er.exam_id = e.id AND er.student_id = ?
      WHERE e.tenant_id = ?
        AND (
          ? != 'STUDENT'
          OR EXISTS (
            SELECT 1
            FROM course_enrollments ce
            WHERE ce.course_id = e.course_id
              AND ce.student_id = ?
              AND ce.tenant_id = e.tenant_id
              AND ce.status = 'ACTIVE'
          )
        )
      ORDER BY e.exam_date ASC
    `).all(userId, tenantId, req.user?.role || '', userId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ exams }));
    return true;
  }

  // POST /api/academic/exams/register
  if (pathname === '/api/academic/exams/register' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    if (req.user.role !== 'STUDENT') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'STUDENT_ONLY', message: 'Only students can register for exams.' }));
      return true;
    }

    const { examId } = body;
    const exam = db.prepare(`
      SELECT e.id, e.hall_number
      FROM exam_schedules e
      WHERE e.id = ? AND e.tenant_id = ?
        AND EXISTS (
          SELECT 1 FROM course_enrollments ce
          WHERE ce.course_id = e.course_id
            AND ce.student_id = ?
            AND ce.tenant_id = e.tenant_id
            AND ce.status = 'ACTIVE'
        )
    `).get(examId, tenantId, req.user.id);

    if (!exam) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'EXAM_NOT_FOUND', message: 'Exam not found for your active courses.' }));
      return true;
    }
    if (exam.hall_number === 'Not listed in uploaded date sheet') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'HALL_TICKET_UNAVAILABLE',
        message: 'The uploaded date sheet does not include a hall or registration details. Check your official university hall ticket.'
      }));
      return true;
    }

    const regId = 'ereg_' + crypto.randomUUID().slice(0, 8);
    const hallTicketNumber = `HT-2026-${req.user.university_id.split('-').slice(2).join('')}-${crypto.randomInt(10, 99)}`;
    const seatAllotment = `Desk ${crypto.randomInt(1, 60)}, Row ${String.fromCharCode(65 + crypto.randomInt(0, 5))}`;
    const qrCode = `EXAM_VERIFY_${regId}_${req.user.university_id}`;

    db.prepare(`
      INSERT INTO exam_registrations (id, tenant_id, exam_id, student_id, registration_status, hall_ticket_number, seat_allotment, qr_verification_code)
      VALUES (?, ?, ?, ?, 'REGISTERED', ?, ?, ?)
    `).run(regId, tenantId, examId, req.user.id, hallTicketNumber, seatAllotment, qrCode);

    logAuditEvent(tenantId, req.user.id, 'EXAM_REGISTER', 'EXAM', examId, req.socket.remoteAddress, { hallTicketNumber });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, hallTicketNumber, seatAllotment, qrCode }));
    return true;
  }

  // GET /api/academic/certificates
  if (pathname === '/api/academic/certificates' && req.method === 'GET') {
    const certs = db.prepare(`
      SELECT * FROM digital_certificates
      WHERE tenant_id = ? AND (user_id = ? OR ? = 'UNIVERSITY_ADMIN' OR ? = 'PLATFORM_OWNER')
      ORDER BY issue_date DESC
    `).all(tenantId, userId, req.user?.role, req.user?.role);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ certificates: certs }));
    return true;
  }

  // GET /api/academic/calendar
  if (pathname === '/api/academic/calendar' && req.method === 'GET') {
    const calendar = db.prepare('SELECT * FROM academic_calendar WHERE tenant_id = ? ORDER BY start_date ASC').all(tenantId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ calendar }));
    return true;
  }

  // POST /api/academic/faculty-evaluation
  if (pathname === '/api/academic/faculty-evaluation' && req.method === 'POST') {
    const { facultyId, courseId, clarityRating, punctualityRating, engagementRating, feedbackText } = body;
    const evalId = 'eval_' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO faculty_evaluations (id, tenant_id, faculty_id, student_id, course_id, clarity_rating, punctuality_rating, engagement_rating, feedback_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(evalId, tenantId, facultyId, null, courseId, clarityRating, punctualityRating, engagementRating, feedbackText); // student_id NULL ensures 100% strict anonymity

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Anonymous faculty evaluation submitted successfully!' }));
    return true;
  }

  return false;
}
