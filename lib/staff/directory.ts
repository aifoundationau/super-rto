/**
 * Super-RTO Institutional Staff Directory & Role-Specific Profiles
 * 
 * Supports role-adaptive staff registration and profiles for:
 * - Teaching Faculty, Trainers & Assessors (Vocational & Higher Ed)
 * - Course Coordinators & Executive Deans
 * - Student Counsellors (PACFA, WWCC, Crisis Protocol)
 * - Executive Leadership (Chancellor, President, Vice President, CEO, COO, CFO, Director)
 * - Technical Operations (CTO, Tech Admin)
 * - Institutional Administration (Registrar, Admissions, Compliance)
 */

import type { FacultyStaffMember } from '../courseBuilder/faculty.ts';

export type StaffRole =
  | 'trainer'
  | 'assessor'
  | 'teacher'
  | 'coordinator'
  | 'dean'
  | 'student_counsellor'
  | 'chancellor'
  | 'president'
  | 'vice_president'
  | 'ceo'
  | 'coo'
  | 'cfo'
  | 'director'
  | 'cto'
  | 'tech_admin'
  | 'admin';

export interface StaffRoleMeta {
  role: StaffRole;
  label: string;
  category: 'Academic & Teaching' | 'Student Support' | 'Executive Leadership' | 'Technical Operations' | 'Institutional Administration';
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const STAFF_ROLE_DEFINITIONS: Record<StaffRole, StaffRoleMeta> = {
  trainer: {
    role: 'trainer',
    label: 'Vocational Trainer',
    category: 'Academic & Teaching',
    description: 'Accredited RTO Trainer delivering competency units with current industry currency and Cert IV TAE.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
  },
  assessor: {
    role: 'assessor',
    label: 'Vocational Assessor',
    category: 'Academic & Teaching',
    description: 'Accredited Assessor conducting formative and summative competency evaluations per ASQA Standards.',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
  },
  teacher: {
    role: 'teacher',
    label: 'Teaching Faculty / Lecturer',
    category: 'Academic & Teaching',
    description: 'Higher Education or Dual-Sector Academic delivering undergraduate/postgraduate coursework.',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    badgeBorder: 'border-blue-300',
  },
  coordinator: {
    role: 'coordinator',
    label: 'Course Coordinator',
    category: 'Academic & Teaching',
    description: 'Directs curriculum syllabus, student academic progression, and moderation of assessments.',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-300',
  },
  dean: {
    role: 'dean',
    label: 'Executive Dean / Head of Faculty',
    category: 'Academic & Teaching',
    description: 'Faculty executive leading academic schools, accreditation submissions, and professorial appointments.',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
  },
  student_counsellor: {
    role: 'student_counsellor',
    label: 'Student Counsellor',
    category: 'Student Support',
    description: 'Licensed counsellor providing confidential mental health, disability support, and crisis intervention.',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-900',
    badgeBorder: 'border-pink-300',
  },
  chancellor: {
    role: 'chancellor',
    label: 'Chancellor',
    category: 'Executive Leadership',
    description: 'Head of university council, ceremonial authority, and degree conferral preside.',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-950',
    badgeBorder: 'border-yellow-400',
  },
  president: {
    role: 'president',
    label: 'President',
    category: 'Executive Leadership',
    description: 'Chief executive officer and academic president directing institution-wide strategic operations.',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300',
  },
  vice_president: {
    role: 'vice_president',
    label: 'Vice President',
    category: 'Executive Leadership',
    description: 'Executive Vice President directing enterprise portfolios, research, and campus infrastructure.',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
    badgeBorder: 'border-teal-300',
  },
  ceo: {
    role: 'ceo',
    label: 'Chief Executive Officer (CEO)',
    category: 'Executive Leadership',
    description: 'Chief Executive Officer leading institutional compliance, expansion, and executive council.',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-950',
    badgeBorder: 'border-blue-300',
  },
  coo: {
    role: 'coo',
    label: 'Chief Operating Officer (COO)',
    category: 'Executive Leadership',
    description: 'Oversees day-to-day operations, facilities, logistics, admissions velocity, and staff operations.',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-950',
    badgeBorder: 'border-indigo-300',
  },
  cfo: {
    role: 'cfo',
    label: 'Chief Financial Officer (CFO)',
    category: 'Executive Leadership',
    description: 'Directs institutional treasury, tuition fee schedules, auditing, and token reserve economics.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-950',
    badgeBorder: 'border-emerald-300',
  },
  director: {
    role: 'director',
    label: 'Executive Director',
    category: 'Executive Leadership',
    description: 'College Director / Dean steering faculty operations, regulatory benchmarks, and course portfolios.',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-950',
    badgeBorder: 'border-rose-300',
  },
  cto: {
    role: 'cto',
    label: 'Chief Technology Officer (CTO)',
    category: 'Technical Operations',
    description: 'Steers enterprise cloud architectures, AI pipelines, system security, and LMS digital infrastructure.',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-950',
    badgeBorder: 'border-violet-300',
  },
  tech_admin: {
    role: 'tech_admin',
    label: 'Technical Administrator',
    category: 'Technical Operations',
    description: 'Manages user accounts, cloud database instances, API integrations, and server infrastructure.',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-900',
    badgeBorder: 'border-slate-400',
  },
  admin: {
    role: 'admin',
    label: 'Institutional Administrator',
    category: 'Institutional Administration',
    description: 'Manages student records, USI validations, AVETMISS submissions, and staff directory records.',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-950',
    badgeBorder: 'border-cyan-300',
  },
};

export interface StaffMemberProfile {
  id: string;
  fullName: string;
  role: StaffRole;
  appointmentTitle: string;
  email: string;
  phone: string;
  campus: string;
  officeLocation: string;
  department: string;
  dateJoined: string;
  status: 'active' | 'on_leave' | 'inactive';
  avatarUrl?: string;

