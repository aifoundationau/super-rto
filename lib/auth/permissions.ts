import type { SystemRole } from './roles.ts';

export type PermissionCategory =
  | 'Academic & LMS'
  | 'Admissions & Students'
  | 'Finance & Operations'
  | 'Communications & AI'
  | 'Administration & Governance';

export interface SystemPermission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export const SYSTEM_PERMISSIONS: SystemPermission[] = [
  // Academic & LMS
  {
    id: 'courses.view',
    name: 'View Courses & Units',
    description: 'Inspect course syllabus, accreditation details, unit structures, and learning outcomes.',
    category: 'Academic & LMS',
  },
  {
    id: 'courses.create',
    name: 'Create & Edit Courses',
    description: 'Build new courses and units in Course Builder, add modular lessons and learning outcomes.',
    category: 'Academic & LMS',
  },
  {
    id: 'courses.publish',
    name: 'Publish Courses to Catalog',
    description: 'Publish draft courses to the live public catalog and student enrollment portal.',
    category: 'Academic & LMS',
  },
  {
    id: 'grades.view',
    name: 'View Student Grades & Transcripts',
    description: 'Access academic performance, assessment results, competency status, and transcripts.',
    category: 'Academic & LMS',
  },
  {
    id: 'grades.edit',
    name: 'Grade Assessments & Units',
    description: 'Evaluate student submissions against competency rubrics (Competent / Not Yet Competent - C/NYC).',
    category: 'Academic & LMS',
  },
  {
    id: 'classroom.manage',
    name: 'Google Classroom Management',
    description: 'Synchronize course cohorts, student rosters, and assignments with Google Classroom.',
    category: 'Academic & LMS',
  },

  // Admissions & Students
  {
    id: 'applications.view',
    name: 'View Admissions Applications',
    description: 'Read submitted student applications, declarations, and attached identity documents.',
    category: 'Admissions & Students',
  },
  {
    id: 'applications.review',
    name: 'Review & Decide Admissions',
    description: 'Approve, place on hold, or reject prospective student admissions applications.',
    category: 'Admissions & Students',
  },
  {
    id: 'applications.export',
    name: 'Export Admissions Data',
    description: 'Export student applications and demographic reports for compliance auditing.',
    category: 'Admissions & Students',
  },
  {
    id: 'students.manage',
    name: 'Manage Student Identifiers & USI',
    description: 'Validate Unique Student Identifiers (USI) and assign official Student Registration numbers.',
    category: 'Admissions & Students',
  },
  {
    id: 'students.enrolment_check',
    name: 'Student Enrolment Check',
    description: 'Review every student account with the courses and units they are enrolled in, flag students with no enrolment, and change their role.',
    category: 'Admissions & Students',
  },

  // Finance & Operations
  {
    id: 'finance.view',
    name: 'View Financial Ledgers',
    description: 'Monitor tuition revenue, fee status, departmental budgets, and balance sheets.',
    category: 'Finance & Operations',
  },
  {
    id: 'finance.approve',
    name: 'Approve Financial Transactions & Budgets',
    description: 'Authorize institutional expenditure, refund claims, and major departmental appropriations.',
    category: 'Finance & Operations',
  },
  {
    id: 'tokens.manage',
    name: 'Manage Tokens & Emergency Fund',
    description: 'Authorize and disburse tokens from emergency pool to students or community beneficiaries.',
    category: 'Finance & Operations',
  },
  {
    id: 'tokens.rates.director',
    name: 'Configure Director Token Exchange Rates',
    description: 'Adjust institutional token pegging, fiat conversion limits, and token rate floors.',
    category: 'Finance & Operations',
  },
  {
    id: 'events.manage',
    name: 'Manage Campus Events & RSVPs',
    description: 'Create and administer campus masterclasses, workshops, orientation days, and reservations.',
    category: 'Finance & Operations',
  },
  {
    id: 'calendar.manage',
    name: 'Manage Academic Calendar & Schedules',
    description: 'Schedule campus terms, assessment deadlines, and timetable sync with Google Calendar.',
    category: 'Finance & Operations',
  },

  // Communications & AI
  {
    id: 'ai.operations',
    name: 'AI Operations & RAG Generation',
    description: 'Operate multimodal Gemini AI assistants, course outline synthesizers, and vector RAG pipelines.',
    category: 'Communications & AI',
  },
  {
    id: 'faqs.edit',
    name: 'Manage Knowledge Base & FAQs',
    description: 'Curate, edit, and publish institutional knowledge bank items and student FAQ vectors.',
    category: 'Communications & AI',
  },
  {
    id: 'messaging.staff',
    name: 'Staff Messaging & Announcements',
    description: 'Send high-priority internal broadcasts, alerts, and peer-to-peer staff messages.',
    category: 'Communications & AI',
  },
  {
    id: 'telemetry.view',
    name: 'View Real-Time System Telemetry',
    description: 'Inspect live Firebase backend activity, audit logs, error diagnostics, and system latency.',
    category: 'Communications & AI',
  },

  // Administration & Governance
  {
    id: 'users.manage',
    name: 'Manage User Profiles & Roles',
    description: 'Assign system roles, audit account logins, and manage staff credentials.',
    category: 'Administration & Governance',
  },
  {
    id: 'rules.manage',
    name: 'Manage Compliance Rules & RBAC',
    description: 'Configure Firestore security rules, statutory compliance policies, and granular RBAC matrices.',
    category: 'Administration & Governance',
  },
  {
    id: 'sheets.sync',
    name: 'Google Sheets Synchronization (24/7)',
    description: 'Initiate and manage two-way background sync between platform databases and Google Sheets.',
    category: 'Administration & Governance',
  },
  {
    id: 'api_keys.manage',
    name: 'Manage Platform API Keys',
    description: 'Configure and rotate external integration credentials (Gemini, Firebase, Stripe, Google).',
    category: 'Administration & Governance',
  },
  {
    id: 'campus_metrics.manage',
    name: 'Manage Campus Metrics & Analytics',
    description: 'Analyze campus-wide enrollment conversion, retention rates, and institutional KPI targets.',
    category: 'Administration & Governance',
  },
  {
    id: 'institution.defaults.manage',
    name: 'Manage Institutional Defaults & Settings',
    description: 'Configure default institutional profiles, operational benchmarks, and organizational governance.',
    category: 'Administration & Governance',
  },
  {
    id: 'compliance.framework.manage',
    name: 'Manage Compliance & Regulatory Frameworks',
    description: 'Configure ASQA, TEQSA, CRICOS standards, audits, and compliance mappings.',
    category: 'Administration & Governance',
  },
];

