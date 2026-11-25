import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  GraduationCap, Calendar, Clock, BookOpen, CheckCircle2, 
  FileText, Download, Award, Star, Video, Play, UploadCloud, 
  AlertCircle, HelpCircle, Check, Send 
} from 'lucide-react';

export const AcademicHub: React.FC = () => {
  const { tenant, user } = useAuth();
  const { addNotification } = useNotifications();

  const [activeSubTab, setActiveSubTab] = useState<'TIMETABLE' | 'COURSES' | 'ASSIGNMENTS' | 'LMS' | 'QUIZZES' | 'EXAMS' | 'CERTIFICATES' | 'EVALUATION'>('TIMETABLE');
  const [courses, setCourses] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [lmsMaterials, setLmsMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timetableError, setTimetableError] = useState('');
  const [selectedDay, setSelectedDay] = useState(
    user?.id === 'user_student_1'
      ? 'ALL'
      : new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  );

  // Assignment submission state
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quiz active state
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Faculty evaluation state
  const [evalFacultyId, setEvalFacultyId] = useState('user_faculty_1');
  const [evalCourseId, setEvalCourseId] = useState('course_cs201');
  const [clarityRating, setClarityRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [engagementRating, setEngagementRating] = useState(5);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalSubmitted, setEvalSubmitted] = useState(false);

  useEffect(() => {
    setSelectedDay(user?.id === 'user_student_1'
      ? 'ALL'
      : new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()));
    loadAcademicData();
  }, [tenant, user?.id]);

  const loadAcademicData = async () => {
    setLoading(true);
    try {
      const headers = {
        'X-Tenant-ID': tenant?.id || 'tenant_apex',
        'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
      };

      const [cRes, tRes, aRes, mRes, qRes, eRes, certRes, calRes] = await Promise.all([
        fetch('/api/academic/courses', { headers }),
        fetch('/api/academic/timetable', { headers }),
        fetch('/api/academic/assignments', { headers }),
        fetch('/api/academic/lms-materials', { headers }),
        fetch('/api/academic/quizzes', { headers }),
        fetch('/api/academic/exams', { headers }),
        fetch('/api/academic/certificates', { headers }),
        fetch('/api/academic/calendar', { headers })
      ]);

      if (cRes.ok) setCourses((await cRes.json()).courses || []);
      if (tRes.ok) {
        setTimetable((await tRes.json()).timetable || []);
        setTimetableError('');
      } else {
        setTimetable([]);
        setTimetableError(`Timetable could not be loaded (HTTP ${tRes.status}). Try again.`);
      }
      if (aRes.ok) setAssignments((await aRes.json()).assignments || []);
      if (mRes.ok) setLmsMaterials((await mRes.json()).materials || []);
      if (qRes.ok) setQuizzes((await qRes.json()).quizzes || []);
      if (eRes.ok) setExams((await eRes.json()).exams || []);
      if (certRes.ok) setCertificates((await certRes.json()).certificates || []);
      if (calRes.ok) setCalendar((await calRes.json()).calendar || []);
    } catch (err) {
      console.error('Academic fetch error:', err);
      setTimetableError('Could not connect to the academic timetable service. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !submissionText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/academic/assignments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          contentText: submissionText
        })
      });

      if (res.ok) {
        addNotification('Assignment Submitted', `Submission registered for ${selectedAssignment.title}.`, 'SUCCESS');
        setSelectedAssignment(null);
        setSubmissionText('');
        loadAcademicData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterExam = async (examId: string) => {
    try {
      const res = await fetch('/api/academic/exams/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({ examId })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(
          'Hall Ticket Generated',
          `Registered for exam. Assigned Desk: ${data.seatAllotment}. Hall Ticket #: ${data.hallTicketNumber}`,
          'SUCCESS'
        );
        loadAcademicData();
      }
    } catch (err: any) {
      alert('Exam registration failed: ' + err.message);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      const res = await fetch('/api/academic/quizzes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          answers: quizAnswers
        })
      });

      if (res.ok) {
        const result = await res.json();
        setQuizResult(result);
        addNotification('Quiz Completed', `You scored ${result.score} / ${result.maxMarks} points.`, 'SUCCESS');
        loadAcademicData();
      }
    } catch (err: any) {
      alert('Quiz submit failed: ' + err.message);
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academic/faculty-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex'
        },
        body: JSON.stringify({
          facultyId: evalFacultyId,
          courseId: evalCourseId,
          clarityRating,
          punctualityRating,
          engagementRating,
          feedbackText: evalFeedback
        })
      });

      if (res.ok) {
        setEvalSubmitted(true);
        addNotification('Evaluation Submitted', '100% Anonymous feedback recorded for academic accreditation.', 'SUCCESS');
      }
    } catch {
      alert('Failed to submit evaluation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-campus-600" />
            Academic Management & Learning Hub
          </h2>
          <p className="text-xs text-slate-500">
            Modules 1 & 2: Normalized curricula, timetables, submissions, quizzes, hall tickets & digital degrees
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-2xl no-scrollbar text-xs font-semibold">
          {[
            { id: 'TIMETABLE', label: 'Timetable' },
            { id: 'COURSES', label: 'Courses' },
            { id: 'ASSIGNMENTS', label: 'Assignments' },
            { id: 'LMS', label: 'LMS Materials' },
            { id: 'QUIZZES', label: 'Quizzes' },
            { id: 'EXAMS', label: 'Exams & Hall Tickets' },
            { id: 'CERTIFICATES', label: 'Certificates' },
            { id: 'EVALUATION', label: 'Faculty Feedback' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id as any); setQuizResult(null); setActiveQuiz(null); }}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeSubTab === tab.id ? 'bg-white text-campus-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. TIMETABLE TAB */}
      {activeSubTab === 'TIMETABLE' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Weekly Digital Timetable Matrix</h3>
              <p className="text-xs text-slate-400">Class schedule, lecture halls & assigned faculty</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-campus-50 text-campus-700">
              {user?.id === 'user_student_1'
                ? 'B.Tech CSE • 5th Semester • Section A'
                : 'Odd Semester 2026-2027'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2" aria-label="Filter timetable by day">
            {['Full week', 'Today', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const dayName = day === 'Full week'
                ? 'ALL'
                : day === 'Today'
                ? new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
                : day;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDay(dayName)}
                  aria-pressed={selectedDay === dayName}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedDay === dayName
                      ? 'bg-campus-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              );
            })}
            <button
              type="button"
              onClick={loadAcademicData}
              disabled={loading}
              className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {timetableError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <span>{timetableError}</span>
              <button type="button" onClick={loadAcademicData} className="shrink-0 font-bold underline">Retry</button>
            </div>
          )}

          {loading && timetable.length === 0 && (
            <p role="status" className="py-4 text-center text-xs text-slate-500">Loading your timetable...</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {timetable.filter((slot) => selectedDay === 'ALL' || slot.day_of_week === selectedDay).map((slot) => (
              <div key={slot.id} className="p-4 rounded-2xl border border-slate-200 hover:border-campus-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md font-bold text-campus-700 bg-campus-50">
                    {slot.code}
                  </span>
                  <span className="font-bold text-slate-700">{slot.day_of_week}</span>
                </div>
                <div className="mt-2 font-bold text-slate-900 text-sm">{slot.title}</div>
                <div className="mt-1 text-slate-500">Room: <strong className="text-slate-700">{slot.room_number}</strong> • Section {slot.batch_section}</div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-campus-600" />
                    {slot.start_time} - {slot.end_time}
                  </span>
                  <span className="truncate max-w-[120px]">{slot.faculty_name}</span>
                </div>
              </div>
            ))}
          </div>
          {!loading && !timetableError && timetable.filter((slot) => selectedDay === 'ALL' || slot.day_of_week === selectedDay).length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500">
              {selectedDay === 'ALL' ? 'No classes were found in your timetable.' : `No classes are scheduled for ${selectedDay}.`}
            </p>
          )}
        </div>
      )}

      {/* 2. COURSES TAB */}
      {activeSubTab === 'COURSES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Curriculum & Subjects</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {courses.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-bold text-xs text-campus-600 bg-campus-50 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <span className="font-semibold text-slate-500">{c.credits} Credits • Sem {c.semester}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{c.title}</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mb-3">
                    {c.syllabus_outline}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Enrolled: <strong>{c.enrolled_count || 120} students</strong></span>
                  <span className="text-emerald-600 font-semibold">Active Syllabus</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ASSIGNMENTS TAB */}
      {activeSubTab === 'ASSIGNMENTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Online Assignments & Digital Grading</h3>
          <div className="space-y-3 text-xs">
            {assignments.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-campus-600 bg-campus-50 px-2 py-0.5 rounded text-[10px]">
                      {a.course_code}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{a.title}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{a.description}</p>
                  <div className="text-slate-400 text-[10px]">
                    Faculty: {a.faculty_name} • Max Marks: {a.max_marks} • Due: {new Date(a.due_date).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {a.user_marks !== null && a.user_marks !== undefined ? (
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                        Graded: {a.user_marks} / {a.max_marks}
                      </span>
                      {a.user_feedback && (
                        <div className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={a.user_feedback}>
                          "{a.user_feedback}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAssignment(a)}
                      className="px-3.5 py-2 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs"
                    >
                      Submit Work
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submission Modal */}
          {selectedAssignment && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4">
                <h4 className="font-bold text-base text-slate-900">Submit: {selectedAssignment.title}</h4>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Enter online response summary or project GitHub URL..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-campus-500"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button onClick={() => setSelectedAssignment(null)} className="px-4 py-2 text-slate-600">Cancel</button>
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={submitting || !submissionText.trim()}
                    className="px-4 py-2 rounded-xl bg-campus-600 text-white font-bold disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Upload & Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. LMS MATERIALS */}
      {activeSubTab === 'LMS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Digital Course Materials & Video Lectures (Module 2)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {lmsMaterials.map((mat) => (
              <div key={mat.id} className="p-4 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-bold text-[10px] text-campus-600 bg-campus-50 px-2 py-0.5 rounded">
                      {mat.course_code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      mat.material_type === 'VIDEO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {mat.material_type}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{mat.title}</h4>
                  <p className="text-slate-500 text-[11px] mb-3">{mat.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{mat.file_size_kb} KB</span>
                  <a
                    href={mat.file_url}
                    onClick={(e) => { e.preventDefault(); alert(`Accessing streaming media: ${mat.file_url}`); }}
                    className="text-campus-600 hover:underline font-bold flex items-center gap-1"
                  >
                    {mat.material_type === 'VIDEO' ? <Play className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    {mat.material_type === 'VIDEO' ? 'Watch Video' : 'Open PDF'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. QUIZZES */}
      {activeSubTab === 'QUIZZES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Online Quizzes & Instant Scoring Engine</h3>
          
          {!activeQuiz ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {quizzes.map((q) => (
                <div key={q.id} className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono font-bold text-campus-600 bg-campus-50 px-2 py-0.5 rounded">
                        {q.course_code}
                      </span>
                      <span className="font-semibold text-slate-500">{q.duration_minutes} Mins • {q.total_marks} Pts</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{q.title}</h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {q.user_score !== null && q.user_score !== undefined ? (
                      <span className="font-bold text-emerald-600">Score: {q.user_score} / {q.total_marks}</span>
                    ) : (
                      <span className="text-slate-400">Not Attempted</span>
                    )}
                    <button
                      onClick={() => { setActiveQuiz(q); setQuizAnswers({}); setQuizResult(null); }}
                      className="px-3.5 py-1.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold"
                    >
                      {q.user_score !== null ? 'Re-attempt Quiz' : 'Start Online Quiz'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{activeQuiz.title}</h4>
                  <p className="text-xs text-slate-400">Answer all questions to complete automatic grading</p>
                </div>
                <button onClick={() => setActiveQuiz(null)} className="text-xs text-slate-500 hover:text-slate-800">
                  Exit Quiz
                </button>
              </div>

              {activeQuiz.questions?.map((quest: any, qIdx: number) => (
                <div key={quest.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">
                    Q{qIdx + 1}: {quest.question_text} <span className="text-campus-600">({quest.points} pts)</span>
                  </div>
                  <div className="space-y-1.5">
                    {quest.options?.map((opt: string, optIdx: number) => (
                      <label key={optIdx} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:bg-campus-50/50 cursor-pointer">
                        <input
                          type="radio"
                          name={`quest_${quest.id}`}
                          checked={quizAnswers[quest.id] === optIdx}
                          onChange={() => setQuizAnswers({ ...quizAnswers, [quest.id]: optIdx })}
                          className="text-campus-600 focus:ring-campus-500"
                        />
                        <span className="text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmitQuiz}
                className="w-full py-3 rounded-2xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-md"
              >
                Submit Answers for Instant Grading
              </button>

              {quizResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                  <div className="font-bold text-sm">Quiz Scored: {quizResult.score} / {quizResult.maxMarks} Points</div>
                  <div className="mt-1 text-slate-600">Answers validated against institutional rubric.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. EXAMS & HALL TICKETS */}
      {activeSubTab === 'EXAMS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Examination Schedule & Hall Tickets</h3>
            {user?.id === 'user_student_1' && (
              <p className="mt-1 text-xs text-slate-500">
                B.Tech CSE • 5th Semester • End-Term Nov-Dec 2026 • Afternoon shift: 2:00 PM–5:00 PM.
                Hall details are not included in the uploaded date sheet.
              </p>
            )}
          </div>
          <div className="space-y-3 text-xs">
            {exams.map((exam) => (
              <div key={exam.id} className="p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono font-bold text-campus-600 bg-campus-50 px-2 py-0.5 rounded text-[10px]">
                    {exam.course_code}
                  </span>
                  <div className="font-bold text-sm text-slate-900">{exam.exam_name}</div>
                  <div className="text-slate-500 text-[11px]">
                    Date: <strong className="text-slate-800">{exam.exam_date}</strong> • Time: <strong className="text-slate-800">{exam.start_time} - {exam.end_time}</strong> • Hall: {exam.hall_number}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {exam.hall_number === 'Not listed in uploaded date sheet' ? (
                    <span className="inline-block max-w-56 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                      Hall ticket and room details: check the official university notice
                    </span>
                  ) : exam.registration_status === 'REGISTERED' ? (
                    <div className="space-y-1">
                      <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] inline-block">
                        Ticket: {exam.hall_ticket_number}
                      </div>
                      <div className="text-[10px] text-slate-500">Allocated: {exam.seat_allotment}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegisterExam(exam.id)}
                      className="px-4 py-2 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-sm"
                    >
                      Register & Get Hall Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. DIGITAL CERTIFICATES */}
      {activeSubTab === 'CERTIFICATES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Cryptographic Digital Certificates</h3>
          <p className="text-xs text-slate-500">Tamper-proof certificates with SHA-256 cryptographic verification hashes</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" /> {cert.certificate_type}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{cert.issue_date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">{cert.title}</h4>
                  <div className="text-[10px] font-mono text-slate-500 break-all bg-white p-2 rounded-xl border border-slate-200">
                    SHA-256: {cert.cryptographic_hash}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200/50 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Institutional Seal Verified
                  </span>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert(`Verifying Cryptographic Certificate Hash: ${cert.cryptographic_hash}`); }}
                    className="text-campus-600 font-bold hover:underline"
                  >
                    Verify Authenticity
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. FACULTY FEEDBACK */}
      {activeSubTab === 'EVALUATION' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Faculty Evaluation & Feedback (100% Strictly Anonymous)</h3>
          <p className="text-xs text-slate-500">
            Ratings are stored without student ID linkage to ensure honest, constructive teaching evaluations for accreditation.
          </p>

          {!evalSubmitted ? (
            <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Faculty & Course</label>
                <select 
                  value={evalCourseId} 
                  onChange={(e) => setEvalCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="course_cs201">Prof. Arvind Namboodiri — CS201 Data Structures</option>
                  <option value="course_cs301">Prof. Arvind Namboodiri — CS301 Database Systems</option>
                  <option value="course_ai402">Prof. Arvind Namboodiri — AI402 Generative AI</option>
                </select>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Conceptual Clarity & Explanations', val: clarityRating, set: setClarityRating },
                  { label: 'Punctuality & Syllabus Adherence', val: punctualityRating, set: setPunctualityRating },
                  { label: 'Interactive Student Engagement', val: engagementRating, set: setEngagementRating }
                ].map((crit, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-700">{crit.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => crit.set(star)}
                          className={`w-6 h-6 rounded-md font-bold text-xs ${
                            star <= crit.val ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {star}★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Constructive Comments</label>
                <textarea
                  rows={3}
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  placeholder="Share feedback on lab examples, homework pace, or lecture quality..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                Submit Anonymous Evaluation
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">Evaluation Registered</h4>
              <p className="text-xs text-slate-500">Thank you for helping improve teaching standards.</p>
              <button onClick={() => setEvalSubmitted(false)} className="text-xs text-campus-600 hover:underline font-bold mt-2">
                Evaluate another course
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