  // 1. Teaching Faculty, Trainers & Assessors
  qualifications?: string; // Academic Qualifications & Vocational Credentials
  industryExperience?: string; // Industry Experience & Professional Currency
  consultationHours?: string; // Student Consultation Hours
  vocationalCompetencies?: string[]; // e.g. ["BSBWHS411", "TAE40122"]
  asqaTrainerMatrixVerified?: boolean;

  // 2. Student Counsellor
  counsellingCredentials?: string; // PACFA, ACA, Psychology Board registration
  wwccNumber?: string; // Working With Children Check number & State
  crisisSpecialisation?: string; // Crisis Intervention, Academic Anxiety, Youth Mental Health
  confidentialBookingLink?: string; // Calendly / Telehealth link
  emergencyCrisisPhone?: string; // 24/7 on-call phone

  // 3. Executive Suite (Chancellor, President, VP, CEO, COO, Director)
  boardTerm?: string; // e.g. "2024 - 2028"
  governanceCommittees?: string[]; // Academic Senate, Audit & Risk, Executive Committee
  executiveAssistantName?: string;
  executiveAssistantEmail?: string;
  strategicDelegations?: string; // Statutory expenditure limit, governance delegations

  // 4. CFO
  accountingAccreditation?: string; // FCPA, CA ANZ, CIMA
  financialDelegationLimit?: string; // e.g. "AUD $5,000,000"
  auditGovernancePortfolio?: string; // National Audits Group, ATO RTO Tax Compliance

  // 5. CTO & Tech Admin
  securityClearance?: string; // Baseline, NV1, NV2, ISO 27001 Lead
  techStackOversight?: string[]; // Next.js, Firebase, BigQuery, Canvas LMS
  criticalEmergencyOnCall?: string; // 24/7 incident pager
  disasterRecoveryLead?: boolean;

