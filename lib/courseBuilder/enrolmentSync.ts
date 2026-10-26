/**
 * Client helper that pushes Course Builder enrolment changes to /api/enrolments,
 * so students can see their enrolments (and are notified) from their own account.
 */

import { authenticatedFetch } from '@/lib/firebase/client';
import type { UnitEnrolledStudent } from './studentEnrolment';

export interface EnrolmentSyncResult {
  ok: boolean;
  summary: string;
}

interface StudentOutcome {
  studentName: string;
  newUnitCodes: string[];
  roleUpdate: string;
}

function describeEnrolResult(data: any): string {
  const students: StudentOutcome[] = data.students || [];
  if (students.length === 0) {
    return 'Saved. These students were already enrolled, so no new notification was sent.';
  }

  const promoted = students.filter((s) => s.roleUpdate === 'promoted_to_student').length;
  const parts = [`Notified ${students.length} student${students.length === 1 ? '' : 's'} in-app`];
  if (promoted > 0) parts.push(`${promoted} upgraded to Student role`);

  return `${parts.join(' · ')}.`;
}

async function post(body: object): Promise<{ ok: boolean; data: any }> {
  try {
    const res = await authenticatedFetch('/api/enrolments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (err: any) {
    return { ok: false, data: { error: err?.message || 'Network error' } };
  }
}

export async function syncEnrolledStudents(
  students: UnitEnrolledStudent[],
  courseCode: string,
  courseTitle: string,
  unitTitles: Record<string, string>
): Promise<EnrolmentSyncResult> {
  const { ok, data } = await post({
    action: 'enrol',
    enrolments: students.map((s) => ({
      studentName: s.studentName,
      studentEmail: s.studentEmail,
      studentId: s.studentId,
      courseCode: s.courseCode || courseCode,
      courseTitle,
      unitCode: s.unitCode,
      unitTitle: unitTitles[s.unitCode.toUpperCase()] || s.unitCode,
      status: s.status,
    })),
  });

  if (!ok) {
    return { ok: false, summary: `Saved in this browser only. Server sync failed: ${data.error || 'unknown error'}` };
  }
  return { ok: true, summary: describeEnrolResult(data) };
}

export async function syncRemovedStudent(
  student: UnitEnrolledStudent,
  courseCode: string
): Promise<EnrolmentSyncResult> {
  const { ok, data } = await post({
    action: 'remove',
    enrolments: [{ studentEmail: student.studentEmail, courseCode: student.courseCode || courseCode, unitCode: student.unitCode }],
  });
  if (!ok) {
    return { ok: false, summary: `Removed in this browser only. Server sync failed: ${data.error || 'unknown error'}` };
  }
  const reverted = (data.students || []).some((s: { roleUpdate: string }) => s.roleUpdate === 'reverted_to_supporter');
  return {
    ok: true,
    summary: reverted
      ? 'No enrolments remain, so their role is now Supporter.'
      : 'Removed from their account.',
  };
}
