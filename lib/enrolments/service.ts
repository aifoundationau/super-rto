/**
 * Super-RTO Server-Side Student Enrolment & Notification Service
 *
 * Source of truth for which student is enrolled in which course unit.
 * Course Builder writes here so the enrolment is visible from the student's own account.
 *
 * Firestore collections:
 * - enrolments:    one document per (student email, course code, unit code)
 * - notifications: in-app messages addressed to a recipient email
 *
 * Side effects of a NEW enrolment (re-saving an existing one does not repeat them):
 * - Student role is upgraded from 'supporter' to 'student' (staff roles are never changed)
 * - The student's admission application(s) are marked 'Enrolled'
 * - One in-app notification per student, listing every newly added unit
 */

import { db, auth, isFirebaseConfigured, recordActivity } from '@/lib/firebase/admin';
import type { WriteBatch } from 'firebase-admin/firestore';
import { normalizeRole } from '@/lib/auth/roles';
import type { StudentEnrolmentStatus } from '@/lib/courseBuilder/studentEnrolment';

export interface EnrolmentInput {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  courseCode: string;
  courseTitle?: string;
  unitCode: string;
  unitTitle?: string;
  status?: StudentEnrolmentStatus;
}

export interface EnrolmentRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  courseCode: string;
  courseTitle: string;
  unitCode: string;
  unitTitle: string;
  status: StudentEnrolmentStatus;
  enrolledAt: string;
  updatedAt: string;
  enrolledBy: string;
}

export interface NotificationRecord {
  id: string;
  recipientEmail: string;
  type: 'enrolment';
  title: string;
  body: string;
  courseCode?: string;
  courseTitle?: string;
  unitCodes?: string[];
  read: boolean;
  createdAt: string;
  createdBy?: string;
}

export type RoleUpdateOutcome = 'promoted_to_student' | 'already_student' | 'kept_staff_role' | 'no_account_yet';

export interface StudentEnrolmentOutcome {
  studentEmail: string;
  studentName: string;
  newUnitCodes: string[];
  notified: boolean;
  roleUpdate: RoleUpdateOutcome;
  applicationsMarkedEnrolled: number;
}

const ENROLMENTS = 'enrolments';
const NOTIFICATIONS = 'notifications';

export class FirestoreUnavailableError extends Error {
  constructor() {
    super('Firestore is not configured on the server, so enrolments cannot be saved.');
  }
}

function requireFirestore() {
  if (!isFirebaseConfigured) throw new FirestoreUnavailableError();
}

// Firestore batches are capped at 500 writes.
async function commitInChunks<T>(items: T[], apply: (batch: WriteBatch, item: T) => void) {
  for (let i = 0; i < items.length; i += 450) {
    const batch = db.batch();
    items.slice(i, i + 450).forEach((item) => apply(batch, item));
    await batch.commit();
  }
}