export const ALL_PERMISSION_IDS: string[] = SYSTEM_PERMISSIONS.map((p) => p.id);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: [...ALL_PERMISSION_IDS],

  president: [
    'courses.view',
    'courses.publish',
    'grades.view',
    'applications.view',
    'applications.review',
    'applications.export',
    'students.manage',
    'finance.view',
    'finance.approve',
    'tokens.manage',
    'events.manage',
    'calendar.manage',
    'ai.operations',
    'messaging.staff',
    'telemetry.view',
    'users.manage',
    'rules.manage',
    'campus_metrics.manage',
  ],

  chancellor: [
    'courses.view',
    'grades.view',
    'applications.view',
    'finance.view',
    'telemetry.view',
    'rules.manage',
    'campus_metrics.manage',
  ],

  ceo: [
    'courses.view',
    'courses.publish',
    'grades.view',
    'applications.view',
    'applications.review',
    'applications.export',
    'finance.view',
    'finance.approve',
    'tokens.manage',
    'events.manage',
    'calendar.manage',
    'ai.operations',
    'messaging.staff',
    'telemetry.view',
    'users.manage',
    'campus_metrics.manage',
  ],

  coo: [
    'courses.view',
    'applications.view',
    'applications.review',
    'applications.export',
    'students.manage',
    'finance.view',
    'events.manage',
    'calendar.manage',
    'messaging.staff',
    'telemetry.view',
    'sheets.sync',
    'campus_metrics.manage',
  ],

  cfo: [
    'finance.view',
    'finance.approve',
    'tokens.manage',
    'applications.view',
    'applications.export',
    'campus_metrics.manage',
  ],

  administration: [
    'courses.view',
    'applications.view',
    'applications.review',
    'applications.export',
    'students.manage',
    'students.enrolment_check',
    'events.manage',
    'calendar.manage',
    'faqs.edit',
    'messaging.staff',
    'users.manage',
    'sheets.sync',
    'campus_metrics.manage',
  ],

  accounting: [
    'finance.view',
    'tokens.manage',
    'applications.view',
    'applications.export',
  ],

  teacher: [
    'courses.view',
    'courses.create',
    'courses.publish',
    'grades.view',
    'grades.edit',
    'classroom.manage',
    'events.manage',
    'calendar.manage',
    'ai.operations',
    'faqs.edit',
    'messaging.staff',
  ],

  student: [
    'courses.view',
    'grades.view',
    'events.manage',
    'calendar.manage',
  ],

  supporter: [
    'courses.view',
    'events.manage',
  ],

  director: [
    'courses.view',
    'courses.create',
    'courses.publish',
    'grades.view',
    'applications.view',
    'applications.review',
    'students.manage',
    'students.enrolment_check',
    'finance.view',
    'finance.approve',
    'tokens.manage',
    'events.manage',
    'calendar.manage',
    'ai.operations',
    'messaging.staff',
    'telemetry.view',
    'users.manage',
    'rules.manage',
    'campus_metrics.manage',
    'tokens.rates.director',
    'institution.defaults.manage',
    'compliance.framework.manage',
  ],

  vice_president: [
    'courses.view',
    'courses.create',
    'courses.publish',
    'grades.view',
    'applications.view',
    'applications.review',
    'students.manage',
    'events.manage',
    'calendar.manage',
    'ai.operations',
    'messaging.staff',
    'telemetry.view',
    'users.manage',
    'rules.manage',
    'campus_metrics.manage',
  ],

  cto: [
    'courses.view',
    'ai.operations',
    'telemetry.view',
    'api_keys.manage',
    'rules.manage',
    'campus_metrics.manage',
    'messaging.staff',
    'sheets.sync',
    'classroom.manage',
  ],

  tech_admin: [
    'courses.view',
    'ai.operations',
    'telemetry.view',
    'api_keys.manage',
    'rules.manage',
    'users.manage',
    'messaging.staff',
    'sheets.sync',
  ],

  admin: [
    'courses.view',
    'courses.create',
    'applications.view',
    'applications.review',
    'applications.export',
    'students.manage',
    'students.enrolment_check',
    'users.manage',
    'events.manage',
    'calendar.manage',
    'faqs.edit',
    'messaging.staff',
    'sheets.sync',
    'campus_metrics.manage',
  ],

  student_counsellor: [
    'courses.view',
    'applications.view',
    'applications.review',
    'students.manage',
    'students.enrolment_check',
    'messaging.staff',
    'events.manage',
    'calendar.manage',
  ],
};