  // 6. Admin
  administrativePortfolio?: string; // Admissions, AVETMISS, Records
  clearanceLevel?: string; // Level 3 - Full Student Records & USI Validation
  smsSystemAccess?: string; // VETtrak / SMS & EduPulse Central
}

export const DEFAULT_STAFF_DIRECTORY: StaffMemberProfile[] = [
  // 1. Teaching Faculty / Trainers & Assessors
  {
    id: 'staff-marcus-sterling',
    fullName: 'Dr. Marcus Sterling',
    role: 'trainer',
    appointmentTitle: 'Lead Trainer & Safety Auditor',
    email: 'm.sterling@super-rto.edu.au',
    phone: '+61 2 9514 2040',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Building 1, Level 5, Room 512',
    department: 'School of Work Health & Safety Compliance',
    dateJoined: '2021-03-15',
    status: 'active',
    qualifications: 'PhD (Ergonomics, USyd), Cert IV TAE40122, Lead Statutory Safety Auditor, COHSPr',
    industryExperience: '20+ years leading statutory safety compliance audits across Australian mining, civil construction and transport logistics.',
    consultationHours: 'Tuesdays & Thursdays 1:00 PM – 3:00 PM (AEST) or online appointment',
    vocationalCompetencies: ['BSBWHS411', 'BSBWHS412', 'BSBWHS413', 'TAE40122'],
    asqaTrainerMatrixVerified: true,
  },
  {
    id: 'staff-sarah-chen',
    fullName: 'Sarah Chen, MAppSc',
    role: 'assessor',
    appointmentTitle: 'Senior Industry Fellow & Workplace Safety Practitioner',
    email: 's.chen@super-rto.edu.au',
    phone: '+61 2 9514 2045',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Building 1, Level 5, Room 518',
    department: 'School of Work Health & Safety Compliance',
    dateJoined: '2022-07-01',
    status: 'active',
    qualifications: 'MAppSc (Occupational Health), BSafeSc, Dip WHS, Cert IV TAE40116/TAE40122',
    industryExperience: 'Former Senior SafeWork NSW Inspector and Risk Director at Multiplex Australasia; certified incident investigator.',
    consultationHours: 'Mondays & Fridays 10:00 AM – 12:00 PM (AEST)',
    vocationalCompetencies: ['BSBWHS414', 'BSBWHS415', 'TAE40122'],
    asqaTrainerMatrixVerified: true,
  },
  {
    id: 'staff-elena-rostova',
    fullName: 'A/Prof. Elena Rostova',
    role: 'coordinator',
    appointmentTitle: 'Associate Professor & AI Program Director',
    email: 'e.rostova@super-rto.edu.au',
    phone: '+61 2 9514 1800',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Building 11, Level 6, Room 614',
    department: 'School of Software Systems & Applied AI',
    dateJoined: '2020-02-10',
    status: 'active',
    qualifications: 'PhD (Machine Learning, UNSW), MSc, BEng (Hons I), Cert IV TAE40122',
    industryExperience: 'Former Senior AI Research Scientist at Google DeepMind & CSIRO Data61; 14+ years research and production ML leadership.',
    consultationHours: 'Wednesdays 2:00 PM – 4:00 PM (AEST) or via Zoom',
    vocationalCompetencies: ['ICTPRG430', 'ICTPRG431', 'ICTAI401'],
    asqaTrainerMatrixVerified: true,
  },
  {
    id: 'staff-david-thorne',
    fullName: 'Dr. David K. Thorne',
    role: 'teacher',
    appointmentTitle: 'Senior Lecturer in Cloud Architectures & Systems Security',
    email: 'd.thorne@super-rto.edu.au',
    phone: '+61 2 9514 1822',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Building 11, Level 6, Room 620',
    department: 'School of Software Systems & Applied AI',
    dateJoined: '2021-09-01',
    status: 'active',
    qualifications: 'PhD (Distributed Systems, ANU), CISSP, AWS Certified Solutions Architect, Cert IV TAE40122',
    industryExperience: 'Principal Infrastructure Architect for Australian Government defense projects; 18+ years cloud engineering and high-assurance architectures.',
    consultationHours: 'Thursdays 10:00 AM – 12:00 PM (AEST)',
    vocationalCompetencies: ['ICTNWK420', 'ICTSAS425', 'ICTCYB401'],
    asqaTrainerMatrixVerified: true,
  },
  {
    id: 'staff-wayne-oconnor',
    fullName: 'Wayne O’Connor',
    role: 'trainer',
    appointmentTitle: 'Lead Civil & High-Risk Operations Trainer',
    email: 'w.oconnor@super-rto.edu.au',
    phone: '+61 7 3012 8840',
    campus: 'Brisbane Regional Training Centre',
    officeLocation: 'Hangar B, Workshop 3',
    department: 'School of Vocational Education & Applied Training',
    dateJoined: '2019-05-20',
    status: 'active',
    qualifications: 'Cert IV TAE40122, Adv Dip Civil Construction, Heavy Machinery Assessor Licenses RII',
    industryExperience: '25+ years in open-cut mining and statutory civil earthworks across QLD and WA; certified plant operator examiner.',
    consultationHours: 'Tuesdays 8:00 AM – 10:00 AM (AEST)',
    vocationalCompetencies: ['RIIMPO318F', 'RIIMPO320F', 'TAE40122'],
    asqaTrainerMatrixVerified: true,
  },

  // 2. Student Counsellor
  {
    id: 'staff-maya-lin',
    fullName: 'Dr. Maya Lin, PhD, PACFA Clinical',
    role: 'student_counsellor',
    appointmentTitle: 'Head of Student Wellbeing & Licensed Counsellor',
    email: 'wellbeing.counselling@super-rto.edu.au',
    phone: '+61 2 9514 1177',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Student Hub, Level 3, Room 304',
    department: 'Department of Student Welfare & Mental Health',
    dateJoined: '2020-08-15',
    status: 'active',
    counsellingCredentials: 'Master of Counselling (USyd), PhD (Clinical Psychology), PACFA Reg Clinical 24901, ACA Level 4',
    wwccNumber: 'WWC0849201E (Valid to Nov 2028 - NSW)',
    crisisSpecialisation: 'Crisis De-escalation, Academic Anxiety, International Student Acculturation, Trauma-Informed Care',
    confidentialBookingLink: 'https://counselling.super-rto.edu.au/book/maya-lin',
    emergencyCrisisPhone: '+61 400 111 999 (24/7 Student Crisis Hotline)',
    consultationHours: 'Monday to Thursday 9:00 AM – 4:30 PM (Confidential Appointments)',
  },

  // 3. Executive Suite
  {
    id: 'staff-vivienne-vance',
    fullName: 'Dame Vivienne Vance, AC, DCL',
    role: 'chancellor',
    appointmentTitle: 'Governing Chancellor',
    email: 'chancellor@super-rto.edu.au',
    phone: '+61 2 9514 1001',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Chancellery Tower, Level 12',
    department: 'University Council & Institutional Chancellery',
    dateJoined: '2018-01-01',
    status: 'active',
    boardTerm: '2022 – 2027 (Second Term)',
    governanceCommittees: ['University Council (Chair)', 'Honorary Awards Committee', 'Academic Senate Governance Oversight'],
    executiveAssistantName: 'Margaret Holloway',
    executiveAssistantEmail: 'chancellor.ea@super-rto.edu.au',
    strategicDelegations: 'Statutory degree conferral, institutional charter signing, and council governance.',
  },
  {
    id: 'staff-arthur-pendelton',
    fullName: 'Prof. Arthur Pendelton, AO, PhD',
    role: 'president',
    appointmentTitle: 'Institutional President & Vice-Chancellor',
    email: 'president@super-rto.edu.au',
    phone: '+61 2 9514 1005',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Chancellery Tower, Level 11',
    department: 'Executive Governance & Strategic Leadership',
    dateJoined: '2019-06-01',
    status: 'active',
    boardTerm: '2024 – 2029',
    governanceCommittees: ['Executive Board (Chair)', 'Academic Senate', 'Finance & Investment Committee'],
    executiveAssistantName: 'James Sinclair',
    executiveAssistantEmail: 'president.ea@super-rto.edu.au',
    strategicDelegations: 'Overall institutional direction, executive appointments, government statutory relations.',
  },
  {
    id: 'staff-beatrice-holloway',
    fullName: 'Prof. Beatrice Holloway, PhD, FTSE',
    role: 'vice_president',
    appointmentTitle: 'Vice President (Academic & Industry Partnerships)',
    email: 'vp.partnerships@super-rto.edu.au',
    phone: '+61 2 9514 1010',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Chancellery Tower, Level 11, Room 1104',
    department: 'Academic Partnerships & Enterprise Strategy',
    dateJoined: '2021-04-12',
    status: 'active',
    boardTerm: '2023 – 2028',
    governanceCommittees: ['Research Innovation Council', 'Industry Advisory Board', 'Academic Quality Assurance'],
    executiveAssistantName: 'Claire Beaumont',
    executiveAssistantEmail: 'vp.ea@super-rto.edu.au',
    strategicDelegations: 'Commercial enterprise agreements, international university exchanges, research grant approvals up to $5M.',
  },
  {
    id: 'staff-evelyn-reed',
    fullName: 'Evelyn Reed, MBA, GAICD',
    role: 'ceo',
    appointmentTitle: 'Chief Executive Officer',
    email: 'ceo@super-rto.edu.au',
    phone: '+61 2 9514 1015',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Chancellery Tower, Level 10, Suite 1001',
    department: 'Executive Operations & Corporate Governance',
    dateJoined: '2020-01-15',
    status: 'active',
    boardTerm: '2024 – 2029',
    governanceCommittees: ['Executive Committee', 'Audit & Risk Committee', 'RTO Standards Compliance Board'],
    executiveAssistantName: 'Sophie Bennett',
    executiveAssistantEmail: 'ceo.ea@super-rto.edu.au',
    strategicDelegations: 'Enterprise budget execution, ASQA/TEQSA statutory sign-off, corporate operational decisions.',
  },
  {
    id: 'staff-liam-montgomery',
    fullName: 'Liam Montgomery, BEng, MBA',
    role: 'coo',
    appointmentTitle: 'Chief Operating Officer',
    email: 'coo@super-rto.edu.au',
    phone: '+61 2 9514 1020',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Chancellery Tower, Level 10, Suite 1005',
    department: 'Campus Operations, Timetabling & Student Logistics',
    dateJoined: '2021-02-01',
    status: 'active',
    boardTerm: '2023 – 2027',
    governanceCommittees: ['Campus Health & Safety Committee', 'Infrastructure Masterplan Committee'],
    executiveAssistantName: 'Liam Chen',
    executiveAssistantEmail: 'coo.ea@super-rto.edu.au',
    strategicDelegations: 'Multi-campus facilities management, admissions operational cadence, timetabling dispatch.',
  },
  {
    id: 'staff-danielle-foster',
    fullName: 'Danielle Foster, FCPA, CA ANZ',
    role: 'cfo',
    appointmentTitle: 'Chief Financial Officer',
    email: 'cfo@super-rto.edu.au',
    phone: '+61 2 9514 1025',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Chancellery Tower, Level 9, Room 901',
    department: 'Financial Services & Treasury Management',
    dateJoined: '2020-11-01',
    status: 'active',
    accountingAccreditation: 'Fellow Certified Practising Accountant (FCPA), Chartered Accountants ANZ (CA)',
    financialDelegationLimit: 'AUD $10,000,000 statutory spending authorization',
    auditGovernancePortfolio: 'National Audits Group, Commonwealth CSP Reconciliation, Token Reserve Liquidity',
    executiveAssistantEmail: 'cfo.ea@super-rto.edu.au',
  },
  {
    id: 'staff-gregory-hayes',
    fullName: 'Dr. Gregory Hayes, EdD, MBA, MAICD',
    role: 'dean',
    appointmentTitle: 'Executive Dean of Academic & Vocational Studies',
    email: 'g.hayes@super-rto.edu.au',
    phone: '+61 2 9514 2000',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Building 1, Level 5, Room 501',
    department: 'Faculty of Business, Technology & Vocational Safety',
    dateJoined: '2019-01-10',
    status: 'active',
    qualifications: 'EdD (Curriculum Architecture, Melb), MBA (Exec, AGSM), Cert IV TAE40122, MAICD',
    industryExperience: '25+ years in vocational education leadership, former ASQA Auditor Panel Member, state training awards judge.',
    consultationHours: 'Wednesdays 11:00 AM – 1:00 PM (AEST)',
    asqaTrainerMatrixVerified: true,
  },

  // 4. Technical Operations
  {
    id: 'staff-nathanial-vance',
    fullName: 'Nathanial Vance, MSc, CISSP',
    role: 'cto',
    appointmentTitle: 'Chief Technology Officer',
    email: 'cto@super-rto.edu.au',
    phone: '+61 2 9514 1030',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Building 11, Level 7, Room 702',
    department: 'Information Technology, AI & Cloud Infrastructure',
    dateJoined: '2021-05-15',
    status: 'active',
    securityClearance: 'Australian Government NV2 Secret Clearance, ISO 27001 Lead Auditor',
    techStackOversight: ['Next.js / TypeScript App Engine', 'Firebase Enterprise Authentication & Firestore', 'Google Cloud / BigQuery Pipelines', 'Canvas LMS & SCORM Engine'],
    criticalEmergencyOnCall: '+61 400 999 111 (24/7 Priority Ops Pager)',
    disasterRecoveryLead: true,
  },
  {
    id: 'staff-kieran-patel',
    fullName: 'Kieran Patel, BCompSc',
    role: 'tech_admin',
    appointmentTitle: 'Senior Systems & Cloud Infrastructure Administrator',
    email: 'k.patel@super-rto.edu.au',
    phone: '+61 2 9514 1035',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Building 11, Level 7, Room 710',
    department: 'Information Technology Infrastructure',
    dateJoined: '2022-03-20',
    status: 'active',
    securityClearance: 'Baseline Government Security Clearance, CompTIA Security+, AWS DevOps Professional',
    techStackOversight: ['Linux Systems Administration', 'Cloud Identity Management & SSO / SAML', 'Database Backups & Replication'],
    criticalEmergencyOnCall: '+61 400 888 222 (Systems Tier 2 On-Call)',
    disasterRecoveryLead: false,
  },

  // 5. Institutional Administration
  {
    id: 'staff-brenda-kowalski',
    fullName: 'Brenda Kowalski, DipBus',
    role: 'admin',
    appointmentTitle: 'University Registrar & Admissions Operations Lead',
    email: 'registrar.admissions@super-rto.edu.au',
    phone: '+61 2 9514 1050',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Student Administration Centre, Level 2, Counter 4',
    department: 'Student Admissions, Registry & Compliance Records',
    dateJoined: '2018-09-01',
    status: 'active',
    administrativePortfolio: 'Student Admissions, CRICOS Visa 500 Compliance, USI Registry & AVETMISS Nat Files',
    clearanceLevel: 'Level 3 - Unrestricted Student Records & Australian Government AVETMISS Registry',
    smsSystemAccess: 'VETtrak, EduPulse SMS, Department of Education PRISMS Registry',
  },
];

const LOCAL_STORAGE_KEY = 'super_rto_staff_directory_v1';

/**
 * Loads the current staff directory from localStorage (browser) or returns default seed.
 */
export function getStoredStaffDirectory(): StaffMemberProfile[] {
  if (typeof window === 'undefined') {
    return DEFAULT_STAFF_DIRECTORY;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_STAFF_DIRECTORY));
      return DEFAULT_STAFF_DIRECTORY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read staff directory from localStorage:', err);
  }
  return DEFAULT_STAFF_DIRECTORY;
}