export function enrolmentDocId(studentEmail: string, courseCode: string, unitCode: string): string {
  return [studentEmail.toLowerCase().trim(), courseCode.toUpperCase().trim(), unitCode.toUpperCase().trim()]
    .join('__')
    .replace(/\//g, '_');
}

function toRecord(input: EnrolmentInput, enrolledBy: string, now: string): EnrolmentRecord {
  const studentEmail = input.studentEmail.toLowerCase().trim();
  const courseCode = input.courseCode.toUpperCase().trim();
  const unitCode = input.unitCode.toUpperCase().trim();
  return {
    id: enrolmentDocId(studentEmail, courseCode, unitCode),
    studentName: input.studentName.trim(),
    studentEmail,
    studentId: input.studentId?.trim() || '',
    courseCode,
    courseTitle: input.courseTitle?.trim() || courseCode,
    unitCode,
    unitTitle: input.unitTitle?.trim() || unitCode,
    status: input.status || 'Enrolled',
    enrolledAt: now,
    updatedAt: now,
    enrolledBy,
  };
}

/**
 * Upgrades a 'supporter' account to 'student'. Any other role (teacher, admin, etc.) is left alone.
 */
export async function promoteToStudentIfSupporter(email: string): Promise<RoleUpdateOutcome> {
  const snapshot = await db.collection('users').where('email', '==', email.toLowerCase().trim()).get();
  if (snapshot.empty) return 'no_account_yet';

  let outcome: RoleUpdateOutcome = 'kept_staff_role';
  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const role = normalizeRole(data.role || data.status);
    if (role === 'student') {
      outcome = 'already_student';
      continue;
    }
    if (role !== 'supporter' || data.isSuperAdmin === true) continue;

    await doc.ref.set(
      {
        role: 'student',
        status: 'student',
        classification: 'Student',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    try {
      await auth.setCustomUserClaims(doc.id, { role: 'student', isSuperAdmin: false, roles: ['student'] });
    } catch (claimErr) {
      console.warn(`[enrolments] Could not set student claims for ${doc.id}:`, claimErr);
    }
    outcome = 'promoted_to_student';
  }
  return outcome;
}

export async function hasAnyEnrolment(email: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const snapshot = await db.collection(ENROLMENTS).where('studentEmail', '==', email.toLowerCase().trim()).limit(1).get();
    return !snapshot.empty;
  } catch (err) {
    // Called during sign-in; a lookup failure must never block login.
    console.warn('[enrolments] hasAnyEnrolment lookup failed:', err);
    return false;
  }
}

async function markApplicationsEnrolled(email: string, courseCode: string, courseTitle: string): Promise<number> {
  const snapshot = await db.collection('applications').where('personalDetails.email', '==', email).get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    if (doc.data()?.status === 'Enrolled') continue;
    await doc.ref.set(
      {
        status: 'Enrolled',
        enrolledCourseCode: courseCode,
        enrolledCourseTitle: courseTitle,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    updated++;
  }
  return updated;
}

function buildEnrolmentTitle(courseTitle: string, units: EnrolmentRecord[]): string {
  return units.length === 1
    ? `You've been enrolled in ${units[0].unitCode} – ${units[0].unitTitle}`
    : `You've been enrolled in ${units.length} units of ${courseTitle}`;
}

/**
 * Saves enrolments and notifies each student once about the units newly added for them.
 */
export async function enrolStudents(inputs: EnrolmentInput[], enrolledBy: string): Promise<{
  saved: number;
  students: StudentEnrolmentOutcome[];
}> {
  requireFirestore();
  const now = new Date().toISOString();

  const records = new Map<string, EnrolmentRecord>();
  for (const input of inputs) {
    if (!input.studentEmail?.trim() || !input.courseCode?.trim() || !input.unitCode?.trim()) continue;
    const record = toRecord(input, enrolledBy, now);
    records.set(record.id, record);
  }
  if (records.size === 0) return { saved: 0, students: [] };

  const refs = Array.from(records.keys()).map((id) => db.collection(ENROLMENTS).doc(id));
  const existing = await db.getAll(...refs);
  const existingById = new Map(existing.filter((d) => d.exists).map((d) => [d.id, d.data() || {}]));

  const newByStudent = new Map<string, EnrolmentRecord[]>();
  const toWrite = Array.from(records.values()).map((record) => {
    const prior = existingById.get(record.id);
    if (!prior) {
      const list = newByStudent.get(record.studentEmail) || [];
      list.push(record);
      newByStudent.set(record.studentEmail, list);
    }
    // Keep the original enrolment date when an existing enrolment is re-saved.
    return prior ? { ...record, enrolledAt: prior.enrolledAt || now } : record;
  });
  await commitInChunks(toWrite, (batch, record) => batch.set(db.collection(ENROLMENTS).doc(record.id), record, { merge: true }));

  const students: StudentEnrolmentOutcome[] = [];
  for (const [email, units] of Array.from(newByStudent.entries())) {
    const { studentName, courseCode, courseTitle } = units[0];
    await db.collection(NOTIFICATIONS).add({
      recipientEmail: email,
      type: 'enrolment',
      title: buildEnrolmentTitle(courseTitle, units),
      body: `Enrolled in ${units.map((u) => u.unitCode).join(', ')} (${courseCode} ${courseTitle}).`,
      courseCode,
      courseTitle,
      unitCodes: units.map((u) => u.unitCode),
      read: false,
      createdAt: now,
      createdBy: enrolledBy,
    });

    const [roleUpdate, applicationsMarkedEnrolled] = await Promise.all([
      promoteToStudentIfSupporter(email),
      markApplicationsEnrolled(email, courseCode, courseTitle),
    ]);

    await recordActivity({
      category: 'ENROLMENT',
      action: 'STUDENT_ENROLLED',
      userEmail: email,
      metadata: {
        courseCode,
        unitCodes: units.map((u) => u.unitCode),
        enrolledBy,
        roleUpdate,
      },
    });

    students.push({
      studentEmail: email,
      studentName,
      newUnitCodes: units.map((u) => u.unitCode),
      notified: true,
      roleUpdate,
      applicationsMarkedEnrolled,
    });
  }

  return { saved: records.size, students };
}

export async function removeEnrolments(
  keys: { studentEmail: string; courseCode: string; unitCode: string }[]
): Promise<number> {
  requireFirestore();
  await commitInChunks(keys, (batch, k) =>
    batch.delete(db.collection(ENROLMENTS).doc(enrolmentDocId(k.studentEmail, k.courseCode, k.unitCode)))
  );
  return keys.length;
}

export async function getEnrolmentsForEmail(email: string): Promise<EnrolmentRecord[]> {
  if (!isFirebaseConfigured) return [];
  const snapshot = await db.collection(ENROLMENTS).where('studentEmail', '==', email.toLowerCase().trim()).get();
  const list = snapshot.docs.map((d) => ({ ...(d.data() as EnrolmentRecord), id: d.id }));
  return list.sort((a, b) => a.courseCode.localeCompare(b.courseCode) || a.unitCode.localeCompare(b.unitCode));
}

export async function getApplicationStatusesForEmail(email: string): Promise<{ id: string; status: string }[]> {
  if (!isFirebaseConfigured) return [];
  const snapshot = await db.collection('applications').where('personalDetails.email', '==', email).get();
  return snapshot.docs.map((d) => ({ id: d.id, status: d.data()?.status || 'Draft' }));
}

export async function getNotificationsForEmail(email: string, limit = 30): Promise<NotificationRecord[]> {
  if (!isFirebaseConfigured) return [];
  // Sorted in memory to avoid needing a composite Firestore index.
  const snapshot = await db.collection(NOTIFICATIONS).where('recipientEmail', '==', email.toLowerCase().trim()).get();
  return snapshot.docs
    .map((d) => ({ ...(d.data() as NotificationRecord), id: d.id }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);
}

/**
 * Marks the given notifications (or all, when ids is omitted) as read, only if addressed to email.
 */
export async function markNotificationsRead(email: string, ids?: string[]): Promise<number> {
  requireFirestore();
  const owned = await getNotificationsForEmail(email, 500);
  const targets = owned.filter((n) => !n.read && (!ids || ids.includes(n.id)));
  const readAt = new Date().toISOString();
  await commitInChunks(targets, (batch, n) => batch.update(db.collection(NOTIFICATIONS).doc(n.id), { read: true, readAt }));
  return targets.length;
}