export const PERMISSION_CATEGORIES: readonly PermissionCategory[] = [
  'Academic & LMS',
  'Admissions & Students',
  'Finance & Operations',
  'Communications & AI',
  'Administration & Governance',
];

/**
 * Maps each Admin Panel tab to the permissions required to view/access it.
 * If an array has multiple permissions, possessing ANY one of them grants visibility.
 * An empty array means the tab is open to all authenticated staff/users.
 */
export const ADMIN_PANEL_TAB_ACCESS: Record<string, string[]> = {
  account_profile: [], // Accessible to all roles
  campus_metrics: ['campus_metrics.manage'],
  course_builder: ['courses.create'], // Students only have courses.view and cannot access Course Builder
  compliance: ['compliance.framework.manage', 'rules.manage'],
  role_permissions: ['rules.manage'],
  rag_pipeline: ['ai.operations', 'telemetry.view'],
  blog_insights: ['courses.publish', 'messaging.staff'],
  api_key: ['api_keys.manage'],
  telemetry: ['telemetry.view'],
  staff_messaging: ['messaging.staff'],
  faculty_staff_directory: ['users.manage'],
  user_management: ['users.manage', 'students.manage'],
  student_check: ['students.enrolment_check'],
  applications: ['applications.view'],
  sheets_sync: ['sheets.sync'],
  images: ['courses.create'],
  classroom: ['classroom.manage'],
  embed_code: ['rules.manage', 'ai.operations', 'telemetry.view'],
  events: ['events.manage'],
  knowledge: ['faqs.edit'],
  tokens: ['tokens.manage', 'finance.view'],
  calendar: ['calendar.manage'],
  drive_upload: ['applications.export', 'users.manage', 'courses.create']
};

export function getPermissionsForRole(
  role: string,
  customMap?: Record<string, string[]>
): string[] {
  const norm = role.toLowerCase().trim();
  if (norm === 'superadmin') {
    return [...ALL_PERMISSION_IDS];
  }
  if (customMap && customMap[norm]) {
    return customMap[norm];
  }
  return DEFAULT_ROLE_PERMISSIONS[norm] || ['courses.view'];
}

export function roleHasPermission(
  role: string,
  permissionId: string,
  customMap?: Record<string, string[]>
): boolean {
  if (role.toLowerCase().trim() === 'superadmin') return true;
  const rolePerms = getPermissionsForRole(role, customMap);
  return rolePerms.includes(permissionId);
}

/**
 * Checks whether an Admin Panel tab is accessible under a given role.
 * Superadmin always has access to all tabs.
 */
export function isTabAccessibleForRole(
  tabId: string,
  role: string,
  customMap?: Record<string, string[]>
): boolean {
  const norm = (role || '').toLowerCase().trim();
  if (norm === 'superadmin') return true;
  if (tabId === 'account_profile') return true;

  const required = ADMIN_PANEL_TAB_ACCESS[tabId];
  if (!required || required.length === 0) return true;

  const userPerms = getPermissionsForRole(norm, customMap);
  return required.some((perm) => userPerms.includes(perm));
}

