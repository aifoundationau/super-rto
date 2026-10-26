/**
 * Super-RTO Student Course & Unit Enrolment Management
 * 
 * Provides:
 * 1. Data contracts & models for student enrolment in course units
 * 2. Pre-populated directory of registered student candidates (with write-in support)
 * 3. CSV template generation for bulk student unit enrolments
 * 4. Resilient CSV parser supporting quote-escaping and validation
 * 5. Unit and Course level enrolment helpers (add, remove, bulk assign)
 */

import type { CourseUnit } from './units.ts';

export type StudentEnrolmentStatus =
  | 'Enrolled'
  | 'In Progress'
  | 'Competent'
  | 'Deferred'
  | 'Withdrawn';

export interface UnitEnrolledStudent {
  id: string;
  studentName: string;
  studentEmail: string;
  studentId?: string; // e.g. STU-2026-00001 or USI
  unitCode: string;
  courseCode?: string;
  enrolledAt: string; // ISO date string
  status: StudentEnrolmentStatus;
  notes?: string;
}

export interface RegisteredStudentCandidate {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department?: string;
  avatarColor?: string;
}

/**
 * Standard candidate roster from student applications and system directory.
 * Used for instant auto-complete and write-in dropdowns in Course Builder.
 */
export const KNOWN_STUDENT_CANDIDATES: RegisteredStudentCandidate[] = [
  {
    id: 'cand-1',
    name: 'Emma Watson',
    email: 'emma.w@example.com',
    studentId: 'STU-2026-00001',
    department: 'Occupational Health & Safety',
    avatarColor: 'bg-emerald-500'
  },
  {
    id: 'cand-2',
    name: 'Marcus Chen',
    email: 'm.chen@example.com',
    studentId: 'STU-2026-00002',
    department: 'Compliance & Safety Systems',
    avatarColor: 'bg-blue-500'
  },
  {
    id: 'cand-3',
    name: 'Sophia Nguyen',
    email: 'sophia.n@example.com',
    studentId: 'STU-2026-00003',
    department: 'Workplace Health Management',
    avatarColor: 'bg-purple-500'
  },
  {
    id: 'cand-4',
    name: 'Liam O\'Connor',
    email: 'liam.oc@example.com',
    studentId: 'STU-2026-00004',
    department: 'Risk Engineering & Ergonomics',
    avatarColor: 'bg-amber-500'
  },
  {
    id: 'cand-5',
    name: 'Zainab Al-Mansoor',
    email: 'zainab.m@example.com',
    studentId: 'STU-2026-00005',
    department: 'Statutory Safety Operations',
    avatarColor: 'bg-rose-500'
  },
  {
    id: 'cand-6',
    name: 'Ethan Miller',
    email: 'ethan.m@example.com',
    studentId: 'STU-2026-00006',
    department: 'Workplace Consultation Systems',
    avatarColor: 'bg-indigo-500'
  }
];

export const STUDENT_ENROLMENT_CSV_HEADERS = [
  'Student Name',
  'Student Email',
  'Student ID',
  'Course Code',
  'Unit Code',
  'Status',
  'Enrolment Date'
] as const;

