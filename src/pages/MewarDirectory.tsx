import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2, ExternalLink, GraduationCap, Search, ShieldCheck, Users
} from 'lucide-react';

interface UniversityProfile {
  university_type: string;
  established_year: number;
  location: string;
  district: string;
  state: string;
  country: string;
  postal_code: string;
  region: string;
  academic_session: string;
  official_website: string;
  admissions_website: string;
  student_portal: string;
  admissions_helpline: string;
  admissions_email: string;
  source_note: string;
}

interface DirectoryDepartment {
  id: string;
  name: string;
  verification_status: string;
}

interface DirectoryProgramme {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  verification_status: string;
}

interface DirectoryFaculty {
  id: string;
  full_name: string;
  directory_section: 'FACULTY' | 'PUBLISHED_LEADERSHIP';
  verification_status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'INACTIVE';
  verified_at: string | null;
  source_note: string;
  department_id: string | null;
  department_name: string;
}

interface DirectoryResponse {
  profile: UniversityProfile | null;
  departments: DirectoryDepartment[];
  programmes: DirectoryProgramme[];
  faculty: DirectoryFaculty[];
  facultySummary: Record<string, number>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface StudentRosterEntry {
  id: string;
  full_name: string;
  record_status: 'INCOMPLETE';
}

interface StudentRosterResponse {
  entries: StudentRosterEntry[];
  incompleteCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface StudentProfileRecord {
  id: string;
  enrollment_number: string;
  roll_number: string | null;
  full_name: string;
  course_details: string;
  room_number: string | null;
  verification_status: string;
  verified_at: string | null;
}

interface StudentProfilesResponse {
  profiles: StudentProfileRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const EMPTY_DIRECTORY: DirectoryResponse = {
  profile: null,
  departments: [],
  programmes: [],
  faculty: [],
  facultySummary: {},
  pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
};

const statusLabel = (status: string) =>
  status === 'PENDING_VERIFICATION' ? 'Pending verification' :
    status === 'VERIFIED' ? 'Verified by university admin' : 'Inactive';

export const MewarDirectory: React.FC = () => {
  const { user, tenant, token: sessionToken } = useAuth();
  const token = sessionToken || localStorage.getItem('smart_campus_token');
  const [directory, setDirectory] = useState(EMPTY_DIRECTORY);
  const [query, setQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [verificationStatus, setVerificationStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingFacultyId, setSavingFacultyId] = useState('');
  const [error, setError] = useState('');
  const [roster, setRoster] = useState<StudentRosterResponse>({
    entries: [],
    incompleteCount: 0,
    pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
  });
  const [rosterQuery, setRosterQuery] = useState('');
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');
  const [studentProfiles, setStudentProfiles] = useState<StudentProfilesResponse>({
    profiles: [],
    pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
  });
  const [studentProfileQuery, setStudentProfileQuery] = useState('');
  const [studentProfilePage, setStudentProfilePage] = useState(1);
  const [studentProfilesLoading, setStudentProfilesLoading] = useState(false);
  const [studentProfilesError, setStudentProfilesError] = useState('');
  const isUniversityAdmin = user?.role === 'UNIVERSITY_ADMIN';
  const programmesByDepartment = useMemo(() => {
    const groups = new Map<string, DirectoryProgramme[]>();
    for (const programme of directory.programmes) {
      const current = groups.get(programme.department_name) || [];
      current.push(programme);
      groups.set(programme.department_name, current);
    }
    return [...groups.entries()];
  }, [directory.programmes]);

  useEffect(() => {
    const controller = new AbortController();
    const loadDirectory = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        q: query.trim(),
        page: String(page),
        limit: '25',
        status: verificationStatus
      });
      if (selectedDepartment === 'LEADERSHIP') {
        params.set('section', 'PUBLISHED_LEADERSHIP');
      } else if (selectedDepartment !== 'ALL') {
        params.set('departmentId', selectedDepartment);
      }

      try {
        const response = await fetch(`/api/university/catalog?${params}`, {
          headers: {
            'X-Tenant-ID': tenant?.id || user?.tenant_id || 'tenant_apex',
            Authorization: `Bearer ${token || ''}`
          },
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || `Directory unavailable (HTTP ${response.status}).`);
        }
        setDirectory(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        console.error('Unable to load university directory:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load university directory.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadDirectory();
    return () => controller.abort();
  }, [query, page, selectedDepartment, verificationStatus, tenant?.id, user?.tenant_id, token]);

  useEffect(() => {
    if (!isUniversityAdmin) return;
    const controller = new AbortController();
    const loadRoster = async () => {
      setRosterLoading(true);
      setRosterError('');
      const params = new URLSearchParams({
        q: rosterQuery.trim(),
        page: String(rosterPage),
        limit: '25'
      });

      try {
        const response = await fetch(`/api/university/students/roster?${params}`, {
          headers: {
            'X-Tenant-ID': tenant?.id || user?.tenant_id || 'tenant_apex',
            Authorization: `****** || ''}`
          },
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || `Student roster unavailable (HTTP ${response.status}).`);
        }
        setRoster(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        console.error('Unable to load incomplete student roster:', loadError);
        setRosterError(loadError instanceof Error ? loadError.message : 'Unable to load student roster.');
      } finally {
        if (!controller.signal.aborted) setRosterLoading(false);
      }
    };

    loadRoster();
    return () => controller.abort();
  }, [isUniversityAdmin, rosterQuery, rosterPage, tenant?.id, user?.tenant_id, token]);

  useEffect(() => {
    if (!isUniversityAdmin) return;
    const controller = new AbortController();
    const loadStudentProfiles = async () => {
      setStudentProfilesLoading(true);
      setStudentProfilesError('');
      const params = new URLSearchParams({
        q: studentProfileQuery.trim(),
        page: String(studentProfilePage),
        limit: '25'
      });

      try {
        const response = await fetch(`/api/university/students/profiles?${params}`, {
          headers: {
            'X-Tenant-ID': tenant?.id || user?.tenant_id || 'tenant_apex',
            Authorization: `****** || ''}`
          },
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || `Student profiles unavailable (HTTP ${response.status}).`);
        }
        setStudentProfiles(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        console.error('Unable to load student profiles:', loadError);
        setStudentProfilesError(loadError instanceof Error ? loadError.message : 'Unable to load student profiles.');
      } finally {
        if (!controller.signal.aborted) setStudentProfilesLoading(false);
      }
    };

    loadStudentProfiles();
    return () => controller.abort();
  }, [isUniversityAdmin, studentProfileQuery, studentProfilePage, tenant?.id, user?.tenant_id, token]);

  const verifyFaculty = async (facultyId: string) => {
    setSavingFacultyId(facultyId);
    setError('');
    try {
      const response = await fetch('/api/university/faculty/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || user?.tenant_id || 'tenant_apex',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ facultyId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Could not verify faculty record.');
      setDirectory((current) => ({
        ...current,
        faculty: current.faculty.map((entry) => entry.id === facultyId
          ? { ...entry, verification_status: 'VERIFIED', verified_at: new Date().toISOString() }
          : entry),
        facultySummary: {
          ...current.facultySummary,
          PENDING_VERIFICATION: Math.max(0, (current.facultySummary.PENDING_VERIFICATION || 0) - 1),
          VERIFIED: (current.facultySummary.VERIFIED || 0) + 1
        }
      }));
    } catch (verifyError) {
      console.error('Unable to verify faculty record:', verifyError);
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify faculty record.');
    } finally {
      setSavingFacultyId('');
    }
  };

  const profile = directory.profile;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-campus-700">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Mewar University</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">University directory and academic programme catalogue</p>
        </div>
        <span className="w-fit rounded-full border border-campus-200 bg-campus-50 px-3 py-1 text-xs font-semibold text-campus-700">
          Academic session {profile?.academic_session || '2026-2027'}
        </span>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-campus-700">{profile?.university_type || 'University'}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Gangrar Campus</h2>
              <p className="mt-1 text-sm text-slate-600">{profile?.location || 'Gangrar, Chittorgarh, Rajasthan'}</p>
              <p className="mt-2 text-xs text-slate-500">
                Established {profile?.established_year || '—'} • {profile?.postal_code || '—'} • {profile?.country || 'India'}
              </p>
            </div>
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-campus-50 text-campus-700 sm:flex">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile?.official_website && (
              <a className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                href={profile.official_website} target="_blank" rel="noreferrer">
                Official website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {profile?.admissions_website && (
              <a className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                href={profile.admissions_website} target="_blank" rel="noreferrer">
                Admissions <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {profile?.student_portal && (
              <a className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                href={profile.student_portal} target="_blank" rel="noreferrer">
                Student ERP <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Admissions: <a className="font-semibold text-campus-700 hover:underline" href={`mailto:${profile?.admissions_email}`}>
              {profile?.admissions_email || 'Not listed'}
            </a>
            {' '}• Helpline: <a className="font-semibold text-campus-700 hover:underline" href={`tel:${profile?.admissions_helpline}`}>
              {profile?.admissions_helpline || 'Not listed'}
            </a>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Building2 className="h-5 w-5 text-campus-600" />
            <p className="mt-3 text-2xl font-black text-slate-900">{directory.departments.length}</p>
            <p className="text-xs text-slate-500">Departments in supplied dataset</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <GraduationCap className="h-5 w-5 text-campus-600" />
            <p className="mt-3 text-2xl font-black text-slate-900">{directory.programmes.length}</p>
            <p className="text-xs text-slate-500">Programmes pending verification</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Users className="h-4 w-4" />
              {directory.facultySummary.PENDING_VERIFICATION || 0} directory names pending verification
            </div>
            <p className="mt-1 text-xs text-amber-800">
              Names and departments are from the supplied directory, not confirmation of current employment.
              No personal contact details or student records were invented.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Departments & programmes</h2>
          <p className="mt-1 text-xs text-slate-500">Imported programme offerings are marked pending until confirmed.</p>
          <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
            {programmesByDepartment.map(([departmentName, entries]) => (
              <details key={departmentName} className="group rounded-xl border border-slate-200 p-3" open={departmentName === 'Computer Science and Engineering'}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-campus-600">
                  <span className="flex items-center justify-between gap-2">
                    {departmentName}
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      {entries.length} pending
                    </span>
                  </span>
                </summary>
                <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {entries.map((programme) => (
                    <li key={programme.id} className="flex items-start justify-between gap-2 text-xs text-slate-700">
                      <span>{programme.name}</span>
                      <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                        Pending
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            {programmesByDepartment.length === 0 && !loading && (
              <p className="py-8 text-center text-xs text-slate-500">Programme catalogue is unavailable.</p>
            )}
          </div>
          <details className="mt-3 rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-xs font-bold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-campus-600">
              View all {directory.departments.length} departments
            </summary>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {directory.departments.map((department) => (
                <li key={department.id} className="text-xs text-slate-600">{department.name}</li>
              ))}
            </ul>
          </details>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Faculty & published leadership</h2>
              <p className="mt-1 text-xs text-slate-500">Search and filter the imported directory.</p>
            </div>
            {isUniversityAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin verification enabled
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <label className="relative sm:col-span-1">
              <span className="sr-only">Search faculty and departments</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Search names or departments"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
            </label>
            <label>
              <span className="sr-only">Filter by department</span>
              <select value={selectedDepartment} onChange={(event) => { setSelectedDepartment(event.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-campus-500">
                <option value="ALL">All departments</option>
                <option value="LEADERSHIP">Published leadership</option>
                {directory.departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by verification status</span>
              <select value={verificationStatus} onChange={(event) => { setVerificationStatus(event.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-campus-500">
                <option value="ALL">All statuses</option>
                <option value="PENDING_VERIFICATION">Pending verification</option>
                <option value="VERIFIED">Verified by admin</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            {directory.faculty.map((entry) => (
              <article key={entry.id} className="flex flex-col gap-3 border-b border-slate-100 p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{entry.full_name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      entry.verification_status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : entry.verification_status === 'INACTIVE'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {statusLabel(entry.verification_status)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {entry.directory_section === 'PUBLISHED_LEADERSHIP' ? 'Published university leadership' : entry.department_name}
                  </p>
                  {entry.verified_at && <p className="mt-1 text-[10px] text-slate-400">Verified {entry.verified_at}</p>}
                </div>
                {isUniversityAdmin && entry.verification_status === 'PENDING_VERIFICATION' && (
                  <button type="button" disabled={savingFacultyId === entry.id} onClick={() => verifyFaculty(entry.id)}
                    className="shrink-0 rounded-lg bg-campus-600 px-3 py-2 text-xs font-bold text-white hover:bg-campus-700 disabled:opacity-50">
                    {savingFacultyId === entry.id ? 'Saving...' : 'Mark verified'}
                  </button>
                )}
              </article>
            ))}
            {directory.faculty.length === 0 && !loading && (
              <p className="px-4 py-10 text-center text-xs text-slate-500">No directory entries match these filters.</p>
            )}
            {loading && <p role="status" className="px-4 py-6 text-center text-xs text-slate-500">Loading directory...</p>}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{directory.pagination.total} matching entries</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
              <span>{page} / {Math.max(1, directory.pagination.totalPages)}</span>
              <button type="button" disabled={page >= directory.pagination.totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </section>
      {isUniversityAdmin && (
        <section aria-labelledby="student-profiles-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="student-profiles-title" className="text-base font-bold text-slate-900">Student profiles</h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-500">
                Private university-admin records imported from the supplied register. These profiles are not login accounts;
                the verification label reflects the supplied data as designated by the authorized user.
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              {studentProfiles.pagination.total} profiles
            </span>
          </div>

          {studentProfilesError && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {studentProfilesError}
            </p>
          )}

          <label className="relative mt-4 block max-w-sm">
            <span className="sr-only">Search student profiles</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={studentProfileQuery}
              onChange={(event) => { setStudentProfileQuery(event.target.value); setStudentProfilePage(1); }}
              placeholder="Search name, MUR ID, roll, course, or room"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100"
            />
          </label>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {studentProfiles.profiles.map((profileRecord) => (
              <article key={profileRecord.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{profileRecord.full_name}</h3>
                    <p className="mt-1 font-mono text-xs text-campus-700">{profileRecord.enrollment_number}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Verified per supplied register
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                  <dt className="font-semibold text-slate-500">Roll number</dt>
                  <dd className="text-slate-800">{profileRecord.roll_number || 'Not listed'}</dd>
                  <dt className="font-semibold text-slate-500">Course / semester</dt>
                  <dd className="text-slate-800">{profileRecord.course_details}</dd>
                  <dt className="font-semibold text-slate-500">Room</dt>
                  <dd className="text-slate-800">{profileRecord.room_number || 'Not listed'}</dd>
                </dl>
              </article>
            ))}
            {studentProfiles.profiles.length === 0 && !studentProfilesLoading && (
              <p className="rounded-xl border border-slate-200 px-4 py-8 text-center text-xs text-slate-500 md:col-span-2">
                No student profiles match this search.
              </p>
            )}
            {studentProfilesLoading && (
              <p role="status" className="px-4 py-6 text-center text-xs text-slate-500 md:col-span-2">Loading student profiles...</p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{studentProfiles.pagination.total} matching profiles</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={studentProfilePage <= 1 || studentProfilesLoading}
                onClick={() => setStudentProfilePage((current) => current - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
              <span>{studentProfilePage} / {Math.max(1, studentProfiles.pagination.totalPages)}</span>
              <button type="button" disabled={studentProfilePage >= studentProfiles.pagination.totalPages || studentProfilesLoading}
                onClick={() => setStudentProfilePage((current) => current + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>
      )}
      {isUniversityAdmin && (
        <section aria-labelledby="student-roster-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="student-roster-title" className="text-base font-bold text-slate-900">Name-only student roster</h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-500">
                These imported names are incomplete records, not student accounts. University ID, programme, cohort,
                contact details, and enrollment have not been supplied or inferred.
              </p>
            </div>
            <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              {roster.incompleteCount} incomplete
            </span>
          </div>

          {rosterError && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {rosterError}
            </p>
          )}

          <label className="relative mt-4 block max-w-sm">
            <span className="sr-only">Search incomplete student roster</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={rosterQuery}
              onChange={(event) => { setRosterQuery(event.target.value); setRosterPage(1); }}
              placeholder="Search roster names"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100"
            />
          </label>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            {roster.entries.map((entry) => (
              <article key={entry.id} className="flex flex-col gap-2 border-b border-slate-100 p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{entry.full_name}</h3>
                <span className="w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Incomplete · no account created
                </span>
              </article>
            ))}
            {roster.entries.length === 0 && !rosterLoading && (
              <p className="px-4 py-8 text-center text-xs text-slate-500">No roster names match this search.</p>
            )}
            {rosterLoading && <p role="status" className="px-4 py-6 text-center text-xs text-slate-500">Loading student roster...</p>}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{roster.pagination.total} matching names</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={rosterPage <= 1 || rosterLoading} onClick={() => setRosterPage((current) => current - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
              <span>{rosterPage} / {Math.max(1, roster.pagination.totalPages)}</span>
              <button type="button" disabled={rosterPage >= roster.pagination.totalPages || rosterLoading}
                onClick={() => setRosterPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>
      )}
      {profile?.source_note && <p className="text-[11px] text-slate-400">{profile.source_note}</p>}
    </div>
  );
};
