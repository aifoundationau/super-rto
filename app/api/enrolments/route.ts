import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedCaller, requireSuperAdminCaller } from '@/lib/auth/serverAuth';
import {
  enrolStudents,
  removeEnrolments,
  getEnrolmentsForEmail,
  getApplicationStatusesForEmail,
  FirestoreUnavailableError,
  type EnrolmentInput
} from '@/lib/enrolments/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/enrolments
 * Returns the verified caller's own enrolments and application statuses.
 * Superadmins may pass ?email= to inspect another student.
 */
export async function GET(req: NextRequest) {
  const authCheck = await requireAuthenticatedCaller(req);
  if ('errorResponse' in authCheck) return authCheck.errorResponse;
  const { caller } = authCheck;

  const requestedEmail = new URL(req.url).searchParams.get('email');
  const email = requestedEmail && caller.isSuperAdmin ? requestedEmail.toLowerCase().trim() : caller.email;

  try {
    const [enrolments, applications] = await Promise.all([
      getEnrolmentsForEmail(email),
      getApplicationStatusesForEmail(email),
    ]);
    return NextResponse.json({ email, enrolments, applications });
  } catch (err: any) {
    console.error('[GET /api/enrolments]', err);
    return NextResponse.json({ error: err.message || 'Failed to load enrolments' }, { status: 500 });
  }
}

/**
 * POST /api/enrolments  (Superadmin / Director only)
 * { action: 'enrol', enrolments: EnrolmentInput[] }
 * { action: 'remove', enrolments: { studentEmail, courseCode, unitCode }[] }
 */
export async function POST(req: NextRequest) {
  const authCheck = await requireSuperAdminCaller(req);
  if ('errorResponse' in authCheck) return authCheck.errorResponse;
  const { caller } = authCheck;

  try {
    const body = await req.json();
    const entries = Array.isArray(body?.enrolments) ? body.enrolments : [];
    if (entries.length === 0) {
      return NextResponse.json({ error: 'No enrolments supplied.' }, { status: 400 });
    }

    if (body.action === 'enrol') {
      const result = await enrolStudents(entries as EnrolmentInput[], caller.email);
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'remove') {
      const result = await removeEnrolments(entries, caller.email);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: `Unknown action "${body.action}".` }, { status: 400 });
  } catch (err: any) {
    if (err instanceof FirestoreUnavailableError) {
      return NextResponse.json({ error: err.message, code: 'FIRESTORE_UNAVAILABLE' }, { status: 503 });
    }
    console.error('[POST /api/enrolments]', err);
    return NextResponse.json({ error: err.message || 'Failed to save enrolments' }, { status: 500 });
  }
}