/**
 * Saves staff directory to localStorage and dispatches change event for real-time reactivity.
 */
export function saveStoredStaffDirectory(staff: StaffMemberProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staff));
    window.dispatchEvent(new Event('super_rto_staff_directory_updated'));
  } catch (err) {
    console.error('Failed to save staff directory to localStorage:', err);
  }
}

/**
 * Returns only teaching staff, trainers, assessors, coordinators, and deans.
 */
export function getTeachingStaff(staff: StaffMemberProfile[] = getStoredStaffDirectory()): StaffMemberProfile[] {
  const teachingRoles: StaffRole[] = ['trainer', 'assessor', 'teacher', 'coordinator', 'dean'];
  return staff.filter((s) => teachingRoles.includes(s.role));
}

/**
 * Formats a registered staff member profile into the Course Builder's FacultyStaffMember format.
 */
export function formatStaffAsFacultyMember(staff: StaffMemberProfile): FacultyStaffMember {
  return {
    id: staff.id,
    name: staff.fullName,
    role: staff.appointmentTitle || STAFF_ROLE_DEFINITIONS[staff.role]?.label || 'Academic Staff',
    qualifications: staff.qualifications || 'Cert IV TAE40122, Relevant Industry Qualifications',
    industryExperience: staff.industryExperience || 'Demonstrated current industry currency and compliance standards.',
    email: staff.email,
    officeLocation: staff.officeLocation ? `${staff.officeLocation} (${staff.campus})` : staff.campus,
    consultationHours: staff.consultationHours || 'By appointment via Student Portal',
  };
}

