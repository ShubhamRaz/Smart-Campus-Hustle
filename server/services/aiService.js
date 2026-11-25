import db from '../db/connection.js';

export class AIAssistantService {
  /**
   * Process natural language queries with role-based and tenant-isolated context.
   */
  static handleQuery({ query, user, tenantId }) {
    const normalizedQuery = typeof query === 'string' ? query : '';
    const q = normalizedQuery.trim().toLowerCase();

    if (!q) {
      return {
        answer: 'Please ask a specific question about attendance, exams, timetables, campus services, or official procedures.',
        referencedData: { copilotReady: true }
      };
    }

    // 1. PRIVACY & SECURITY GUARDRAIL CHECK
    if (
      q.includes('counselling') || 
      q.includes('psychological') || 
      q.includes('disciplinary record') || 
      (q.includes('fee') && q.includes('other student')) ||
      (q.includes('phone number') && q.includes('student'))
    ) {
      return {
        answer: "I cannot fulfill this request. Under institutional security and privacy policies (Module 9 & 22), access to confidential student records, disciplinary proceedings, counselling history, or fellow students' contact information is strictly restricted.",
        referencedData: { privacyRestricted: true }
      };
    }

    // 2. ATTENDANCE CALCULATION & POLICIES
    if (q.includes('attendance') || q.includes('shortage') || q.includes('bunk') || q.includes('deficit')) {
      const policy = db.prepare('SELECT min_attendance_pct FROM tenant_policies WHERE tenant_id = ?').get(tenantId) || { min_attendance_pct: 75.0 };
      
      let studentContext = null;
      if (user && user.role === 'STUDENT') {
        const studentStats = db.prepare('SELECT attendance_rate, risk_level FROM student_success_metrics WHERE student_id = ?').get(user.id);
        const courses = db.prepare(`
          SELECT c.code, c.title,
            COUNT(ar.id) as total_classes,
            SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as attended_classes
          FROM course_enrollments ce
          JOIN courses c ON ce.course_id = c.id
          LEFT JOIN attendance_records ar ON ar.course_id = c.id AND ar.student_id = ce.student_id
          WHERE ce.student_id = ? AND ce.tenant_id = ?
          GROUP BY c.id
        `).all(user.id, tenantId);

        studentContext = {
          studentStats,
          courses: courses.map(c => {
            const pct = c.total_classes > 0 ? ((c.attended_classes / c.total_classes) * 100).toFixed(1) : '100.0';
            return `${c.code} (${c.title}): ${pct}% attended (${c.attended_classes}/${c.total_classes} sessions)`;
          })
        };
      }

      const policyThreshold = policy.min_attendance_pct;
      let reply = `Academic Attendance Policy for ${tenantId === 'tenant_apex' ? 'Mewar University' : 'Metropolitan Tech'}:\n` +
        `• Minimum mandatory attendance is ${policyThreshold}% across each registered course.\n` +
        `• Students falling below ${policyThreshold}% are flagged in the Early Warning System and become ineligible for regular End-Semester examinations.\n` +
        `• Medical leaves (up to 10%) can be excused through the Academic Dean portal within 3 days of resuming classes.\n`;

      if (studentContext && studentContext.courses.length > 0) {
        reply += `\nYour Current Course Attendance Breakdown:\n` + studentContext.courses.map(line => `• ${line}`).join('\n');
      }

      return {
        answer: reply,
        referencedData: studentContext
      };
    }

    // 3. LEAVE APPLICATION GUIDANCE
    if (q.includes('leave') || q.includes('apply for leave') || q.includes('sick leave') || q.includes('on duty') || q.includes('od')) {
      return {
        answer: `Procedure for Student Leave Application:\n` +
          `1. Submit an e-Leave request through the Academic Hub at least 24 hours prior for planned leaves, or within 48 hours with medical documentation for emergency illness.\n` +
          `2. Your Faculty Advisor will review and approve within 12 hours.\n` +
          `3. Hostel residents must also receive automated Parent SMS confirmation before gate out-pass generation.\n` +
          `4. For inter-college hackathons or sports competitions, select 'On Duty (OD)' category to ensure 100% attendance credit upon submission of participation proof.`,
        referencedData: { workflow: 'LEAVE_APPROVAL_PIPELINE' }
      };
    }

    // 4. EXAMINATION PROCEDURES & HALL TICKETS
    if (q.includes('exam') || q.includes('hall ticket') || q.includes('registration') || q.includes('admit card')) {
      return {
        answer: `End-Semester Examination Guidelines:\n` +
          `• Examination Registration closes 7 days before the start of the exam schedule.\n` +
          `• Clear all semester tuition fees and library fines to unblock Hall Ticket generation.\n` +
          `• Digital Hall Tickets contain a dynamic anti-fraud QR code and must be presented alongside your Digital University ID Card at the examination hall entrance.\n` +
          `• Electronic devices, smart watches, and unauthorized material are strictly prohibited inside examination halls.`,
        referencedData: { module: 'EXAMINATION_ENGINE' }
      };
    }

    // 5. TIMETABLE & CLASS SCHEDULE
    if (q.includes('timetable') || q.includes('class') || q.includes('schedule') || q.includes('room')) {
      let scheduleInfo = [];
      if (user && user.role === 'STUDENT') {
        scheduleInfo = db.prepare(`
          SELECT t.day_of_week, t.start_time, t.end_time, t.room_number, c.code, c.title, u.name as faculty_name
          FROM timetables t
          JOIN courses c ON t.course_id = c.id
          JOIN users u ON t.faculty_id = u.id
          JOIN course_enrollments ce ON ce.course_id = c.id
          WHERE ce.student_id = ? AND t.tenant_id = ?
          ORDER BY t.day_of_week, t.start_time
        `).all(user.id, tenantId);
      }

      if (scheduleInfo.length > 0) {
        const lines = scheduleInfo.map(s => `• ${s.day_of_week} ${s.start_time}-${s.end_time}: ${s.code} - ${s.title} in ${s.room_number} (Faculty: ${s.faculty_name})`);
        return {
          answer: `Here is your upcoming timetable schedule:\n\n${lines.join('\n')}`,
          referencedData: scheduleInfo
        };
      }

      return {
        answer: `Timetable hours run Monday through Friday from 09:00 AM to 05:30 PM. Core theoretical lectures take place in the morning blocks, followed by laboratory sessions and research project slots in the afternoons. Check the Academic Hub tab for your detailed batch grid.`,
        referencedData: null
      };
    }

    // 6. CAMPUS SERVICES & EMERGENCY HELPLINES
    if (q.includes('emergency') || q.includes('police') || q.includes('hospital') || q.includes('clinic') || q.includes('help')) {
      const contacts = db.prepare('SELECT service_name, phone_number, operating_hours FROM emergency_contacts WHERE tenant_id = ?').all(tenantId);
      const lines = contacts.map(c => `• ${c.service_name}: ${c.phone_number} (${c.operating_hours})`);
      return {
        answer: `Emergency & Safety Helpline Directory:\n\n${lines.join('\n')}\n\n*Tap the red SOS button at the top header for instant 1-tap geo-tagged rapid officer dispatch.*`,
        referencedData: contacts
      };
    }

    // 7. DEFAULT CONTEXTUAL COPILOT RESPONSE
    return {
      answer: `Hello! I am your Smart Campus AI Copilot. I have real-time access to authorized university services, academic schedules, library reservations, bus transit tracking, and examination rules.\n\nYou can ask me:\n• "What is my current attendance percentage and risk status?"\n• "How do I apply for On-Duty (OD) leave for an event?"\n• "When is the deadline to register for end-semester exams?"\n• "Show my schedule for today"\n• "What are the emergency response numbers?"`,
      referencedData: { copilotReady: true }
    };
  }
}
