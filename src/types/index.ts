export type UserRole =
  | 'PLATFORM_OWNER'
  | 'UNIVERSITY_ADMIN'
  | 'CAMPUS_ADMIN'
  | 'FACULTY'
  | 'STUDENT'
  | 'PARENT'
  | 'MAINTENANCE_STAFF'
  | 'SECURITY_GUARD'
  | 'LIBRARIAN'
  | 'TRANSPORT_COORDINATOR'
  | 'CAFETERIA_STAFF'
  | 'WARDEN'
  | 'COUNSELLOR';

export interface User {
  id: string;
  tenant_id: string;
  campus_id?: string;
  university_id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  photo_url?: string;
  card_status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  mfa_enabled?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  subscription_plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscription_status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  max_campuses: number;
  max_students: number;
}

export interface Campus {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  contact_email: string;
  contact_phone: string;
}

export interface Course {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  department: string;
  credits: number;
  semester: number;
  syllabus_outline: string;
  enrolled_count?: number;
}

export interface TimetableSlot {
  id: string;
  tenant_id: string;
  campus_id: string;
  course_id: string;
  code: string;
  title: string;
  department: string;
  faculty_id: string;
  faculty_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  batch_section: string;
}

export interface Assignment {
  id: string;
  tenant_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  faculty_name: string;
  title: string;
  description: string;
  max_marks: number;
  due_date: string;
  attachment_url?: string;
  submission_count?: number;
  user_marks?: number;
  user_feedback?: string;
  user_submitted_at?: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  points: number;
}

export interface Quiz {
  id: string;
  tenant_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  starts_at: string;
  ends_at: string;
  questions?: QuizQuestion[];
  user_score?: number;
  completed_at?: string;
}

export interface ExamSchedule {
  id: string;
  tenant_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  exam_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  hall_number: string;
  registration_id?: string;
  registration_status?: string;
  hall_ticket_number?: string;
  seat_allotment?: string;
  qr_verification_code?: string;
}

export interface DigitalCertificate {
  id: string;
  tenant_id: string;
  user_id: string;
  certificate_type: string;
  title: string;
  issue_date: string;
  cryptographic_hash: string;
  pdf_url?: string;
  metadata_json?: string;
}

export interface VisitorRequest {
  id: string;
  tenant_id: string;
  campus_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_email: string;
  id_proof_type: string;
  id_proof_number: string;
  host_user_id: string;
  host_name: string;
  host_department: string;
  purpose: string;
  expected_arrival: string;
  host_approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  pass_qr_code: string;
  allowed_zones: string;
  check_in_time?: string;
  check_out_time?: string;
}

export interface SOSAlert {
  id: string;
  tenant_id: string;
  campus_id: string;
  triggered_by_user_id: string;
  user_name: string;
  user_phone: string;
  user_role: string;
  alert_type: string;
  location_description: string;
  gps_coordinates: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  dispatched_officers?: string;
  created_at: string;
}

export interface MaintenanceTicket {
  id: string;
  tenant_id: string;
  campus_id: string;
  reported_by_user_id: string;
  reporter_name: string;
  technician_name?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  photo_url?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigned_department: string;
  sla_due_hours: number;
  student_rating?: number;
  student_feedback?: string;
  created_at: string;
}

export interface FeeDue {
  id: string;
  tenant_id: string;
  student_id: string;
  fee_structure_id: string;
  fee_type: string;
  due_date: string;
  academic_year: string;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
}

export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  payment_mode: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  receipt_number: string;
  created_at: string;
}

export interface LibraryBook {
  id: string;
  tenant_id: string;
  campus_id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  is_ebook: number;
  ebook_url?: string;
}

export interface TransportRoute {
  id: string;
  tenant_id: string;
  route_name: string;
  start_point: string;
  end_point: string;
  stops: Array<{ name: string; eta: string }>;
  monthly_fee: number;
}

export interface TransportVehicle {
  id: string;
  tenant_id: string;
  route_id?: string;
  route_name?: string;
  bus_number: string;
  license_plate: string;
  seating_capacity: number;
  driver_name: string;
  driver_phone: string;
  current_lat: number;
  current_lng: number;
  speed_kmh: number;
  next_stop?: string;
  eta_minutes?: number;
}

export interface StudentSuccessMetrics {
  student_id: string;
  tenant_id: string;
  attendance_rate: number;
  gpa: number;
  assignment_completion_rate: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  explainableRiskFactors: string[];
  supportRecommendations: string[];
}

export interface Grievance {
  id: string;
  tenant_id: string;
  tracking_ticket_number: string;
  category: string;
  confidentiality_level: 'PUBLIC' | 'CONFIDENTIAL' | 'STRICTLY_ANONYMOUS';
  submitter_name: string;
  subject: string;
  details: string;
  priority: string;
  status: string;
  auto_escalation_deadline: string;
  is_escalated: number;
  created_at: string;
}

export interface AutomationWorkflow {
  id: string;
  tenant_id: string;
  name: string;
  trigger_event: string;
  condition_json: string;
  action_type: string;
  action_payload_json: string;
  is_active: number;
  last_triggered_at?: string;
}