/**
 * Generates a clean new blank profile tailored to the selected role.
 */
export function createBlankStaffProfile(role: StaffRole = 'trainer'): StaffMemberProfile {
  const id = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const meta = STAFF_ROLE_DEFINITIONS[role];

  const base: StaffMemberProfile = {
    id,
    fullName: '',
    role,
    appointmentTitle: meta.label,
    email: '',
    phone: '+61 2 9514 ',
    campus: 'Sydney Broadway Campus',
    officeLocation: 'Main Academic Wing, Level 3',
    department: 'School of Vocational Education & Applied Training',
    dateJoined: new Date().toISOString().split('T')[0],
    status: 'active',
  };

  switch (role) {
    case 'trainer':
    case 'assessor':
    case 'teacher':
    case 'coordinator':
    case 'dean':
      return {
        ...base,
        qualifications: 'Cert IV TAE40122, Bachelor / Diploma in Discipline',
        industryExperience: '5+ years proven industry currency and vocational practice.',
        consultationHours: 'Wednesdays 2:00 PM – 4:00 PM (AEST)',
        vocationalCompetencies: [],
        asqaTrainerMatrixVerified: true,
      };

    case 'student_counsellor':
      return {
        ...base,
        appointmentTitle: 'Student Counsellor & Mental Wellbeing Specialist',
        department: 'Department of Student Welfare & Mental Health',
        counsellingCredentials: 'Master of Counselling / Registered Psychologist, PACFA Reg Clinical',
        wwccNumber: 'WWC-PENDING (NSW)',
        crisisSpecialisation: 'Crisis Intervention, Academic Resilience, International Student Care',
        confidentialBookingLink: 'https://counselling.super-rto.edu.au/book',
        emergencyCrisisPhone: '+61 400 000 000',
        consultationHours: 'Mon-Fri 9:00 AM – 5:00 PM',
      };

    case 'chancellor':
    case 'president':
    case 'vice_president':
    case 'ceo':
    case 'coo':
    case 'director':
      return {
        ...base,
        officeLocation: 'Chancellery Tower, Level 11',
        department: 'Executive Governance & Institutional Strategy',
        boardTerm: '2025 – 2030',
        governanceCommittees: ['Executive Governance Board'],
        executiveAssistantName: '',
        executiveAssistantEmail: '',
        strategicDelegations: 'Statutory spending and institutional approvals authority.',
      };

    case 'cfo':
      return {
        ...base,
        officeLocation: 'Chancellery Tower, Level 9',
        department: 'Financial Services & Treasury Management',
        accountingAccreditation: 'FCPA / CA ANZ Member',
        financialDelegationLimit: 'AUD $5,000,000',
        auditGovernancePortfolio: 'Statutory Financial Audit, CSP Tuition Reconciliations',
        executiveAssistantEmail: '',
      };

    case 'cto':
    case 'tech_admin':
      return {
        ...base,
        officeLocation: 'Building 11, Level 7',
        department: 'Information Technology, AI & Cloud Infrastructure',
        securityClearance: 'Baseline Government Clearance',
        techStackOversight: ['Next.js', 'Firebase Enterprise', 'Google Cloud', 'Canvas LMS'],
        criticalEmergencyOnCall: '+61 400 000 000 (24/7 On-Call Pager)',
        disasterRecoveryLead: role === 'cto',
      };

    case 'admin':
      return {
        ...base,
        officeLocation: 'Student Administration Centre, Level 2',
        department: 'Student Admissions, Registry & Compliance Records',
        administrativePortfolio: 'Student Admissions, Enrolments, AVETMISS Submissions',
        clearanceLevel: 'Level 3 - Unrestricted Student Records',
        smsSystemAccess: 'VETtrak & EduPulse SMS',
      };

    default:
      return base;
  }
}
