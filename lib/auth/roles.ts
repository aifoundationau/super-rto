/**
 * Super-RTO Unified Strict Role-Based Access Control (RBAC) Definitions
 * 
 * Roles:
 * - superadmin: Master platform governance, global currency & compliance defaults, multi-tenant RBAC.
 * - director: Senior Management (College Presidents, University Deans, Board of Directors)
 *             Can establish institution-specific defaults (compliance framework, token pricing, course approval).
 * - chancellor: University ceremonial & high board authority.
 * - president: Executive institutional president.
 * - ceo: Chief Executive Officer.
 * - coo: Chief Operating Officer.
 * - cfo: Chief Financial Officer.
 * - accounting: Invoicing, ledger, token accounting.
 * - administration: Registrar, student admissions, compliance records, USI/AVETMISS.
 * - teacher: Course Builder, assessment marking rubrics, syllabus delivery.
 * - student: Enrolled learner accessing course units, assessments, transcripts.
 * - supporter: Default public community user upon registration.
 */

export const SYSTEM_ROLES = [
  'superadmin',
  'director',
  'chancellor',
  'president',
  'ceo',
  'coo',
  'cfo',
  'accounting',
  'administration',
  'teacher',
  'student',
  'supporter',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export interface RoleMeta {
  role: SystemRole;
  label: string;
  category: 'Public' | 'Executive' | 'Operations' | 'Academic' | 'Superadmin';
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  hierarchyLevel: number;
}

export const ROLE_DEFINITIONS: Record<SystemRole, RoleMeta> = {
  superadmin: {
    role: 'superadmin',
    label: 'Super Admin',
    category: 'Superadmin',
    description: 'Master unrestricted control over all institutions, global currency rates, compliance templates, and system tenants.',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    badgeBorder: 'border-purple-700',
    hierarchyLevel: 100,
  },
  director: {
    role: 'director',
    label: 'Director (College / University Leadership)',
    category: 'Executive',
    description: 'Senior management team of colleges and universities. Sets institution-specific compliance defaults, custom token conversion rates, and course offerings.',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    badgeBorder: 'border-rose-700',
    hierarchyLevel: 95,
  },
  chancellor: {
    role: 'chancellor',
    label: 'Chancellor',
    category: 'Executive',
    description: 'Highest ceremonial and institutional governance authority, degree conferral, and board reports.',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    badgeBorder: 'border-amber-700',
    hierarchyLevel: 90,
  },
  president: {
    role: 'president',
    label: 'President',
    category: 'Executive',
    description: 'Executive institutional president directing university-wide operations, governance, and strategy.',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    badgeBorder: 'border-sky-700',
    hierarchyLevel: 85,
  },
  ceo: {
    role: 'ceo',
    label: 'CEO',
    category: 'Executive',
    description: 'Chief Executive Officer supervising executive workflows and institutional operations.',
    badgeBg: 'bg-blue-700',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-800',
    hierarchyLevel: 80,
  },
  coo: {
    role: 'coo',
    label: 'COO',
    category: 'Operations',
    description: 'Chief Operating Officer steering internal operations, schedules, and facilities.',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    badgeBorder: 'border-indigo-700',
    hierarchyLevel: 75,
  },
  cfo: {
    role: 'cfo',
    label: 'CFO',
    category: 'Executive',
    description: 'Chief Financial Officer directing fiscal management, budget governance, and token treasury allocations.',
    badgeBg: 'bg-emerald-700',
    badgeText: 'text-white',
    badgeBorder: 'border-emerald-800',
    hierarchyLevel: 70,
  },
  accounting: {
    role: 'accounting',
    label: 'Accounting',
    category: 'Operations',
    description: 'Financial ledger management, invoicing, tuition reconciliations, and expense approvals.',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    badgeBorder: 'border-teal-700',
    hierarchyLevel: 60,
  },
  administration: {
    role: 'administration',
    label: 'Administration & Compliance',
    category: 'Operations',
    description: 'Registrar, admissions processing, student enrolments, ASQA/TEQSA records, USI validation, and AVETMISS exports.',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-800',
    hierarchyLevel: 50,
  },
  teacher: {
    role: 'teacher',
    label: 'Trainer / Assessor',
    category: 'Academic',
    description: 'Course builder authoring, syllabus delivery, marking rubrics, assessment evaluation (C/NYC), and student feedback.',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    badgeBorder: 'border-orange-700',
    hierarchyLevel: 40,
  },
  student: {
    role: 'student',
    label: 'Student',
    category: 'Academic',
    description: 'Enrolled learner accessing course units, lecture streams, assignments, quizzes, and transcripts.',
    badgeBg: 'bg-cyan-600',
    badgeText: 'text-white',
    badgeBorder: 'border-cyan-700',
    hierarchyLevel: 30,
  },
  supporter: {
    role: 'supporter',
    label: 'Supporter',
    category: 'Public',
    description: 'Default role assigned to all users upon registration. General prospective community member.',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    badgeBorder: 'border-emerald-700',
    hierarchyLevel: 10,
  },
};

export const DEFAULT_REGISTRATION_ROLE: SystemRole = 'supporter';

export function isValidRole(role: any): role is SystemRole {
  if (typeof role !== 'string') return false;
  return SYSTEM_ROLES.includes(role.toLowerCase() as SystemRole);
}

export function normalizeRole(rawRole: string | null | undefined): SystemRole {
  if (!rawRole) return DEFAULT_REGISTRATION_ROLE;
  const lower = rawRole.toLowerCase().trim();

  // Legacy mappings
  if (lower === 'admin' || lower === 'super_admin' || lower === 'superadmin') return 'superadmin';
  if (lower === 'dean' || lower === 'principal' || lower === 'director' || lower === 'executive_director') return 'director';
  if (lower === 'academic_staff' || lower === 'faculty' || lower === 'instructor' || lower === 'assessor') return 'teacher';
  if (lower === 'registrar') return 'administration';
  if (lower === 'finance') return 'accounting';

  if (isValidRole(lower)) {
    return lower;
  }

  return DEFAULT_REGISTRATION_ROLE;
}

export function getRoleMeta(rawRole: string | null | undefined): RoleMeta {
  const norm = normalizeRole(rawRole);
  return ROLE_DEFINITIONS[norm];
}

export function isSuperAdmin(rawRole: string | null | undefined, flag?: boolean, email?: string | null): boolean {
  if (email && isProjectOwnerEmail(email)) return true;
  if (flag === true && rawRole === 'superadmin') return true;
  return normalizeRole(rawRole) === 'superadmin';
}

export function isDirector(rawRole: string | null | undefined): boolean {
  const norm = normalizeRole(rawRole);
  return norm === 'director' || norm === 'superadmin';
}

/**
 * Checks if an email address is strictly a verified Project Owner.
 */
export function isProjectOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  const envOwners = (
    process.env.FIREBASE_PROJECT_OWNERS ||
    process.env.SUPERADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS ||
    ''
  )
    .toLowerCase()
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  if (envOwners.includes(cleanEmail)) {
    return true;
  }

  const strictProjectOwners = [
    'admin@aifoundation.net.au',
    'support@aifoundation.net.au',
    'eleanor.vance@edupulse.edu.au',
    'davidrobertson.info@gmail.com',
  ];

  return strictProjectOwners.includes(cleanEmail);
}