function esc(val: string | number | undefined | null): string {
  const str = String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates a standard CSV template for student unit enrolments.
 */
export function generateStudentEnrolmentTemplateCsv(
  courseCode: string = 'BSB41419',
  unitCode: string = 'BSBWHS411'
): string {
  const headers = STUDENT_ENROLMENT_CSV_HEADERS.map((h) => esc(h)).join(',');
  const today = new Date().toISOString().split('T')[0];

  const sampleRows = [
    [
      esc('Emma Watson'),
      esc('emma.w@example.com'),
      esc('STU-2026-00001'),
      esc(courseCode),
      esc(unitCode),
      esc('Enrolled'),
      esc(today)
    ].join(','),
    [
      esc('Marcus Chen'),
      esc('m.chen@example.com'),
      esc('STU-2026-00002'),
      esc(courseCode),
      esc(unitCode),
      esc('In Progress'),
      esc(today)
    ].join(','),
    [
      esc('Sophia Nguyen'),
      esc('sophia.n@example.com'),
      esc('STU-2026-00003'),
      esc(courseCode),
      esc(unitCode),
      esc('Enrolled'),
      esc(today)
    ].join(',')
  ];

  return [headers, ...sampleRows].join('\n');
}

/**
 * Robust CSV Line Parser that handles escaped quotes and commas.
 */
export function parseStudentCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += ch;
      i++;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses a student enrolment CSV string into structured UnitEnrolledStudent objects.
 */
export function parseStudentEnrolmentCsv(
  csvText: string,
  fallbackCourseCode: string = 'BSB41419',
  fallbackUnitCode: string = 'BSBWHS411'
): { students: UnitEnrolledStudent[]; errors: string[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const errors: string[] = [];
  const students: UnitEnrolledStudent[] = [];

  if (lines.length === 0) {
    return { students: [], errors: ['CSV content is empty.'] };
  }

  // Check header row
  const headerTokens = parseStudentCsvLine(lines[0]).map((h) => h.toLowerCase());
  const hasHeaders =
    headerTokens.some((t) => t.includes('name')) &&
    headerTokens.some((t) => t.includes('email') || t.includes('id') || t.includes('unit'));

  const startIndex = hasHeaders ? 1 : 0;

  for (let idx = startIndex; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const tokens = parseStudentCsvLine(rawLine);

    if (tokens.length === 0 || (tokens.length === 1 && !tokens[0])) {
      continue;
    }

    const name = tokens[0] || '';
    if (!name) {
      errors.push(`Row ${idx + 1}: Missing student name.`);
      continue;
    }

    const email = tokens[1] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.rto.edu.au`;
    const studentId = tokens[2] || `STU-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;
    const courseCode = tokens[3] || fallbackCourseCode;
    const unitCode = tokens[4] || fallbackUnitCode;
    const rawStatus = (tokens[5] || 'Enrolled').trim();
    const enrolledAt = tokens[6] || new Date().toISOString().split('T')[0];

    const validStatuses: StudentEnrolmentStatus[] = [
      'Enrolled',
      'In Progress',
      'Competent',
      'Deferred',
      'Withdrawn'
    ];
    const matchedStatus = validStatuses.find(
      (s) => s.toLowerCase() === rawStatus.toLowerCase()
    ) || 'Enrolled';

    students.push({
      id: `enrol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentName: name,
      studentEmail: email,
      studentId,
      courseCode,
      unitCode,
      status: matchedStatus,
      enrolledAt
    });
  }

  return { students, errors };
}

/**
 * Exports an array of enrolled students to a downloadable CSV string.
 */
export function exportStudentsToCsv(
  students: UnitEnrolledStudent[],
  courseTitle?: string
): string {
  const headers = STUDENT_ENROLMENT_CSV_HEADERS.map((h) => esc(h)).join(',');
  const rows = students.map((s) =>
    [
      esc(s.studentName),
      esc(s.studentEmail),
      esc(s.studentId || ''),
      esc(s.courseCode || ''),
      esc(s.unitCode),
      esc(s.status),
      esc(s.enrolledAt)
    ].join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Creates sample enrolled students for a unit (used for initial state & mock data).
 */
export function createDefaultEnrolledStudents(
  courseCode: string = 'BSB41419',
  unitCode: string = 'BSBWHS411'
): UnitEnrolledStudent[] {
  return [
    {
      id: `enrol-${unitCode.toLowerCase()}-1`,
      studentName: 'Emma Watson',
      studentEmail: 'emma.w@example.com',
      studentId: 'STU-2026-00001',
      courseCode,
      unitCode,
      enrolledAt: '2026-08-27',
      status: 'Enrolled'
    },
    {
      id: `enrol-${unitCode.toLowerCase()}-2`,
      studentName: 'Marcus Chen',
      studentEmail: 'm.chen@example.com',
      studentId: 'STU-2026-00002',
      courseCode,
      unitCode,
      enrolledAt: '2026-09-01',
      status: 'In Progress'
    }
  ];
}

/**
 * Adds or updates a student in a unit's enrolled students list.
 */
export function addStudentToUnit(
  unit: CourseUnit,
  studentInput: {
    studentName: string;
    studentEmail?: string;
    studentId?: string;
    courseCode?: string;
    status?: StudentEnrolmentStatus;
    notes?: string;
  }
): { updatedUnit: CourseUnit; newStudent: UnitEnrolledStudent } {
  const existingList = [...(unit.enrolledStudents || [])];
  const name = studentInput.studentName.trim();
  const email =
    studentInput.studentEmail?.trim() ||
    `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.rto.edu.au`;
  const studentId =
    studentInput.studentId?.trim() ||
    `STU-2026-${String(existingList.length + 1).padStart(5, '0')}`;

  const newStudent: UnitEnrolledStudent = {
    id: `enrol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    studentName: name,
    studentEmail: email,
    studentId,
    unitCode: unit.unitCode,
    courseCode: studentInput.courseCode,
    enrolledAt: new Date().toISOString().split('T')[0],
    status: studentInput.status || 'Enrolled',
    notes: studentInput.notes
  };

  // Check if student with same email or ID is already in this unit
  const existingIdx = existingList.findIndex(
    (s) =>
      s.studentEmail.toLowerCase() === email.toLowerCase() ||
      (studentId && s.studentId === studentId)
  );

  if (existingIdx !== -1) {
    existingList[existingIdx] = {
      ...existingList[existingIdx],
      studentName: name,
      status: studentInput.status || existingList[existingIdx].status
    };
  } else {
    existingList.push(newStudent);
  }

  return {
    updatedUnit: {
      ...unit,
      enrolledStudents: existingList
    },
    newStudent
  };
}

/**
 * Removes a student from a unit by ID.
 */
export function removeStudentFromUnit(
  unit: CourseUnit,
  studentId: string
): { updatedUnit: CourseUnit; removedStudent: UnitEnrolledStudent | null } {
  const current = unit.enrolledStudents || [];
  const removedStudent = current.find((s) => s.id === studentId) || null;
  const filtered = current.filter((s) => s.id !== studentId);

  return {
    updatedUnit: {
      ...unit,
      enrolledStudents: filtered
    },
    removedStudent
  };
}
