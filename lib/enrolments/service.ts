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
 *
 * Removing a student's last enrolment returns their role from 'student' to 'supporter'.
 */

import { db, auth, isFirebaseConfigured, recordActivity } from '@/lib/firebase/admin';
import type { WriteBatch } from 'firebase-admin/firestore';
import { normalizeRole, type SystemRole } from '@/lib/auth/roles';
import { isValidStudentEmail, type StudentEnrolmentStatus } from '@/lib/courseBuilder/studentEnrolment';

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
 * Moves every account with this email from one role to another, but only if it currently holds `from`.
 * Staff and admin roles are never touched. Returns 'changed', 'unchanged', or 'no_account_yet'.
 */
async function switchRoleIfCurrently(
  email: string,
  from: 'supporter' | 'student',
  to: 'supporter' | 'student'
): Promise<'changed' | 'unchanged' | 'no_account_yet'> {
  const snapshot = await db.collection('users').where('email', '==', email.toLowerCase().trim()).get();
  if (snapshot.empty) return 'no_account_yet';

  let changed = false;
  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    if (normalizeRole(data.role || data.status) !== from || data.isSuperAdmin === true) continue;

    await doc.ref.set(
      {
        role: to,
        status: to,
        classification: to.charAt(0).toUpperCase() + to.slice(1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    try {
      await auth.setCustomUserClaims(doc.id, { role: to, isSuperAdmin: false, roles: [to] });
    } catch (claimErr) {
      console.warn(`[enrolments] Could not set ${to} claims for ${doc.id}:`, claimErr);
    }
    changed = true;
  }
  return changed ? 'changed' : 'unchanged';
}

/**
 * Upgrades a 'supporter' account to 'student'. Any other role (teacher, admin, etc.) is left alone.
 */
export async function promoteToStudentIfSupporter(email: string): Promise<RoleUpdateOutcome> {
  const result = await switchRoleIfCurrently(email, 'supporter', 'student');
  if (result === 'no_account_yet') return 'no_account_yet';
  if (result === 'changed') return 'promoted_to_student';
  const snapshot = await db.collection('users').where('email', '==', email.toLowerCase().trim()).get();
  const isStudent = snapshot.docs.some((d) => normalizeRole(d.data()?.role || d.data()?.status) === 'student');
  return isStudent ? 'already_student' : 'kept_staff_role';
}

// Throws on lookup failure, so callers that change roles never act on a failed read.
async function hasEnrolmentStrict(email: string): Promise<boolean> {
  const snapshot = await db.collection(ENROLMENTS).where('studentEmail', '==', email.toLowerCase().trim()).limit(1).get();
  return !snapshot.empty;
}

/**
 * Sign-in reconciliation: a supporter with enrolments becomes a student, and a student with none
 * falls back to supporter. Other roles are returned unchanged. A failed lookup keeps the current role
 * and never blocks login.
 */
export async function reconcileEnrolmentRole(email: string, role: SystemRole): Promise<SystemRole> {
  if (!isFirebaseConfigured || !email || (role !== 'supporter' && role !== 'student')) return role;
  try {
    const enrolled = await hasEnrolmentStrict(email);
    if (role === 'supporter' && enrolled) return 'student';
    if (role === 'student' && !enrolled) return 'supporter';
  } catch (err) {
    console.warn('[enrolments] Role reconciliation lookup failed, keeping current role:', err);
  }
  return role;
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
    if (!isValidStudentEmail(input.studentEmail) || !input.courseCode?.trim() || !input.unitCode?.trim()) continue;
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

export type RemovalRoleOutcome = 'reverted_to_supporter' | 'still_enrolled' | 'kept_role' | 'no_account_yet';

/**
 * Deletes enrolments. A student left with no enrolments in any course or unit falls back to 'supporter'.
 */
export async function removeEnrolments(
  keys: { studentEmail: string; courseCode: string; unitCode: string }[],
  removedBy: string
): Promise<{ removed: number; students: { studentEmail: string; roleUpdate: RemovalRoleOutcome }[] }> {
  requireFirestore();
  await commitInChunks(keys, (batch, k) =>
    batch.delete(db.collection(ENROLMENTS).doc(enrolmentDocId(k.studentEmail, k.courseCode, k.unitCode)))
  );

  const emails = Array.from(new Set(keys.map((k) => k.studentEmail.toLowerCase().trim())));
  const students: { studentEmail: string; roleUpdate: RemovalRoleOutcome }[] = [];
  for (const email of emails) {
    let roleUpdate: RemovalRoleOutcome = 'still_enrolled';
    if (!(await hasEnrolmentStrict(email))) {
      const result = await switchRoleIfCurrently(email, 'student', 'supporter');
      roleUpdate = result === 'changed' ? 'reverted_to_supporter' : result === 'no_account_yet' ? 'no_account_yet' : 'kept_role';
    }

    await recordActivity({
      category: 'ENROLMENT',
      action: 'STUDENT_UNENROLLED',
      userEmail: email,
      metadata: {
        units: keys.filter((k) => k.studentEmail.toLowerCase().trim() === email).map((k) => `${k.courseCode}/${k.unitCode}`),
        removedBy,
        roleUpdate,
      },
    });
    students.push({ studentEmail: email, roleUpdate });
  }

  return { removed: keys.length, students };
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

export interface StudentCheckCourse {
  courseCode: string;
  courseTitle: string;
  units: { unitCode: string; unitTitle: string; status: StudentEnrolmentStatus }[];
}

export interface StudentCheckRow {
  uid: string | null; // null when enrolled by email but the person has never signed in
  name: string;
  email: string;
  role: SystemRole | null;
  lastLoginAt: string | null;
  courses: StudentCheckCourse[];
  unitCount: number;
}

/**
 * Every account with the Student role, every account holding an enrolment, and every enrolled
 * email that has no account yet, each with the courses and units they are enrolled in.
 */
export async function getStudentCheckReport(): Promise<StudentCheckRow[]> {
  requireFirestore();
  const [studentSnap, enrolmentSnap] = await Promise.all([
    db.collection('users').where('role', 'in', ['student', 'Student', 'STUDENT']).get(),
    db.collection(ENROLMENTS).get(),
  ]);

  const coursesByEmail = new Map<string, Map<string, StudentCheckCourse>>();
  const nameByEmail = new Map<string, string>();
  enrolmentSnap.docs.forEach((d) => {
    const e = d.data() as EnrolmentRecord;
    if (!e.studentEmail) return;
    const courses = coursesByEmail.get(e.studentEmail) || new Map<string, StudentCheckCourse>();
    const course = courses.get(e.courseCode) || { courseCode: e.courseCode, courseTitle: e.courseTitle, units: [] };
    course.units.push({ unitCode: e.unitCode, unitTitle: e.unitTitle, status: e.status });
    courses.set(e.courseCode, course);
    coursesByEmail.set(e.studentEmail, courses);
    if (e.studentName) nameByEmail.set(e.studentEmail, e.studentName);
  });

  const accountsByEmail = new Map<string, Record<string, any> & { uid: string }>();
  studentSnap.docs.forEach((d) => {
    const email = (d.data().email || '').toLowerCase();
    if (email) accountsByEmail.set(email, { ...d.data(), uid: d.id });
  });

  // Look up accounts for enrolled emails that are not already in the student list ('in' allows 30 values).
  const missing = Array.from(coursesByEmail.keys()).filter((email) => !accountsByEmail.has(email));
  for (let i = 0; i < missing.length; i += 30) {
    const snap = await db.collection('users').where('email', 'in', missing.slice(i, i + 30)).get();
    snap.docs.forEach((d) => accountsByEmail.set((d.data().email || '').toLowerCase(), { ...d.data(), uid: d.id }));
  }

  const emails = new Set([...Array.from(accountsByEmail.keys()), ...Array.from(coursesByEmail.keys())]);
  const rows: StudentCheckRow[] = Array.from(emails).map((email) => {
    const account = accountsByEmail.get(email);
    const courses = Array.from(coursesByEmail.get(email)?.values() || [])
      .map((c) => ({ ...c, units: c.units.sort((a, b) => a.unitCode.localeCompare(b.unitCode)) }))
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    return {
      uid: account?.uid || null,
      name: account?.displayName || account?.name || nameByEmail.get(email) || email,
      email,
      role: account ? normalizeRole(account.role || account.status) : null,
      lastLoginAt: account?.lastLoginAt || null,
      courses,
      unitCount: courses.reduce((n, c) => n + c.units.length, 0),
    };
  });

  // Not-enrolled students first, then alphabetical.
  return rows.sort((a, b) => Number(a.unitCount > 0) - Number(b.unitCount > 0) || a.name.localeCompare(b.name));
}

export class RoleChangeNotAllowedError extends Error {}

/**
 * Sets a user's role from the Student Check panel (Firestore profile + auth custom claims).
 * When allowedCurrentRoles is given, accounts holding any other role are refused before anything is written.
 */
export async function setUserRoleFromStudentCheck(
  uid: string,
  role: SystemRole,
  allowedCurrentRoles?: SystemRole[]
): Promise<{ email: string; previousRole: SystemRole }> {
  requireFirestore();
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('User account not found.');
  const data = doc.data() || {};
  const previousRole = normalizeRole(data.role || data.status);
  if (allowedCurrentRoles && (data.isSuperAdmin === true || !allowedCurrentRoles.includes(previousRole))) {
    throw new RoleChangeNotAllowedError('Only a Superadmin can change the role of a staff account.');
  }

  await ref.set(
    {
      role,
      status: role,
      classification: role.charAt(0).toUpperCase() + role.slice(1),
      isSuperAdmin: role === 'superadmin',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  try {
    await auth.setCustomUserClaims(uid, { role, isSuperAdmin: role === 'superadmin', roles: [role] });
  } catch (claimErr) {
    console.warn(`[student-check] Could not set ${role} claims for ${uid}:`, claimErr);
  }
  return { email: data.email || '', previousRole };
}
