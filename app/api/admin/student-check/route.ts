import { NextRequest, NextResponse } from 'next/server';
import { requirePermissionCaller } from '@/lib/auth/serverAuth';
import { isValidRole, normalizeRole, type SystemRole } from '@/lib/auth/roles';
import { recordActivity } from '@/lib/firebase/admin';
import {
  getStudentCheckReport,
  setUserRoleFromStudentCheck,
  FirestoreUnavailableError,
  RoleChangeNotAllowedError
} from '@/lib/enrolments/service';

export const dynamic = 'force-dynamic';

const PERMISSION = 'students.enrolment_check';
// Without Superadmin rights, Student Check may only move accounts between these roles.
const LIMITED_ROLES: SystemRole[] = ['student', 'supporter'];

function errorResponse(err: any, fallback: string) {
  if (err instanceof FirestoreUnavailableError) {
    return NextResponse.json({ error: err.message, code: 'FIRESTORE_UNAVAILABLE' }, { status: 503 });
  }
  if (err instanceof RoleChangeNotAllowedError) {
    return NextResponse.json({ error: err.message, code: 'FORBIDDEN' }, { status: 403 });
  }
  console.error('[student-check]', err);
  return NextResponse.json({ error: err?.message || fallback }, { status: 500 });
}

/**
 * GET /api/admin/student-check
 * Lists student accounts with the courses and units each is enrolled in.
 */
export async function GET(req: NextRequest) {
  const authCheck = await requirePermissionCaller(req, PERMISSION);
  if ('errorResponse' in authCheck) return authCheck.errorResponse;

  try {
    const students = await getStudentCheckReport();
    return NextResponse.json({
      students,
      canAssignAnyRole: authCheck.caller.isSuperAdmin,
    });
  } catch (err: any) {
    return errorResponse(err, 'Failed to load student check');
  }
}

/**
 * PATCH /api/admin/student-check  { uid, role }
 * Changes a listed account's role. Non-superadmins may only switch between student and supporter.
 */
export async function PATCH(req: NextRequest) {
  const authCheck = await requirePermissionCaller(req, PERMISSION);
  if ('errorResponse' in authCheck) return authCheck.errorResponse;
  const { caller } = authCheck;

  try {
    const { uid, role } = await req.json();
    if (!uid || !isValidRole(role)) {
      return NextResponse.json({ error: 'A user id and a valid role are required.' }, { status: 400 });
    }
    const newRole = normalizeRole(role);

    if (!caller.isSuperAdmin && !LIMITED_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Only a Superadmin can assign roles other than Student or Supporter.' }, { status: 403 });
    }
    if (uid === caller.uid) {
      return NextResponse.json({ error: 'You cannot change your own role here.' }, { status: 400 });
    }

    const { email, previousRole } = await setUserRoleFromStudentCheck(
      uid,
      newRole,
      caller.isSuperAdmin ? undefined : LIMITED_ROLES
    );

    await recordActivity({
      category: 'ENROLMENT',
      action: 'STUDENT_CHECK_ROLE_CHANGED',
      userId: uid,
      userEmail: email,
      metadata: { previousRole, newRole, changedBy: caller.email },
    });

    return NextResponse.json({ success: true, uid, role: newRole, previousRole });
  } catch (err: any) {
    return errorResponse(err, 'Failed to update role');
  }
}
