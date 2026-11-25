import crypto from 'node:crypto';
import db from '../db/connection.js';

export function handleCareerAlumniRoutes(req, res, pathname, body) {
  const tenantId = (req.tenant && req.tenant.id) || 'tenant_apex';
  const userId = req.user ? req.user.id : null;

  // =========================================================================
  // MODULE 11: PLACEMENTS & CAREER
  // =========================================================================
  if (pathname === '/api/placements/jobs' && req.method === 'GET') {
    const jobs = db.prepare(`
      SELECT j.*, c.company_name, c.industry, c.website, c.tier,
        (SELECT ja.stage FROM job_applications ja WHERE ja.job_id = j.id AND ja.student_id = ?) as application_stage
      FROM job_openings j
      JOIN placement_companies c ON j.company_id = c.id
      WHERE j.tenant_id = ?
      ORDER BY j.created_at DESC
    `).all(userId, tenantId);

    const companies = db.prepare('SELECT * FROM placement_companies WHERE tenant_id = ?').all(tenantId);
    
    let resume = null;
    let myApplications = [];
    if (userId) {
      resume = db.prepare('SELECT * FROM student_resumes WHERE student_id = ? AND tenant_id = ?').get(userId, tenantId);
      if (resume) {
        resume.projects = JSON.parse(resume.projects_json || '[]');
        resume.certifications = JSON.parse(resume.certifications_json || '[]');
      }

      myApplications = db.prepare(`
        SELECT ja.*, j.title as job_title, j.ctc_lpa, c.company_name
        FROM job_applications ja
        JOIN job_openings j ON ja.job_id = j.id
        JOIN placement_companies c ON j.company_id = c.id
        WHERE ja.student_id = ? AND ja.tenant_id = ?
      `).all(userId, tenantId);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jobs, companies, resume, myApplications }));
    return true;
  }

  if (pathname === '/api/placements/apply' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { jobId, resumeUrl } = body;
    const appId = 'app_' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO job_applications (id, tenant_id, job_id, student_id, resume_url, stage)
      VALUES (?, ?, ?, ?, ?, 'APPLIED')
    `).run(appId, tenantId, jobId, req.user.id, resumeUrl || '/resumes/active_resume.pdf');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, applicationId: appId }));
    return true;
  }

  if (pathname === '/api/placements/resume' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { skills, projects, certifications, summary } = body;
    db.prepare(`
      INSERT INTO student_resumes (student_id, tenant_id, skills, projects_json, certifications_json, summary, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id) DO UPDATE SET
        skills = excluded.skills,
        projects_json = excluded.projects_json,
        certifications_json = excluded.certifications_json,
        summary = excluded.summary,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      req.user.id,
      tenantId,
      skills,
      JSON.stringify(projects || []),
      JSON.stringify(certifications || []),
      summary
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Career resume profile updated successfully!' }));
    return true;
  }

  // =========================================================================
  // MODULE 15: ALUMNI MANAGEMENT
  // =========================================================================
  if (pathname === '/api/alumni' && req.method === 'GET') {
    const alumni = db.prepare(`
      SELECT a.*, u.name, u.email, u.photo_url, u.department
      FROM alumni_profiles a
      JOIN users u ON a.user_id = u.id
      WHERE a.tenant_id = ?
      ORDER BY a.graduation_year DESC
    `).all(tenantId);

    const donations = db.prepare(`
      SELECT d.*, u.name as donor_name, a.current_company
      FROM alumni_donations d
      JOIN alumni_profiles a ON d.alumni_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE d.tenant_id = ?
      ORDER BY d.created_at DESC
    `).all(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ alumni, donations }));
    return true;
  }

  if (pathname === '/api/alumni/mentorship' && req.method === 'POST') {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return true;
    }

    const { alumniId, topic, message } = body;
    const reqId = 'ment_' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO alumni_mentorship_requests (id, tenant_id, alumni_id, student_id, topic, message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(reqId, tenantId, alumniId, req.user.id, topic, message);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, requestId: reqId }));
    return true;
  }

  return false;
}
